-- ============================================================================
-- HOMECARE SECURITY & IMMUTABILITY HARDENING MIGRATION
-- ============================================================================

-- 1. HARDENING DE AUDITORIA FORENSE (IMUTABILIDADE ESTRITA DE AUDIT_LOGS)
CREATE OR REPLACE FUNCTION check_audit_log_immutability()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'A trilha de auditoria (audit_logs) é estritamente imutável e à prova de adulteração. Operações de UPDATE e DELETE são permanentemente proibidas.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutability_audit_logs ON audit_logs;

CREATE TRIGGER trg_immutability_audit_logs
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION check_audit_log_immutability();

-- 2. HARDENING DE FUNÇÕES SECURITY DEFINER (FIX SEARCH_PATH CONTRA HIJACKING)
CREATE OR REPLACE FUNCTION current_profile_id()
RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION current_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION current_professional_id()
RETURNS UUID AS $$
  SELECT id FROM public.professionals WHERE profile_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION has_permission(p_permission_code TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = auth.uid() 
      AND p.code = p_permission_code
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION belongs_to_unit(p_unit_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_unit_assignments
    WHERE user_id = auth.uid() 
      AND unit_id = p_unit_id 
      AND status = 'ACTIVE'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

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
  SELECT organization_id INTO v_patient_org_id FROM public.patients WHERE id = p_patient_id;
  v_org_id := public.current_organization_id();
  
  IF v_patient_org_id IS NULL OR v_patient_org_id <> v_org_id THEN
    RETURN FALSE;
  END IF;

  -- 2. Checar Escopo Global/Organização (Ex: Administrador, Auditor)
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = v_user_id 
      AND p.code IN ('PATIENT_READ', 'PEP_READ')
      AND rp.scope_type IN ('GLOBAL', 'ORGANIZATION')
  ) INTO v_has_org_scope;

  IF v_has_org_scope THEN
    RETURN TRUE;
  END IF;

  -- 3. Checar Escopo de Unidade (Ex: Gestor de Base)
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON rp.role_id = ur.role_id
    JOIN public.permissions p ON p.id = rp.permission_id
    JOIN public.patient_unit_assignments pua ON pua.patient_id = p_patient_id
    JOIN public.user_unit_assignments uua ON uua.unit_id = pua.unit_id
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

  -- 4. Checar Escopo Próprio / Vínculo Assistencial Ativo (Anti-IDOR Beira-Leito)
  SELECT EXISTS (
    SELECT 1 FROM public.patient_professional_assignments ppa
    JOIN public.professionals prof ON prof.id = ppa.professional_id
    WHERE ppa.patient_id = p_patient_id
      AND prof.profile_id = v_user_id
      AND ppa.is_active = TRUE
      AND (ppa.ends_at IS NULL OR ppa.ends_at >= NOW())
  ) INTO v_has_own_scope;

  RETURN v_has_own_scope;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp;

-- 3. RLS HARDENING PARA AUDITORIA (APENAS INSERT E SELECT, ZERO UPDATE/DELETE)
CREATE POLICY "RLS Audit Logs Insert Only" ON audit_logs
FOR INSERT WITH CHECK (organization_id = current_organization_id());

CREATE POLICY "RLS Audit Logs Read for Admins and Auditors" ON audit_logs
FOR SELECT USING (
  organization_id = current_organization_id() AND
  has_permission('AUDIT_READ')
);

