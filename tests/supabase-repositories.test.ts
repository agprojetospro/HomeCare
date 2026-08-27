import { describe, it, expect } from "vitest";
import {
  patientsRepository,
  assignmentsRepository,
  pepRepository,
  billingRepository,
  alertsRepository,
  auditRepository,
} from "@/services/supabase";

describe("Supabase Repositories & Data Access Layer Tests", () => {
  it("1. PatientsRepository deve validar schema de paciente antes de inserir", async () => {
    const invalidPatient: any = {
      organizationId: "org_curahome",
      unitId: "unit_ilheus",
      fullName: "J", // muito curto
      motherName: "",
    };

    const res = await patientsRepository.createPatient(invalidPatient);
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  it("2. AssignmentsRepository deve gerar vínculo com identificador e estado ativo", async () => {
    const newAssign = await assignmentsRepository.createAssignment({
      episodeId: "ep_antonio",
      patientId: "pat_antonio",
      professionalId: "prof_roberta",
      role: "Médica Assistente",
      startDate: new Date(),
      isActive: true,
    });

    expect(newAssign.success).toBe(true);
    expect(newAssign.data?.id).toBeDefined();
    expect(newAssign.data?.isActive).toBe(true);
  });

  it("3. PEPRepository deve calcular alertas fisiológicos automaticamente ao gravar sinais vitais", async () => {
    const res = await pepRepository.recordVitals({
      episodeId: "ep_antonio",
      patientId: "pat_antonio",
      professionalId: "prof_roberta",
      measuredAt: new Date(),
      systolicBp: 190, // Crítico > 180
      diastolicBp: 115, // Crítico > 110
      heartRate: 75,
      respiratoryRate: 18,
      oxygenSaturation: 88, // Crítico < 90
      temperature: 36.5,
      bloodGlucose: 100,
      painScore: 0,
    });

    expect(res.success).toBe(true);
    expect(res.alerts.length).toBeGreaterThanOrEqual(2);
    expect(res.alerts.some((a) => a.parameter === "SpO2" && a.severity === "CRITICO")).toBe(true);
    expect(res.alerts.some((a) => a.parameter === "PA" && a.severity === "CRITICO")).toBe(true);
  });

  it("4. BillingRepository deve retornar convênios com métricas e código ANS", async () => {
    const insurers = await billingRepository.getInsurers("org_curahome");
    expect(insurers.length).toBeGreaterThanOrEqual(4);
    expect(insurers[0].name).toBe("Unimed Sul da Bahia");
    expect(insurers[0].ansCode).toBe("30554");
    expect(insurers[0].monthlyBillingEstimated).toBeGreaterThan(0);
  });

  it("5. AlertsRepository deve gerar alertas dinâmicos sobre sinais vitais dos pacientes", async () => {
    const alerts = await alertsRepository.getActiveAlerts();
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].severity).toBeDefined();
    expect(alerts[0].patientName).toBeDefined();
  });
});
