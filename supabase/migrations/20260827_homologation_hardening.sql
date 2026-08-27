-- ============================================================================
-- HOMECARE HOMOLOGATION HARDENING: CONCURRENCY, AMENDMENTS & AUDIT DDL
-- ============================================================================

-- 1. RETIFICAÇÕES CLÍNICAS ADITIVAS (AMENDMENTS)
CREATE TABLE IF NOT EXISTS clinical_evolution_amendments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_evolution_id UUID NOT NULL REFERENCES clinical_evolutions(id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE RESTRICT,
  amendment_content TEXT NOT NULL,
  justification TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ADMINISTRAÇÃO MEDICAMENTOSA BEIRA-LEITO
CREATE TYPE medication_status AS ENUM (
  'ADMINISTRADO', 'RECUSADO', 'SUSPENSO', 'NAO_ADMINISTRADO'
);

CREATE TABLE IF NOT EXISTS medication_administrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  episode_id UUID NOT NULL REFERENCES care_episodes(id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE RESTRICT,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  route TEXT NOT NULL,
  status medication_status NOT NULL DEFAULT 'ADMINISTRADO',
  administered_by_id UUID NOT NULL REFERENCES professionals(id) ON DELETE RESTRICT,
  administered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  second_checker_id UUID REFERENCES professionals(id),
  refusal_reason TEXT,
  batch_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. FUNÇÃO ATÔMICA PARA ALOCAÇÃO DE PLANTÕES SEM CONDIÇÃO DE CORRIDA
CREATE OR REPLACE FUNCTION allocate_shift_atomic(
  p_unit_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_shift_type shift_type,
  p_doctor_id UUID,
  p_nurse_id UUID,
  p_notes TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_shift_id UUID;
  v_conflict_count INTEGER;
BEGIN
  -- Bloqueio transacional advisory baseado no hash da unidade e médico para serializar alocações concorrentes
  PERFORM pg_advisory_xact_lock(hashtext(p_unit_id::text || COALESCE(p_doctor_id::text, '')));

  -- Verificar se já existe plantão sobreposto para o mesmo médico
  IF p_doctor_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_conflict_count
    FROM shifts
    WHERE doctor_in_charge_id = p_doctor_id
      AND status NOT IN ('CANCELADO')
      AND (start_time < p_end_time AND end_time > p_start_time);

    IF v_conflict_count > 0 THEN
      RAISE EXCEPTION 'Conflito de Escala: O profissional médico já possui plantão alocado no intervalo informado.'
        USING ERRCODE = '23P01';
    END IF;
  END IF;

  -- Inserir o novo plantão de forma atômica
  INSERT INTO shifts (
    unit_id,
    start_time,
    end_time,
    shift_type,
    status,
    doctor_in_charge_id,
    nurse_in_charge_id,
    notes
  ) VALUES (
    p_unit_id,
    p_start_time,
    p_end_time,
    p_shift_type,
    'PLANEJADO',
    p_doctor_id,
    p_nurse_id,
    p_notes
  ) RETURNING id INTO v_shift_id;

  RETURN v_shift_id;
END;
$$;

-- 4. HABILITAR RLS NAS NOVAS TABELAS
ALTER TABLE clinical_evolution_amendments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_administrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinical_amendments_select_policy"
  ON clinical_evolution_amendments
  FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "clinical_amendments_insert_policy"
  ON clinical_evolution_amendments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "medication_admin_select_policy"
  ON medication_administrations
  FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "medication_admin_insert_policy"
  ON medication_administrations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

