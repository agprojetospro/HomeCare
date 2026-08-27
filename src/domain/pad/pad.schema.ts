import { z } from "zod";
import { UserRole } from "../security/rbac";

export const CareRegimeEnum = z.enum([
  "HOME_CARE_24H",
  "HOME_CARE_12H_DIURNO",
  "HOME_CARE_12H_NOTURNO",
  "VISITAS_PONTUAIS",
  "PROCEDIMENTOS_ESPECIAIS",
]);

export const CarePlanStatusEnum = z.enum([
  "ATIVO",
  "REVISADO",
  "CONCLUIDO",
  "SUSPENSO",
]);

export const MultidisciplinaryVisitSchema = z.object({
  id: z.string().optional(),
  profession: z.enum([
    "MEDICO",
    "ENFERMEIRO",
    "FISIOTERAPEUTA",
    "FONOAUDIOLOGO",
    "NUTRICIONISTA",
    "PSICOLOGO",
    "TERAPEUTA_OCUPACIONAL",
    "ASSISTENTE_SOCIAL",
  ]),
  frequencyPerWeek: z.number().min(1).max(7),
  durationMinutes: z.number().default(60),
  objective: z.string().min(3, "Objetivo terapêutico é obrigatório"),
  professionalInChargeId: z.string().optional().nullable(),
});

export type MultidisciplinaryVisit = z.infer<typeof MultidisciplinaryVisitSchema>;

export const EquipmentAndMaterialSchema = z.object({
  id: z.string().optional(),
  itemCategory: z.enum([
    "RESPIRATORIO",
    "MOBILIARIO",
    "CURATIVO_ESPECIAL",
    "NUTRICAO_ENTERAL",
    "HIGIENE_E_CONFORTO",
    "OUTRO",
  ]),
  itemName: z.string().min(2, "Nome do item/equipamento é obrigatório"),
  quantity: z.number().min(1).default(1),
  specifications: z.string().optional().nullable(),
  status: z.enum(["SOLICITADO", "ENTREGUE", "EM_USO", "DEVOLVIDO"]).default("SOLICITADO"),
});

export type EquipmentAndMaterial = z.infer<typeof EquipmentAndMaterialSchema>;

export const PadSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().default("org_curahome"),
  unitId: z.string().default("unit_ilheus"),
  episodeId: z.string(),
  patientId: z.string().min(1, "Paciente é obrigatório"),
  triageId: z.string().optional().nullable(),
  version: z.number().default(1),
  careRegime: CareRegimeEnum.default("HOME_CARE_12H_DIURNO"),
  startDate: z.coerce.date().default(() => new Date()),
  endDate: z.coerce.date().optional().nullable(),
  reviewIntervalDays: z.number().default(30),
  status: CarePlanStatusEnum.default("ATIVO"),
  createdById: z.string().default("prof_roberta"),
  clinicalGoals: z.string().min(5, "Metas terapêuticas são obrigatórias"),
  visits: z.array(MultidisciplinaryVisitSchema).default([]),
  equipment: z.array(EquipmentAndMaterialSchema).default([]),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().default(() => new Date()),
});

export type Pad = z.infer<typeof PadSchema>;
