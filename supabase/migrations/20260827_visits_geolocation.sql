-- ============================================================================
-- MIGRATION: 20260827_visits_geolocation.sql
-- ONDA 2: Módulo Operacional de Visitas, Check-in/Check-out Beira-Leito & Geofence
-- ============================================================================

-- 1. TABELA DE VISITAS ASSISTENCIAIS
CREATE TABLE IF NOT EXISTS public.visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
    care_episode_id UUID NOT NULL REFERENCES public.care_episodes(id) ON DELETE RESTRICT,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE RESTRICT,
    shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
    pad_visit_id UUID,
    care_location_id UUID REFERENCES public.patient_addresses(id) ON DELETE SET NULL,
    
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED' CHECK (
        status IN ('SCHEDULED', 'EN_ROUTE', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')
    ),
    procedure_summary TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT chk_visit_time CHECK (scheduled_end > scheduled_start)
);

-- 2. TABELA DE CHECK-IN / CHECK-OUT COM GEOLOCALIZAÇÃO PONTUAL
CREATE TABLE IF NOT EXISTS public.visit_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
    
    -- Check-in
    check_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    check_in_latitude NUMERIC(10, 7),
    check_in_longitude NUMERIC(10, 7),
    check_in_accuracy NUMERIC(8, 2),
    distance_from_care_location NUMERIC(8, 2),
    geofence_result VARCHAR(30) NOT NULL CHECK (
        geofence_result IN ('INSIDE_GEOFENCE', 'OUTSIDE_GEOFENCE', 'LOW_ACCURACY', 'LOCATION_DENIED', 'LOCATION_UNAVAILABLE')
    ),
    
    -- Justificativa e aprovação quando fora de cerca
    override_reason TEXT,
    override_approved_by UUID REFERENCES public.profiles(id),
    override_approved_at TIMESTAMPTZ,
    
    -- Check-out
    check_out_at TIMESTAMPTZ,
    check_out_latitude NUMERIC(10, 7),
    check_out_longitude NUMERIC(10, 7),
    check_out_accuracy NUMERIC(8, 2),
    check_out_distance NUMERIC(8, 2),
    
    device_metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ÍNDICES OPERACIONAIS
CREATE INDEX IF NOT EXISTS idx_visits_schedule ON public.visits(unit_id, scheduled_start, status);
CREATE INDEX IF NOT EXISTS idx_visits_patient ON public.visits(patient_id, scheduled_start DESC);
CREATE INDEX IF NOT EXISTS idx_visits_professional ON public.visits(professional_id, scheduled_start DESC);
CREATE INDEX IF NOT EXISTS idx_visit_checkins_visit ON public.visit_checkins(visit_id);

-- 4. POLÍTICAS DE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_checkins ENABLE ROW LEVEL SECURITY;

-- RLS: visits
CREATE POLICY "visits_select_policy" ON public.visits
FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "visits_insert_policy" ON public.visits
FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "visits_update_policy" ON public.visits
FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
) WITH CHECK (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

-- RLS: visit_checkins
CREATE POLICY "visit_checkins_select_policy" ON public.visit_checkins
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.visits v
        WHERE v.id = visit_id AND v.organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
);

CREATE POLICY "visit_checkins_insert_policy" ON public.visit_checkins
FOR INSERT WITH CHECK (
    professional_id = (SELECT professional_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "visit_checkins_update_policy" ON public.visit_checkins
FOR UPDATE USING (
    professional_id = (SELECT professional_id FROM public.profiles WHERE id = auth.uid())
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('SUPER_ADMIN', 'ADMIN', 'GESTOR_ESCALA')
);

