-- ============================================================================
-- HOMECARE DATABASE SCHEMA & SECURITY POLICIES (MIGRATION INITIAL)
-- ============================================================================

-- 1. ENUMS
CREATE TYPE user_role AS ENUM (
  'ADMIN', 'GESTOR_ESCALA', 'MEDICO', 'ENFERMEIRO',
  'TECNICO_ENFERMAGEM', 'FISIOTERAPEUTA', 'NUTRICIONISTA',
  'FONOAUDIOLOGO', 'PSICOLOGO', 'TERAPEUTA_OCUPACIONAL',
  'CUIDADOR', 'FAMILIAR'
);

CREATE TYPE care_type AS ENUM (
  'INTERNO', 'HOME_CARE_24H', 'HOME_CARE_12H', 'VISITAS_PONTUAIS', 'PROCEDIMENTOS'
);

CREATE TYPE care_complexity AS ENUM ('BAIXA', 'MEDIA', 'ALTA');
CREATE TYPE triage_eligibility AS ENUM ('ELEGIVEL', 'NAO_ELEGIVEL');
CREATE TYPE shift_type AS ENUM ('HORAS_24', 'DIURNO_12H', 'NOTURNO_12H', 'FERIADO', 'FINAL_DE_SEMANA', 'OUTRO');
CREATE TYPE shift_status AS ENUM ('PLANEJADO', 'CONFIRMADO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO');
CREATE TYPE record_status AS ENUM ('RASCUNHO', 'FINALIZADO');

-- 2. PROFILES & PROFESSIONALS
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'TECNICO_ENFERMAGEM',
  avatar_url TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  profession user_role NOT NULL,
  council_type TEXT NOT NULL,
  council_number TEXT NOT NULL,
  council_uf CHAR(2) NOT NULL,
  specialties TEXT[] DEFAULT '{}',
  phone TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'ATIVO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PATIENTS & CONVÊNIOS
CREATE TABLE insurers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  ans_code TEXT,
  status TEXT NOT NULL DEFAULT 'ATIVO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  social_name TEXT,
  father_name TEXT,
  mother_name TEXT NOT NULL,
  cpf TEXT UNIQUE,
  rg TEXT,
  birth_date DATE NOT NULL,
  nationality TEXT DEFAULT 'Brasileira',
  race_color TEXT DEFAULT 'NAO_INFORMADO',
  naturalness TEXT,
  marital_status TEXT DEFAULT 'SOLTEIRO',
  gender TEXT NOT NULL,
  address_street TEXT NOT NULL,
  address_number TEXT NOT NULL,
  address_complement TEXT,
  address_neighborhood TEXT NOT NULL,
  address_city TEXT NOT NULL,
  address_state CHAR(2) NOT NULL,
  address_zip TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  allergies TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'ATIVO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. EPISÓDIOS & ATENDIMENTOS
CREATE TABLE care_episodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  insurer_id UUID REFERENCES insurers(id) ON DELETE RESTRICT,
  care_type care_type NOT NULL DEFAULT 'HOME_CARE_12H',
  admission_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  discharge_date TIMESTAMPTZ,
  doctor_in_charge_id UUID REFERENCES professionals(id),
  nurse_in_charge_id UUID REFERENCES professionals(id),
  status TEXT NOT NULL DEFAULT 'ATIVO',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TRIAGEM & ELEGIBILIDADE
