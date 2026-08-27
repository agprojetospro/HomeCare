# Registro de Decisões Arquiteturais e Funcionais (ADRs) — HomeCare

---

### DECISÃO NECESSÁRIA 01: Modelagem de Atendimento vs. Episódio Assistencial

#### Problema
Em operações de Home Care, o paciente pode passar por múltiplas internações domiciliares ao longo de anos, receber visitas pontuais ou passar por períodos de internação hospitalar com retorno posterior. Precisamos definir se **Atendimento** e **Episódio Assistencial** devem ser entidades separadas ou unificadas.

#### Opção A: Entidade Unificada (`care_episodes` englobando Atendimento)
- **Vantagens**: Menor complexidade de tabelas, menos JOINs nas consultas cotidianas, implementação mais ágil no MVP.
- **Desvantagens**: Dificulta modelar um episódio longo de Home Care (ex: 6 meses) composto por múltiplos atendimentos diários ou ambulatoriais separados.
- **Impactos**: O ciclo de vida da admissão até a alta é representado em um único registro.

#### Opção B: Entidades Separadas (`care_episodes` 1:N `appointments/visits`)
- **Vantagens**: Separação conceitual estrita entre o "Episódio de Internação Domiciliar" (admissão até a alta definitiva) e os "Atendimentos/Visitas Pontuais" que ocorrem dentro dele. Permite auditoria cirúrgica e faturamento fracionado por atendimento.
- **Desvantagens**: Requer uma tabela intermediária a mais e chave composta em relatórios.
- **Impactos**: Suporta naturalmente tanto plantões contínuos quanto visitas multidisciplinares avulsas dentro do mesmo contrato.

#### Recomendação Técnica
**Recomendação: Opção B (Entidades Separadas)**.
Na atenção domiciliar, o paciente possui um **Episódio Assistencial** (o plano de internação domiciliar ativo com convênio/particular) e múltiplos **Atendimentos/Plantões/Visitas** vinculados a ele. Essa separação garante rastreabilidade para faturamento TISS, prontuário e repasse financeiro.

---

### DECISÃO NECESSÁRIA 02: Estratégia de Imutabilidade do PEP

#### Problema
A legislação médica (CFM, COREN) e a LGPD exigem que prontuários eletrônicos finalizados não possam sofrer alterações retrospectivas. Precisamos definir onde e como a imutabilidade será garantida.

#### Opção A: Flag lógica na aplicação (`status = FINALIZADO`)
- **Vantagens**: Simples de implementar no código da aplicação.
- **Desvantagens**: Vulnerável a bugs em endpoints, chamadas diretas via API ou scripts manuais no banco.
- **Impactos**: Baixa segurança jurídica em caso de litígio ou perícia médica.

#### Opção B: Trigger PostgreSQL BEFORE UPDATE/DELETE + RLS Restritivo
- **Vantagens**: Segurança a nível de banco de dados. Qualquer tentativa de UPDATE em registro com `status = 'FINALIZADO'` dispara exceção SQL (`RAISE EXCEPTION`), independente da origem da chamada.
- **Desvantagens**: Correções de erros de digitação exigem a criação de um novo registro do tipo `RETIFICACAO`.
- **Impactos**: Total conformidade com as resoluções do CFM/COREN e segurança jurídica inquestionável.

#### Recomendação Técnica
**Recomendação: Opção B (Trigger PostgreSQL + RLS)**.
Em sistemas de saúde, a integridade do prontuário deve ser inviolável a nível de infraestrutura de dados.

---

### DECISÃO NECESSÁRIA 03: Gestão de Vínculo Profissional ↔ Paciente para Acesso ao PEP

#### Problema
Em Home Care, um profissional alocado em uma escala ou região não pode ter acesso irrestrito a todos os pacientes da empresa. Como estruturar o controle de acesso ao prontuário?

#### Opção A: Acesso baseado apenas no Plantão do dia (`shift_team_members`)
- **Vantagens**: Simples, vincula automaticamente quem está no plantão a todos os pacientes daquele plantão.
- **Desvantagens**: Viola o princípio do menor privilégio em casos de múltiplos pacientes atendidos por equipes diferentes no mesmo turno.
- **Impactos**: Risco de vazamento de dados de saúde entre pacientes distintos.

#### Opção B: Tabela de Vínculo Explícito (`patient_professional_assignments`)
- **Vantagens**: Relação 1:1 estrita e auditada entre o paciente e o profissional responsável durante um período de vigência. RLS valida se existe atribuição ativa antes de liberar SELECT/INSERT no PEP.
- **Desvantagens**: Exige que o gestor de escala ou o sistema de escala gere o vínculo explícito ao montar a grade.
- **Impactos**: Elimina vulnerabilidades de Broken Object Level Authorization (BOLA/IDOR) e cumpre integralmente o requisito funcional do projeto.

#### Recomendação Técnica
**Recomendação: Opção B (Vínculo Explícito `patient_professional_assignments`)**.
Atende com rigor ao requisito central de segurança do sistema.

