import { z } from "zod";

// ============================================================================
// DOMÍNIO DE INSUMOS, OXIGENOTERAPIA & CURATIVOS (ONDA 3)
// ============================================================================

// -------------------------------------------------------------
// 1. CATÁLOGO DE INSUMOS & ESTOQUE LEDGER
// -------------------------------------------------------------

export const SupplyCategoryEnum = z.enum([
  "MEDICAMENTO",
  "MATERIAL_PENSO",
  "OXIGENOTERAPIA",
  "EQUIPAMENTO",
  "DIETA_ENTERAL",
  "EPI_DESCARTAVEL",
  "HIGIENE_CONFORTO",
]);

export type SupplyCategory = z.infer<typeof SupplyCategoryEnum>;

export const InventoryMovementTypeEnum = z.enum([
  "ENTRADA",
  "SAIDA_PACIENTE",
  "PERDA_AVARIA",
  "PERDA_VALIDADE",
  "DEVOLUCAO",
  "AJUSTE_INVENTARIO",
]);

export type InventoryMovementType = z.infer<typeof InventoryMovementTypeEnum>;

export const SupplyItemSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().min(1, "Organização é obrigatória"),
  unitId: z.string().min(1, "Unidade operacional é obrigatória"),
  code: z.string().min(1, "Código do item é obrigatório"),
  name: z.string().min(2, "Nome do insumo é obrigatório"),
  category: SupplyCategoryEnum,
  unitOfMeasure: z.string().min(1, "Unidade de medida é obrigatória"), // Frasco, Unidade, Caixa, Litro, Kit
  currentStock: z.number().int().min(0, "Estoque não pode ser negativo"),
  minimumStock: z.number().int().min(0, "Estoque mínimo deve ser não negativo"),
  reorderPoint: z.number().int().min(0, "Ponto de ressuprimento deve ser não negativo"),
  costPrice: z.number().min(0).optional().nullable(),
  anvisaRegistration: z.string().optional().nullable(),
  active: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type SupplyItem = z.infer<typeof SupplyItemSchema>;

export const InventoryLedgerEntrySchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().min(1),
  unitId: z.string().min(1),
  supplyItemId: z.string().min(1, "Item é obrigatório"),
  movementType: InventoryMovementTypeEnum,
  quantity: z.number().int().positive("Quantidade deve ser positiva"),
  balanceAfter: z.number().int().min(0, "Saldo após movimentação não pode ser negativo"),
  batchNumber: z.string().optional().nullable(),
  expirationDate: z.date().optional().nullable(),
  patientId: z.string().optional().nullable(),
  professionalId: z.string().min(1, "Profissional responsável é obrigatório"),
  visitId: z.string().optional().nullable(),
  reason: z.string().optional().nullable(),
  createdAt: z.date().optional(),
});

export type InventoryLedgerEntry = z.infer<typeof InventoryLedgerEntrySchema>;

// -------------------------------------------------------------
// 2. MONITORAMENTO DE OXIGENOTERAPIA & CÁLCULO DE AUTONOMIA
// -------------------------------------------------------------

export const OxygenSourceTypeEnum = z.enum([
  "CILINDRO_O2",
  "CONCENTRADOR_ESTACIONARIO",
  "CONCENTRADOR_PORTATIL",
  "REDE_CANALIZADA",
]);

export type OxygenSourceType = z.infer<typeof OxygenSourceTypeEnum>;

export const OxygenDeliveryInterfaceEnum = z.enum([
  "CATETER_NASAL",
  "MASCARA_VENTURI",
  "MASCARA_REINALACAO",
  "MASCARA_NAO_REINALACAO",
  "TRAQUEOSTOMIA_MICRONEBULIZACAO",
  "CANULA_ALTO_FLUXO",
]);

export type OxygenDeliveryInterface = z.infer<typeof OxygenDeliveryInterfaceEnum>;

