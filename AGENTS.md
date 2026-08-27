# Guia de Engenharia Agêntica (AGENTS.md)

Este documento define as diretrizes para agentes de IA e engenheiros que atuam no desenvolvimento do sistema **HomeCare**.

---

## 🧭 Princípios Absolutos

1. **Fonte de Verdade**: As especificações do projeto e os requisitos clínicos/operacionais são soberanos. Nunca invente regras de negócio.
2. **Segurança First**: Validação clínica e controle de acesso nunca devem depender exclusivamente da interface do usuário. A segurança reside no banco (PostgreSQL + RLS + Triggers) e na camada de domínio (Zod Schemas + RPC/Server).
3. **Sem Duplicidade de Entidades**: Profissionais, pacientes e convênios devem ter cadastros únicos e centrais. Todos os módulos referenciam os mesmos IDs.
4. **Vínculo Explícito Paciente ↔ Profissional**: Nunca assumir que um profissional alocado em um plantão atende todos os pacientes daquele plantão. O acesso ao PEP exige vínculo explícito e ativo.
5. **Rastreabilidade e Imutabilidade Clínica**: Registros clínicos finalizados (evoluções, sinais vitais, procedimentos) são estritamente imutáveis e auditados com trilha completa (`audit_logs`).
6. **Testabilidade Real**: Nenhuma funcionalidade é declarada `CONCLUÍDO` sem evidência empírica de testes (unitários, integração, RLS, testes negativos de permissão).

---

## 🏛️ Papéis Agênticos Especializados

```text
ORQUESTRADOR
│
├── ARQUITETURA & DOMÍNIO (Modelos, contratos, interfaces, regras de negócio)
├── BANCO / SUPABASE (DDL SQL, RLS Policies, Triggers de auditoria, Migrations)
├── FRONTEND / UX (Componentes, formulários, PEP, responsividade, estados offline)
├── SEGURANÇA / RLS (RBAC, testes de penetração/IDOR, proteção de dados de saúde)
└── QA / TESTES (Suíte de testes automatizados, testes negativos, E2E)
```

---

## 🚦 Critérios para Status "CONCLUÍDO"

Para marcar um módulo como `CONCLUÍDO` em [`docs/STATUS_PROJETO.md`](docs/STATUS_PROJETO.md), são obrigatórios:
- [x] Modelagem de dados validada e sem pendências;
- [x] Schema DDL / Migrations criadas com constraints e chaves estrangeiras;
- [x] Políticas de RLS aplicadas e testadas para todos os papéis (Admin, Médico, Enfermeiro, Técnico, Familiar);
- [x] Interface frontend implementada com validação Zod, loading states, empty states e tratamento de erros;
- [x] Suíte de testes unitários e testes negativos executada com 100% de sucesso (`npm test`);
- [x] Typecheck e Lint sem advertências ou erros (`npm run typecheck && npm run lint`).

