# Protocolo NEWS2-BR — Detecção Precoce de Deterioração Clínica

Este documento define as diretrizes clínicas, regras de cálculo determinístico e fluxos operacionais do módulo **NEWS2** (*National Early Warning Score 2*, adaptado para o Brasil) no sistema **HomeCare**.

---

## 🎯 1. Objetivo & Princípio de Não Substituição Médica

O NEWS2 é uma ferramenta científica de **estratificação preditiva de risco** desenvolvida pelo *Royal College of Physicians*. 

> [!IMPORTANT]
> **Princípio Fundamental**: O algoritmo do NEWS2 **NÃO substitui o julgamento clínico** e nunca toma decisões médicas ou prescritivas automáticas. Ele atua como um sistema de suporte à decisão clínica, padronizando a avaliação fisiológica e disparando protocolos operacionais de escalonamento assistencial.

---

## 📊 2. Parâmetros Fisiológicos & Tabela de Pontuação (NEWS2-BR v1.0)

| Parâmetro Fisiológico | 3 Pontos | 2 Pontos | 1 Ponto | 0 Ponto | 1 Ponto | 2 Pontos | 3 Pontos |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Frequência Respiratória (rpm)** | $\le 8$ | — | $9 - 11$ | **$12 - 20$** | — | $21 - 24$ | $\ge 25$ |
| **SpO2 - Escala 1 Padrão (%)** | $\le 91$ | $92 - 93$ | $94 - 95$ | **$\ge 96$** | — | — | — |
| **SpO2 - Escala 2 DPOC/Hipercápnico (%)** | $\le 83$ | $84 - 85$ | $86 - 87$ | **$88 - 92$** | $93 - 94$ (c/ O2) | $95 - 96$ (c/ O2) | $\ge 97$ (c/ O2) |
| **Oxigênio Suplementar** | — | **Sim (2 pts)** | — | **Ar Ambiente (0 pt)** | — | — | — |
| **Pressão Arterial Sistólica (mmHg)** | $\le 90$ | $91 - 100$ | $101 - 110$ | **$111 - 219$** | — | — | $\ge 220$ |
| **Frequência Cardíaca (bpm)** | $\le 40$ | — | $41 - 50$ | **$51 - 90$** | $91 - 110$ | $111 - 130$ | $\ge 131$ |
| **Nível de Consciência (Escala AVPU)** | — | — | — | **A (Alerta)** | — | — | **V / P / U (3 pts)** |
| **Temperatura Corporal (°C)** | $\le 35.0$ | — | $35.1 - 36.0$ | **$36.1 - 38.0$** | $38.1 - 39.0$ | $\ge 39.1$ | — |

---

## 🚦 3. Estratificação de Risco & Protocolo Operacional

| Pontuação Agregada | Nível de Risco | Ação Operacional Recomendada | Notificação & Escalonamento |
| :---: | :---: | :--- | :--- |
| **0 a 4** | `LOW` (Baixo) | Manter monitoramento de rotina assistencial domiciliar conforme PAD. | Equipe de Enfermagem de Campo |
| **Score 3 em 1 parâmetro** (Total $<5$) | `LOW_MEDIUM` (Moderado) | Reavaliar parâmetro alterado em 30 minutos e comunicar coordenação de enfermagem. | Enfermeiro Supervisor |
| **5 a 6** | `MEDIUM` (Médio) | Alerta de deterioração clínica. Reavaliar sinais vitais em 1h e ajustar plano de cuidados. | Enfermeiro Supervisor + Médico de Plantão |
| **$\ge 7$** | `HIGH` (Alto / Crítico) | **EMERGÊNCIA CLÍNICA**: Avaliação médica imediata. Acionar médico de plantão e avaliar protocolo de remoção/SAMU. | Médico Plantonista + Central de Regulação |

---

## 🔒 4. Imutabilidade, Versionamento & Auditoria

1. **Versionamento do Score**: Todo cálculo é gravado em `clinical_score_results` com `score_version: "1.0"` e snapshot imutável dos dados digitados (`inputs_snapshot`).
2. **Imutabilidade DDL**: Trigger `trg_clinical_score_immutability` impede qualquer operação de `UPDATE` ou `DELETE` no banco.
3. **Auditoria Forense**: Registro obrigatório de `NEWS2_CALCULATE`, `CLINICAL_ALERT_ACKNOWLEDGED` e `CLINICAL_ALERT_RESOLVED` com autor, papel, carimbo de tempo e notas clínicas.

---

## 🧪 5. Evidência de Testes Automatizados

A suíte `tests/news2-clinical-score.test.ts` valida:
- [x] Paciente estável com score 0 e risco `LOW`;
- [x] Matriz completa de limites fisiológicos para os 7 parâmetros;
- [x] Escala 2 para DPOC / retenção crônica de CO2;
- [x] Detecção de `LOW_MEDIUM` para pontuação 3 isolada;
- [x] Detecção de `HIGH` ($\ge 7$) com ação emergencial;
- [x] Validação estrita do schema Zod com snapshot.

