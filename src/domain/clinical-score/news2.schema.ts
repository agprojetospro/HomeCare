import { z } from "zod";

export const ConsciousnessLevelEnum = z.enum(["A", "V", "P", "U"]);
export type ConsciousnessLevel = z.infer<typeof ConsciousnessLevelEnum>;

export const News2RiskLevelEnum = z.enum([
  "LOW",
  "LOW_MEDIUM", // Pontuação agregada baixa, mas com 3 pontos em um único parâmetro
  "MEDIUM",
  "HIGH",
]);
export type News2RiskLevel = z.infer<typeof News2RiskLevelEnum>;

export const News2InputsSchema = z.object({
  respiratoryRate: z.number().int().min(4).max(70),
  oxygenSaturation: z.number().int().min(40).max(100),
  onSupplementalOxygen: z.boolean().default(false),
  isHypercapnicRespiratoryFailure: z.boolean().default(false), // Escala 2 para DPOC / retenção de CO2
  systolicBp: z.number().int().min(40).max(300),
  heartRate: z.number().int().min(20).max(260),
  consciousnessLevel: ConsciousnessLevelEnum.default("A"), // A = Alerta, V = Responde a Voz, P = Responde a Dor, U = Inconsciente
  temperature: z.number().min(30).max(45),
});

export type News2Inputs = z.infer<typeof News2InputsSchema>;

export interface News2Subscores {
  respiratoryRate: number;
  oxygenSaturation: number;
  supplementalOxygen: number;
  systolicBp: number;
  heartRate: number;
  consciousness: number;
  temperature: number;
}

export const ClinicalScoreResultSchema = z.object({
  id: z.string().optional(),
  scoreType: z.literal("NEWS2").default("NEWS2"),
  scoreVersion: z.string().default("1.0"),
  patientId: z.string().min(1),
  episodeId: z.string().min(1),
  vitalSignsId: z.string().optional().nullable(),
  professionalId: z.string().min(1),
  inputsSnapshot: News2InputsSchema,
  subscores: z.object({
    respiratoryRate: z.number(),
    oxygenSaturation: z.number(),
    supplementalOxygen: z.number(),
    systolicBp: z.number(),
    heartRate: z.number(),
    consciousness: z.number(),
    temperature: z.number(),
  }),
  score: z.number().int().min(0).max(20),
  riskLevel: News2RiskLevelEnum,
  recommendedAction: z.string(),
  calculatedAt: z.coerce.date().default(() => new Date()),
});

export type ClinicalScoreResult = z.infer<typeof ClinicalScoreResultSchema>;

/**
 * Motor de Cálculo Puro e Determinístico do NEWS2 (Versão 1.0)
 * Padrão Royal College of Physicians / Validação NEWS2-BR
 */
