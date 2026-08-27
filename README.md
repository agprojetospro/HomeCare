# HomeCare — Sistema Integrado de Atenção Domiciliar

Sistema completo de gestão clínica, operacional, escalas e Prontuário Eletrônico do Paciente (PEP) para operações de Home Care.

---

## 🏥 Visão Geral

O **HomeCare** é projetado para administrar com rigor clínico e conformidade legal todo o ciclo operacional e assistencial do paciente em ambiente domiciliar:

```text
CADASTRO DO PACIENTE
        ↓
ATENDIMENTO / ADMISSÃO
        ↓
TRIAGEM CLÍNICA
        ↓
ELEGIBILIDADE & COMPLEXIDADE
        ↓
PLANO ASSISTENCIAL
        ↓
PLANEJAMENTO DA ASSISTÊNCIA
        ↓
PLANTÕES / AGENDA
        ↓
EQUIPE ASSISTENCIAL & VÍNCULO PACIENTE ↔ PROFISSIONAL
        ↓
PEP (PRONTUÁRIO ELETRÔNICO DO PACIENTE)
        ├── Evoluções Clínicas (com Rascunho / Finalização / Imutabilidade)
        ├── Prescrições Médicas & Aprazamento
        ├── Sinais Vitais & Alertas de Deterioração
        ├── Procedimentos Realizados & Materiais
        ├── Exames Solicitados & Laudos
        ├── Anamnese & Alergias
        └── Linha do Tempo Clínica Unificada
```

---

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Radix UI.
- **Backend / Persistência**: Supabase / PostgreSQL com Row-Level Security (RLS), Triggers de Imutabilidade e Funções RPC.
- **Validação & Tipagem**: Zod para esquemas estritos de domínio clínico e administrativo.
- **Qualidade & Testes**: Vitest, React Testing Library, ESLint, TypeScript Strict Mode.

---

## 📁 Estrutura de Documentação Viva

Consulte a documentação completa na pasta `/docs`:

- [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md) — Arquitetura de software, separação de camadas e princípios.
- [`docs/REQUISITOS.md`](docs/REQUISITOS.md) — Requisitos funcionais, não-funcionais e critérios de aceite.
- [`docs/REGRAS_NEGOCIO.md`](docs/REGRAS_NEGOCIO.md) — Regras de admissão, escalas, vínculos e governança clínica.
- [`docs/MODELO_DADOS.md`](docs/MODELO_DADOS.md) — Modelo conceitual, lógico, tabelas, constraints e RLS.
- [`docs/FLUXOS.md`](docs/FLUXOS.md) — Diagramas de fluxos operacionais e clínicos.
- [`docs/DECISOES.md`](docs/DECISOES.md) — Registro de decisões arquiteturais e funcionais (ADRs).
- [`docs/SEGURANCA.md`](docs/SEGURANCA.md) — Política de RBAC, RLS, proteção a IDOR e auditoria imutável.
- [`docs/TESTES.md`](docs/TESTES.md) — Pirâmide de testes, matriz de testes negativos e E2E.
- [`docs/STATUS_PROJETO.md`](docs/STATUS_PROJETO.md) — Matriz de status em tempo real por módulo.

---

## 🚀 Como Executar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Executar testes automatizados
npm test

# 3. Executar typecheck
npm run typecheck

# 4. Iniciar ambiente de desenvolvimento
npm run dev
```

