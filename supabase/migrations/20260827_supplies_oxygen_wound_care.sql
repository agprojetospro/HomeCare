-- ============================================================================
-- MIGRATION: ONDA 3 — GESTÃO DE INSUMOS, OXIGENOTERAPIA & CURATIVOS (NPUAP)
-- Data: 27/08/2026
-- ============================================================================

-- 1. CATÁLOGO DE INSUMOS & MEDICAMENTOS
CREATE TABLE IF NOT EXISTS public.supplies_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'MEDICAMENTO', 'MATERIAL_PENSO', 'OXIGENOTERAPIA', 'EQUIPAMENTO',
        'DIETA_ENTERAL', 'EPI_DESCARTAVEL', 'HIGIENE_CONFORTO'
    )),
    unit_of_measure VARCHAR(50) NOT NULL,
    current_stock INT NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    minimum_stock INT NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
    reorder_point INT NOT NULL DEFAULT 0 CHECK (reorder_point >= 0),
    cost_price NUMERIC(12, 2) DEFAULT 0.00,
    anvisa_registration VARCHAR(100),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unq_supplies_code_org UNIQUE (organization_id, unit_id, code)
);

-- 2. LIVRO-RAZÃO DE ESTOQUE (INVENTORY LEDGER)
CREATE TABLE IF NOT EXISTS public.inventory_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    supply_item_id UUID NOT NULL REFERENCES public.supplies_catalog(id) ON DELETE RESTRICT,
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN (
        'ENTRADA', 'SAIDA_PACIENTE', 'PERDA_AVARIA', 'PERDA_VALIDADE', 'DEVOLUCAO', 'AJUSTE_INVENTARIO'
    )),
    quantity INT NOT NULL CHECK (quantity > 0),
    balance_after INT NOT NULL CHECK (balance_after >= 0),
    batch_number VARCHAR(100),
    expiration_date DATE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE RESTRICT,
    visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. OXIGENOTERAPIA & MONITORAMENTO DE AUTONOMIA
CREATE TABLE IF NOT EXISTS public.patient_oxygen_therapy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    care_episode_id UUID NOT NULL REFERENCES public.care_episodes(id) ON DELETE CASCADE,
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN (
        'CILINDRO_O2', 'CONCENTRADOR_ESTACIONARIO', 'CONCENTRADOR_PORTATIL', 'REDE_CANALIZADA'
    )),
    delivery_interface VARCHAR(50) NOT NULL CHECK (delivery_interface IN (
        'CATETER_NASAL', 'MASCARA_VENTURI', 'MASCARA_REINALACAO',
        'MASCARA_NAO_REINALACAO', 'TRAQUEOSTOMIA_MICRONEBULIZACAO', 'CANULA_ALTO_FLUXO'
    )),
    flow_rate_lpm NUMERIC(4, 1) NOT NULL CHECK (flow_rate_lpm > 0 AND flow_rate_lpm <= 15),
    usage_hours_per_day NUMERIC(4, 1) NOT NULL DEFAULT 24 CHECK (usage_hours_per_day > 0 AND usage_hours_per_day <= 24),
    
    cylinder_type VARCHAR(50),
    cylinder_factor_k NUMERIC(4, 2) DEFAULT 1.0,
    current_pressure_bar NUMERIC(6, 1) DEFAULT 150 CHECK (current_pressure_bar >= 0),
    nominal_pressure_bar NUMERIC(6, 1) DEFAULT 150,
    last_pressure_check_at TIMESTAMPTZ DEFAULT NOW(),
    
    concentrator_fio2_percent NUMERIC(4, 1),
    concentrator_hour_meter NUMERIC(10, 1),
    backup_cylinder_available BOOLEAN NOT NULL DEFAULT true,
    
    active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PROTOCOLO DE CURATIVOS & AVALIAÇÃO DE LESÕES (NPUAP/EPUAP)
