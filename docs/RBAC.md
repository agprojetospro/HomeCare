# Arquitetura de RBAC, Papéis e Escopos — HomeCare

## 1. Princípio: Papel + Permissão + Escopo

A segurança do HomeCare não utiliza checagens estáticas como `if (role === 'MEDICO')` espalhadas no código. A autorização é baseada na tríade:

```text
AUTORIZAÇÃO = PERMISSÃO (O que pode fazer) + ESCOPO (Onde/Em quais registros pode fazer)
```

---

## 2. Estrutura de Tabelas RBAC

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  code VARCHAR(50) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_org_role_code UNIQUE (organization_id, code)
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  scope_type VARCHAR(30) NOT NULL DEFAULT 'OWN', -- OWN, TEAM, UNIT, REGION, ORGANIZATION, GLOBAL
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);
```

---

## 3. Definição de Escopos de Acesso

| Escopo | Nível de Abrangência | Exemplo Típico |
| :--- | :--- | :--- |
| **`OWN`** | Apenas registros vinculados diretamente ao profissional | Médico assistente ou Técnico de enfermagem acessando seus pacientes atribuídos |
| **`TEAM`** | Registros de pacientes sob a supervisão da equipe clínica | Enfermeiro supervisor acompanhando a equipe de plantão |
| **`UNIT`** | Todos os registros dentro da unidade operacional do usuário | Gestor de escala ou Atendente de uma filial específica |
| **`REGION`** | Registros abrangendo todas as unidades de uma região | Coordenador regional de atenção domiciliar |
| **`ORGANIZATION`** | Acesso irrestrito a todos os dados da organização/empresa | Administrador geral, Faturista central ou Auditor interno |
| **`GLOBAL`** | Manutenção multi-tenant da plataforma (Uso de engenharia) | Super Administrador da infraestrutura SaaS |

