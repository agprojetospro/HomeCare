import json
import sys
from typing import Dict, Any, List

from tools.code_index.config import load_config
from tools.code_index.database.db import Database
from tools.code_index.embeddings import get_embedding_provider
from tools.code_index.retrieval.hybrid_search import HybridSearchEngine
from tools.code_index.graph.dependency_graph import DependencyGraph


class HomeCareMCPServer:
    """Servidor MCP local (JSON-RPC) para prover inteligência de código a agentes de IA."""

    def __init__(self):
        self.config = load_config()
        self.db = Database(self.config.index_db_path)
        self.provider = get_embedding_provider(
            provider_type=self.config.embedding.provider,
            model=self.config.embedding.model,
            endpoint=self.config.embedding.endpoint,
            dimension=self.config.embedding.dimension,
            fallback_to_local=self.config.embedding.fallback_to_local,
        )
        self.search_engine = HybridSearchEngine(self.db, self.provider, self.config.search)
        self.graph = DependencyGraph(self.db)

    def handle_search_code(self, args: Dict[str, Any]) -> Dict[str, Any]:
        query = args.get("query", "")
        limit = int(args.get("limit", 8))
        filter_type = args.get("type")
        results = self.search_engine.search(query=query, top_k=limit, filter_type=filter_type)
        return {
            "results": [
                {
                    "rank": r.rank,
                    "symbol": r.symbol_name,
                    "type": r.symbol_type,
                    "file": r.file_path,
                    "lines": f"{r.start_line}-{r.end_line}",
                    "score": r.score,
                    "snippet": r.snippet,
                }
                for r in results
            ]
        }

    def handle_find_symbol(self, args: Dict[str, Any]) -> Dict[str, Any]:
        name = args.get("name", "")
        sym = self.graph.get_symbol(name)
        if not sym:
            return {"error": f"Símbolo '{name}' não encontrado."}
        return {"symbol": sym}

    def handle_get_dependencies(self, args: Dict[str, Any]) -> Dict[str, Any]:
        name = args.get("name", "")
        return {"dependencies": self.graph.get_dependencies(name)}

    def handle_get_references(self, args: Dict[str, Any]) -> Dict[str, Any]:
        name = args.get("name", "")
        return {"references": self.graph.get_references(name)}

    def handle_analyze_impact(self, args: Dict[str, Any]) -> Dict[str, Any]:
        target = args.get("target", "")
        report = self.graph.analyze_impact(target)
        return {
            "target": report.target,
            "target_type": report.target_type,
            "direct_dependents": report.direct_dependents,
            "indirect_dependents": report.indirect_dependents,
            "affected_components": report.affected_components,
            "affected_rpcs": report.affected_rpcs,
            "affected_policies": report.affected_policies,
            "affected_tests": report.affected_tests,
        }

    def process_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        req_id = request.get("id")
        method = request.get("method")
        params = request.get("params", {})

        handlers = {
            "search_code": self.handle_search_code,
            "find_symbol": self.handle_find_symbol,
            "get_dependencies": self.handle_get_dependencies,
            "get_references": self.handle_get_references,
            "analyze_impact": self.handle_analyze_impact,
        }

        handler = handlers.get(method)
        if not handler:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"code": -32601, "message": f"Method '{method}' not found"},
            }

        try:
            result = handler(params)
            return {"jsonrpc": "2.0", "id": req_id, "result": result}
        except Exception as e:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "error": {"code": -32000, "message": str(e)},
            }

    def run_stdio(self):
        """Loop de comunicação stdio para integração MCP."""
        for line in sys.stdin:
            line_str = line.strip()
            if not line_str:
                continue
            try:
                req = json.loads(line_str)
                resp = self.process_request(req)
                sys.stdout.write(json.dumps(resp) + "\n")
                sys.stdout.flush()
            except Exception as e:
                err_resp = {"jsonrpc": "2.0", "error": {"code": -32700, "message": str(e)}}
                sys.stdout.write(json.dumps(err_resp) + "\n")
                sys.stdout.flush()


def main():
    server = HomeCareMCPServer()
    server.run_stdio()


if __name__ == "__main__":
    main()

