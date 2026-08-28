import { describe, it, expect } from "vitest";
import {
  calculateNews2Score,
  ClinicalScoreResultSchema,
  News2Inputs,
} from "@/domain/clinical-score/news2.schema";

describe("ONDA 1: Módulo NEWS2 de Detecção Precoce de Deterioração Clínica", () => {
  const normalInputs: News2Inputs = {
    respiratoryRate: 16,
    oxygenSaturation: 98,
    onSupplementalOxygen: false,
    isHypercapnicRespiratoryFailure: false,
    systolicBp: 120,
    heartRate: 72,
    consciousnessLevel: "A",
    temperature: 36.6,
  };

  it("1. Paciente com sinais vitais ideais deve ter pontuação 0 e risco LOW", () => {
    const result = calculateNews2Score(normalInputs);
    expect(result.score).toBe(0);
    expect(result.riskLevel).toBe("LOW");
    expect(result.hasSingleParamMaxScore).toBe(false);
    expect(result.subscores.respiratoryRate).toBe(0);
    expect(result.subscores.oxygenSaturation).toBe(0);
    expect(result.subscores.supplementalOxygen).toBe(0);
    expect(result.subscores.systolicBp).toBe(0);
    expect(result.subscores.heartRate).toBe(0);
    expect(result.subscores.consciousness).toBe(0);
    expect(result.subscores.temperature).toBe(0);
  });

  describe("2. Testes de Limites (Boundary Tests) por Parâmetro Fisiológico", () => {
    it("2.1 Frequência Respiratória", () => {
      expect(calculateNews2Score({ ...normalInputs, respiratoryRate: 8 }).subscores.respiratoryRate).toBe(3);
      expect(calculateNews2Score({ ...normalInputs, respiratoryRate: 9 }).subscores.respiratoryRate).toBe(1);
      expect(calculateNews2Score({ ...normalInputs, respiratoryRate: 11 }).subscores.respiratoryRate).toBe(1);
      expect(calculateNews2Score({ ...normalInputs, respiratoryRate: 12 }).subscores.respiratoryRate).toBe(0);
      expect(calculateNews2Score({ ...normalInputs, respiratoryRate: 20 }).subscores.respiratoryRate).toBe(0);
      expect(calculateNews2Score({ ...normalInputs, respiratoryRate: 21 }).subscores.respiratoryRate).toBe(2);
      expect(calculateNews2Score({ ...normalInputs, respiratoryRate: 24 }).subscores.respiratoryRate).toBe(2);
      expect(calculateNews2Score({ ...normalInputs, respiratoryRate: 25 }).subscores.respiratoryRate).toBe(3);
    });

    it("2.2 Saturação de Oxigênio (Escala 1 Padrão)", () => {
      expect(calculateNews2Score({ ...normalInputs, oxygenSaturation: 96 }).subscores.oxygenSaturation).toBe(0);
      expect(calculateNews2Score({ ...normalInputs, oxygenSaturation: 95 }).subscores.oxygenSaturation).toBe(1);
      expect(calculateNews2Score({ ...normalInputs, oxygenSaturation: 94 }).subscores.oxygenSaturation).toBe(1);
      expect(calculateNews2Score({ ...normalInputs, oxygenSaturation: 93 }).subscores.oxygenSaturation).toBe(2);
      expect(calculateNews2Score({ ...normalInputs, oxygenSaturation: 92 }).subscores.oxygenSaturation).toBe(2);
      expect(calculateNews2Score({ ...normalInputs, oxygenSaturation: 91 }).subscores.oxygenSaturation).toBe(3);
      expect(calculateNews2Score({ ...normalInputs, oxygenSaturation: 88 }).subscores.oxygenSaturation).toBe(3);
    });

    it("2.3 Uso de Oxigênio Suplementar", () => {
      expect(calculateNews2Score({ ...normalInputs, onSupplementalOxygen: false }).subscores.supplementalOxygen).toBe(0);
      expect(calculateNews2Score({ ...normalInputs, onSupplementalOxygen: true }).subscores.supplementalOxygen).toBe(2);
    });

    it("2.4 Pressão Arterial Sistólica", () => {
      expect(calculateNews2Score({ ...normalInputs, systolicBp: 90 }).subscores.systolicBp).toBe(3);
      expect(calculateNews2Score({ ...normalInputs, systolicBp: 91 }).subscores.systolicBp).toBe(2);
      expect(calculateNews2Score({ ...normalInputs, systolicBp: 100 }).subscores.systolicBp).toBe(2);
      expect(calculateNews2Score({ ...normalInputs, systolicBp: 101 }).subscores.systolicBp).toBe(1);
      expect(calculateNews2Score({ ...normalInputs, systolicBp: 110 }).subscores.systolicBp).toBe(1);
      expect(calculateNews2Score({ ...normalInputs, systolicBp: 111 }).subscores.systolicBp).toBe(0);
      expect(calculateNews2Score({ ...normalInputs, systolicBp: 219 }).subscores.systolicBp).toBe(0);
      expect(calculateNews2Score({ ...normalInputs, systolicBp: 220 }).subscores.systolicBp).toBe(3);
    });

    it("2.5 Frequência Cardíaca", () => {
      expect(calculateNews2Score({ ...normalInputs, heartRate: 40 }).subscores.heartRate).toBe(3);
      expect(calculateNews2Score({ ...normalInputs, heartRate: 41 }).subscores.heartRate).toBe(1);
      expect(calculateNews2Score({ ...normalInputs, heartRate: 50 }).subscores.heartRate).toBe(1);
      expect(calculateNews2Score({ ...normalInputs, heartRate: 51 }).subscores.heartRate).toBe(0);
      expect(calculateNews2Score({ ...normalInputs, heartRate: 90 }).subscores.heartRate).toBe(0);
      expect(calculateNews2Score({ ...normalInputs, heartRate: 91 }).subscores.heartRate).toBe(1);
      expect(calculateNews2Score({ ...normalInputs, heartRate: 110 }).subscores.heartRate).toBe(1);
      expect(calculateNews2Score({ ...normalInputs, heartRate: 111 }).subscores.heartRate).toBe(2);
      expect(calculateNews2Score({ ...normalInputs, heartRate: 130 }).subscores.heartRate).toBe(2);
      expect(calculateNews2Score({ ...normalInputs, heartRate: 131 }).subscores.heartRate).toBe(3);
    });

    it("2.6 Nível de Consciência (Escala AVPU)", () => {
      expect(calculateNews2Score({ ...normalInputs, consciousnessLevel: "A" }).subscores.consciousness).toBe(0);
      expect(calculateNews2Score({ ...normalInputs, consciousnessLevel: "V" }).subscores.consciousness).toBe(3);
      expect(calculateNews2Score({ ...normalInputs, consciousnessLevel: "P" }).subscores.consciousness).toBe(3);
      expect(calculateNews2Score({ ...normalInputs, consciousnessLevel: "U" }).subscores.consciousness).toBe(3);
    });

    it("2.7 Temperatura Corporal", () => {
      expect(calculateNews2Score({ ...normalInputs, temperature: 35.0 }).subscores.temperature).toBe(3);
      expect(calculateNews2Score({ ...normalInputs, temperature: 35.1 }).subscores.temperature).toBe(1);
      expect(calculateNews2Score({ ...normalInputs, temperature: 36.0 }).subscores.temperature).toBe(1);
      expect(calculateNews2Score({ ...normalInputs, temperature: 36.1 }).subscores.temperature).toBe(0);
      expect(calculateNews2Score({ ...normalInputs, temperature: 38.0 }).subscores.temperature).toBe(0);
      expect(calculateNews2Score({ ...normalInputs, temperature: 38.1 }).subscores.temperature).toBe(1);
      expect(calculateNews2Score({ ...normalInputs, temperature: 39.0 }).subscores.temperature).toBe(1);
      expect(calculateNews2Score({ ...normalInputs, temperature: 39.1 }).subscores.temperature).toBe(2);
    });
  });

  it("3. Identifica Risco LOW_MEDIUM quando um único parâmetro tem score 3 (ex: SpO2 90%) com total < 5", () => {
    const singleParamCrit = calculateNews2Score({
      ...normalInputs,
      oxygenSaturation: 90, // score 3
    });

    expect(singleParamCrit.score).toBe(3);
    expect(singleParamCrit.hasSingleParamMaxScore).toBe(true);
    expect(singleParamCrit.riskLevel).toBe("LOW_MEDIUM");
  });

  it("4. Identifica Risco MEDIUM para pontuações agregadas entre 5 e 6", () => {
    const mediumRisk = calculateNews2Score({
      ...normalInputs,
      respiratoryRate: 22, // 2
      oxygenSaturation: 94, // 1
      onSupplementalOxygen: true, // 2
      heartRate: 95, // 1 -> Total = 6
    });

    expect(mediumRisk.score).toBe(6);
    expect(mediumRisk.riskLevel).toBe("MEDIUM");
  });

  it("5. Identifica Risco HIGH (Emergência Clínica) para pontuação >= 7 com ação recomendada", () => {
    const highRisk = calculateNews2Score({
      ...normalInputs,
      respiratoryRate: 26, // 3
      oxygenSaturation: 89, // 3
      onSupplementalOxygen: true, // 2
      systolicBp: 85, // 3
      heartRate: 135, // 3
      consciousnessLevel: "V", // 3
      temperature: 39.4, // 2 -> Total = 19
    });

    expect(highRisk.score).toBe(19);
    expect(highRisk.riskLevel).toBe("HIGH");
    expect(highRisk.recommendedAction).toContain("RISCO ALTO (Emergência Clínica)");
  });

  it("6. Suporta cálculo da Escala 2 para pacientes com DPOC / Insuficiência Hipercápnica", () => {
    const copdNormal = calculateNews2Score({
      ...normalInputs,
      isHypercapnicRespiratoryFailure: true,
      oxygenSaturation: 90, // Na escala 2, 88-92% é pontuação 0
    });

    expect(copdNormal.subscores.oxygenSaturation).toBe(0);
  });

  it("7. Valida persistência e imutabilidade de snapshot através do ClinicalScoreResultSchema", () => {
    const calculation = calculateNews2Score(normalInputs);

    const record = ClinicalScoreResultSchema.parse({
      id: "score_news2_1",
      scoreType: "NEWS2",
      scoreVersion: "1.0",
      patientId: "pat_antonio",
      episodeId: "ep_antonio",
      vitalSignsId: "vs_123",
      professionalId: "prof_mariana",
      inputsSnapshot: normalInputs,
      subscores: calculation.subscores,
      score: calculation.score,
      riskLevel: calculation.riskLevel,
      recommendedAction: calculation.recommendedAction,
      calculatedAt: new Date(),
    });

    expect(record.scoreVersion).toBe("1.0");
    expect(record.inputsSnapshot.heartRate).toBe(72);
    expect(record.score).toBe(0);
  });
});

