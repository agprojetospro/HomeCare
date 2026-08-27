export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "GESTOR_UNIDADE"
  | "MEDICO"
  | "ENFERMEIRO_SUPERVISOR"
  | "ENFERMEIRO"
  | "TECNICO_ENFERMAGEM"
  | "FISIOTERAPEUTA"
  | "NUTRICIONISTA"
  | "FONOAUDIOLOGO"
  | "PSICOLOGO"
  | "TERAPEUTA_OCUPACIONAL"
  | "CUIDADOR"
  | "ATENDIMENTO"
  | "FATURAMENTO"
  | "AUDITOR_CLINICO"
  | "FAMILIAR";

export type ScopeType =
  | "OWN"
  | "TEAM"
  | "UNIT"
  | "REGION"
  | "ORGANIZATION"
  | "GLOBAL";

export type PermissionAction =
  | "PATIENT_READ"
  | "PATIENT_CREATE"
  | "PATIENT_UPDATE"
  | "PATIENT_DISCHARGE"
  | "TRIAGE_EXECUTE"
  | "CARE_PLAN_MANAGE"
  | "SHIFT_READ"
  | "SHIFT_MANAGE"
  | "SHIFT_ASSIGN_PATIENT"
  | "SHIFT_CHECKIN_EXECUTE"
  | "PEP_READ"
  | "EVOLUTION_CREATE"
  | "EVOLUTION_FINALIZE"
  | "PRESCRIPTION_CREATE"
  | "PRESCRIPTION_FINALIZE"
  | "MEDICATION_ADMINISTER"
  | "VITAL_SIGNS_RECORD"
  | "PROCEDURE_RECORD"
  | "EXAM_REQUEST"
  | "EXAM_RESULT_UPLOAD"
  | "PROFESSIONAL_READ"
  | "PROFESSIONAL_MANAGE"
  | "AUDIT_READ"
  | "ORGANIZATION_MANAGE"
  | "UNIT_MANAGE";

export interface RolePermissionRule {
  action: PermissionAction;
  scope: ScopeType;
}

