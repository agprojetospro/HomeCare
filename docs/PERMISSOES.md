# Catálogo de Permissões Granulares — HomeCare

## 1. Padrão de Nomenclatura

As permissões seguem o padrão uniforme: `[DOMINIO]_[ACAO]`.

---

## 2. Catálogo Completo de Permissões

### Gestão de Pacientes & Admissão
- `PATIENT_READ`: Visualizar cadastros de pacientes no escopo autorizado.
- `PATIENT_CREATE`: Cadastrar novos pacientes com validação de duplicidade.
- `PATIENT_UPDATE`: Atualizar dados demográficos e de contato do paciente.
- `PATIENT_DISCHARGE`: Registrar alta, suspensão ou óbito.
- `TRIAGE_EXECUTE`: Realizar e assinar avaliação de triagem clínica e elegibilidade.
- `CARE_PLAN_MANAGE`: Criar e versionar planos assistenciais estruturados.

### Prontuário Eletrônico do Paciente (PEP)
- `PEP_READ`: Acessar o prontuário eletrônico no escopo autorizado (requer vínculo explícito se scope = `OWN`).
- `EVOLUTION_CREATE`: Criar novas evoluções clínicas (salvar rascunho).
- `EVOLUTION_FINALIZE`: Finalizar e assinar digitalmente a evolução tornando-a imutável.
- `PRESCRIPTION_CREATE`: Elaborar nova prescrição médica de medicamentos.
- `PRESCRIPTION_FINALIZE`: Assinar prescrição médica (exclusivo para perfil com CRM).
- `MEDICATION_ADMINISTER`: Registrar checagem beira-leito e administração de medicamentos.
- `VITAL_SIGNS_RECORD`: Aferir e registrar sinais vitais.
- `PROCEDURE_RECORD`: Registrar procedimentos executados e consumo de materiais.
- `EXAM_REQUEST`: Solicitar exames laboratoriais/imagem.
- `EXAM_RESULT_UPLOAD`: Anexar laudos e resultados de exames.

### Gestão Operacional & Escalas
- `SHIFT_READ`: Visualizar escalas e plantões.
- `SHIFT_MANAGE`: Criar, editar horários e alocar profissionais nos plantões.
- `SHIFT_ASSIGN_PATIENT`: Criar vínculo explícito Paciente $\leftrightarrow$ Profissional (`patient_professional_assignments`).
- `SHIFT_CHECKIN_EXECUTE`: Registrar ponto/check-in beira-leito de visita ou plantão.

### Profissionais & Credenciais
- `PROFESSIONAL_READ`: Visualizar cadastro do corpo clínico.
- `PROFESSIONAL_MANAGE`: Cadastrar e atualizar dados de profissionais, conselhos e especialidades.
- `PROFESSIONAL_CREDENTIAL_VALIDATE`: Validar situação de registro nos conselhos (COREN/CRM/CREFITO).

### Auditoria & Governança
- `AUDIT_READ`: Visualizar trilha de auditoria e logs de segurança.
- `ORGANIZATION_MANAGE`: Gerenciar parâmetros da empresa e unidades.

