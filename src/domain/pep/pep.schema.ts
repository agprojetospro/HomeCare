import { z } from "zod";

// 1. Evolução Clínica
export const ClinicalEvolutionSchema = z.object({
  id: z.string().optional(),
  episodeId: z.string().min(1, "Episódio assistencial obrigatório"),
  patientId: z.string().min(1, "Paciente obrigatório"),
  professionalId: z.string().min(1, "Profissional obrigatório"),
  shiftId: z.string().optional().nullable(),
  evolutionType: z.enum([
    "MEDICA",
    "ENFERMAGEM",
    "TECNICO_ENFERMAGEM",
    "FISIOTERAPIA",
    "FONOAUDIOLOGIA",
    "NUTRICAO",
    "PSICOLOGIA",
    "MULTIDISCIPLINAR",
    "RETIFICACAO",
  ]),
  content: z.string().min(10, "Evolução clínica deve conter descrição detalhada do atendimento"),
  status: z.enum(["RASCUNHO", "FINALIZADO"]).default("RASCUNHO"),
  finalizedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date().default(() => new Date()),
});

export type ClinicalEvolution = z.infer<typeof ClinicalEvolutionSchema>;

// 2. Sinais Vitais com Avaliação de Alertas Fisiológicos
export const VitalSignsSchema = z.object({
  id: z.string().optional(),
  episodeId: z.string().min(1, "Episódio assistencial obrigatório"),
  patientId: z.string().min(1, "Paciente obrigatório"),
  professionalId: z.string().min(1, "Profissional obrigatório"),
  measuredAt: z.coerce.date().default(() => new Date()),
  
  systolicBp: z.number().int().min(40).max(300, "Pressão sistólica fora de escala fisiológica"),
  diastolicBp: z.number().int().min(20).max(200, "Pressão diastólica fora de escala fisiológica"),
  heartRate: z.number().int().min(20).max(260, "Frequência cardíaca fora de escala fisiológica"),
  respiratoryRate: z.number().int().min(6).max(60, "Frequência respiratória fora de escala fisiológica"),
  oxygenSaturation: z.number().int().min(40).max(100, "SpO2 deve estar entre 40% e 100%"),
  temperature: z.number().min(30).max(45, "Temperatura corporal fora de escala"),
  bloodGlucose: z.number().int().min(20).max(800).optional().nullable(),
  weightKg: z.number().min(1).max(350).optional().nullable(),
  painScore: z.number().int().min(0).max(10, "Escala de dor deve ser de 0 a 10"),
});

export type VitalSigns = z.infer<typeof VitalSignsSchema>;

export interface VitalSignAlert {
  parameter: string;
  severity: "ATENCAO" | "CRITICO";
  message: string;
}

export function evaluateVitalSignAlerts(v: VitalSigns): VitalSignAlert[] {
  const alerts: VitalSignAlert[] = [];

  // SpO2
  if (v.oxygenSaturation < 90) {
    alerts.push({
      parameter: "SpO2",
      severity: "CRITICO",
      message: `Dessaturação grave: ${v.oxygenSaturation}% (Crítico: <90%)`,
    });
  } else if (v.oxygenSaturation < 94) {
    alerts.push({
      parameter: "SpO2",
      severity: "ATENCAO",
      message: `Dessaturação leve/moderada: ${v.oxygenSaturation}% (Alerta: <94%)`,
    });
  }

  // Frequência Cardíaca
  if (v.heartRate > 130 || v.heartRate < 45) {
    alerts.push({
      parameter: "FC",
      severity: "CRITICO",
      message: `Frequência Cardíaca crítica: ${v.heartRate} bpm`,
    });
  } else if (v.heartRate > 100 || v.heartRate < 55) {
    alerts.push({
      parameter: "FC",
      severity: "ATENCAO",
      message: `Frequência Cardíaca alterada: ${v.heartRate} bpm`,
    });
  }

  // Pressão Arterial
  if (v.systolicBp >= 180 || v.diastolicBp >= 110) {
    alerts.push({
      parameter: "PA",
      severity: "CRITICO",
      message: `Crise Hipertensiva: ${v.systolicBp}x${v.diastolicBp} mmHg`,
    });
  } else if (v.systolicBp <= 85 || v.diastolicBp <= 50) {
    alerts.push({
      parameter: "PA",
      severity: "CRITICO",
      message: `Hipotensão severa: ${v.systolicBp}x${v.diastolicBp} mmHg`,
    });
  }

  // Temperatura
  if (v.temperature >= 38.5) {
    alerts.push({
      parameter: "Temperatura",
      severity: "CRITICO",
      message: `Febre alta: ${v.temperature.toFixed(1)}°C`,
    });
  } else if (v.temperature >= 37.8) {
    alerts.push({
      parameter: "Temperatura",
      severity: "ATENCAO",
      message: `Estado febril: ${v.temperature.toFixed(1)}°C`,
    });
  } else if (v.temperature < 35.0) {
    alerts.push({
      parameter: "Temperatura",
      severity: "CRITICO",
      message: `Hipotermia: ${v.temperature.toFixed(1)}°C`,
    });
  }

  // Glicemia
  if (v.bloodGlucose != null) {
    if (v.bloodGlucose < 70) {
      alerts.push({
        parameter: "Glicemia",
        severity: "CRITICO",
        message: `Hipoglicemia grave: ${v.bloodGlucose} mg/dL`,
      });
    } else if (v.bloodGlucose > 250) {
      alerts.push({
        parameter: "Glicemia",
        severity: "ATENCAO",
        message: `Hiperglicemia acentuada: ${v.bloodGlucose} mg/dL`,
      });
    }
  }

  return alerts;
}

