# HomeCare Code Index — Local Code Intelligence Engine

O **HomeCare Code Index** é um motor local de busca semântica, inteligência de código e análise de dependências projetado especificamente para o ecossistema HomeCare.

---

## 🚀 Como Executar

### 1. Inicializar o Índice Local
```bash
python -m tools.code_index init
```

### 2. Indexar o Repositório
```bash
python -m tools.code_index index
```

### 3. Verificar o Status do Índice
```bash
python -m tools.code_index status
```

### 4. Busca Híbrida Semântica & Textual
```bash
python -m tools.code_index search "onde é validado o vínculo entre profissional e paciente?"
python -m tools.code_index search "quais policies protegem o PEP" --type POLICY
python -m tools.code_index search "conflito de plantão" --limit 5
```

### 5. Inspecionar Símbolo e Dependências
```bash
python -m tools.code_index symbol can_access_patient
python -m tools.code_index deps can_access_patient
python -m tools.code_index refs can_access_patient
```

### 6. Análise de Impacto (Impact Analysis)
```bash
python -m tools.code_index affected can_access_patient
```

---

## 🧪 Executar Testes Automatizados

```bash
python -m unittest discover -s tools/code_index/tests -p "test_*.py"
```

---

## 🏛️ Arquitetura

- **Scanner Incremental**: Rastreia novos arquivos, modificações e exclusões via hash SHA256.
- **Detector de Segredos**: Bloqueia arquivos sensíveis (`.env*`, `*.key`, `*.pem`, senhas, tokens).
- **Parsers Estruturais**:
  - `TypeScriptParser`: Funções, componentes React, hooks, interfaces, types, enums e testes.
  - `SqlParser`: Tabelas, views, RPCs, policies RLS e triggers.
  - `MarkdownParser`: Seções hierárquicas de documentação técnica e clínica.
- **Chunker Semântico Enriquecido**: Agrupa por símbolo com metadados de domínio e sub-chunking inteligente.
- **Embeddings & Vetores**: Interface abstrata com suporte ao Ollama local e fallback determinístico de alta resolução.
- **Busca Híbrida**: $\text{Score} = 0.55 \times \text{Vetorial} + 0.35 \times \text{FTS5} + 0.10 \times \text{Metadados}$.
- **Grafo de Dependências**: Rastreia quem chama, quem é chamado e analisa o impacto cascata de alterações.
- **Servidor MCP**: Suporte nativo ao protocolo Model Context Protocol em `tools/code_index/mcp/server.py`.

