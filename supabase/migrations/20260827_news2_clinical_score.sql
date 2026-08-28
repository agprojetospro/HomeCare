-- ============================================================================
-- MIGRATION: 20260827_news2_clinical_score.sql
-- ONDA 1: Módulo NEWS2 de Detecção Precoce de Deterioração Clínica & Alertas
-- ============================================================================

-- 1. TABELA DE RESULTADOS DO ESCORE CLÍNICO (NEWS2)
CREATE TABLE IF NOT EXISTS public.clinical_score_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
    care_episode_id UUID NOT NULL REFERENCES public.care_episodes(id) ON DELETE RESTRICT,
    vital_signs_id UUID REFERENCES public.vital_signs(id) ON DELETE SET NULL,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE RESTRICT,
    score_type VARCHAR(50) NOT NULL DEFAULT 'NEWS2',
    score_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    inputs_snapshot JSONB NOT NULL,
    subscores JSONB NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 20),
    risk_level VARCHAR(30) NOT NULL CHECK (risk_level IN ('LOW', 'LOW_MEDIUM', 'MEDIUM', 'HIGH')),
    recommended_action TEXT NOT NULL,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TRIGGER DE IMUTABILIDADE PARA ESCORES CLÍNICOS
CREATE OR REPLACE FUNCTION public.check_clinical_score_immutability()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Registros de escores clínicos (NEWS2) são estritamente imutáveis para garantir validade científica e legal.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clinical_score_immutability ON public.clinical_score_results;
CREATE TRIGGER trg_clinical_score_immutability
BEFORE UPDATE OR DELETE ON public.clinical_score_results
FOR EACH ROW EXECUTE FUNCTION public.check_clinical_score_immutability();

-- 3. TABELA DE ALERTAS CLÍNICOS ESTATIFICADOS
CREATE TABLE IF NOT EXISTS public.clinical_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
    care_episode_id UUID NOT NULL REFERENCES public.care_episodes(id) ON DELETE RESTRICT,
    source_score_id UUID REFERENCES public.clinical_score_results(id) ON DELETE SET NULL,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('BAIXO', 'ATENCAO', 'CRITICO')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ABERTO' CHECK (status IN ('ABERTO', 'RECONHECIDO', 'EM_TRATAMENTO', 'RESOLVIDO')),
    acknowledged_by UUID REFERENCES public.profiles(id),
    acknowledged_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    cooldown_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABELA DE AÇÕES TOMADAS SOBRE ALERTAS (AUDITORIA E CONDUTA ASSISTENCIAL)
CREATE TABLE IF NOT EXISTS public.clinical_alert_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES public.clinical_alerts(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    performed_by UUID NOT NULL REFERENCES public.profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ÍNDICES DE PERFORMANCE E PESQUISA RÁPIDA
CREATE INDEX IF NOT EXISTS idx_clinical_scores_patient ON public.clinical_score_results(patient_id, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_alerts_status ON public.clinical_alerts(status, severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_alerts_patient ON public.clinical_alerts(patient_id, status);

-- 6. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.clinical_score_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_alert_actions ENABLE ROW LEVEL SECURITY;

-- RLS: clinical_score_results
CREATE POLICY "clinical_scores_select_policy" ON public.clinical_score_results
FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "clinical_scores_insert_policy" ON public.clinical_score_results
FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    AND professional_id = (SELECT professional_id FROM public.profiles WHERE id = auth.uid())
);

-- RLS: clinical_alerts
CREATE POLICY "clinical_alerts_select_policy" ON public.clinical_alerts
FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "clinical_alerts_update_policy" ON public.clinical_alerts
FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
) WITH CHECK (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

-- RLS: clinical_alert_actions
CREATE POLICY "clinical_alert_actions_select_policy" ON public.clinical_alert_actions
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.clinical_alerts a
        WHERE a.id = alert_id AND a.organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
);

CREATE POLICY "clinical_alert_actions_insert_policy" ON public.clinical_alert_actions
FOR INSERT WITH CHECK (
    performed_by = auth.uid()
);

