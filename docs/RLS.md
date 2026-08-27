# Arquitetura de Row-Level Security (RLS) & Funções Centrais — HomeCare

## 1. Funções Centrais de Segurança SQL

Para evitar duplicação de lógica e facilitar manutenção, as regras de autorização são encapsuladas em funções SQL nativas:

```sql
-- 1. Identificador do Perfil Autenticado
CREATE OR REPLACE FUNCTION current_profile_id()
RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Identificador da Organização do Usuário Autenticado
CREATE OR REPLACE FUNCTION current_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. Identificador do Profissional (quando aplicável)
CREATE OR REPLACE FUNCTION current_professional_id()
RETURNS UUID AS $$
  SELECT id FROM professionals WHERE profile_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. Verificação de Permissão e Escopo
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

-- 5. Pertence à Unidade
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

-- 6. Autorização Contextual de Acesso ao Paciente
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
  -- Verificar Organização
  SELECT organization_id INTO v_patient_org_id FROM patients WHERE id = p_patient_id;
  v_org_id := current_organization_id();
  
  IF v_patient_org_id IS NULL OR v_patient_org_id <> v_org_id THEN
    RETURN FALSE;
  END IF;

  -- Checar Escopo Global/Organização (Ex: Admin)
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

  -- Checar Escopo de Unidade
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

  -- Checar Escopo Próprio / Vínculo Assistencial (Anti-IDOR)
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
```