export const CylinderSizeFactor: Record<string, number> = {
  CILINDRO_E_10L: 1.0,  // Cilindro E (Transporte/Pequeno, 10L a 150bar ~ 1000L O2)
  CILINDRO_G_40L: 4.0,  // Cilindro G (Médio, 40L a 150bar ~ 4000L O2)
  CILINDRO_J_50L: 5.0,  // Cilindro J (Grande/Base, 50L a 150bar ~ 5000L O2)
};

export const PatientOxygenTherapySchema = z.object({
  id: z.string().optional(),
  patientId: z.string().min(1, "Paciente é obrigatório"),
  episodeId: z.string().min(1, "Episódio de cuidado é obrigatório"),
  sourceType: OxygenSourceTypeEnum,
  deliveryInterface: OxygenDeliveryInterfaceEnum,
  flowRateLpm: z.number().positive("Fluxo em L/min deve ser maior que zero").max(15, "Fluxo máximo de 15 L/min"),
  usageHoursPerDay: z.number().min(1).max(24, "Horas por dia entre 1 e 24"),
  
  // Dados de cilindro para cálculo de autonomia
  cylinderType: z.string().optional().nullable(), // CILINDRO_E_10L, CILINDRO_G_40L, CILINDRO_J_50L
  cylinderFactorK: z.number().positive().default(1.0),
  currentPressureBar: z.number().min(0, "Pressão não pode ser negativa").optional().nullable(),
  nominalPressureBar: z.number().positive().default(150),
  lastPressureCheckAt: z.date().optional().nullable(),

  // Concentrador
  concentratorFio2Percent: z.number().min(21).max(100).optional().nullable(),
  concentratorHourMeter: z.number().min(0).optional().nullable(),
  backupCylinderAvailable: z.boolean().default(true),

  active: z.boolean().default(true),
  notes: z.string().optional().nullable(),
  updatedAt: z.date().optional(),
});

export type PatientOxygenTherapy = z.infer<typeof PatientOxygenTherapySchema>;

export interface OxygenAutonomyCalculation {
  totalUsableLiters: number;
  autonomyMinutes: number;
  autonomyHours: number;
  estimatedDepletionAt: Date | null;
  status: "CRITICO" | "ATENCAO" | "NORMAL";
  alertMessage: string;
}

/**
 * Calcula a autonomia restante de um cilindro de oxigênio com base na pressão e fluxo prescrito.
 * Volume (L) = Pressão (bar) * Fator K
 * Autonomia (min) = Volume (L) / Fluxo (L/min)
 */
export function calculateOxygenAutonomy(
  currentPressureBar: number,
  flowRateLpm: number,
  cylinderFactorK: number = 1.0,
  referenceDate: Date = new Date()
): OxygenAutonomyCalculation {
  if (flowRateLpm <= 0 || currentPressureBar <= 0) {
    return {
      totalUsableLiters: 0,
      autonomyMinutes: 0,
      autonomyHours: 0,
      estimatedDepletionAt: referenceDate,
      status: "CRITICO",
      alertMessage: "Cilindro vazio ou sem pressão residual mensurável.",
    };
  }

  const totalUsableLiters = currentPressureBar * cylinderFactorK;
  const autonomyMinutes = Math.round(totalUsableLiters / flowRateLpm);
  const autonomyHours = Number((autonomyMinutes / 60).toFixed(1));

  const estimatedDepletionAt = new Date(referenceDate.getTime() + autonomyMinutes * 60 * 1000);

  let status: "CRITICO" | "ATENCAO" | "NORMAL" = "NORMAL";
  let alertMessage = `Autonomia estimada em ${autonomyHours} horas (${totalUsableLiters}L disponíveis).`;

  if (autonomyHours < 2 || currentPressureBar < 20) {
    status = "CRITICO";
    alertMessage = `CRÍTICO: Autonomia restante de apenas ${autonomyHours}h (${autonomyMinutes} min). Troca ou ressuprimento urgente de O2 necessário!`;
  } else if (autonomyHours < 6 || currentPressureBar < 45) {
    status = "ATENCAO";
    alertMessage = `ATENÇÃO: Autonomia residual de ${autonomyHours}h. Programar rota de reposição.`;
  }

  return {
    totalUsableLiters,
    autonomyMinutes,
    autonomyHours,
    estimatedDepletionAt,
    status,
    alertMessage,
  };
}