export function calculateNews2Score(inputs: News2Inputs): {
  score: number;
  subscores: News2Subscores;
  riskLevel: News2RiskLevel;
  hasSingleParamMaxScore: boolean;
  recommendedAction: string;
} {
  // 1. Frequência Respiratória
  let respScore = 0;
  if (inputs.respiratoryRate <= 8) respScore = 3;
  else if (inputs.respiratoryRate >= 9 && inputs.respiratoryRate <= 11) respScore = 1;
  else if (inputs.respiratoryRate >= 12 && inputs.respiratoryRate <= 20) respScore = 0;
  else if (inputs.respiratoryRate >= 21 && inputs.respiratoryRate <= 24) respScore = 2;
  else if (inputs.respiratoryRate >= 25) respScore = 3;

  // 2. Saturação de Oxigênio (SpO2)
  let spo2Score = 0;
  if (inputs.isHypercapnicRespiratoryFailure) {
    // Escala 2 (DPOC / Hipercápnico: Alvo 88-92%)
    if (inputs.oxygenSaturation <= 83) spo2Score = 3;
    else if (inputs.oxygenSaturation >= 84 && inputs.oxygenSaturation <= 85) spo2Score = 2;
    else if (inputs.oxygenSaturation >= 86 && inputs.oxygenSaturation <= 87) spo2Score = 1;
    else if (inputs.oxygenSaturation >= 88 && inputs.oxygenSaturation <= 92) spo2Score = 0;
    else if (inputs.oxygenSaturation >= 93 && inputs.oxygenSaturation <= 94) {
      spo2Score = inputs.onSupplementalOxygen ? 1 : 0;
    } else if (inputs.oxygenSaturation >= 95 && inputs.oxygenSaturation <= 96) {
      spo2Score = inputs.onSupplementalOxygen ? 2 : 0;
    } else if (inputs.oxygenSaturation >= 97) {
      spo2Score = inputs.onSupplementalOxygen ? 3 : 0;
    }
  } else {
    // Escala 1 (Padrão)
    if (inputs.oxygenSaturation <= 91) spo2Score = 3;
    else if (inputs.oxygenSaturation >= 92 && inputs.oxygenSaturation <= 93) spo2Score = 2;
    else if (inputs.oxygenSaturation >= 94 && inputs.oxygenSaturation <= 95) spo2Score = 1;
    else if (inputs.oxygenSaturation >= 96) spo2Score = 0;
  }

  // 3. Ar Suplementar
  const suppO2Score = inputs.onSupplementalOxygen ? 2 : 0;

  // 4. Pressão Arterial Sistólica
  let bpScore = 0;
  if (inputs.systolicBp <= 90) bpScore = 3;
  else if (inputs.systolicBp >= 91 && inputs.systolicBp <= 100) bpScore = 2;
  else if (inputs.systolicBp >= 101 && inputs.systolicBp <= 110) bpScore = 1;
  else if (inputs.systolicBp >= 111 && inputs.systolicBp <= 219) bpScore = 0;
  else if (inputs.systolicBp >= 220) bpScore = 3;

  // 5. Frequência Cardíaca
  let hrScore = 0;
  if (inputs.heartRate <= 40) hrScore = 3;
  else if (inputs.heartRate >= 41 && inputs.heartRate <= 50) hrScore = 1;
  else if (inputs.heartRate >= 51 && inputs.heartRate <= 90) hrScore = 0;
  else if (inputs.heartRate >= 91 && inputs.heartRate <= 110) hrScore = 1;
  else if (inputs.heartRate >= 111 && inputs.heartRate <= 130) hrScore = 2;
  else if (inputs.heartRate >= 131) hrScore = 3;

  // 6. Nível de Consciência
  const consciousnessScore = inputs.consciousnessLevel === "A" ? 0 : 3;

  // 7. Temperatura Corporal
  let tempScore = 0;
  if (inputs.temperature <= 35.0) tempScore = 3;
  else if (inputs.temperature >= 35.1 && inputs.temperature <= 36.0) tempScore = 1;
  else if (inputs.temperature >= 36.1 && inputs.temperature <= 38.0) tempScore = 0;
  else if (inputs.temperature >= 38.1 && inputs.temperature <= 39.0) tempScore = 1;
  else if (inputs.temperature >= 39.1) tempScore = 2;

  const subscores: News2Subscores = {
    respiratoryRate: respScore,
    oxygenSaturation: spo2Score,
    supplementalOxygen: suppO2Score,
    systolicBp: bpScore,
    heartRate: hrScore,
    consciousness: consciousnessScore,
    temperature: tempScore,
  };

  const totalScore =
    respScore +
    spo2Score +
    suppO2Score +
    bpScore +
    hrScore +
    consciousnessScore +
    tempScore;

  const hasSingleParamMaxScore = Object.values(subscores).some((val) => val === 3);

  let riskLevel: News2RiskLevel = "LOW";
  let recommendedAction = "Manter monitoramento de rotina assistencial domiciliar conforme PAD.";

  if (totalScore >= 7) {
    riskLevel = "HIGH";
    recommendedAction =
      "RISCO ALTO (Emergência Clínica): Avaliação médica imediata. Acionar médico de plantão e considerar protocolo de transferência / suporte avançado.";
  } else if (totalScore >= 5 && totalScore <= 6) {
    riskLevel = "MEDIUM";
    recommendedAction =
      "RISCO MÉDIO: Alerta de deterioração clínica. Notificar enfermeiro supervisor, reavaliar sinais vitais em 1h e ajustar plano de cuidados.";
  } else if (hasSingleParamMaxScore) {
    riskLevel = "LOW_MEDIUM";
    recommendedAction =
      "RISCO MODERADO POR PARÂMETRO CRÍTICO (Score 3 em parâmetro único): Reavaliar parâmetro alterado em 30 minutos e comunicar coordenação de enfermagem.";
  }

  return {
    score: totalScore,
    subscores,
    riskLevel,
    hasSingleParamMaxScore,
    recommendedAction,
  };
}