export const ROLE_DEFINITIONS: Record<UserRole, RolePermissionRule[]> = {
  SUPER_ADMIN: [
    { action: "ORGANIZATION_MANAGE", scope: "GLOBAL" },
    { action: "UNIT_MANAGE", scope: "GLOBAL" },
    { action: "PATIENT_READ", scope: "GLOBAL" },
    { action: "PROFESSIONAL_READ", scope: "GLOBAL" },
    { action: "PROFESSIONAL_MANAGE", scope: "GLOBAL" },
    { action: "SHIFT_READ", scope: "GLOBAL" },
    { action: "SHIFT_MANAGE", scope: "GLOBAL" },
    { action: "AUDIT_READ", scope: "GLOBAL" },
  ],
  ADMIN: [
    { action: "ORGANIZATION_MANAGE", scope: "ORGANIZATION" },
    { action: "UNIT_MANAGE", scope: "ORGANIZATION" },
    { action: "PATIENT_READ", scope: "ORGANIZATION" },
    { action: "PATIENT_CREATE", scope: "ORGANIZATION" },
    { action: "PATIENT_UPDATE", scope: "ORGANIZATION" },
    { action: "PATIENT_DISCHARGE", scope: "ORGANIZATION" },
    { action: "PROFESSIONAL_READ", scope: "ORGANIZATION" },
    { action: "PROFESSIONAL_MANAGE", scope: "ORGANIZATION" },
    { action: "SHIFT_READ", scope: "ORGANIZATION" },
    { action: "SHIFT_MANAGE", scope: "ORGANIZATION" },
    { action: "SHIFT_ASSIGN_PATIENT", scope: "ORGANIZATION" },
    { action: "AUDIT_READ", scope: "ORGANIZATION" },
  ],
  GESTOR_UNIDADE: [
    { action: "UNIT_MANAGE", scope: "UNIT" },
    { action: "PATIENT_READ", scope: "UNIT" },
    { action: "PATIENT_CREATE", scope: "UNIT" },
    { action: "PATIENT_UPDATE", scope: "UNIT" },
    { action: "PROFESSIONAL_READ", scope: "UNIT" },
    { action: "SHIFT_READ", scope: "UNIT" },
    { action: "SHIFT_MANAGE", scope: "UNIT" },
    { action: "SHIFT_ASSIGN_PATIENT", scope: "UNIT" },
    { action: "AUDIT_READ", scope: "UNIT" },
  ],
  MEDICO: [
    { action: "PATIENT_READ", scope: "OWN" },
    { action: "PEP_READ", scope: "OWN" },
    { action: "TRIAGE_EXECUTE", scope: "UNIT" },
    { action: "CARE_PLAN_MANAGE", scope: "UNIT" },
    { action: "EVOLUTION_CREATE", scope: "OWN" },
    { action: "EVOLUTION_FINALIZE", scope: "OWN" },
    { action: "PRESCRIPTION_CREATE", scope: "OWN" },
    { action: "PRESCRIPTION_FINALIZE", scope: "OWN" },
    { action: "VITAL_SIGNS_RECORD", scope: "OWN" },
    { action: "PROCEDURE_RECORD", scope: "OWN" },
    { action: "EXAM_REQUEST", scope: "OWN" },
    { action: "SHIFT_READ", scope: "OWN" },
    { action: "SHIFT_CHECKIN_EXECUTE", scope: "OWN" },
  ],
  ENFERMEIRO_SUPERVISOR: [
    { action: "PATIENT_READ", scope: "UNIT" },
    { action: "PEP_READ", scope: "UNIT" },
    { action: "TRIAGE_EXECUTE", scope: "UNIT" },
    { action: "CARE_PLAN_MANAGE", scope: "UNIT" },
    { action: "EVOLUTION_CREATE", scope: "UNIT" },
    { action: "EVOLUTION_FINALIZE", scope: "UNIT" },
    { action: "MEDICATION_ADMINISTER", scope: "UNIT" },
    { action: "VITAL_SIGNS_RECORD", scope: "UNIT" },
    { action: "PROCEDURE_RECORD", scope: "UNIT" },
    { action: "EXAM_REQUEST", scope: "UNIT" },
    { action: "SHIFT_READ", scope: "UNIT" },
    { action: "SHIFT_MANAGE", scope: "UNIT" },
    { action: "SHIFT_CHECKIN_EXECUTE", scope: "OWN" },
  ],
  ENFERMEIRO: [
    { action: "PATIENT_READ", scope: "OWN" },
    { action: "PEP_READ", scope: "OWN" },
    { action: "TRIAGE_EXECUTE", scope: "UNIT" },
    { action: "CARE_PLAN_MANAGE", scope: "UNIT" },
    { action: "EVOLUTION_CREATE", scope: "OWN" },
    { action: "EVOLUTION_FINALIZE", scope: "OWN" },
    { action: "MEDICATION_ADMINISTER", scope: "OWN" },
    { action: "VITAL_SIGNS_RECORD", scope: "OWN" },
    { action: "PROCEDURE_RECORD", scope: "OWN" },
    { action: "EXAM_REQUEST", scope: "OWN" },
    { action: "SHIFT_READ", scope: "OWN" },
    { action: "SHIFT_CHECKIN_EXECUTE", scope: "OWN" },
  ],
  TECNICO_ENFERMAGEM: [
    { action: "PATIENT_READ", scope: "OWN" },
    { action: "PEP_READ", scope: "OWN" },
    { action: "EVOLUTION_CREATE", scope: "OWN" },
    { action: "EVOLUTION_FINALIZE", scope: "OWN" },
    { action: "MEDICATION_ADMINISTER", scope: "OWN" },
    { action: "VITAL_SIGNS_RECORD", scope: "OWN" },
    { action: "PROCEDURE_RECORD", scope: "OWN" },
    { action: "SHIFT_READ", scope: "OWN" },
    { action: "SHIFT_CHECKIN_EXECUTE", scope: "OWN" },
  ],
  FISIOTERAPEUTA: [
    { action: "PATIENT_READ", scope: "OWN" },
    { action: "PEP_READ", scope: "OWN" },
    { action: "TRIAGE_EXECUTE", scope: "UNIT" },
    { action: "EVOLUTION_CREATE", scope: "OWN" },
    { action: "EVOLUTION_FINALIZE", scope: "OWN" },
    { action: "VITAL_SIGNS_RECORD", scope: "OWN" },
    { action: "PROCEDURE_RECORD", scope: "OWN" },
    { action: "SHIFT_READ", scope: "OWN" },
    { action: "SHIFT_CHECKIN_EXECUTE", scope: "OWN" },
  ],
  NUTRICIONISTA: [
    { action: "PATIENT_READ", scope: "OWN" },
    { action: "PEP_READ", scope: "OWN" },
    { action: "EVOLUTION_CREATE", scope: "OWN" },
    { action: "EVOLUTION_FINALIZE", scope: "OWN" },
    { action: "SHIFT_READ", scope: "OWN" },
  ],
  FONOAUDIOLOGO: [
    { action: "PATIENT_READ", scope: "OWN" },
    { action: "PEP_READ", scope: "OWN" },
    { action: "EVOLUTION_CREATE", scope: "OWN" },
    { action: "EVOLUTION_FINALIZE", scope: "OWN" },
    { action: "PROCEDURE_RECORD", scope: "OWN" },
    { action: "SHIFT_READ", scope: "OWN" },
  ],
  PSICOLOGO: [
    { action: "PATIENT_READ", scope: "OWN" },
    { action: "PEP_READ", scope: "OWN" },
    { action: "EVOLUTION_CREATE", scope: "OWN" },
    { action: "EVOLUTION_FINALIZE", scope: "OWN" },
    { action: "SHIFT_READ", scope: "OWN" },
  ],
  TERAPEUTA_OCUPACIONAL: [
    { action: "PATIENT_READ", scope: "OWN" },
    { action: "PEP_READ", scope: "OWN" },
    { action: "EVOLUTION_CREATE", scope: "OWN" },
    { action: "EVOLUTION_FINALIZE", scope: "OWN" },
    { action: "PROCEDURE_RECORD", scope: "OWN" },
    { action: "SHIFT_READ", scope: "OWN" },
  ],
  CUIDADOR: [
    { action: "PATIENT_READ", scope: "OWN" },
    { action: "PEP_READ", scope: "OWN" },
    { action: "EVOLUTION_CREATE", scope: "OWN" },
    { action: "VITAL_SIGNS_RECORD", scope: "OWN" },
    { action: "SHIFT_READ", scope: "OWN" },
  ],
  ATENDIMENTO: [
    { action: "PATIENT_READ", scope: "UNIT" },
    { action: "PATIENT_CREATE", scope: "UNIT" },
    { action: "PATIENT_UPDATE", scope: "UNIT" },
    { action: "SHIFT_READ", scope: "UNIT" },
  ],
  FATURAMENTO: [
    { action: "PATIENT_READ", scope: "ORGANIZATION" },
    { action: "SHIFT_READ", scope: "ORGANIZATION" },
  ],
  AUDITOR_CLINICO: [
    { action: "PATIENT_READ", scope: "ORGANIZATION" },
    { action: "PEP_READ", scope: "ORGANIZATION" },
    { action: "AUDIT_READ", scope: "ORGANIZATION" },
  ],
  FAMILIAR: [
    { action: "PATIENT_READ", scope: "OWN" },
    { action: "PEP_READ", scope: "OWN" },
  ],
};

