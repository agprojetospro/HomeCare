# Matriz Definitiva de Autorização & Escopos — HomeCare

## 1. Matriz de Perfis $\times$ Permissões $\times$ Escopos

| Papel (Role) | Escopo Padrão | Pacientes Visíveis | Visualização PEP | Evolução Clínica | Prescrição Médica | Gestão de Escalas | Auditoria & Logs |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **SUPER_ADMIN** | `GLOBAL` | Todos | Todas as Orgs | ❌ (Sem CRM/COREN) | ❌ | Total | Leitura Geral |
| **ADMIN** | `ORGANIZATION` | Todos da Org | Conforme Permissão | ❌ | ❌ | Total | Total na Org |
| **GESTOR_UNIDADE** | `UNIT` | Unidade | Supervisão | ❌ | ❌ | Total na Unidade | Unidade |
| **MEDICO** | `OWN` | Vinculados | Permitido | Permitido | **Permitido** | Leitura da Escala | Própria |
| **ENFERMEIRO_SUPERVISOR** | `TEAM` / `UNIT` | Equipe/Unidade | Permitido | Permitido | ❌ | Supervisão | Equipe |
| **ENFERMEIRO_ASSISTENCIAL** | `OWN` | Vinculados | Permitido | Permitido | ❌ | Própria | Própria |
| **TECNICO_ENFERMAGEM** | `OWN` | Vinculados | Execução | Permitido | ❌ | Própria | Própria |
| **FISIOTERAPEUTA** | `OWN` | Vinculados | Permitido | Permitido | ❌ | Própria | Própria |
| **NUTRICIONISTA / FONOAUDIOLOGO**| `OWN` | Vinculados | Permitido | Permitido | ❌ | Própria | Própria |
| **ATENDIMENTO / ADMISSAO** | `UNIT` | Unidade | Dados Cadastrais | ❌ | ❌ | Leitura | ❌ |
| **FATURAMENTO** | `UNIT` / `ORG` | Necessários | Mínimo Necessário | ❌ | ❌ | ❌ | ❌ |
| **AUDITOR_CLINICO** | `ORGANIZATION` | Todos da Org | Leitura | ❌ | ❌ | Leitura | Leitura Total |
| **FAMILIAR / CUIDADOR_LEIGO** | `OWN` | Próprio Paciente | Portal do Familiar | ❌ | ❌ | Visualizar Plantonista | ❌ |

---

## 2. Regra de Resolução de Acesso ao Paciente (`can_access_patient`)

```mermaid
flowchart TD
    A[Início: Solicitação de Acesso ao Paciente] --> B{Mesma Organização?}
    B -- Não --> Z[NEGADO 403]
    B -- Sim --> C{Possui Permissão PATIENT_READ ou PEP_READ?}
    C -- Não --> Z
    C -- Sim --> D{Qual é o Escopo da Permissão?}
    
    D -- GLOBAL / ORGANIZATION --> S[PERMITIDO 200]
    D -- UNIT --> E{Paciente pertence à mesma Unidade?}
    E -- Sim --> S
    E -- Não --> Z
    
    D -- TEAM --> F{Paciente está sob supervisão da Equipe?}
    F -- Sim --> S
    F -- Não --> Z
    
    D -- OWN --> G{Existe vínculo ativo em patient_professional_assignments?}
    G -- Sim --> S
    G -- Não --> Z
```

