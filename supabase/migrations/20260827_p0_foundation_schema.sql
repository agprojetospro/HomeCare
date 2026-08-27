-- ============================================================================
-- HOMECARE P0 FOUNDATION: IDENTITY, ORGANIZATIONS, LOCALITIES & SECURITY DDL
-- ============================================================================

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_account_status AS ENUM (
  'INVITED', 'ACTIVE', 'SUSPENDED', 'BLOCKED', 'INACTIVE'
);

CREATE TYPE unit_type AS ENUM (
  'SEDE', 'FILIAL', 'BASE_OPERACIONAL', 'CLINICA', 'HOSPITAL', 'ALMOXARIFADO'
);

CREATE TYPE council_type AS ENUM (
  'CRM', 'COREN', 'CREFITO', 'CRN', 'CREFONO', 'CRP', 'OUTRO'
);

CREATE TYPE profession_category AS ENUM (
  'MEDICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM', 'FISIOTERAPEUTA',
  'NUTRICIONISTA', 'FONOAUDIOLOGO', 'PSICOLOGO', 'TERAPEUTA_OCUPACIONAL',
  'CUIDADOR', 'ADMINISTRATIVO', 'OUTRO'
);

CREATE TYPE address_type AS ENUM (
  'RESIDENTIAL', 'CARE_LOCATION', 'TEMPORARY', 'BILLING', 'OTHER'
);

CREATE TYPE scope_type AS ENUM (
  'OWN', 'TEAM', 'UNIT', 'REGION', 'ORGANIZATION', 'GLOBAL'
);

CREATE TYPE record_status AS ENUM (
  'RASCUNHO', 'FINALIZADO'
);

CREATE TYPE shift_type AS ENUM (
  'HORAS_24', 'DIURNO_12H', 'NOTURNO_12H', 'FERIADO', 'FINAL_DE_SEMANA', 'OUTRO'
);

CREATE TYPE shift_status AS ENUM (
  'PLANEJADO', 'CONFIRMADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO'
);

-- 2. ORGANIZATIONS (TENANTS)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trade_name TEXT,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. UNITS (OPERATIONAL BASES)
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  code VARCHAR(30) NOT NULL,
  type unit_type NOT NULL DEFAULT 'BASE_OPERACIONAL',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  phone VARCHAR(30),
  email VARCHAR(120),
  address_street TEXT NOT NULL,
  address_number TEXT NOT NULL,
  address_complement TEXT,
  address_neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state CHAR(2) NOT NULL,
  postal_code VARCHAR(10) NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_org_unit_code UNIQUE (organization_id, code)
);

-- 4. SERVICE REGIONS & SERVICE AREAS
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

-- 5. PROFILES (USERS)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  email VARCHAR(120) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone VARCHAR(30),
  avatar_url TEXT,
  status user_account_status NOT NULL DEFAULT 'INVITED',
  timezone TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
  locale TEXT NOT NULL DEFAULT 'pt-BR',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. RBAC: ROLES, PERMISSIONS, ROLE_PERMISSIONS, USER_ROLES
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
  scope_type scope_type NOT NULL DEFAULT 'OWN',
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

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
  CONSTRAINT uq_user_unit UNIQUE (user_id, unit_id),
  CONSTRAINT chk_user_unit_dates CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

-- 7. PROFESSIONALS, CREDENTIALS & SPECIALTIES
CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(20),
  phone VARCHAR(30) NOT NULL,
  email VARCHAR(120),
  professional_type profession_category NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE professional_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  council_type council_type NOT NULL,
  registration_number VARCHAR(30) NOT NULL,
  state CHAR(2) NOT NULL,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_prof_credential UNIQUE (council_type, registration_number, state),
  CONSTRAINT chk_prof_cred_dates CHECK (valid_until IS NULL OR valid_until >= valid_from)
);

CREATE TABLE specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  council_type council_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE professional_specialties (
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
  rqe_number VARCHAR(30),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (professional_id, specialty_id)
);

CREATE TABLE professional_unit_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_prof_unit UNIQUE (professional_id, unit_id),
  CONSTRAINT chk_prof_unit_dates CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

