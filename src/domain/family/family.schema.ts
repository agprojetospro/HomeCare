import { z } from "zod";

// ============================================================================
// DOMÍNIO DO PORTAL DO FAMILIAR & CAMADA DE VISIBILIDADE LGPD (ONDA 4)
// ============================================================================

export const FamilyRelationshipEnum = z.enum([
  "CONJUGE",
  "FILHO_FILHA",
  "PAI_MAE",
  "IRMAO_IRMA",
  "CUIDADOR_LEGAL",
  "RESPONSAVEL_LEGAL",
  "OUTRO",
]);
export type FamilyRelationship = z.infer<typeof FamilyRelationshipEnum>;

export const FamilyAccessLevelEnum = z.enum([
  "VISAO_COMPLETA_LEIGA",      // Vê diário, horários, medicações checadas e conforto
  "VISAO_OPERACIONAL_HORARIOS", // Vê apenas horários de visitas e escalas dos profissionais
  "VISAO_RESTRITA",            // Apenas comunicados institucionais
]);
export type FamilyAccessLevel = z.infer<typeof FamilyAccessLevelEnum>;

export const FamilyAccessGrantSchema = z.object({
  id: z.string().optional(),
  patientId: z.string().min(1, "Paciente é obrigatório"),
  familyUserId: z.string().min(1, "Identificador do familiar é obrigatório"),
  familyUserName: z.string().min(2, "Nome do familiar é obrigatório"),
  familyEmail: z.string().email("E-mail válido é obrigatório"),
  familyPhone: z.string().optional().nullable(),
  relationship: FamilyRelationshipEnum,
  accessLevel: FamilyAccessLevelEnum.default("VISAO_COMPLETA_LEIGA"),
  consentSignedAt: z.date().default(() => new Date()),
  expiresAt: z.date().optional().nullable(),
  active: z.boolean().default(true),
  notes: z.string().optional().nullable(),
  createdAt: z.date().optional(),
});
export type FamilyAccessGrant = z.infer<typeof FamilyAccessGrantSchema>;

export interface FamilyTimelineEvent {
  id: string;
  patientId: string;
  category: "VISITA_EQUIPE" | "MEDICACAO_MINISTRADA" | "CUIDADO_GERAL" | "AVISO_COORDENACAO" | "SINAIS_ESTABILIDADE";
  title: string;
  description: string;
  timestamp: Date;
  professionalRole?: string;
  statusTag?: string;
  highlightIcon?: string;
}

export interface CareDailySummary {
  patientId: string;
  patientName: string;
  date: Date;
  overallStatus: "ESTAVEL_CONFORTAVEL" | "EM_OBSERVACAO" | "ATENDIMENTO_URGENTE";
  statusTitle: string;
  statusMessage: string;
  completedVisitsCount: number;
  upcomingVisitsCount: number;
  medsAdministeredCount: number;
  nutritionStatus: string;
  hygieneComfortStatus: string;
  latestVitalsFriendly: string;
}

export const FamilyFeedbackSchema = z.object({
  id: z.string().optional(),
  patientId: z.string().min(1),
  familyUserId: z.string().min(1),
  familyUserName: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  category: z.enum(["ATENDIMENTO_EQUIPE", "PONTUALIDADE", "COMUNICACAO", "CONFORTO_PACIENTE", "GERAL"]),
  comment: z.string().min(3, "Comentário deve ter no mínimo 3 caracteres"),
  createdAt: z.date().default(() => new Date()),
});
export type FamilyFeedback = z.infer<typeof FamilyFeedbackSchema>;

/**
 * Higieniza eventos clínicos brutos para uma linguagem humanizada e segura conforme LGPD e CFM.
 * Filtra diagnósticos diferenciais, jargões crípticos ou anotações sigilosas.
 */
export function sanitizeClinicalEventForFamily(rawEvent: {
  id: string;
  patientId: string;
  eventType: string;
  eventTitle: string;
  eventTimestamp: Date;
  authorName: string;
  authorRole: string;
  summary: string;
  severity?: "NORMAL" | "ATENCAO" | "CRITICO";
}): FamilyTimelineEvent | null {
  // Ocultar eventos puramente administrativos ou de auditoria interna restrita
  if (rawEvent.eventType === "AUDITORIA" || rawEvent.eventType === "BLOQUEIO_ACESSO") {
    return null;
  }

  let category: FamilyTimelineEvent["category"] = "CUIDADO_GERAL";
  let title = rawEvent.eventTitle;
  let description = rawEvent.summary;
  let statusTag = "Realizado";

  if (rawEvent.eventType === "SINAIS_VITAIS") {
    category = "SINAIS_ESTABILIDADE";
    title = "Checagem de Sinais Vitais & Bem-Estar";
    if (rawEvent.severity === "NORMAL") {
      description = "Sinais vitais checados pela equipe e encontram-se estáveis dentro dos parâmetros esperados.";
      statusTag = "Estável";
    } else {
      description = "Sinais vitais avaliados com atenção continuada pela equipe de saúde.";
      statusTag = "Acompanhamento";
    }
  } else if (rawEvent.eventType === "MEDICACAO" || rawEvent.eventTitle.includes("Medicamento") || rawEvent.eventTitle.includes("Dispensação")) {
    category = "MEDICACAO_MINISTRADA";
    title = "Medicação / Cuidados Farmacológicos";
    description = `Cuidados e medicações programadas foram administrados com sucesso por ${rawEvent.authorName}.`;
    statusTag = "Administrado";
  } else if (rawEvent.eventType === "EVOLUCAO" || rawEvent.eventType === "VISITA") {
    category = "VISITA_EQUIPE";
    title = `Visita Assistencial — ${rawEvent.authorRole.replace(/_/g, " ")}`;
    description = `Atendimento domiciliar realizado por ${rawEvent.authorName}. Paciente acolhido e plano terapêutico mantido.`;
    statusTag = "Concluída";
  } else if (rawEvent.eventType === "PROCEDIMENTO") {
    category = "CUIDADO_GERAL";
    title = "Procedimento & Conforto Domiciliar";
    description = `Procedimento assistencial realizado com segurança e conforto pelo profissional ${rawEvent.authorName}.`;
    statusTag = "Concluído";
  }

  return {
    id: rawEvent.id,
    patientId: rawEvent.patientId,
    category,
    title,
    description,
    timestamp: new Date(rawEvent.eventTimestamp),
    professionalRole: rawEvent.authorRole,
    statusTag,
  };
}
