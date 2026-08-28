# Onda 6: Central Operacional Integrada & Comando Unificado

## 📋 Visão Geral

A **Onda 6** conclui o roadmap de evolução estratégica da plataforma **HomeCare**, integrando todos os módulos e inovações clínicas/operacionais em uma **Central de Comando Operacional Unificada**.

---

## 🏛️ Os 5 Pilares Estratégicos Consolidados

```text
┌─────────────────────────────────────────────────────────────────────────┐
│              CENTRAL OPERACIONAL HOMECARE — COMANDO UNIFICADO           │
├─────────────────┬─────────────────┬─────────────────┬───────────────────┤
│ 1. SEGURANÇA    │ 2. OPERAÇÃO     │ 3. LOGÍSTICA    │ 4. EXPERIÊNCIA    │
│    CLÍNICA      │    EM CAMPO     │    & INSUMOS    │    & LGPD         │
│                 │                 │                 │                   │
│ • Score NEWS2   │ • Visitas Hoje  │ • Insumos Ponto │ • Portal Familiar │
│ • Deterioração  │ • Check-in GPS  │   de Pedido     │ • Satisfação ⭐   │
│   Precoce       │ • Geofence 100m │ • O₂ Autonomia  │ • Termos LGPD     │
│ • Alertas PEP   │ • Overrides     │ • Curativos LPP │ • Resiliência PWA │
└─────────────────┴─────────────────┴─────────────────┴───────────────────┘
```

---

## 🔍 Funcionalidades de Drill-Down & Filtro

1. **Seletor de Polo/Unidade**:
   - Alternância imediata entre `Todas as Unidades`, `Polo Ilhéus` e `Polo Itabuna`, recalculando instantaneamente os 5 KPIs.
2. **Navegação Contextual Direta**:
   - Clique em qualquer indicador leva imediatamente à tela detalhada do paciente ou módulo assistencial correspondente com filtros pré-aplicados.
3. **Alertas Beira-Leito Ativos**:
   - Painel lateral com lista de descompensações em tempo real (NEWS2 $\ge 5$, dessaturação de $\text{O}_2$, picos hipertensivos).

---

## 🧪 Certificação & Quality Gates

- **Testes Unitários**: `tests/operational-command-center.test.ts` (17 suítes, 120 testes).
- **Testes E2E (Playwright)**: `tests/e2e-browser-flows.spec.ts` (10 fluxos completos).
- **TypeScript**: `tsc --noEmit` com 0 erros.
- **Build de Produção**: 17 rotas Next.js 15 compiladas com sucesso.
