import { describe, it, expect } from "vitest";
import {
  calculateOxygenAutonomy,
  evaluateWoundHealingProgress,
  SupplyItemSchema,
  InventoryLedgerEntrySchema,
  PatientOxygenTherapySchema,
  WoundEvaluationSchema,
  WoundEvaluation,
} from "../src/domain/supplies/supplies.schema";

describe("MÓDULO DE INSUMOS, OXIGÊNIO & CURATIVOS (ONDA 3)", () => {
  describe("[1] Motor de Oxigenoterapia & Cálculo de Autonomia", () => {
    it("deve calcular corretamente a autonomia de um cilindro E (10L, K=1.0) a 150 bar com fluxo de 2 L/min", () => {
      // 150 bar * 1.0 = 150 L utilizáveis
      // 150 L / 2 L/min = 75 min = 1.3 horas (status CRITICO pois < 2h)
      const res = calculateOxygenAutonomy(150, 2, 1.0);
      expect(res.totalUsableLiters).toBe(150);
      expect(res.autonomyMinutes).toBe(75);
      expect(res.autonomyHours).toBe(1.3);
      expect(res.status).toBe("CRITICO");
    });

    it("deve calcular autonomia para cilindro grande J (50L, K=5.0) a 150 bar com fluxo de 3 L/min", () => {
      // 150 bar * 5.0 = 750 L
      // 750 L / 3 L/min = 250 min = 4.2 horas (status ATENCAO pois < 6h)
      const res = calculateOxygenAutonomy(150, 3, 5.0);
      expect(res.totalUsableLiters).toBe(750);
      expect(res.autonomyMinutes).toBe(250);
      expect(res.autonomyHours).toBe(4.2);
      expect(res.status).toBe("ATENCAO");
    });

    it("deve retornar status NORMAL quando a autonomia for superior a 6 horas", () => {
      // 150 bar * 5.0 = 750 L; fluxo de 1 L/min = 750 min = 12.5 horas
      const res = calculateOxygenAutonomy(150, 1, 5.0);
      expect(res.autonomyHours).toBe(12.5);
      expect(res.status).toBe("NORMAL");
    });

    it("deve retornar status CRITICO e zerado se a pressão for 0 ou fluxo <= 0", () => {
      const res = calculateOxygenAutonomy(0, 2, 1.0);
      expect(res.totalUsableLiters).toBe(0);
      expect(res.autonomyHours).toBe(0);
      expect(res.status).toBe("CRITICO");
    });
  });

  describe("[2] Protocolo de Curativos, Lesões NPUAP & Cicatrização", () => {
    it("deve validar avaliação de lesão por pressão estágio 3 consistente", () => {
      const wound: WoundEvaluation = {
        patientId: "pat_antonio",
        episodeId: "ep_antonio",
        professionalId: "prof_mariana",
        woundIdentifier: "Lesão 1 - Região Sacral",
        location: "SACRO",
        stage: "ESTAGIO_3",
        lengthCm: 4.5,
        widthCm: 3.0,
        depthCm: 0.8,
        granulationPercent: 70,
        sloughPercent: 20,
        necrosisPercent: 0,
        epithelializationPercent: 10,
        exudateAmount: "MODERADO",
        exudateType: "SEROSO",
        odorPresent: false,
        painScoreVisualScale: 2,
        prescribedCovering: "ESPUMA_DE_POLIURETANO_SILICONE",
        cleaningSolution: "Soro Fisiológico 0,9% morno",
        dressingChangeFrequencyHours: 48,
        healingEvolutionStatus: "ESTAVEL",
        evaluatedAt: new Date(),
      };

      const parsed = WoundEvaluationSchema.safeParse(wound);
      expect(parsed.success).toBe(true);
    });

    it("deve rejeitar avaliação quando a soma dos tecidos ultrapassar 100%", () => {
      const invalidWound = {
        patientId: "pat_antonio",
        episodeId: "ep_antonio",
        professionalId: "prof_mariana",
        woundIdentifier: "Lesão 1 - Região Sacral",
        location: "SACRO",
        stage: "ESTAGIO_2",
        lengthCm: 2.0,
        widthCm: 2.0,
        granulationPercent: 60,
        sloughPercent: 50, // 60 + 50 = 110% (> 100%)
        prescribedCovering: "HIDROCOLOIDE",
      };

      const parsed = WoundEvaluationSchema.safeParse(invalidWound);
      expect(parsed.success).toBe(false);
    });

    it("deve calcular corretamente a redução de área (regressão positiva de cicatrização)", () => {
      const prev: WoundEvaluation = {
        patientId: "pat_antonio",
        episodeId: "ep_antonio",
        professionalId: "prof_mariana",
        woundIdentifier: "Lesão 1",
        location: "SACRO",
        stage: "ESTAGIO_3",
        lengthCm: 5.0,
        widthCm: 4.0, // Área = 20 cm²
        depthCm: 1.0,
        granulationPercent: 50,
        sloughPercent: 30,
        necrosisPercent: 10,
        epithelializationPercent: 10,
        exudateAmount: "MODERADO",
        exudateType: "SEROSO",
        odorPresent: false,
        painScoreVisualScale: 3,
        prescribedCovering: "ALGINATO_DE_CALCIO",
        cleaningSolution: "SF 0,9%",
        dressingChangeFrequencyHours: 24,
        healingEvolutionStatus: "ESTAVEL",
        evaluatedAt: new Date("2026-08-20"),
      };

      const current: WoundEvaluation = {
        ...prev,
        lengthCm: 4.0,
        widthCm: 3.5, // Área = 14 cm² (redução de 30%)
        evaluatedAt: new Date("2026-08-27"),
      };

      const progress = evaluateWoundHealingProgress(prev, current);
      expect(progress.healingTrajectory).toBe("REGRESSAO_POSITIVA");
      expect(progress.percentageChange).toBe(-30);
      expect(progress.areaDeltaCm2).toBe(-6);
    });

    it("deve detectar expansão negativa da lesão (alerta clínico de piora)", () => {
      const prev = {
        lengthCm: 2.0,
        widthCm: 2.0, // 4 cm²
      } as WoundEvaluation;

      const current = {
        lengthCm: 3.0,
        widthCm: 2.0, // 6 cm² (+50%)
      } as WoundEvaluation;

      const progress = evaluateWoundHealingProgress(prev, current);
      expect(progress.healingTrajectory).toBe("EXPANSAO_NEGATIVA");
      expect(progress.percentageChange).toBe(50);
    });
  });

  describe("[3] Catálogo de Insumos & Validação de Estoque Ledger", () => {
    it("deve validar item de insumo hospitalar com ponto de ressuprimento", () => {
      const item = {
        organizationId: "org_curahome",
        unitId: "unit_ilheus",
        code: "MAT-001",
        name: "Catéter Nasal de Oxigênio Adulto",
        category: "OXIGENOTERAPIA" as const,
        unitOfMeasure: "Unidade",
        currentStock: 45,
        minimumStock: 10,
        reorderPoint: 20,
        costPrice: 4.5,
        active: true,
      };

      const parsed = SupplyItemSchema.safeParse(item);
      expect(parsed.success).toBe(true);
    });

    it("deve rejeitar estoque negativo no catálogo", () => {
      const item = {
        organizationId: "org_curahome",
        unitId: "unit_ilheus",
        code: "MAT-002",
        name: "Sonda de Aspiração Traqueal nº 12",
        category: "MATERIAL_PENSO" as const,
        unitOfMeasure: "Unidade",
        currentStock: -5, // Inválido
        minimumStock: 10,
        reorderPoint: 20,
      };

      const parsed = SupplyItemSchema.safeParse(item);
      expect(parsed.success).toBe(false);
    });

    it("deve validar movimentação de saída de estoque para paciente com lote e validade", () => {
      const movement = {
        organizationId: "org_curahome",
        unitId: "unit_ilheus",
        supplyItemId: "sup_1",
        movementType: "SAIDA_PACIENTE" as const,
        quantity: 2,
        balanceAfter: 43,
        batchNumber: "LOTE2026-X8",
        expirationDate: new Date("2028-12-31"),
        patientId: "pat_antonio",
        professionalId: "prof_mariana",
        visitId: "vis_1",
        reason: "Curativo sacral beira-leito",
      };

      const parsed = InventoryLedgerEntrySchema.safeParse(movement);
      expect(parsed.success).toBe(true);
    });
  });
});
