import argparse
import sys
import time
import os
from pathlib import Path
from typing import Optional

# Configurar UTF-8 no Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from tools.code_index.config import load_config
from tools.code_index.database.db import Database
from tools.code_index.scanner.scanner import FileScanner
from tools.code_index.parsers import parse_file
from tools.code_index.chunker.chunker import CodeChunker
from tools.code_index.embeddings import get_embedding_provider
from tools.code_index.retrieval.hybrid_search import HybridSearchEngine
from tools.code_index.graph.dependency_graph import DependencyGraph


def cmd_init(args):
    config = load_config()
    print(f"🔧 Inicializando HomeCare Code Index para o projeto '{config.project_name}'...")
    db = Database(config.index_db_path)
    db.init_schema(repo_name=config.project_name, repo_root=str(config.project_root))
    print(f"✅ Banco SQLite criado com sucesso em: {config.index_db_path}")
    print(f"📁 Diretório de logs preparado em: {config.log_path.parent}")


def cmd_index(args):
    config = load_config()
    db = Database(config.index_db_path)
    db.init_schema(repo_name=config.project_name, repo_root=str(config.project_root))

    scanner = FileScanner(config.project_root, config.scanner)
    provider = get_embedding_provider(
        provider_type=config.embedding.provider,
        model=config.embedding.model,
        endpoint=config.embedding.endpoint,
        dimension=config.embedding.dimension,
        fallback_to_local=config.embedding.fallback_to_local,
    )

    print(f"🔍 Escaneando repositório com modelo '{provider.model_name}'...")
    start_time = time.time()
    scanned_files, skipped = scanner.scan()

    active_db_files = {f["path"]: f for f in db.get_all_active_files()}
    current_paths = {sf.rel_path for sf in scanned_files}

    new_count = 0
    changed_count = 0
    unchanged_count = 0
    deleted_count = 0
    total_chunks = 0
    total_embeddings = 0

    run_id = db.start_index_run()

    # 1. Tratar arquivos removidos
    for old_path, old_row in active_db_files.items():
        if old_path not in current_paths:
            db.delete_file_records(old_row["id"])
            deleted_count += 1

    # 2. Processar arquivos novos ou modificados
    for sf in scanned_files:
        existing = active_db_files.get(sf.rel_path)
        is_new = existing is None
        is_changed = existing and existing["content_hash"] != sf.content_hash

        if not is_new and not is_changed and not args.force:
            unchanged_count += 1
            continue

        try:
            content = sf.abs_path.read_text(encoding="utf-8", errors="replace")
            parsed_file = parse_file(content, sf.rel_path, sf.language)
            chunks = CodeChunker.chunk_file(parsed_file)

            # Upsert do arquivo
            file_id = db.upsert_file(
                rel_path=sf.rel_path,
                language=sf.language,
                size=sf.size,
                content_hash=sf.content_hash,
                mtime=sf.mtime,
            )

            # Inserir símbolos
            sym_map = db.insert_symbols(file_id, parsed_file.symbols)

            # Inserir dependências
            for s in parsed_file.symbols:
                s_id = sym_map.get(s.name)
                if s_id and s.dependencies:
                    db.insert_dependencies(s_id, s.dependencies)

            # Gerar embeddings em batch
            search_texts = [c.search_text for c in chunks]
            vectors = provider.embed_batch(search_texts) if search_texts else []

            # Inserir chunks + vetores + FTS5
            db.insert_chunks(file_id, chunks, vectors, model_name=provider.model_name)

            total_chunks += len(chunks)
            total_embeddings += len(vectors)

            if is_new:
                new_count += 1
            else:
                changed_count += 1

        except Exception as e:
            print(f"⚠️ Erro ao indexar {sf.rel_path}: {e}")

    duration = round(time.time() - start_time, 2)
    db.finish_index_run(
        run_id=run_id,
        scanned=len(scanned_files),
        added=new_count,
        changed=changed_count,
        deleted=deleted_count,
        chunks=total_chunks,
        embeddings=total_embeddings,
        status="SUCCESS",
    )

    print("\n" + "=" * 50)
    print("📊 RESUMO DA INDEXAÇÃO INCREMENTAL")
    print("=" * 50)
    print(f"Arquivos escaneados:   {len(scanned_files)}")
    print(f"  • Novos:             {new_count}")
    print(f"  • Modificados:       {changed_count}")
    print(f"  • Inalterados:       {unchanged_count}")
    print(f"  • Removidos:         {deleted_count}")
    print(f"Chunks gerados:        {total_chunks}")
    print(f"Embeddings gerados:    {total_embeddings}")
    print(f"Provedor vetorial:     {provider.model_name}")
    print(f"Duração total:         {duration}s")
    print("=" * 50)


