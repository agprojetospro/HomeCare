import { describe, it, expect } from "vitest";
import { store } from "@/services/store.service";
import { authorizePatientAccess, hasPermission } from "@/domain/security/rbac";
import { ProfessionalCredentialSchema } from "@/domain/professional/professional.schema";

describe("P0 Security Foundation — Testes Automatizados de Governança & Segurança", () => {
  // 1. ISOLAMENTO DE ORGANIZAÇÃO
  it("deve bloquear acesso de usuário de uma organização a pacientes de outra organização", () => {
    const accessCheck = authorizePatientAccess({
      userRole: "MEDICO",
      userOrgId: "org_curahome",
      patientOrgId: "org_bahia", // Outra organização
      userUnitIds: ["unit_ilheus"],
      patientUnitId: "unit_ilheus",
      professionalId: "prof_roberta",
      patientId: "pat_antonio",
      activeAssignments: [
        { professionalId: "prof_roberta", patientId: "pat_antonio", isActive: true },
      ],
    });

    expect(accessCheck.authorized).toBe(false);
    expect(accessCheck.reason).toContain("outra organização");
  });

  // 2. ISOLAMENTO DE UNIDADE (ESCOPO UNIT)
  it("deve bloquear usuário com escopo UNIT de acessar paciente de outra unidade", () => {
    const accessCheck = authorizePatientAccess({
      userRole: "GESTOR_UNIDADE",
      userOrgId: "org_curahome",
      patientOrgId: "org_curahome",
      userUnitIds: ["unit_ilheus"], // Unidade Ilhéus
      patientUnitId: "unit_itabuna", // Paciente em Itabuna
      patientId: "pat_antonio",
      activeAssignments: [],
    });

    expect(accessCheck.authorized).toBe(false);
    expect(accessCheck.reason).toContain("unidade");
  });

  it("deve permitir usuário com escopo UNIT acessar paciente da mesma unidade", () => {
    const accessCheck = authorizePatientAccess({
      userRole: "GESTOR_UNIDADE",
      userOrgId: "org_curahome",
      patientOrgId: "org_curahome",
      userUnitIds: ["unit_ilheus"],
      patientUnitId: "unit_ilheus",
      patientId: "pat_antonio",
      activeAssignments: [],
    });

    expect(accessCheck.authorized).toBe(true);
  });

  // 3. PROTEÇÃO ANTI-IDOR (VÍNCULO EXPLÍCITO PACIENTE <-> PROFISSIONAL)
  it("deve negar acesso ao PEP para profissional sem vínculo assistencial ativo (Anti-IDOR)", () => {
    const accessCheck = authorizePatientAccess({
      userRole: "MEDICO",
      userOrgId: "org_curahome",
      patientOrgId: "org_curahome",
      userUnitIds: ["unit_ilheus"],
      patientUnitId: "unit_ilheus",
      professionalId: "prof_desconhecido", // Sem assignment
      patientId: "pat_antonio",
      activeAssignments: [
        { professionalId: "prof_roberta", patientId: "pat_antonio", isActive: true },
      ],
    });

    expect(accessCheck.authorized).toBe(false);
    expect(accessCheck.reason).toContain("vínculo assistencial ativo");
  });

  it("deve autorizar acesso ao PEP para profissional com vínculo assistencial ativo", () => {
    const accessCheck = authorizePatientAccess({
      userRole: "MEDICO",
      userOrgId: "org_curahome",
      patientOrgId: "org_curahome",
      userUnitIds: ["unit_ilheus"],
      patientUnitId: "unit_ilheus",
      professionalId: "prof_roberta",
      patientId: "pat_antonio",
      activeAssignments: [
        { professionalId: "prof_roberta", patientId: "pat_antonio", isActive: true },
      ],
    });

    expect(accessCheck.authorized).toBe(true);
  });

  // 4. SUSPENSÃO DE CONTA DO USUÁRIO
  it("deve bloquear qualquer operação se o status do usuário for SUSPENDED ou BLOCKED", () => {
    const checkSuspended = authorizePatientAccess({
      userRole: "ADMIN",
      userStatus: "SUSPENDED",
      userOrgId: "org_curahome",
      patientOrgId: "org_curahome",
      userUnitIds: ["unit_ilheus"],
      patientUnitId: "unit_ilheus",
      patientId: "pat_antonio",
      activeAssignments: [],
    });

    expect(checkSuspended.authorized).toBe(false);
    expect(checkSuspended.reason).toContain("SUSPENDED");

    const checkBlocked = authorizePatientAccess({
      userRole: "ADMIN",
      userStatus: "BLOCKED",
      userOrgId: "org_curahome",
      patientOrgId: "org_curahome",
      userUnitIds: ["unit_ilheus"],
      patientUnitId: "unit_ilheus",
      patientId: "pat_antonio",
      activeAssignments: [],
    });

    expect(checkBlocked.authorized).toBe(false);
    expect(checkBlocked.reason).toContain("BLOCKED");
  });

  // 5. RBAC: PERMISSÕES E AÇÕES ATÔMICAS
  it("deve validar permissões atômicas por papel", () => {
    expect(hasPermission("MEDICO", "PRESCRIPTION_CREATE")).toBe(true);
    expect(hasPermission("ENFERMEIRO", "PRESCRIPTION_CREATE")).toBe(false);
    expect(hasPermission("ENFERMEIRO", "MEDICATION_ADMINISTER")).toBe(true);
    expect(hasPermission("TECNICO_ENFERMAGEM", "MEDICATION_ADMINISTER")).toBe(true);
    expect(hasPermission("ADMIN", "ORGANIZATION_MANAGE")).toBe(true);
    expect(hasPermission("MEDICO", "ORGANIZATION_MANAGE")).toBe(false);
  });

  // 6. IMUTABILIDADE CLÍNICA
  it("deve bloquear alteração em evolução clínica já finalizada", () => {
    const draft = store.saveEvolution({
      episodeId: "ep_antonio",
      patientId: "pat_antonio",
      professionalId: "prof_mariana",
      evolutionType: "ENFERMAGEM",
      content: "Visita inicial em andamento",
      status: "RASCUNHO",
    });

    expect(draft.success).toBe(true);

    const finalized = store.saveEvolution({
      id: draft.evolution!.id,
      episodeId: "ep_antonio",
      patientId: "pat_antonio",
      professionalId: "prof_mariana",
      evolutionType: "ENFERMAGEM",
      content: "Visita finalizada e assinada",
      status: "FINALIZADO",
    });

    expect(finalized.success).toBe(true);

    const illegalUpdate = store.saveEvolution({
      id: finalized.evolution!.id,
      episodeId: "ep_antonio",
      patientId: "pat_antonio",
      professionalId: "prof_mariana",
      evolutionType: "ENFERMAGEM",
      content: "Tentativa de alteração",
      status: "FINALIZADO",
    });

    expect(illegalUpdate.success).toBe(false);
    expect(illegalUpdate.error).toContain("imutáveis");
  });

  // 7. VALIDAÇÃO DE CREDENCIAIS
  it("deve validar datas e formato de credenciais de conselhos de classe", () => {
    const validCred = ProfessionalCredentialSchema.safeParse({
      councilType: "CRM",
      registrationNumber: "189432",
      state: "BA",
      validFrom: new Date("2020-01-01"),
      status: "ACTIVE",
    });
    expect(validCred.success).toBe(true);

    const invalidCred = ProfessionalCredentialSchema.safeParse({
      councilType: "INVALID" as any,
      registrationNumber: "",
      state: "INVALID",
    });
    expect(invalidCred.success).toBe(false);
  });
});