// 3. Prescrição de Medicamentos
export const PrescriptionItemSchema = z.object({
  id: z.string().optional(),
  prescriptionId: z.string().optional(),
  medicationName: z.string().min(2, "Nome do medicamento é obrigatório"),
  dosage: z.string().min(1, "Dosagem é obrigatória"),
  unit: z.string().min(1, "Unidade é obrigatória"),
  route: z.enum(["ORAL", "EV", "IM", "SC", "SONDA_SNE_GTT", "INALATORIA", "TOPICA", "RETAL", "OTOLOGICA", "OFTALMICA"]),
  frequency: z.string().min(1, "Frequência/Horários é obrigatória (ex: 8/8h, 12/12h, 1x/dia, ACM)"),
  scheduleTimes: z.array(z.string()).default([]),
  durationDays: z.number().int().positive().optional().nullable(),
  instructions: z.string().optional().nullable(),
});

export const PrescriptionSchema = z.object({
  id: z.string().optional(),
  episodeId: z.string().min(1, "Episódio assistencial obrigatório"),
  patientId: z.string().min(1, "Paciente obrigatório"),
  doctorId: z.string().min(1, "Médico prescritor é obrigatório"),
  startDate: z.coerce.date().default(() => new Date()),
  endDate: z.coerce.date().optional().nullable(),
  status: z.enum(["ATIVA", "SUSPENSA", "CONCLUIDA"]).default("ATIVA"),
  items: z.array(PrescriptionItemSchema).min(1, "Prescrição deve ter pelo menos um item"),
});

export type Prescription = z.infer<typeof PrescriptionSchema>;
export type PrescriptionItem = z.infer<typeof PrescriptionItemSchema>;

// 4. Procedimentos e Consumo de Materiais
export const ProcedureSchema = z.object({
  id: z.string().optional(),
  episodeId: z.string().min(1, "Episódio assistencial obrigatório"),
  patientId: z.string().min(1, "Paciente obrigatório"),
  professionalId: z.string().min(1, "Profissional obrigatório"),
  procedureName: z.string().min(3, "Nome do procedimento é obrigatório"),
  executedAt: z.coerce.date().default(() => new Date()),
  quantity: z.number().int().positive().default(1),
  notes: z.string().optional().nullable(),
  materialsUsed: z.array(
    z.object({
      materialName: z.string(),
      quantity: z.number().positive(),
      unit: z.string(),
    })
  ).default([]),
});

export type Procedure = z.infer<typeof ProcedureSchema>;

// 5. Exames Laboratoriais e Imagem
export const ExamSchema = z.object({
  id: z.string().optional(),
  episodeId: z.string().min(1, "Episódio assistencial obrigatório"),
  patientId: z.string().min(1, "Paciente obrigatório"),
  requesterId: z.string().min(1, "Profissional solicitante obrigatório"),
  examName: z.string().min(3, "Nome do exame obrigatório"),
  requestedAt: z.coerce.date().default(() => new Date()),
  status: z.enum(["SOLICITADO", "COLETADO", "EM_ANALISE", "LAUDADO", "CANCELADO"]).default("SOLICITADO"),
  resultSummary: z.string().optional().nullable(),
  resultAttachmentUrl: z.string().optional().nullable(),
});

export type Exam = z.infer<typeof ExamSchema>;

