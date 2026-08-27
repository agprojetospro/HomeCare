# Regras de Negócio — HomeCare

## 1. Regras de Cadastro e Admissão

- **RN-CAD-01 (Unicidade de Paciente)**: Não é permitido cadastrar dois pacientes com o mesmo CPF. Caso o paciente seja menor/sem CPF, a combinação de Nome Completo + Data de Nascimento + Nome da Mãe é validada contra duplicidades.
- **RN-CAD-02 (Registro de Profissional)**: Todo profissional deve ter Conselho de Classe informado (ex: COREN, CRM, CREFITO), Número do Registro e UF válidos.
- **RN-ADM-01 (Elegibilidade)**: Um paciente só pode avançar para a criação de Plano Assistencial e alocação de Plantão após a conclusão de uma Triagem Clínica com resultado `ELEGIVEL`.

---

## 2. Regras de Escalas e Plantões

- **RN-ESC-01 (Responsabilidade Médica)**: Todo plantão de Home Care exige a definição de pelo menos 1 Médico Responsável ativo.
- **RN-ESC-02 (Vínculo Paciente-Profissional)**: Estar alocado no turno/plantão não concede automaticamente acesso aos prontuários de todos os pacientes. O vínculo explícito `patient_professional_assignments` deve estar ativo para o paciente em questão.
- **RN-ESC-03 (Conflito de Horário)**: Um profissional não pode estar alocado em dois plantões com sobreposição de horários.

---

## 3. Regras Clínicas e PEP

- **RN-PEP-01 (Imutabilidade de Evoluções Finalizadas)**: Uma evolução clínica com status `FINALIZADO` não pode ser editada ou excluída por nenhum usuário, nem mesmo administradores. Caso haja necessidade de correção, deve ser inserida uma nova evolução do tipo `RETIFICACAO` referenciando o registro anterior.
- **RN-PEP-02 (Auditoria Obrigatória)**: Toda visualização de PEP por profissional e toda gravação/finalização de dados clínicos gera registro na trilha de auditoria contendo `user_id`, `patient_id`, `action`, `timestamp` e `ip/context`.
- **RN-PEP-03 (Alertas de Sinais Vitais)**: Valores de sinais vitais fora das faixas de segurança clínica disparam alertas visuais imediatos:
  - SpO2 < 90% (Grave) / < 94% (Alerta)
  - FC > 120 bpm ou < 50 bpm
  - PAS > 180 mmHg ou < 90 mmHg
  - Temperatura > 37.8 °C ou < 35.0 °C
  - Glicemia < 70 mg/dL ou > 250 mg/dL

---

## 4. Regras de Prescrição e Medicamentos

- **RN-MED-01 (Validade de Prescrição)**: Prescrições ativas permanecem válidas até a data final estabelecida ou até que sejam explicitamente suspensas/substituídas por médico.
- **RN-MED-02 (Checagem de Administração)**: Apenas profissionais com perfil de enfermagem ou médico com vínculo ativo no plantão podem registrar a administração de medicamentos aprazados.

