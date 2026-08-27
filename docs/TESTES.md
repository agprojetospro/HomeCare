# Estratégia de Testes & Qualidade — HomeCare

## 1. Pirâmide de Testes

```text
       ▲
      / \        Testes E2E (Fluxo Completo Admissão → Triagem → Escala → PEP)
     /   \
    /─────\      Testes de Integração & RLS / Segurança (Permissões, IDOR, Triggers)
   /       \
  /─────────\    Testes Unitários & Validação de Domínio (Zod, Alertas, Imutabilidade)
 ─────────────
```

---

## 2. Matriz de Testes Negativos de Segurança

| Caso de Teste | Cenário / Entrada | Comportamento Esperado | Status |
| :--- | :--- | :--- | :--- |
| **TN-01** | Profissional sem vínculo tenta abrir PEP via URL direta | Acesso negado com 403 Forbidden e log de auditoria | Planejado |
| **TN-02** | Tentativa de edição em Evolução com `status = FINALIZADO` | Exceção SQL disparada por trigger / Erro de Imutabilidade | Planejado |
| **TN-03** | Cadastro de segundo paciente com mesmo CPF | Bloqueio de duplicidade com indicação do registro existente | Planejado |
| **TN-04** | Criação de plantão sem Médico Responsável | Validação Zod / Constraint rejeita a operação | Planejado |
| **TN-05** | Alocação de profissional em plantões sobrepostos | Detecção de conflito de horário e bloqueio | Planejado |
| **TN-06** | Inserção de sinais vitais fora de limites fisiológicos válidos | Validação Zod rejeita dados corrompidos | Planejado |

---

## 3. Comandos de Verificação Contínua

```bash
# Testes Unitários e de Integração
npm test

# Validação Estrita de Tipagem TypeScript
npm run typecheck

# Análise Estática de Código (Lint)
npm run lint

# Build de Produção
npm run build
```