// -------------------------------------------------------------
// 3. PROTOCOLO DE CURATIVOS & LESÕES POR PRESSÃO (NPUAP/EPUAP)
// -------------------------------------------------------------

export const WoundStageEnum = z.enum([
  "ESTAGIO_1",                // Eritema não branqueável em pele intacta
  "ESTAGIO_2",                // Perda de pele em espessura parcial com exposição da derme
  "ESTAGIO_3",                // Perda total da espessura da pele (tecido adiposo visível)
  "ESTAGIO_4",                // Perda total de tecido com exposição de osso, tendão ou músculo
  "NAO_CLASSIFICAVEL",        // Perda total coberta por esfacelo ou necrose/escara
  "LTP_TISSULAR_PROFUNDA",    // Pele intacta com descoloração vermelho-escura/púrpura
  "FERIDA_CIRURGICA",
  "ULCERA_VASCULAR_VENOSA",
  "ULCERA_VASCULAR_ARTERIAL",
  "LESAO_POR_FRICCAO_SKIN_TEAR",
]);

export type WoundStage = z.infer<typeof WoundStageEnum>;

export const AnatomicalLocationEnum = z.enum([
  "SACRO",
  "TROCANTER_DIREITO",
  "TROCANTER_ESQUERDO",
  "CALCANEO_DIREITO",
  "CALCANEO_ESQUERDO",
  "ISQUIO_DIREITO",
  "ISQUIO_ESQUERDO",
  "MALEOLO_LATERAL_DIREITO",
  "MALEOLO_LATERAL_ESQUERDO",
  "OCCIPITAL",
  "ESCAPULA",
  "ABDOMEN",
  "MEMBRO_INFERIOR",
  "OUTRO",
]);

export type AnatomicalLocation = z.infer<typeof AnatomicalLocationEnum>;

export const ExudateAmountEnum = z.enum(["AUSENTE", "ESCASSO", "MODERADO", "ABUNDANTE"]);
export type ExudateAmount = z.infer<typeof ExudateAmountEnum>;

export const ExudateTypeEnum = z.enum([
  "SEROSO",
  "SEROSANGUINOLENTO",
  "SANGUINOLENTO",
  "PURULENTO",
  "FIBRINOSO",
]);
export type ExudateType = z.infer<typeof ExudateTypeEnum>;

export const WoundCoveringEnum = z.enum([
  "HIDROCOLOIDE",
  "PRATA_IONICA_ALGINATO",
  "ALGINATO_DE_CALCIO",
  "ESPUMA_DE_POLIURETANO_SILICONE",
  "HIDROGEL_COM_ALGINATO",
  "COLAGENASE",
  "FILME_TRANSPARENTE",
  "GAZE_PETROLATO_ADAPTIC",
  "BOTA_DE_UNNA",
  "TERAPIA_PRESSAO_NEGATIVA_VAC",
  "CURATIVO_SIMPLES_GAZE_SF09",
]);
export type WoundCovering = z.infer<typeof WoundCoveringEnum>;