CREATE TABLE IF NOT EXISTS public.wound_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    care_episode_id UUID NOT NULL REFERENCES public.care_episodes(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE RESTRICT,
    visit_id UUID REFERENCES public.visits(id) ON DELETE SET NULL,
    wound_identifier VARCHAR(150) NOT NULL,
    location VARCHAR(50) NOT NULL CHECK (location IN (
        'SACRO', 'TROCANTER_DIREITO', 'TROCANTER_ESQUERDO', 'CALCANEO_DIREITO', 'CALCANEO_ESQUERDO',
        'ISQUIO_DIREITO', 'ISQUIO_ESQUERDO', 'MALEOLO_LATERAL_DIREITO', 'MALEOLO_LATERAL_ESQUERDO',
        'OCCIPITAL', 'ESCAPULA', 'ABDOMEN', 'MEMBRO_INFERIOR', 'OUTRO'
    )),
    stage VARCHAR(50) NOT NULL CHECK (stage IN (
        'ESTAGIO_1', 'ESTAGIO_2', 'ESTAGIO_3', 'ESTAGIO_4',
        'NAO_CLASSIFICAVEL', 'LTP_TISSULAR_PROFUNDA',
        'FERIDA_CIRURGICA', 'ULCERA_VASCULAR_VENOSA', 'ULCERA_VASCULAR_ARTERIAL', 'LESAO_POR_FRICCAO_SKIN_TEAR'
    )),
    length_cm NUMERIC(5, 2) NOT NULL CHECK (length_cm > 0),
    width_cm NUMERIC(5, 2) NOT NULL CHECK (width_cm > 0),
    depth_cm NUMERIC(5, 2) NOT NULL DEFAULT 0.0 CHECK (depth_cm >= 0),
    area_cm2 NUMERIC(7, 2) GENERATED ALWAYS AS (length_cm * width_cm) STORED,
    
    granulation_percent INT NOT NULL DEFAULT 0 CHECK (granulation_percent BETWEEN 0 AND 100),
    slough_percent INT NOT NULL DEFAULT 0 CHECK (slough_percent BETWEEN 0 AND 100),
    necrosis_percent INT NOT NULL DEFAULT 0 CHECK (necrosis_percent BETWEEN 0 AND 100),
    epithelialization_percent INT NOT NULL DEFAULT 0 CHECK (epithelialization_percent BETWEEN 0 AND 100),
    
    exudate_amount VARCHAR(50) NOT NULL DEFAULT 'MODERADO' CHECK (exudate_amount IN ('AUSENTE', 'ESCASSO', 'MODERADO', 'ABUNDANTE')),
    exudate_type VARCHAR(50) NOT NULL DEFAULT 'SEROSO' CHECK (exudate_type IN ('SEROSO', 'SEROSANGUINOLENTO', 'SANGUINOLENTO', 'PURULENTO', 'FIBRINOSO')),
    odor_present BOOLEAN NOT NULL DEFAULT false,
    pain_score INT NOT NULL DEFAULT 0 CHECK (pain_score BETWEEN 0 AND 10),
    edges_condition VARCHAR(100),
    
    prescribed_covering VARCHAR(100) NOT NULL,
    secondary_covering VARCHAR(100),
    cleaning_solution VARCHAR(150) NOT NULL DEFAULT 'Soro Fisiológico 0,9% em jatos mornos',
    dressing_change_frequency_hours INT NOT NULL DEFAULT 24 CHECK (dressing_change_frequency_hours > 0),
    healing_evolution_status VARCHAR(50) NOT NULL DEFAULT 'ESTAVEL' CHECK (healing_evolution_status IN ('MELHORA', 'ESTAVEL', 'PIORA')),
    
    photo_storage_url TEXT,
    clinical_notes TEXT,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_wound_tissue_sum CHECK (
        granulation_percent + slough_percent + necrosis_percent + epithelialization_percent <= 100
    )
);

-- ============================================================================
-- ÍNDICES DE DESEMPENHO
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_supplies_org_unit ON public.supplies_catalog(organization_id, unit_id);
CREATE INDEX IF NOT EXISTS idx_inventory_ledger_item ON public.inventory_ledger(supply_item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_ledger_patient ON public.inventory_ledger(patient_id);
CREATE INDEX IF NOT EXISTS idx_oxygen_therapy_patient ON public.patient_oxygen_therapy(patient_id, active);
CREATE INDEX IF NOT EXISTS idx_wound_evaluations_patient ON public.wound_evaluations(patient_id, evaluated_at DESC);

-- ============================================================================
-- POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.supplies_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_oxygen_therapy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wound_evaluations ENABLE ROW LEVEL SECURITY;

-- 1. Catálogo de Insumos: Leitura por usuários da mesma organização
CREATE POLICY supplies_catalog_select ON public.supplies_catalog
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY supplies_catalog_admin_write ON public.supplies_catalog
    FOR ALL USING (
        organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
        AND (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ADMIN', 'MASTER_GESTOR', 'ENFERMEIRO')
    );

-- 2. Estoque Ledger: Leitura e Inserção auditada
CREATE POLICY inventory_ledger_select ON public.inventory_ledger
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY inventory_ledger_insert ON public.inventory_ledger
    FOR INSERT WITH CHECK (
        organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );

-- 3. Oxigenoterapia: Acesso apenas por profissionais vinculados (Anti-IDOR) ou Admins
CREATE POLICY oxygen_therapy_select ON public.patient_oxygen_therapy
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.patient_professional_assignments ppa
            WHERE ppa.patient_id = patient_oxygen_therapy.patient_id
              AND ppa.professional_id = (SELECT professional_id FROM public.profiles WHERE id = auth.uid())
              AND ppa.is_active = true
        )
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ADMIN', 'MASTER_GESTOR', 'MEDICO')
    );

CREATE POLICY oxygen_therapy_write ON public.patient_oxygen_therapy
    FOR ALL USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ADMIN', 'MASTER_GESTOR', 'MEDICO', 'ENFERMEIRO')
    );

-- 4. Curativos & Lesões: Acesso por profissionais com vínculo ativo
CREATE POLICY wound_evaluations_select ON public.wound_evaluations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.patient_professional_assignments ppa
            WHERE ppa.patient_id = wound_evaluations.patient_id
              AND ppa.professional_id = (SELECT professional_id FROM public.profiles WHERE id = auth.uid())
              AND ppa.is_active = true
        )
        OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ADMIN', 'MASTER_GESTOR', 'MEDICO', 'ENFERMEIRO')
    );

CREATE POLICY wound_evaluations_insert ON public.wound_evaluations
    FOR INSERT WITH CHECK (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ADMIN', 'MASTER_GESTOR', 'MEDICO', 'ENFERMEIRO', 'TECNICO_ENFERMAGEM')
    );
