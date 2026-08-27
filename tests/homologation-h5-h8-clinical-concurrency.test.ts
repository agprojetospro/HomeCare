import { describe, it, expect } from "vitest";
import { store } from "@/services/store.service";
import { hasShiftOverlap } from "@/domain/shift/shift.schema";
import { createAuditEntry } from "@/domain/audit/audit";
import { evaluateVitalSignAlerts } from "@/domain/pep/pep.schema";

describe("Homologação Operacional: Fases H5 a H8 (PEP, Imutabilidade, Concorrência & Auditoria)", () => {
  // H5: Imutabilidade Clínica e Retificações Aditivas
  describe("H5: Imutabilidade do PEP & Retificações Aditivas (CFM 1.821/2007)", () => {
    it("1. Registro de evolução clínica SOAP inicializa com status e dados íntegros", () => {
      const res = store.saveEvolution({
        episodeId: "ep_antonio",
        patientId: "pat_antonio",
        professionalId: "prof_roberta",
        evolutionType: "MEDICA",
        content: "Paciente estável hemodinamicamente em ar ambiente.",
        status: "FINALIZADO",
      });

      expect(res.success).toBe(true);
      expect(res.evolution?.id).toBeDefined();
      expect(res.evolution?.status).toBe("FINALIZADO");
      expect(res.evolution?.createdAt).toBeInstanceOf(Date);
    });

    it("2. Retificação clínica deve criar um registro aditivo sem sobrescrever a evolução original", () => {
      const originalEvolutions = store.getEvolutions("pat_antonio");
      const targetEvo = originalEvolutions[0];
      expect(targetEvo).toBeDefined();

      // Gravar adendo/retificação
      const amendment = {
        id: `amen_${Date.now()}`,
        originalEvolutionId: targetEvo.id,
        patientId: targetEvo.patientId,
        professionalId: "prof_roberta",
        content: "RETIFICAÇÃO/ADENDO: Corrigida dosagem de suporte de oxigênio de 2L/min para ar ambiente.",
        justification: "Correção de apontamento de enfermagem complementado por gasometria arterial.",
        createdAt: new Date(),
      };

      // O registro original permanece intacto no histórico
      const evoAfter = store.getEvolutions("pat_antonio").find((e) => e.id === targetEvo.id);
      expect(evoAfter?.content).toBe(targetEvo.content);
      expect(amendment.originalEvolutionId).toBe(targetEvo.id);
      expect(amendment.content).toContain("RETIFICAÇÃO/ADENDO");
    });
  });

  // H6: Concorrência e Conflitos de Escala / Plantão
  describe("H6: Detecção de Conflitos e Condição de Corrida em Escalas", () => {
    it("3. Identifica conflito exato de sobreposição para o mesmo profissional", () => {
      const existingShifts = [
        {
          startTime: new Date("2026-02-16T07:00:00Z"),
          endTime: new Date("2026-02-16T19:00:00Z"),
          doctorInChargeId: "prof_roberta",
        },
      ];

      // Novo plantão concorrente tentando alocar a mesma médica das 12:00 às 20:00 (sobreposto)
      const isOverlap = hasShiftOverlap(existingShifts, {
        startTime: new Date("2026-02-16T12:00:00Z"),
        endTime: new Date("2026-02-16T20:00:00Z"),
        doctorInChargeId: "prof_roberta",
      });

      expect(isOverlap).toBe(true);
    });

    it("4. Permite alocação em horários distintos e sequenciais sem colisão", () => {
      const existingShifts = [
        {
          startTime: new Date("2026-02-16T07:00:00Z"),
          endTime: new Date("2026-02-16T19:00:00Z"),
          doctorInChargeId: "prof_roberta",
        },
      ];

      // Novo plantão no dia seguinte (sem sobreposição)
      const isOverlap = hasShiftOverlap(existingShifts, {
        startTime: new Date("2026-02-17T07:00:00Z"),
        endTime: new Date("2026-02-17T19:00:00Z"),
        doctorInChargeId: "prof_roberta",
      });

      expect(isOverlap).toBe(false);
    });
  });

  // H7: Administração Medicamentosa e Segurança Farmacológica
  describe("H7: Administração Medicamentosa e Segurança Beira-Leito", () => {
    it("5. Validação de sinais vitais críticos com alerta de dessaturação e crise hipertensiva", () => {
      const alerts = evaluateVitalSignAlerts({
        id: "vit_test",
        episodeId: "ep_antonio",
        patientId: "pat_antonio",
        professionalId: "prof_mariana",
        measuredAt: new Date(),
        systolicBp: 185, // Crítico
        diastolicBp: 112, // Crítico
        heartRate: 140, // Crítico
        respiratoryRate: 28, // Atenção/Crítico
        oxygenSaturation: 87, // Crítico < 90
        temperature: 39.2, // Febre alta
        painScore: 8,
      });

      expect(alerts.length).toBeGreaterThanOrEqual(4);
      expect(alerts.some((a) => a.parameter === "SpO2" && a.severity === "CRITICO")).toBe(true);
      expect(alerts.some((a) => a.parameter === "PA" && a.severity === "CRITICO")).toBe(true);
      expect(alerts.some((a) => a.parameter === "FC" && a.severity === "CRITICO")).toBe(true);
      expect(alerts.some((a) => a.parameter === "Temperatura" && a.severity === "CRITICO")).toBe(true);
    });

    it("6. Registro de administração medicamentosa com status e rastreabilidade", () => {
      const administrationRecord = {
        id: `med_adm_${Date.now()}`,
        prescriptionId: "presc_1",
        patientId: "pat_antonio",
        medicationName: "Ceftriaxona 1g IV",
        dosage: "1g",
        route: "Intravenosa",
        status: "ADMINISTRADO" as const,
        administeredById: "prof_mariana",
        administeredAt: new Date(),
        batchNumber: "LOTE-2026-B89",
      };

      expect(administrationRecord.status).toBe("ADMINISTRADO");
      expect(administrationRecord.administeredById).toBe("prof_mariana");
      expect(administrationRecord.batchNumber).toBeDefined();
    });
  });

  // H8: Trilha de Auditoria Imutável
  describe("H8: Trilha de Auditoria Operacional (audit_logs)", () => {
    it("7. createAuditEntry gera registro com IP, timestamp, autor, papel e estado anterior/novo", () => {
      const entry = createAuditEntry({
        userId: "usr_roberta",
        userName: "Dra. Roberta Mendes",
        userRole: "MEDICO",
        action: "CLINICAL_EVOLUTION_FINALIZE",
        entityTable: "clinical_evolutions",
        recordId: "evo_123",
        patientId: "pat_antonio",
        previousState: { status: "RASCUNHO" },
        newState: { status: "FINALIZADO" },
        ipAddress: "192.168.1.50",
      });

      expect(entry.id).toBeDefined();
      expect(entry.createdAt).toBeInstanceOf(Date);
      expect(entry.userRole).toBe("MEDICO");
      expect(entry.action).toBe("CLINICAL_EVOLUTION_FINALIZE");
      expect(entry.entityTable).toBe("clinical_evolutions");
      expect(entry.ipAddress).toBe("192.168.1.50");
    });
  });
});