export const WoundEvaluationSchema = z.object({
  id: z.string().optional(),
  patientId: z.string().min(1, "Paciente é obrigatório"),
  episodeId: z.string().min(1, "Episódio é obrigatório"),
  professionalId: z.string().min(1, "Profissional é obrigatório"),
  visitId: z.string().optional().nullable(),
  woundIdentifier: z.string().min(1, "Identificador da lesão é obrigatório (ex: Lesão 1 - Região Sacral)"),
  location: AnatomicalLocationEnum,
  stage: WoundStageEnum,

  // Dimensões em centímetros
  lengthCm: z.number().positive("Comprimento deve ser maior que zero"),
  widthCm: z.number().positive("Largura deve ser maior que zero"),
  depthCm: z.number().min(0, "Profundidade não pode ser negativa").default(0),
  areaCm2: z.number().optional(),

  // Composição do leito tecidual (Percentuais)
  granulationPercent: z.number().min(0).max(100).default(0),
  sloughPercent: z.number().min(0).max(100).default(0),
  necrosisPercent: z.number().min(0).max(100).default(0),
  epithelializationPercent: z.number().min(0).max(100).default(0),

  // Exsudato e bordas
  exudateAmount: ExudateAmountEnum.default("MODERADO"),
  exudateType: ExudateTypeEnum.default("SEROSO"),
  odorPresent: z.boolean().default(false),
  painScoreVisualScale: z.number().int().min(0).max(10).default(0),
  edgesCondition: z.string().optional().nullable(), // Integras, Maceradas, Descoladas, Epíbolas

  // Cobertura e conduta
  prescribedCovering: WoundCoveringEnum,
  secondaryCovering: z.string().optional().nullable(),
  cleaningSolution: z.string().default("Soro Fisiológico 0,9% em jatos mornos"),
  dressingChangeFrequencyHours: z.number().int().positive().default(24),
  healingEvolutionStatus: z.enum(["MELHORA", "ESTAVEL", "PIORA"]).default("ESTAVEL"),

  // Registro fotográfico
  photoStorageUrl: z.string().optional().nullable(),
  clinicalNotes: z.string().optional().nullable(),
  evaluatedAt: z.date().default(() => new Date()),
  createdAt: z.date().optional(),
}).refine(
  (data) =>
    data.granulationPercent + data.sloughPercent + data.necrosisPercent + data.epithelializationPercent <= 100,
  {
    message: "A soma dos tecidos do leito da lesão (granulação, esfacelo, necrose, epitelização) não pode ultrapassar 100%.",
    path: ["granulationPercent"],
  }
);

export type WoundEvaluation = z.infer<typeof WoundEvaluationSchema>;

/**
 * Calcula a área da lesão e gera indicador comparativo de evolução.
 */
export function evaluateWoundHealingProgress(
  previous?: WoundEvaluation,
  current?: WoundEvaluation
): {
  areaDeltaCm2: number;
  percentageChange: number;
  healingTrajectory: "REGRESSAO_POSITIVA" | "ESTABILIDADE" | "EXPANSAO_NEGATIVA";
  summary: string;
} {
  if (!current) {
    return {
      areaDeltaCm2: 0,
      percentageChange: 0,
      healingTrajectory: "ESTABILIDADE",
      summary: "Sem dados suficientes para avaliação comparativa.",
    };
  }

  const currentArea = current.lengthCm * current.widthCm;

  if (!previous) {
    return {
      areaDeltaCm2: 0,
      percentageChange: 0,
      healingTrajectory: "ESTABILIDADE",
      summary: `Lesão registrada com área inicial de ${currentArea.toFixed(2)} cm² (${current.stage}).`,
    };
  }

  const prevArea = previous.lengthCm * previous.widthCm;
  const areaDeltaCm2 = Number((currentArea - prevArea).toFixed(2));
  const percentageChange = prevArea > 0 ? Number((((currentArea - prevArea) / prevArea) * 100).toFixed(1)) : 0;

  if (percentageChange <= -10) {
    return {
      areaDeltaCm2,
      percentageChange,
      healingTrajectory: "REGRESSAO_POSITIVA",
      summary: `Cicatrização em evolução favorável: redução de ${Math.abs(percentageChange)}% da área (${Math.abs(areaDeltaCm2)} cm² a menos).`,
    };
  }

  if (percentageChange >= 10) {
    return {
      areaDeltaCm2,
      percentageChange,
      healingTrajectory: "EXPANSAO_NEGATIVA",
      summary: `Alerta clínico: expansão de ${percentageChange}% da área da ferida (+${areaDeltaCm2} cm²). Reavaliar cobertura e alívio de pressão.`,
    };
  }

  return {
    areaDeltaCm2,
    percentageChange,
    healingTrajectory: "ESTABILIDADE",
    summary: `Área estável (${currentArea.toFixed(2)} cm²). Variação de ${percentageChange}%.`,
  };
}
