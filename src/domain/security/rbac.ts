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
  | "UNIT_MANAGE"
  | "BILLING_MANAGE";

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
    { action: "BILLING_MANAGE", scope: "GLOBAL" },
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
    { action: "BILLING_MANAGE", scope: "ORGANIZATION" },
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
    { action: "BILLING_MANAGE", scope: "ORGANIZATION" },
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

/**
 * Verifica se a ação solicitada é um ato clínico exclusivo/reservado
 */
export function isClinicalAction(action: PermissionAction): boolean {
  const clinicalActions: PermissionAction[] = [
    "EVOLUTION_CREATE",
    "EVOLUTION_FINALIZE",
    "PRESCRIPTION_CREATE",
    "PRESCRIPTION_FINALIZE",
    "MEDICATION_ADMINISTER",
    "PROCEDURE_RECORD",
    "EXAM_REQUEST",
    "VITAL_SIGNS_RECORD",
    "TRIAGE_EXECUTE",
  ];
  return clinicalActions.includes(action);
}

/**
 * Validação rigorosa de Execução de Ato Clínico (ADMINISTRAR ≠ EXECUTAR ATO CLÍNICO)
 */
export function validateClinicalExecution(params: {
  userRole: UserRole;
  activeContextRole?: UserRole;
  professionalId?: string | null;
  professionalStatus?: string;
  councilNumber?: string | null;
  councilType?: string | null;
  action: PermissionAction;
}): { authorized: boolean; reason?: string } {
  const effectiveRole = params.activeContextRole || params.userRole;

  // 1. ADMIN puro sem contexto clínico ativo
  if (effectiveRole === "ADMIN" || effectiveRole === "SUPER_ADMIN" || effectiveRole === "FATURAMENTO") {
    if (isClinicalAction(params.action)) {
      return {
        authorized: false,
        reason: "ADMINISTRAR ≠ EXECUTAR ATO CLÍNICO: O papel administrativo não possui habilitação para executar ou assinar atos clínicos reservados.",
      };
    }
  }

  // 2. Para atos clínicos, exigir cadastro profissional ativo e conselho de classe
  if (isClinicalAction(params.action)) {
    if (!params.professionalId) {
      return {
        authorized: false,
        reason: "Acesso negado: Ação clínica requer identificador de profissional de saúde vinculado.",
      };
    }

    if (params.professionalStatus && params.professionalStatus !== "ATIVO" && params.professionalStatus !== "ACTIVE") {
      return {
        authorized: false,
        reason: `Acesso negado: Profissional de saúde com status inativo ou suspenso (${params.professionalStatus}).`,
      };
    }

    // Ações médicas exclusivas
    if (params.action === "PRESCRIPTION_CREATE" || params.action === "PRESCRIPTION_FINALIZE") {
      if (effectiveRole !== "MEDICO") {
        return {
          authorized: false,
          reason: "Acesso negado: Prescrição médica é um ato privativo de profissional Médico com CRM ativo.",
        };
      }
      if (params.councilType && params.councilType !== "CRM") {
        return {
          authorized: false,
          reason: "Acesso negado: Conselho profissional informado não é CRM.",
        };
      }
    }
  }

  return { authorized: true };
}

/**
 * Validação de Troca de Contexto (Context Switching Seguro - Prevenção de Escalonamento de Privilégios)
 */
export function validateContextSwitch(
  grantedRoles: UserRole[],
  targetRole: UserRole
): { allowed: boolean; reason?: string } {
  if (!grantedRoles.includes(targetRole)) {
    return {
      allowed: false,
      reason: `Escalonamento de Privilégios Negado: O usuário não possui a concessão do papel '${targetRole}'.`,
    };
  }
  return { allowed: true };
}

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
 * Resolução Contextual Completa de Acesso ao Paciente (Anti-IDOR)
 */
export function authorizePatientAccess(params: {
  userRole: UserRole;
  activeContextRole?: UserRole;
  userStatus?: string;
  professionalStatus?: string;
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
  const effectiveRole = params.activeContextRole || params.userRole;
  const userOrg = params.userOrgId || "org_curahome";
  const patientOrg = params.patientOrgId || "org_curahome";
  const userUnits = params.userUnitIds || ["unit_ilheus"];
  const profId = params.professionalId || params.userId;

  // 1. Validar Status do Usuário
  if (params.userStatus && params.userStatus !== "ACTIVE" && params.userStatus !== "ATIVO") {
    return {
      authorized: false,
      reason: `Acesso negado: Conta com status ${params.userStatus}.`,
    };
  }

  // 2. Validar Status do Profissional (se aplicável)
  if (params.professionalStatus && params.professionalStatus !== "ACTIVE" && params.professionalStatus !== "ATIVO") {
    return {
      authorized: false,
      reason: `Acesso negado: Profissional com status ${params.professionalStatus}.`,
    };
  }

  // 3. Validar Isolamento Multitenant (Organização A vs B)
  if (userOrg !== patientOrg) {
    return {
      authorized: false,
      reason: "Acesso negado: Paciente pertence a outra organização.",
    };
  }

  // 4. Checar Permissão de Leitura para o Papel Efetivo
  const rules = ROLE_DEFINITIONS[effectiveRole] || [];
  const pepRule = rules.find((r) => r.action === "PEP_READ");
  const patRule = rules.find((r) => r.action === "PATIENT_READ");
  const relevantRule = pepRule || patRule;
  
  if (!relevantRule) {
    return {
      authorized: false,
      reason: "Acesso negado: Perfil não possui permissão de leitura de prontuário.",
    };
  }

  // 5. Escopo GLOBAL / ORGANIZATION (Ex: Admin Operacional, Auditor Clínico)
  if (relevantRule.scope === "GLOBAL" || relevantRule.scope === "ORGANIZATION") {
    return { authorized: true };
  }

  // 6. Escopo UNIT (Ex: Gestor de Unidade, Atendimento)
  if (relevantRule.scope === "UNIT") {
    if (params.patientUnitId && userUnits.includes(params.patientUnitId)) {
      return { authorized: true };
    }
    return {
      authorized: false,
      reason: "Acesso negado: Paciente não pertence à sua unidade de atuação.",
    };
  }

  // 7. Escopo OWN / TEAM (Anti-IDOR com Vínculo Assistencial Obrigatório)
  if (relevantRule.scope === "OWN" || relevantRule.scope === "TEAM") {
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