CREATE TABLE professional_service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  service_area_id UUID NOT NULL REFERENCES service_areas(id) ON DELETE RESTRICT,
  service_type TEXT NOT NULL DEFAULT 'ALL',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_prof_service_area UNIQUE (professional_id, service_area_id, service_type)
);

CREATE TABLE professional_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  unit_id UUID REFERENCES units(id),
  service_region_id UUID REFERENCES service_regions(id),
  care_type TEXT DEFAULT 'ALL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_prof_avail_times CHECK (end_time > start_time)
);

CREATE TABLE professional_unavailability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  reason VARCHAR(50) NOT NULL, -- FERIAS, FOLGA, ATESTADO, TREINAMENTO, BLOQUEIO_ADMIN
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_prof_unavail_dates CHECK (end_datetime > start_datetime)
);

-- 8. PATIENTS, ADDRESSES & UNIT ASSIGNMENTS
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL,
  social_name TEXT,
  cpf VARCHAR(14),
  rg VARCHAR(30),
  birth_date DATE NOT NULL,
  mother_name TEXT NOT NULL,
  father_name TEXT,
  gender VARCHAR(20) NOT NULL,
  marital_status VARCHAR(30) DEFAULT 'SOLTEIRO',
  nationality VARCHAR(50) DEFAULT 'Brasileira',
  race_color VARCHAR(30) DEFAULT 'NAO_INFORMADO',
  naturalness VARCHAR(80),
  allergies TEXT[] DEFAULT '{}',
  status VARCHAR(30) NOT NULL DEFAULT 'ATIVO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_org_patient_cpf UNIQUE (organization_id, cpf)
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
  postal_code VARCHAR(10) NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_primary BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE patient_unit_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_patient_unit_dates CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

-- 9. CARE EPISODES & PATIENT PROFESSIONAL ASSIGNMENTS
CREATE TABLE care_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  care_location_id UUID REFERENCES patient_addresses(id),
  care_type TEXT NOT NULL DEFAULT 'HOME_CARE_12H',
  admission_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  discharge_date TIMESTAMPTZ,
  doctor_in_charge_id UUID REFERENCES professionals(id),
  nurse_in_charge_id UUID REFERENCES professionals(id),
  status TEXT NOT NULL DEFAULT 'ATIVO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_episode_dates CHECK (discharge_date IS NULL OR discharge_date >= admission_date)
);

CREATE TABLE patient_professional_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  care_episode_id UUID NOT NULL REFERENCES care_episodes(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  CONSTRAINT chk_ppa_dates CHECK (ends_at IS NULL OR ends_at >= starts_at)
);

-- 10. SHIFTS (PLANTÕES)
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  service_region_id UUID REFERENCES service_regions(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  shift_type shift_type NOT NULL,
  doctor_in_charge_id UUID NOT NULL REFERENCES professionals(id),
  nurse_in_charge_id UUID REFERENCES professionals(id),
  status shift_status NOT NULL DEFAULT 'PLANEJADO',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_shift_times CHECK (end_time > start_time)
);

CREATE TABLE shift_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id),
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ALOCADO',
  PRIMARY KEY (shift_id, professional_id)
);

CREATE TABLE shift_patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  care_episode_id UUID NOT NULL REFERENCES care_episodes(id) ON DELETE RESTRICT,
  PRIMARY KEY (shift_id, patient_id)
);