def cmd_status(args):
    config = load_config()
    db = Database(config.index_db_path)
    summary = db.get_status_summary()

    print("\n" + "=" * 50)
    print("📍 STATUS DO HOMECARE CODE INDEX")
    print("=" * 50)
    print(f"Banco de Dados:        {summary['db_path']}")
    print(f"Arquivos Indexados:    {summary['files_indexed']}")
    print(f"Símbolos Registrados:  {summary['symbols_count']}")
    print(f"Chunks Semânticos:     {summary['chunks_count']}")
    print(f"Vetores Armazenados:   {summary['vectors_count']}")
    print(f"Relações de Grafo:     {summary['dependencies_count']}")

    last = summary.get("last_run")
    if last:
        print(f"Última Indexação:      {last.get('completed_at') or last.get('started_at')} ({last.get('status')})")
    print("=" * 50)


def cmd_search(args):
    config = load_config()
    db = Database(config.index_db_path)
    provider = get_embedding_provider(
        provider_type=config.embedding.provider,
        model=config.embedding.model,
        endpoint=config.embedding.endpoint,
        dimension=config.embedding.dimension,
        fallback_to_local=config.embedding.fallback_to_local,
    )

    engine = HybridSearchEngine(db, provider, config.search)
    results = engine.search(
        query=args.query,
        top_k=args.limit or config.search.top_k,
        filter_type=args.type,
        filter_lang=args.lang,
        filter_path=args.path,
        filter_domain=args.domain,
    )

    print(f"\n🔎 Resultados da busca para: '{args.query}' (Total: {len(results)})\n")
    for r in results:
        print(f"{r.rank}. [{r.symbol_type}] {r.symbol_name}")
        print(f"   Arquivo: {r.file_path} (Linhas {r.start_line}-{r.end_line})")
        print(f"   Score: {r.score} (Vetorial: {r.vector_score} | FTS5: {r.fts_score})")
        if r.signature:
            print(f"   Assinatura: {r.signature}")
        print("   --- Snippet ---")
        for line in r.snippet.splitlines():
            print(f"   | {line}")
        print()


def cmd_symbol(args):
    config = load_config()
    db = Database(config.index_db_path)
    graph = DependencyGraph(db)
    sym = graph.get_symbol(args.name)

    if not sym:
        print(f"❌ Símbolo '{args.name}' não encontrado no índice.")
        return

    print("\n" + "=" * 50)
    print(f"Símbolo:      {sym['name']}")
    print(f"Tipo:         {sym['symbol_type']}")
    print(f"Arquivo:      {sym['file_path']} (Linhas {sym['start_line']}-{sym['end_line']})")
    print(f"Domínio:      {sym['domain'] or 'Geral'}")
    if sym.get("signature"):
        print(f"Assinatura:   {sym['signature']}")
    if sym.get("summary"):
        print(f"Resumo:       {sym['summary']}")

    deps = graph.get_dependencies(sym["name"])
    if deps:
        print("\nDependências (O que ele chama/usa):")
        for d in deps:
            print(f"  ├── [{d['dependency_type']}] {d['target_name']}")

    refs = graph.get_references(sym["name"])
    if refs:
        print("\nReferências (Quem o chama/usa):")
        for ref in refs:
            print(f"  └── [{ref['dependency_type']}] {ref['caller_name']} ({ref['file_path']}:{ref['start_line']})")
    print("=" * 50)


def cmd_deps(args):
    config = load_config()
    db = Database(config.index_db_path)
    graph = DependencyGraph(db)
    deps = graph.get_dependencies(args.name)

    print(f"\n📦 Grafo de Dependências de '{args.name}':")
    if not deps:
        print("  (Nenhuma dependência externa registrada)")
    else:
        for d in deps:
            print(f"  ├── [{d['dependency_type']}] {d['target_name']}")
    print()


def cmd_refs(args):
    config = load_config()
    db = Database(config.index_db_path)
    graph = DependencyGraph(db)
    refs = graph.get_references(args.name)

    print(f"\n🔗 Quem referencia '{args.name}':")
    if not refs:
        print("  (Nenhuma referência direta encontrada)")
    else:
        for ref in refs:
            print(f"  └── {ref['caller_name']} ({ref['symbol_type']}) em {ref['file_path']}:{ref['start_line']}")
    print()


