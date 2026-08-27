# Arquitetura Organizacional & Multiunidades — HomeCare

## 1. Hierarquia Organizacional

O sistema estrutura a operação em quatro níveis hierárquicos:

```text
ORGANIZATION (Empresa Mantenedora / Tenant)
      ↓
UNITS (Unidades Operacionais: Sedes, Filiais, Clínicas, Almoxarifados)
      ↓
SERVICE REGIONS (Regiões de Atendimento: Norte, Sul, Centro, Litoral)
      ↓
SERVICE AREAS (Áreas Geográficas Delimitadas: CEPs, Bairros, Raio em Km)
```

---

## 2. Multiempresa Leve (`organization_id`)

Para balancear simplicidade de implementação e escalabilidade de produto:
- **Estratégia**: Multiempresa compartilhada (*Row-Level Multitenancy*) utilizando `organization_id` indexado em todas as tabelas centrais (`patients`, `professionals`, `units`, `care_episodes`, `shifts`, `audit_logs`).
- **Isolamento Estrito**: As políticas RLS do PostgreSQL garantem que usuários de uma organização jamais acessem dados de outra, mesmo em chamadas diretas à API.

---

## 3. Entidades Organizacionais

### Organizações (`organizations`)
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trade_name TEXT,
  cnpj TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Unidades Operacionais (`units`)
```sql
CREATE TYPE unit_type AS ENUM (
  'SEDE', 'FILIAL', 'BASE_OPERACIONAL', 'CLINICA', 'HOSPITAL', 'ALMOXARIFADO'
);

CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  code VARCHAR(30) NOT NULL,
  type unit_type NOT NULL DEFAULT 'BASE_OPERACIONAL',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  phone TEXT,
  email TEXT,
  address_street TEXT NOT NULL,
  address_number TEXT NOT NULL,
  address_neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state CHAR(2) NOT NULL,
  postal_code TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_org_unit_code UNIQUE (organization_id, code)
);
```

---

## 4. Vínculo Multiunidade de Usuários e Profissionais

Um colaborador ou profissional pode atuar em múltiplas unidades com uma unidade principal definida:

```sql
CREATE TABLE user_unit_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  CONSTRAINT uq_user_unit UNIQUE (user_id, unit_id)
);
```

