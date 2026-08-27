# Especificação de Requisitos — HomeCare

## 1. Requisitos Funcionais (RF)

### Módulo 1: Cadastro de Pacientes & Prevenção de Duplicidade
- **RF01.1**: Permitir cadastro centralizado de pacientes (Nome, Nome Social, Filiação Pai/Mãe, CPF, RG, Data Nascimento, Nacionalidade, Raça/Cor, Naturalidade, Estado Civil, Sexo, Endereço completo geocodificado).
- **RF01.2**: Implementar verificação obrigatória de duplicidade por CPF ou combinação fonética/nome + data de nascimento antes da inserção.
- **RF01.3**: Permitir busca rápida e retorno automático ao fluxo chamador (ex: Admissão, Atendimento, Triagem).

### Módulo 2: Cadastro de Profissionais de Saúde
- **RF02.1**: Cadastro único de profissionais com dados pessoais, CPF, Conselho de Classe (COREN, CRM, CREFITO, etc.), Número do Registro, UF do Conselho, Especialidade, Contatos e Status.
- **RF02.2**: Suporte a múltiplos conselhos e categorias profissionais configuráveis.
- **RF02.3**: Bloqueio de duplicidade de profissionais em todos os módulos (plantões, escalas e PEP referenciam exclusivamente o ID único).

### Módulo 3: Atendimento e Admissão
- **RF03.1**: Criação e controle do ciclo de vida do Atendimento/Admissão (Tipos: Interno, Home Care).
- **RF03.2**: Associação de Médico Responsável, Especialidade, Convênio/Particular e dados de contato de emergência.

### Módulo 4: Triagem Clínica e Elegibilidade
- **RF04.1**: Avaliação clínica inicial estruturada com registro de local (Hospital, Residência, Clínica) e tipo (Presencial, Teleatendimento).
- **RF04.2**: Registro de Diagnóstico Principal (CID-10), Diagnósticos Secundários, Motivo da Solicitação, Estado Geral (Bom, Regular, Grave), Nível de Consciência (Alerta, Sonolento, Confuso, Sedado).
- **RF04.3**: Registro detalhado de Sinais Vitais, Mobilidade (Independente a Acamado), Alimentação (Oral, Enteral, GTT, NPT), Respiração (Ar ambiente, O2, TQT, VM), Eliminações e Avaliação de Pele/Curativos.
- **RF04.4**: Registro de Dispositivos Invasivos (GTT, SNE, SVD, PICC, CVC, TQT, Colostomia, Dreno).
- **RF04.5**: Mapeamento de Riscos (Queda, Lesão por Pressão, Broncoaspiração, Infecção, Agitação, Convulsão).
- **RF04.6**: Determinação formal de Elegibilidade (Elegível / Não Elegível) e Grau de Complexidade (Baixa, Média, Alta).

### Módulo 5: Plano Assistencial Estruturado
- **RF05.1**: Geração do Plano Assistencial estruturado a partir dos dados da Triagem.
- **RF05.2**: Definição de necessidades assistenciais por categoria profissional, frequência semanal, procedimentos previstos, equipamentos/materiais consignados e metas terapêuticas.
- **RF05.3**: Versionamento e histórico de revisões do plano.

### Módulo 6: Plantões, Equipes e Vínculo Explícito
- **RF06.1**: Gestão de plantões por período (Data Inicial, Data Final, Turno: 24h, Diurno 12h, Noturno 12h, Feriado, FDS).
- **RF06.2**: Exigência de Médico Responsável obrigatório e Enfermeiro Responsável opcional.
- **RF06.3**: Vínculo explícito Paciente ↔ Profissional com função, período de validade, responsabilidade e status. O sistema não assume atendimento indiscriminado.

### Módulo 7: Prontuário Eletrônico do Paciente (PEP)
- **RF07.1**: Tela operacional "Meus Pacientes" para profissionais autenticados visualizarem apenas seus pacientes ativos com vínculo.
- **RF07.2**: Cabeçalho clínico fixo (Nome, Idade, Data Nasc, Diagnóstico/CID, Alergias, Tipo de Atendimento, Plano, Alertas, Médico/Enfermeiro Responsável, Plantão).
- **RF07.3**: Abas estruturadas: Resumo, Evolução, Prescrição, Sinais Vitais, Procedimentos, Exames, Anamnese, Documentos, Histórico.

### Módulo 8: Evoluções Clínicas e Imutabilidade
- **RF08.1**: Registro de novas evoluções com suporte a status `RASCUNHO` e `FINALIZADO`.
- **RF08.2**: Registros finalizados tornam-se estritamente imutáveis no banco de dados com assinatura e auditoria.

### Módulo 9: Prescrições e Aprazamento
- **RF09.1**: Cadastro de prescrições médicas (Medicamento, Dose, Unidade, Via, Frequência, Horários, Duração, Instruções).
- **RF09.2**: Funcionalidade de copiar prescrição anterior e utilizar modelos padrão.

### Módulo 10: Sinais Vitais, Procedimentos e Exames
- **RF10.1**: Registro de Sinais Vitais completos (PA, FC, FR, SpO2, Temp, Glicemia, Peso, Dor) com alertas visuais para parâmetros fora da normalidade.
- **RF10.2**: Registro de Procedimentos e consumo de materiais para futura integração de faturamento/estoque.
- **RF10.3**: Gestão de solicitações e laudos de exames laboratoriais/imagem.

### Módulo 11: Linha do Tempo Clínica Unificada
- **RF11.1**: Timeline cronológica consolidada de todos os eventos assistenciais do paciente (Evoluções, Sinais, Prescrições, Procedimentos, Exames).

---

## 2. Requisitos Não-Funcionais (RNF)

- **RNF01 (Segurança & LGPD)**: Controle de acesso RBAC estrito e RLS em nível de linha no banco. Proteção integral contra IDOR.
- **RNF02 (Auditoria)**: Toda criação, leitura sensível, alteração e finalização deve gerar log indelével na tabela `audit_logs`.
- **RNF03 (Performance)**: Tempo de resposta do PEP < 300ms em conexões de banda padrão.
- **RNF04 (Responsividade)**: Interface totalmente otimizada para smartphones (cuidadores de campo), tablets e desktops.

