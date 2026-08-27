# Localidades, Regiões de Atendimento e Áreas de Atuação — HomeCare

## 1. Princípio de Separação de Localidades

No sistema **HomeCare**, existem três conceitos geográficos distintos que não devem ser confundidos:

```text
1. LOCALIDADE CADASTRAL (Endereço formal do paciente/familiar em patient_addresses)
2. LOCAL DO ATENDIMENTO (Onde a assistência domiciliar é efetivamente prestada no episódio)
3. ÁREA DE ATUAÇÃO OPERACIONAL (Região coberta pela unidade/profissional para escalas)
```

---

## 2. Regiões e Áreas de Atendimento

### Regiões de Atendimento (`service_regions`)
```sql
CREATE TABLE service_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  code VARCHAR(30) NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_unit_region_code UNIQUE (unit_id, code)
);
```

### Áreas de Cobertura Geográfica (`service_areas`)
```sql
CREATE TABLE service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_region_id UUID NOT NULL REFERENCES service_regions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state CHAR(2) NOT NULL,
  postal_code_start VARCHAR(10),
  postal_code_end VARCHAR(10),
  center_latitude DOUBLE PRECISION,
  center_longitude DOUBLE PRECISION,
  radius_km NUMERIC(5,2),
  neighborhoods TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. Áreas de Atuação do Profissional (`professional_service_areas`)

Mapeia onde cada profissional de saúde está habilitado e disponível para realizar plantões e visitas:

```sql
CREATE TABLE professional_service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  service_area_id UUID NOT NULL REFERENCES service_areas(id) ON DELETE RESTRICT,
  service_type TEXT NOT NULL DEFAULT 'ALL', -- PLANTÃO_12H, PLANTÃO_24H, VISITA_PONTUAL
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_prof_service_area UNIQUE (professional_id, service_area_id, service_type)
);
```

---

## 4. Endereços do Paciente e Desacoplamento do Local da Assistência

O endereço residencial do paciente não é necessariamente o local onde o Home Care acontece (ex: paciente recebendo cuidados na casa da filha ou em instituição de longa permanência temporária):

```sql
CREATE TYPE address_type AS ENUM (
  'RESIDENTIAL', 'CARE_LOCATION', 'TEMPORARY', 'BILLING', 'OTHER'
);

CREATE TABLE patient_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  address_type address_type NOT NULL DEFAULT 'RESIDENTIAL',
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state CHAR(2) NOT NULL,
  postal_code TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 5. Política de Geolocalização e Check-in de Visitas

> [!CAUTION]
> **Privacidade e LGPD**: O sistema **NÃO** realiza rastreamento GPS contínuo da localização do profissional em segundo plano.

O registro de coordenadas geográficas ocorre **exclusivamente no momento da execução**:
- **Check-in da Visita/Plantão**: Registro de ponto no momento da chegada à residência do paciente com coordenadas (`lat`, `lng`, `accuracy`).
- **Check-out da Visita/Plantão**: Registro de término com coordenadas.
- **Assinatura de Evolução Beira-Leito**: Carimbo de data/hora seguro e contexto de auditoria.