export function hasPermission(
  role: UserRole,
  action: PermissionAction,
  targetScope?: ScopeType
): boolean {
  const rules = ROLE_DEFINITIONS[role] || [];
  const rule = rules.find((r) => r.action === action);
  if (!rule) return false;
  if (!targetScope) return true;

  const hierarchy: Record<ScopeType, number> = {
    GLOBAL: 6,
    ORGANIZATION: 5,
    REGION: 4,
    UNIT: 3,
    TEAM: 2,
    OWN: 1,
  };

  return hierarchy[rule.scope] >= hierarchy[targetScope];
}

/**
 * Resolução Contextual Completa de Acesso ao Paciente
 */
export function authorizePatientAccess(params: {
  userRole: UserRole;
  userStatus?: string;
  userOrgId?: string;
  patientOrgId?: string;
  userUnitIds?: string[];
  patientUnitId?: string | null;
  professionalId?: string | null;
  userId?: string | null;
  patientId: string;
  activeAssignments: Array<{
    professionalId?: string;
    professionalUserId?: string;
    patientId: string;
    isActive: boolean;
  }>;
}): { authorized: boolean; reason?: string } {
  const userOrg = params.userOrgId || "org_curahome";
  const patientOrg = params.patientOrgId || "org_curahome";
  const userUnits = params.userUnitIds || ["unit_ilheus"];
  const profId = params.professionalId || params.userId;

  // 1. Validar Status do Usuário
  if (params.userStatus && params.userStatus !== "ACTIVE") {
    return {
      authorized: false,
      reason: `Acesso negado: Conta com status ${params.userStatus}.`,
    };
  }

  // 2. Validar Isolamento de Organização
  if (userOrg !== patientOrg) {
    return {
      authorized: false,
      reason: "Acesso negado: Paciente pertence a outra organização.",
    };
  }

  // 3. Checar Permissão de Leitura
  const rules = ROLE_DEFINITIONS[params.userRole] || [];
  const pepRule = rules.find((r) => r.action === "PEP_READ" || r.action === "PATIENT_READ");
  if (!pepRule) {
    return {
      authorized: false,
      reason: "Acesso negado: Perfil não possui permissão de leitura de prontuário.",
    };
  }

  // 4. Escopo GLOBAL / ORGANIZATION (Ex: Admin, Auditor)
  if (pepRule.scope === "GLOBAL" || pepRule.scope === "ORGANIZATION") {
    return { authorized: true };
  }

  // 5. Escopo UNIT (Ex: Gestor de Unidade, Atendimento)
  if (pepRule.scope === "UNIT") {
    if (params.patientUnitId && userUnits.includes(params.patientUnitId)) {
      return { authorized: true };
    }
    return {
      authorized: false,
      reason: "Acesso negado: Paciente não pertence à sua unidade de atuação.",
    };
  }

  // 6. Escopo OWN / Vínculo Assistencial Direto (Anti-IDOR)
  if (pepRule.scope === "OWN" || pepRule.scope === "TEAM") {
    const hasAssignment = params.activeAssignments.some((a) => {
      const matchProf = (a.professionalId && a.professionalId === profId) ||
                        (a.professionalUserId && a.professionalUserId === profId);
      return matchProf && a.patientId === params.patientId && a.isActive;
    });

    if (hasAssignment) {
      return { authorized: true };
    }

    return {
      authorized: false,
      reason: "Acesso negado: Profissional não possui vínculo assistencial ativo com este paciente.",
    };
  }

  return { authorized: false, reason: "Acesso não autorizado." };
}
