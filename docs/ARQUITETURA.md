# Arquitetura do Sistema — HomeCare

## 1. Visão Geral da Arquitetura

O sistema **HomeCare** adota uma arquitetura em camadas orientada ao domínio da saúde, garantindo desacoplamento, segurança por padrão (*Security by Design*) e alta manutenibilidade.

```text
┌────────────────────────────────────────────────────────┐
│               Camada de Apresentação (UI)              │
│       React 19 / Next.js 15 App Router / Tailwind      │
│  - Dashboard Gestor      - Painel Operacional Escalas  │
│  - PEP Beira-Leito       - Triagem & Admissão          │
└──────────────────────────┬─────────────────────────────┘
                           │ (Chamadas Tipadas & Hooks)
┌──────────────────────────▼─────────────────────────────┐
│             Camada de Domínio & Aplicação              │
│  - Schemas de Validação Zod (Clínicos e Operacionais)  │
│  - Regras de Transição de Estado & Imutabilidade       │
│  - Camada de Repositórios & Serviços (Type-Safe)       │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│          Camada de Segurança & Autorização             │
│  - Autenticação Supabase Auth (JWT)                    │
│  - RBAC (Perfis: ADMIN, MEDICO, ENFERMEIRO, TECNICO...)│
│  - RLS (Row-Level Security) em PostgreSQL              │
│  - Proteção IDOR (Vínculo Paciente ↔ Profissional)    │
└──────────────────────────┬─────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────┐
│           Camada de Persistência & Auditoria           │
│  - PostgreSQL (Tabelas Relacionais + Enums Estritos)   │
│  - Triggers de Imutabilidade para Prontuário Finalizado│
│  - Trilha de Auditoria Universal (audit_logs)          │
└────────────────────────────────────────────────────────┘
```

---

## 2. Separação de Responsabilidades no Frontend

```text
src/
├── app/                  # Rotas e páginas (Next.js App Router)
│   ├── (auth)/           # Login, recuperação de acesso
│   ├── (admin)/          # Cadastros, escalas, gestão, relatórios
│   ├── (pep)/            # Prontuário Eletrônico do Paciente (Contextual)
│   └── api/              # Handlers e RPC quando aplicável
├── components/
│   ├── ui/               # Componentes atômicos (Button, Dialog, Input, Table)
│   ├── layout/           # Header, Sidebar, Navegação
│   ├── clinical/         # Sinais Vitais, Linha do Tempo, Prescrições, Alertas
│   └── shifts/           # Grade de plantões, alocação, check-in
├── domain/               # Entidades, Enums, Zod Schemas e Regras de Negócio
│   ├── patient/
│   ├── professional/
│   ├── triage/
│   ├── care-plan/
│   ├── shift/
│   ├── pep/
│   └── audit/
├── services/             # Repositórios de dados e integração Supabase
├── hooks/                # Hooks React para estado, queries e permissões
└── lib/                  # Utilitários de data, moeda, cn, supabase client
```

---

## 3. Princípios Arquiteturais

1. **Segurança no Banco (RLS + Triggers)**: Regras críticas de permissão e imutabilidade de registros finalizados residem no PostgreSQL.
2. **Contexto Clínico Estrito no PEP**: Ao abrir o prontuário de um paciente, todas as abas (Evolução, Prescrição, Sinais Vitais, Procedimentos, Exames, Histórico) operam sob o mesmo identificador de paciente/atendimento auditado.
3. **Resiliência e Operação Offline-Friendly**: O sistema prevê salvamento local temporário de rascunhos para suportar instabilidades de conexão na residência do paciente.
4. **Sem Duplicidade de Entidades**: Cadastros de Pacientes e Profissionais são únicos e canônicos em todo o ciclo de vida.