CREATE TABLE triages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID REFERENCES care_episodes(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES professionals(id),
  evaluation_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  location TEXT NOT NULL,
  modality TEXT NOT NULL,
  main_diagnosis TEXT NOT NULL,
  cid_10 TEXT NOT NULL,
  secondary_diagnoses TEXT[] DEFAULT '{}',
  request_reason TEXT NOT NULL,
  general_state TEXT NOT NULL,
  consciousness_level TEXT NOT NULL,
  
  -- Sinais Vitais
  systolic_bp INT NOT NULL,
  diastolic_bp INT NOT NULL,
  heart_rate INT NOT NULL,
  respiratory_rate INT NOT NULL,
  oxygen_saturation INT NOT NULL,
  temperature NUMERIC(4,1) NOT NULL,
  blood_glucose INT,

  -- Avaliações de Domínio
  mobility TEXT NOT NULL,
  feeding TEXT NOT NULL,
  breathing TEXT NOT NULL,
  eliminations TEXT NOT NULL,
  skin_condition TEXT NOT NULL,
  devices TEXT[] DEFAULT '{}',
  risks TEXT[] DEFAULT '{}',
  care_needs TEXT[] DEFAULT '{}',

  -- Conclusão
  eligibility triage_eligibility NOT NULL,
  complexity_level care_complexity NOT NULL,
  conclusion TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PLANO ASSISTENCIAL
CREATE TABLE care_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES care_episodes(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  triage_id UUID REFERENCES triages(id),
  version INT NOT NULL DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'ATIVO',
  created_by_id UUID NOT NULL REFERENCES professionals(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE care_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  care_plan_id UUID NOT NULL REFERENCES care_plans(id) ON DELETE CASCADE,
  profession_type user_role NOT NULL,
  frequency TEXT NOT NULL,
  procedure_description TEXT NOT NULL,
  goals TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PLANTÕES, EQUIPES & VÍNCULOS
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  shift_type shift_type NOT NULL,
  doctor_in_charge_id UUID NOT NULL REFERENCES professionals(id),
  nurse_in_charge_id UUID REFERENCES professionals(id),
  status shift_status NOT NULL DEFAULT 'PLANEJADO',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE shift_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id),
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ALOCADO'
);

CREATE TABLE patient_professional_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES care_episodes(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES professionals(id),
  role TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. PRONTUÁRIO ELETRÔNICO DO PACIENTE (PEP)
CREATE TABLE clinical_evolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES care_episodes(id) ON DELETE RESTRICT,
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
  episode_id UUID NOT NULL REFERENCES care_episodes(id) ON DELETE RESTRICT,
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
  episode_id UUID NOT NULL REFERENCES care_episodes(id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  professional_id UUID NOT NULL REFERENCES professionals(id),
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  systolic_bp INT NOT NULL,
  diastolic_bp INT NOT NULL,
  heart_rate INT NOT NULL,
  respiratory_rate INT NOT NULL,
  oxygen_saturation INT NOT NULL,
  temperature NUMERIC(4,1) NOT NULL,
  blood_glucose INT,
  weight_kg NUMERIC(5,2),
  pain_score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES care_episodes(id) ON DELETE RESTRICT,
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
  episode_id UUID NOT NULL REFERENCES care_episodes(id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  requester_id UUID NOT NULL REFERENCES professionals(id),
  exam_name TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'SOLICITADO',
  result_summary TEXT,
  result_attachment_url TEXT
);

CREATE TABLE clinical_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES care_episodes(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reference_id UUID,
  reference_table TEXT,
  author_name TEXT NOT NULL
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_table TEXT NOT NULL,
  record_id UUID,
  patient_id UUID,
  previous_state JSONB,
  new_state JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 9. TRIGGERS DE SEGURANÇA & IMUTABILIDADE CLÍNICA
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
-- 10. ROW LEVEL SECURITY (RLS POLICIES)
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE triages ENABLE ROW LEVEL SECURITY;
ALTER TABLE care_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_professional_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_evolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política Base: Administradores e Gestores
CREATE POLICY "Admin All Access Profiles" ON profiles FOR ALL USING (auth.jwt() ->> 'role' = 'ADMIN');
CREATE POLICY "Admin All Access Patients" ON patients FOR ALL USING (auth.jwt() ->> 'role' IN ('ADMIN', 'GESTOR_ESCALA'));
CREATE POLICY "Admin All Access Episodes" ON care_episodes FOR ALL USING (auth.jwt() ->> 'role' IN ('ADMIN', 'GESTOR_ESCALA'));

-- Política de Acesso ao PEP por Vínculo Ativo (Anti-IDOR)
CREATE POLICY "Profissionais Ver Pacientes Vinculados" ON patients
FOR SELECT USING (
  auth.jwt() ->> 'role' IN ('ADMIN', 'GESTOR_ESCALA') OR
  EXISTS (
    SELECT 1 FROM patient_professional_assignments ppa
    JOIN professionals p ON p.id = ppa.professional_id
    WHERE ppa.patient_id = patients.id
      AND p.profile_id = auth.uid()
      AND ppa.is_active = TRUE
  )
);

CREATE POLICY "Profissionais Ver e Inserir Evolucoes PEP" ON clinical_evolutions
FOR ALL USING (
  auth.jwt() ->> 'role' = 'ADMIN' OR
  EXISTS (
    SELECT 1 FROM patient_professional_assignments ppa
    JOIN professionals p ON p.id = ppa.professional_id
    WHERE ppa.patient_id = clinical_evolutions.patient_id
      AND p.profile_id = auth.uid()
      AND ppa.is_active = TRUE
  )
);

