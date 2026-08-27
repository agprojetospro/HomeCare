# Arquitetura de Segurança, RBAC & RLS — HomeCare

## 1. Matriz de Perfis e Permissões (RBAC)

| Perfil | Cadastrar Paciente | Abrir Atendimento | Realizar Triagem | Criar Plano Assistencial | Gerir Escalas | Acessar PEP Geral | Acessar PEP Vinculado | Prescrever Medicamentos | Evoluir Beira-Leito |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (se CRM) | ✅ |
| **GESTOR_ESCALA** | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **MEDICO** | 👁️ (Leitura) | 👁️ | ✅ | ✅ | 👁️ | ❌ | ✅ | ✅ | ✅ |
| **ENFERMEIRO** | 👁️ (Leitura) | 👁️ | ✅ | ✅ | 👁️ | ❌ | ✅ | ❌ | ✅ |
| **TECNICO_ENFERMAGEM** | ❌ | ❌ | ❌ | ❌ | 👁️ (Própria) | ❌ | ✅ | ❌ | ✅ |
| **FISIOTERAPEUTA** | ❌ | ❌ | ✅ (Espec.) | ❌ | 👁️ (Própria) | ❌ | ✅ | ❌ | ✅ |
| **FAMILIAR** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 👁️ (Portal) | ❌ | ❌ |

---

## 2. Estratégia de RLS (Row-Level Security) no PostgreSQL

A política de segurança no banco impede que qualquer consulta ou mutação acerte dados sem autorização:

```sql
-- Exemplo de RLS para Evoluções Clínicas
ALTER TABLE clinical_evolutions ENABLE ROW LEVEL SECURITY;

-- Política de Leitura: Administrador ou Profissional com vínculo ativo com o paciente
CREATE POLICY "Permitir leitura de evolução clínica"
ON clinical_evolutions FOR SELECT
USING (
  auth.role() = 'ADMIN' OR
  EXISTS (
    SELECT 1 FROM patient_professional_assignments ppa
    JOIN professionals p ON p.id = ppa.professional_id
    WHERE ppa.patient_id = clinical_evolutions.patient_id
      AND p.profile_id = auth.uid()
      AND ppa.is_active = true
  )
);

-- Política de Inserção: Apenas profissional com vínculo ativo
CREATE POLICY "Permitir criação de evolução clínica"
ON clinical_evolutions FOR INSERT
WITH CHECK (
  auth.role() = 'ADMIN' OR
  EXISTS (
    SELECT 1 FROM patient_professional_assignments ppa
    JOIN professionals p ON p.id = ppa.professional_id
    WHERE ppa.patient_id = clinical_evolutions.patient_id
      AND p.profile_id = auth.uid()
      AND ppa.is_active = true
  )
);
```

---

## 3. Trigger de Imutabilidade Clínica

```sql
CREATE OR REPLACE FUNCTION enforce_clinical_record_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'FINALIZADO' THEN
    RAISE EXCEPTION 'Registros clínicos finalizados são estritamente imutáveis conforme resolução CFM/COREN.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clinical_evolutions_immutability
BEFORE UPDATE OR DELETE ON clinical_evolutions
FOR EACH ROW
EXECUTE FUNCTION enforce_clinical_record_immutability();
```

---

## 4. Proteção contra IDOR (Insecure Direct Object Reference)

- **Princípio**: Nenhuma rota de frontend ou chamada API confia no `patient_id` ou `shift_id` vindo do cliente sem validar no banco se o usuário autenticado (`auth.uid()`) possui o perfil ou atribuição ativa correspondente.
- **Validação de Domínio**: Toda mutação passa por `assertProfessionalAssignment(userId, patientId)`.