-- 11. PEP: CLINICAL EVOLUTIONS, PRESCRIPTIONS, VITALS, PROCEDURES, EXAMS
CREATE TABLE clinical_evolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  care_episode_id UUID NOT NULL REFERENCES care_episodes(id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  professional_id UUID NOT NULL REFERENCES professionals(id),
  shift_id UUID REFERENCES shifts(id),
  evolution_type TEXT NOT NULL,
  content TEXT NOT NULL,
  status record_status NOT NULL DEFAULT 'RASCUNHO',
  finalized_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  care_episode_id UUID NOT NULL REFERENCES care_episodes(id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  doctor_id UUID NOT NULL REFERENCES professionals(id),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ATIVA',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE prescription_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  unit TEXT NOT NULL,
  route TEXT NOT NULL,
  frequency TEXT NOT NULL,
  schedule_times TEXT[] DEFAULT '{}',
  duration_days INT,
  instructions TEXT
);

CREATE TABLE vital_signs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  care_episode_id UUID NOT NULL REFERENCES care_episodes(id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  professional_id UUID NOT NULL REFERENCES professionals(id),
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  systolic_bp INT NOT NULL CHECK (systolic_bp BETWEEN 30 AND 350),
  diastolic_bp INT NOT NULL CHECK (diastolic_bp BETWEEN 20 AND 250),
  heart_rate INT NOT NULL CHECK (heart_rate BETWEEN 20 AND 300),
  respiratory_rate INT NOT NULL CHECK (respiratory_rate BETWEEN 4 AND 80),
  oxygen_saturation INT NOT NULL CHECK (oxygen_saturation BETWEEN 30 AND 100),
  temperature NUMERIC(4,1) NOT NULL CHECK (temperature BETWEEN 25.0 AND 45.0),
  blood_glucose INT CHECK (blood_glucose IS NULL OR blood_glucose BETWEEN 10 AND 1000),
  weight_kg NUMERIC(5,2),
  pain_score INT NOT NULL DEFAULT 0 CHECK (pain_score BETWEEN 0 AND 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  care_episode_id UUID NOT NULL REFERENCES care_episodes(id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  professional_id UUID NOT NULL REFERENCES professionals(id),
  procedure_name TEXT NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  quantity INT NOT NULL DEFAULT 1,
  notes TEXT,
  materials_used JSONB DEFAULT '[]'::jsonb
);

CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  care_episode_id UUID NOT NULL REFERENCES care_episodes(id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  requester_id UUID NOT NULL REFERENCES professionals(id),
  exam_name TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'SOLICITADO',
  result_summary TEXT,
  result_attachment_url TEXT
);

-- 12. CLINICAL EVENTS (TIMELINE) vs AUDIT LOGS (SECURITY)
CREATE TABLE clinical_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  care_episode_id UUID NOT NULL REFERENCES care_episodes(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reference_id UUID,
  reference_table TEXT,
  author_name TEXT NOT NULL,
  summary TEXT,
  severity TEXT DEFAULT 'NORMAL'
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES profiles(id),
  profile_id UUID REFERENCES profiles(id),
  professional_id UUID REFERENCES professionals(id),
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(60) NOT NULL,
  entity_id UUID,
  patient_id UUID,
  care_episode_id UUID,
  old_data JSONB,
  new_data JSONB,
  request_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 13. ÍNDICES DE PERFORMANCE
-- ============================================================================
CREATE INDEX idx_profiles_org_status ON profiles(organization_id, status);
CREATE INDEX idx_professionals_profile ON professionals(profile_id);
CREATE INDEX idx_professionals_cpf ON professionals(cpf);
CREATE INDEX idx_user_unit_assign ON user_unit_assignments(user_id, unit_id, status);
CREATE INDEX idx_prof_unit_assign ON professional_unit_assignments(professional_id, unit_id, status);
CREATE INDEX idx_patient_unit_assign ON patient_unit_assignments(patient_id, unit_id, status);
CREATE INDEX idx_patient_prof_assign ON patient_professional_assignments(patient_id, professional_id, is_active);
CREATE INDEX idx_care_episodes_patient ON care_episodes(patient_id, status);
CREATE INDEX idx_shifts_unit_dates ON shifts(unit_id, start_time, end_time);
CREATE INDEX idx_evolutions_patient ON clinical_evolutions(patient_id, created_at DESC);
CREATE INDEX idx_vitals_patient ON vital_signs(patient_id, measured_at DESC);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id, status);
CREATE INDEX idx_clinical_events_patient ON clinical_events(patient_id, event_timestamp DESC);
CREATE INDEX idx_audit_logs_org_created ON audit_logs(organization_id, created_at DESC);
CREATE INDEX idx_audit_logs_patient ON audit_logs(patient_id, created_at DESC);

-- ============================================================================
-- 14. TRIGGERS DE SEGURANÇA E IMUTABILIDADE CLÍNICA
-- ============================================================================
CREATE OR REPLACE FUNCTION check_clinical_record_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'FINALIZADO' THEN
    RAISE EXCEPTION 'Registros clínicos com status FINALIZADO são estritamente imutáveis conforme normas do CFM e COREN.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_immutability_clinical_evolutions
BEFORE UPDATE OR DELETE ON clinical_evolutions
FOR EACH ROW
EXECUTE FUNCTION check_clinical_record_immutability();

-- ============================================================================
-- 15. FUNÇÕES SQL CENTRAIS DE AUTORIZAÇÃO E RLS
-- ============================================================================
CREATE OR REPLACE FUNCTION current_profile_id()
RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION current_professional_id()
RETURNS UUID AS $$
  SELECT id FROM professionals WHERE profile_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_permission(p_permission_code TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = auth.uid() 
      AND p.code = p_permission_code
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION belongs_to_unit(p_unit_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_unit_assignments
    WHERE user_id = auth.uid() 
      AND unit_id = p_unit_id 
      AND status = 'ACTIVE'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_access_patient(p_patient_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_org_id UUID;
  v_patient_org_id UUID;
  v_has_org_scope BOOLEAN;
  v_has_unit_scope BOOLEAN;
  v_has_own_scope BOOLEAN;
BEGIN
  -- 1. Validar Organização
  SELECT organization_id INTO v_patient_org_id FROM patients WHERE id = p_patient_id;
  v_org_id := current_organization_id();
  
  IF v_patient_org_id IS NULL OR v_patient_org_id <> v_org_id THEN
    RETURN FALSE;
  END IF;

  -- 2. Checar Escopo Global/Organização (Ex: Administrador)
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = v_user_id 
      AND p.code IN ('PATIENT_READ', 'PEP_READ')
      AND rp.scope_type IN ('GLOBAL', 'ORGANIZATION')
  ) INTO v_has_org_scope;

  IF v_has_org_scope THEN
    RETURN TRUE;
  END IF;

  -- 3. Checar Escopo de Unidade
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    JOIN patient_unit_assignments pua ON pua.patient_id = p_patient_id
    JOIN user_unit_assignments uua ON uua.unit_id = pua.unit_id
    WHERE ur.user_id = v_user_id 
      AND uua.user_id = v_user_id
      AND p.code IN ('PATIENT_READ', 'PEP_READ')
      AND rp.scope_type = 'UNIT'
      AND pua.status = 'ACTIVE'
      AND uua.status = 'ACTIVE'
  ) INTO v_has_unit_scope;

  IF v_has_unit_scope THEN
    RETURN TRUE;
  END IF;

  -- 4. Checar Escopo Próprio / Vínculo Assistencial (Anti-IDOR)
  SELECT EXISTS (
    SELECT 1 FROM patient_professional_assignments ppa
    JOIN professionals prof ON prof.id = ppa.professional_id
    WHERE ppa.patient_id = p_patient_id
      AND prof.profile_id = v_user_id
      AND ppa.is_active = TRUE
  ) INTO v_has_own_scope;

  RETURN v_has_own_scope;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================================
-- 16. ROW LEVEL SECURITY (RLS POLICIES)
-- ============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_unit_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_unit_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_professional_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_evolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política de Organização: Acesso a dados restrito à mesma organização do usuário
CREATE POLICY "RLS Organizations Isolation" ON organizations
FOR ALL USING (id = current_organization_id());

CREATE POLICY "RLS Units Org Access" ON units
FOR ALL USING (organization_id = current_organization_id());

CREATE POLICY "RLS Profiles Org Access" ON profiles
FOR ALL USING (organization_id = current_organization_id());

CREATE POLICY "RLS Professionals Org Access" ON professionals
FOR ALL USING (organization_id = current_organization_id());

CREATE POLICY "RLS Patients Contextual Access" ON patients
FOR SELECT USING (can_access_patient(id));

CREATE POLICY "RLS Clinical Evolutions Contextual Access" ON clinical_evolutions
FOR ALL USING (can_access_patient(patient_id));

CREATE POLICY "RLS Vital Signs Contextual Access" ON vital_signs
FOR ALL USING (can_access_patient(patient_id));

CREATE POLICY "RLS Prescriptions Contextual Access" ON prescriptions
FOR ALL USING (can_access_patient(patient_id));

