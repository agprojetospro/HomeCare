import { describe, it, expect } from "vitest";
import {
  FamilyAccessGrantSchema,
  FamilyFeedbackSchema,
  sanitizeClinicalEventForFamily,
  FamilyAccessGrant,
} from "../src/domain/family/family.schema";

describe("MÓDULO PORTAL DO FAMILIAR & CAMADA DE VISIBILIDADE LGPD (ONDA 4)", () => {
  describe("[1] Validação de Vínculos Familiares & Consentimento LGPD", () => {
    it("deve validar concessão de acesso familiar com consentimento ativo", () => {
      const grant: FamilyAccessGrant = {
        patientId: "pat_antonio",
        familyUserId: "user_fam_clara",
        familyUserName: "Clara de Albuquerque",
        familyEmail: "clara.albuquerque@gmail.com",
        familyPhone: "(73) 98888-7777",
        relationship: "FILHO_FILHA",
        accessLevel: "VISAO_COMPLETA_LEIGA",
        consentSignedAt: new Date("2026-08-20"),
        active: true,
      };

      const parsed = FamilyAccessGrantSchema.safeParse(grant);
      expect(parsed.success).toBe(true);
    });

    it("deve rejeitar concessão com e-mail inválido", () => {
      const invalidGrant = {
        patientId: "pat_antonio",
        familyUserId: "user_fam_clara",
        familyUserName: "Clara",
        familyEmail: "email_invalido",
        relationship: "FILHO_FILHA",
      };

      const parsed = FamilyAccessGrantSchema.safeParse(invalidGrant);
      expect(parsed.success).toBe(false);
    });

    it("deve validar envio de feedback familiar de 1 a 5 estrelas", () => {
      const feedback = {
        patientId: "pat_antonio",
        familyUserId: "user_fam_clara",
        familyUserName: "Clara de Albuquerque",
        rating: 5,
        category: "ATENDIMENTO_EQUIPE" as const,
        comment: "Equipe de enfermagem excelente, muito atenciosa com meu pai!",
        createdAt: new Date(),
      };

      const parsed = FamilyFeedbackSchema.safeParse(feedback);
      expect(parsed.success).toBe(true);
    });
  });

  describe("[2] Sanitização de Eventos Clínicos (Filtro LGPD / Sigilo CFM)", () => {
    it("deve converter evento de sinais vitais normais em mensagem humanizada de estabilidade", () => {
      const rawEvent = {
        id: "ev_1",
        patientId: "pat_antonio",
        eventType: "SINAIS_VITAIS",
        eventTitle: "Aferição de Sinais Vitais (NEWS2=0)",
        eventTimestamp: new Date("2026-08-27T08:00:00Z"),
        authorName: "Enf. Mariana Souza",
        authorRole: "ENFERMEIRO",
        summary: "PA 120x80 mmHg, SpO2 98%, FC 72 bpm, Tax 36.4C",
        severity: "NORMAL" as const,
      };

      const sanitized = sanitizeClinicalEventForFamily(rawEvent);
      expect(sanitized).not.toBeNull();
      expect(sanitized?.category).toBe("SINAIS_ESTABILIDADE");
      expect(sanitized?.title).toBe("Checagem de Sinais Vitais & Bem-Estar");
      expect(sanitized?.description).toContain("estáveis dentro dos parâmetros esperados");
      expect(sanitized?.statusTag).toBe("Estável");
    });

    it("deve ocultar eventos de auditoria interna e bloqueios de segurança", () => {
      const rawEvent = {
        id: "ev_audit",
        patientId: "pat_antonio",
        eventType: "AUDITORIA",
        eventTitle: "Acesso de auditoria interna",
        eventTimestamp: new Date(),
        authorName: "Admin",
        authorRole: "ADMIN",
        summary: "Log de acesso interno",
        severity: "NORMAL" as const,
      };

      const sanitized = sanitizeClinicalEventForFamily(rawEvent);
      expect(sanitized).toBeNull();
    });

    it("deve humanizar evento de medicação administrada", () => {
      const rawEvent = {
        id: "ev_med",
        patientId: "pat_antonio",
        eventType: "MEDICACAO",
        eventTitle: "Administração Medicamentosa",
        eventTimestamp: new Date(),
        authorName: "Tec. Carlos Alberto",
        authorRole: "TECNICO_ENFERMAGEM",
        summary: "Ceftriaxona 1g EV administrado sem intercorrências",
        severity: "NORMAL" as const,
      };

      const sanitized = sanitizeClinicalEventForFamily(rawEvent);
      expect(sanitized?.category).toBe("MEDICACAO_MINISTRADA");
      expect(sanitized?.description).toContain("administrados com sucesso");
    });
  });
});