def cmd_affected(args):
    config = load_config()
    db = Database(config.index_db_path)
    graph = DependencyGraph(db)
    report = graph.analyze_impact(args.target)

    print("\n" + "=" * 50)
    print(f"💥 ANÁLISE DE IMPACTO PARA: '{report.target}' ({report.target_type})")
    print("=" * 50)

    print(f"\n[1] Dependentes Diretos ({len(report.direct_dependents)}):")
    for d in report.direct_dependents:
        print(f"  ├── {d['caller_name']} ({d['symbol_type']}) em {d['file_path']}")

    if report.indirect_dependents:
        print(f"\n[2] Dependentes Indiretos ({len(report.indirect_dependents)}):")
        for ind in report.indirect_dependents:
            print(f"  ├── {ind['caller_name']} ({ind['symbol_type']}) em {ind['file_path']}")

    if report.affected_components:
        print(f"\n[3] Componentes & Hooks Afetados ({len(report.affected_components)}):")
        for c in report.affected_components:
            print(f"  • {c['caller_name']} ({c['file_path']})")

    if report.affected_rpcs:
        print(f"\n[4] Funções SQL / RPCs Afetadas ({len(report.affected_rpcs)}):")
        for rpc in report.affected_rpcs:
            print(f"  • {rpc['caller_name']} ({rpc['file_path']})")

    if report.affected_policies:
        print(f"\n[5] Policies RLS Afetadas ({len(report.affected_policies)}):")
        for pol in report.affected_policies:
            print(f"  • {pol['caller_name']} ({pol['file_path']})")

    if report.affected_tests:
        print(f"\n[6] Suítes de Teste Afetadas ({len(report.affected_tests)}):")
        for t in report.affected_tests:
            print(f"  • {t['caller_name']} ({t['file_path']})")
    print("=" * 50)


def main():
    parser = argparse.ArgumentParser(
        prog="homecare-index",
        description="HomeCare Code Intelligence & Semantic Search Engine",
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # init
    p_init = subparsers.add_parser("init", help="Inicializa o banco e diretórios locais")
    p_init.set_defaults(func=cmd_init)

    # index
    p_index = subparsers.add_parser("index", help="Executa indexação incremental do código")
    p_index.add_argument("--force", action="store_true", help="Força reindexação completa")
    p_index.set_defaults(func=cmd_index)

    # status
    p_status = subparsers.add_parser("status", help="Mostra o status e estatísticas do índice")
    p_status.set_defaults(func=cmd_status)

    # search
    p_search = subparsers.add_parser("search", help="Busca híbrida semântica e textual")
    p_search.add_argument("query", help="Termo de pesquisa ou pergunta em linguagem natural")
    p_search.add_argument("--limit", type=int, default=10, help="Limite de resultados")
    p_search.add_argument("--type", help="Filtrar por tipo de símbolo (FUNCTION, POLICY, COMPONENT, etc.)")
    p_search.add_argument("--lang", help="Filtrar por linguagem (typescript, sql, markdown, etc.)")
    p_search.add_argument("--path", help="Filtrar por caminho")
    p_search.add_argument("--domain", help="Filtrar por domínio clínico/técnico")
    p_search.set_defaults(func=cmd_search)

    # symbol
    p_symbol = subparsers.add_parser("symbol", help="Exibe detalhes e relacionamentos de um símbolo")
    p_symbol.add_argument("name", help="Nome do símbolo")
    p_symbol.set_defaults(func=cmd_symbol)

    # deps
    p_deps = subparsers.add_parser("deps", help="Exibe as dependências que o símbolo consome")
    p_deps.add_argument("name", help="Nome do símbolo")
    p_deps.set_defaults(func=cmd_deps)

    # refs
    p_refs = subparsers.add_parser("refs", help="Exibe quem referencia ou consome o símbolo")
    p_refs.add_argument("name", help="Nome do símbolo")
    p_refs.set_defaults(func=cmd_refs)

    # affected
    p_affected = subparsers.add_parser("affected", help="Análise de impacto em profundidade")
    p_affected.add_argument("target", help="Nome do símbolo ou arquivo")
    p_affected.set_defaults(func=cmd_affected)

    parsed_args = parser.parse_args()
    parsed_args.func(parsed_args)


if __name__ == "__main__":
    main()
