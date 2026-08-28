# Módulo de Visitas de Campo, Check-in Beira-Leito & Geofencing GPS (ONDA 2)

Este documento detalha as especificações clínicas, operacionais e de conformidade do motor de visitas de campo, comprovação assistencial beira-leito e cerca virtual (*geofencing*) da plataforma **HomeCare**.

---

## 🎯 1. Objetivos Estratégicos & Prevenção de Glosas

1. **Comprovação Beira-Leito Inquestionável**: Validação pontual da presença física do profissional de saúde no domicílio do paciente no momento do Check-in e Check-out, mitigando glosas com operadoras de saúde e SUS.
2. **Zero Rastreamento Contínuo**: Preservação estrita da privacidade dos profissionais de saúde (LGPD), sem telemetria contínua de trajeto em background. As coordenadas são capturadas única e exclusivamente no ato de confirmação do procedimento.
3. **Cálculo Geodésico Puro (Haversine)**: Determinação matemática precisa da distância linear em metros entre a latitude/longitude do dispositivo e o endereço geocodificado do paciente.
4. **Override Assistencial Auditado**: Em situações adversas (instabilidade de sinal de GPS, reflexão em prédios, atendimentos de emergência), o profissional pode realizar o check-in mediante justificativa assistencial obrigatória registrada em `audit_logs` (`GEOFENCE_OVERRIDE`).

---

## 📐 2. Fórmula de Haversine & Avaliação de Cerca Virtual

A distância é calculada sobre a superfície da Terra ($R = 6.371.000\text{m}$):

$$\Delta\sigma = 2 \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}\right)$$
$$d = R \cdot \Delta\sigma$$

### Classificação de Resultados (`GeofenceResult`)

| Resultado | Distância | Requer Justificativa | Ação no Sistema |
|---|---|---|---|
| `INSIDE_GEOFENCE` | $\le 100\text{m}$ | Não | Check-in aprovado diretamente com badge verde |
| `OUTSIDE_GEOFENCE` | $> 100\text{m}$ | **Sim** | Exige justificativa clínica/operacional obrigatória |
| `LOW_ACCURACY` | Acurácia $> 150\text{m}$ | Conforme distância | Alerta de imprecisão do sensor GPS |
| `LOCATION_UNAVAILABLE` | N/A | **Sim** | Registro de contingência offline/sem sinal |

---

## 🛡️ 3. Transições de Estado da Visita Assistencial

```text
SCHEDULED ──────► EN_ROUTE ──────► CHECKED_IN ──────► IN_PROGRESS ──────► COMPLETED
    │                 │                 │                   │
    └─────────────────┴─────────────────┴───────────────────┴──────► CANCELLED / NO_SHOW
```

---

## 📊 4. Schema PostgreSQL & Políticas de RLS (`20260827_visits_geolocation.sql`)

- Tabela `visits`: Agendamento, horários previstos e reais, procedimentos planejados.
- Tabela `visit_checkins`: Coordenadas de entrada/saída, acurácia, distância calculada, justificativa de override e carimbo de data/hora imutável.
- Índices de performance: `idx_visits_patient_scheduled`, `idx_visits_professional_scheduled`, `idx_visit_checkins_visit`.
- Auditoria: Integrada à tabela `audit_logs` sob os eventos `VISIT_CREATE`, `VISIT_CHECK_IN`, `VISIT_CHECK_OUT` e `GEOFENCE_OVERRIDE`.
