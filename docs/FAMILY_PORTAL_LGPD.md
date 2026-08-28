# Onda 4: Portal do Familiar & Camada de Visibilidade LGPD

## 📋 Visão Geral

A **Onda 4** implementa uma camada humanizada, transparente e segura para familiares e cuidadores acompanharem o atendimento domiciliar de seus entes queridos, em estrita conformidade com a **LGPD (Lei 13.709/2018)** e resoluções do **Conselho Federal de Medicina (CFM)** sobre sigilo do prontuário médico.

---

## 🔒 Princípios de Segurança & Sigilo Clínico

1. **Vínculo Explícito & Consentimento Assinado**:
   - Cada familiar possui um registro em `family_access_grants` vinculado ao ID do paciente, data de assinatura do consentimento e nível de visibilidade (`VISAO_COMPLETA_LEIGA`, `VISAO_OPERACIONAL_HORARIOS`, `VISAO_RESTRITA`).
2. **Camada de Sanitização Automática**:
   - Eventos clínicos brutos (ex: exames detalhados, hipóteses diagnósticas diferenciais, logs de auditoria) são filtrados pela função `sanitizeClinicalEventForFamily`.
   - O familiar recebe termos humanizados e claros: *"Sinais vitais checados e estáveis"*, *"Medicação prescrita administrada no horário"*, *"Visita médica concluída"*.
3. **Canal de Feedback & Ouvidoria**:
   - Avaliação por estrelas (1 a 5) e categorias (`ATENDIMENTO_EQUIPE`, `PONTUALIDADE`, `COMUNICACAO`, `CONFORTO_PACIENTE`), encaminhadas diretamente à coordenação assistencial.

---

## 🏛️ Modelagem de Dados & DDL SQL

- **`family_access_grants`**: Registro de permissões de cuidadores com chave estrangeira para `patients` e `profiles`.
- **`family_feedbacks`**: Livro de avaliações e comentários com isolamento RLS.

---

## 🧪 Certificação & Testes

- **Testes Unitários**: `tests/family-portal-lgpd.test.ts` (6 testes).
- **Testes E2E (Playwright)**: `tests/e2e-browser-flows.spec.ts` (Teste 8 validando navegação, diário e envio de feedback).
- **Quality Gate**: 114 testes Vitest passando com 100% de sucesso.
