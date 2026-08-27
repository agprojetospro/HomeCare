import { describe, it, expect } from "vitest";
import {
  hasPermission,
  authorizePatientAccess,
} from "@/domain/security/rbac";

describe("Módulo Segurança — RBAC e Proteção contra IDOR / Broken Object Level Authorization", () => {
  it("deve permitir que apenas médicos prescrevam medicamentos", () => {
    expect(hasPermission("MEDICO", "PRESCRIPTION_CREATE")).toBe(true);
    expect(hasPermission("TECNICO_ENFERMAGEM", "PRESCRIPTION_CREATE")).toBe(false);
    expect(hasPermission("CUIDADOR", "PRESCRIPTION_CREATE")).toBe(false);
    expect(hasPermission("FAMILIAR", "PRESCRIPTION_CREATE")).toBe(false);
  });

  it("deve permitir que enfermeiros e técnicos executem procedimentos e administrem medicamentos", () => {
    expect(hasPermission("ENFERMEIRO", "MEDICATION_ADMINISTER")).toBe(true);
    expect(hasPermission("TECNICO_ENFERMAGEM", "MEDICATION_ADMINISTER")).toBe(true);
    expect(hasPermission("FAMILIAR", "MEDICATION_ADMINISTER")).toBe(false);
  });

  it("deve BLOQUEAR acesso de profissional a paciente quando NÃO houver vínculo ativo (Anti-IDOR)", () => {
    const activeAssignments = [
      { professionalUserId: "user_tec_mariana", patientId: "pat_antonio", isActive: true },
      { professionalUserId: "user_tec_mariana", patientId: "pat_lourdes", isActive: false }, // Inativo
    ];

    // Mariana tenta acessar Antônio (vínculo ativo -> Permitido)
    const authAntonio = authorizePatientAccess({
      userRole: "TECNICO_ENFERMAGEM",
      userId: "user_tec_mariana",
      patientId: "pat_antonio",
      activeAssignments,
    });
    expect(authAntonio.authorized).toBe(true);

    // Mariana tenta acessar Lourdes (vínculo inativo -> Bloqueado)
    const authLourdes = authorizePatientAccess({
      userRole: "TECNICO_ENFERMAGEM",
      userId: "user_tec_mariana",
      patientId: "pat_lourdes",
      activeAssignments,
    });
    expect(authLourdes.authorized).toBe(false);
    expect(authLourdes.reason).toContain("vínculo assistencial ativo");

    // Mariana tenta acessar Sebastião (sem vínculo algum -> Bloqueado)
    const authSebastiao = authorizePatientAccess({
      userRole: "TECNICO_ENFERMAGEM",
      userId: "user_tec_mariana",
      patientId: "pat_sebastiao",
      activeAssignments,
    });
    expect(authSebastiao.authorized).toBe(false);
  });

  it("deve conceder acesso administrativo para usuário com perfil ADMIN", () => {
    const authAdmin = authorizePatientAccess({
      userRole: "ADMIN",
      userId: "user_admin_roberta",
      patientId: "qualquer_paciente_xyz",
      activeAssignments: [],
    });
    expect(authAdmin.authorized).toBe(true);
  });
});
