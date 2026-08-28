import { z } from "zod";

export const AuditActionEnum = z.enum([
  "AUTH_LOGIN",
  "AUTH_LOGOUT",
  "USER_CREATE",
  "USER_UPDATE",
  "USER_STATUS_CHANGE",
  "PATIENT_CREATE",
  "PATIENT_UPDATE",
  "PATIENT_DISCHARGE",
  "TRIAGE_EVALUATE",
  "CARE_PLAN_CREATE",
  "CARE_PLAN_UPDATE",
  "SHIFT_CREATE",
  "SHIFT_UPDATE",
  "SHIFT_ASSIGN",
  "SHIFT_CANCEL",
  "SHIFT_CHECKIN",
  "PEP_VIEW",
  "CLINICAL_EVOLUTION_DRAFT",
  "CLINICAL_EVOLUTION_SAVE_DRAFT",
  "CLINICAL_EVOLUTION_FINALIZE",
  "VITAL_SIGNS_RECORD",
  "NEWS2_CALCULATE",
  "CLINICAL_ALERT_ACKNOWLEDGED",
  "CLINICAL_ALERT_RESOLVED",
  "MEDICATION_ADMINISTRATION_RECORD",
  "PRESCRIPTION_CREATE",
  "PRESCRIPTION_FINALIZE",
  "PROCEDURE_RECORD",
  "EXAM_REQUEST",
  "EXAM_RESULT_UPLOAD",
  "VISIT_CREATE",
  "VISIT_UPDATE",
  "VISIT_CHECK_IN",
  "VISIT_CHECK_OUT",
  "GEOFENCE_OVERRIDE",
  "LOCATION_DENIED",
  "SECURITY_ACCESS_DENIED",
]);

export const AuditLogSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, "Identificador do usuário é obrigatório"),
  userName: z.string().min(1, "Nome do usuário é obrigatório"),
  userRole: z.string().min(1, "Perfil do usuário é obrigatório"),
  action: z.string().min(2, "Ação de auditoria obrigatória"),
  entityTable: z.string(),
  recordId: z.string().optional().nullable(),
  patientId: z.string().optional().nullable(),
  previousState: z.record(z.any()).optional().nullable(),
  newState: z.record(z.any()).optional().nullable(),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
  createdAt: z.coerce.date().default(() => new Date()),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

export function createAuditEntry(params: Omit<AuditLog, "id" | "createdAt"> & { id?: string }): AuditLog {
  return AuditLogSchema.parse({
    ...params,
    id: params.id || `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date(),
  });
}
