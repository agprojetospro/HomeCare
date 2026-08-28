-- ============================================================================
-- MIGRATION: ONDA 4 — PORTAL DO FAMILIAR & CAMADA DE VISIBILIDADE LGPD
-- Data: 27/08/2026
-- ============================================================================

-- 1. CONCESSÕES DE ACESSO FAMILIAR (LGPD)
CREATE TABLE IF NOT EXISTS public.family_access_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    family_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    family_user_name VARCHAR(255) NOT NULL,
    family_email VARCHAR(255) NOT NULL,
    family_phone VARCHAR(50),
    relationship VARCHAR(50) NOT NULL CHECK (relationship IN (
        'CONJUGE', 'FILHO_FILHA', 'PAI_MAE', 'IRMAO_IRMA',
        'CUIDADOR_LEGAL', 'RESPONSAVEL_LEGAL', 'OUTRO'
    )),
    access_level VARCHAR(50) NOT NULL DEFAULT 'VISAO_COMPLETA_LEIGA' CHECK (access_level IN (
        'VISAO_COMPLETA_LEIGA', 'VISAO_OPERACIONAL_HORARIOS', 'VISAO_RESTRITA'
    )),
    consent_signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_family_patient_user UNIQUE (patient_id, family_user_id)
);

-- 2. FEEDBACKS & AVALIAÇÕES DE CUIDADO FAMILIAR
CREATE TABLE IF NOT EXISTS public.family_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    family_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    family_user_name VARCHAR(255) NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'ATENDIMENTO_EQUIPE', 'PONTUALIDADE', 'COMUNICACAO', 'CONFORTO_PACIENTE', 'GERAL'
    )),
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ÍNDICES DE DESEMPENHO
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_family_access_patient ON public.family_access_grants(patient_id, active);
CREATE INDEX IF NOT EXISTS idx_family_access_user ON public.family_access_grants(family_user_id, active);
CREATE INDEX IF NOT EXISTS idx_family_feedbacks_patient ON public.family_feedbacks(patient_id, created_at DESC);

-- ============================================================================
-- POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.family_access_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_feedbacks ENABLE ROW LEVEL SECURITY;

-- 1. Family Access Grants: O próprio familiar ou admins/gestores
CREATE POLICY family_access_select ON public.family_access_grants
    FOR SELECT USING (
        family_user_id = auth.uid()
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ADMIN', 'MASTER_GESTOR', 'MEDICO', 'ENFERMEIRO')
    );

CREATE POLICY family_access_admin_manage ON public.family_access_grants
    FOR ALL USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ADMIN', 'MASTER_GESTOR', 'ENFERMEIRO')
    );

-- 2. Family Feedbacks: Familiar pode inserir e ler seus feedbacks
CREATE POLICY family_feedbacks_select ON public.family_feedbacks
    FOR SELECT USING (
        family_user_id = auth.uid()
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ADMIN', 'MASTER_GESTOR', 'ENFERMEIRO', 'MEDICO')
    );

CREATE POLICY family_feedbacks_insert ON public.family_feedbacks
    FOR INSERT WITH CHECK (
        family_user_id = auth.uid()
    );
