import { describe, it, expect } from "vitest";
import {
  VitalSigns,
  VitalSignsSchema,
  evaluateVitalSignAlerts,
} from "@/domain/pep/pep.schema";

describe("Módulo PEP — Sinais Vitais e Alertas de Deterioração Clínica", () => {
  it("deve validar sinais vitais normais sem disparar alertas críticos", () => {
    const normalVitals: VitalSigns = {
      episodeId: "ep_1",
      patientId: "pat_1",
      professionalId: "prof_1",
      measuredAt: new Date(),
      systolicBp: 120,
      diastolicBp: 80,
      heartRate: 72,
      respiratoryRate: 16,
      oxygenSaturation: 98,
      temperature: 36.5,
      bloodGlucose: 95,
      painScore: 0,
    };

    const parsed = VitalSignsSchema.safeParse(normalVitals);
    expect(parsed.success).toBe(true);

    const alerts = evaluateVitalSignAlerts(normalVitals);
    expect(alerts.length).toBe(0);
  });

  it("deve disparar alerta crítico para dessaturação grave (<90%)", () => {
    const criticalVitals: VitalSigns = {
      episodeId: "ep_1",
      patientId: "pat_1",
      professionalId: "prof_1",
      measuredAt: new Date(),
      systolicBp: 120,
      diastolicBp: 80,
      heartRate: 80,
      respiratoryRate: 24,
      oxygenSaturation: 87, // Crítico
      temperature: 36.5,
      painScore: 1,
    };

    const alerts = evaluateVitalSignAlerts(criticalVitals);
    expect(alerts.some((a) => a.parameter === "SpO2" && a.severity === "CRITICO")).toBe(true);
  });

  it("deve disparar alerta crítico para crise hipertensiva", () => {
    const hypertensiveCrisis: VitalSigns = {
      episodeId: "ep_1",
      patientId: "pat_1",
      professionalId: "prof_1",
      measuredAt: new Date(),
      systolicBp: 195, // Crítico
      diastolicBp: 115, // Crítico
      heartRate: 90,
      respiratoryRate: 18,
      oxygenSaturation: 97,
      temperature: 36.8,
      painScore: 0,
    };

    const alerts = evaluateVitalSignAlerts(hypertensiveCrisis);
    expect(alerts.some((a) => a.parameter === "PA" && a.severity === "CRITICO")).toBe(true);
  });

  it("deve disparar alerta crítico para hipoglicemia severa", () => {
    const hypoglycemia: VitalSigns = {
      episodeId: "ep_1",
      patientId: "pat_1",
      professionalId: "prof_1",
      measuredAt: new Date(),
      systolicBp: 110,
      diastolicBp: 70,
      heartRate: 110,
      respiratoryRate: 20,
      oxygenSaturation: 98,
      temperature: 36.0,
      bloodGlucose: 52, // Hipoglicemia < 70
      painScore: 0,
    };

    const alerts = evaluateVitalSignAlerts(hypoglycemia);
    expect(alerts.some((a) => a.parameter === "Glicemia" && a.severity === "CRITICO")).toBe(true);
  });
});

