import { describe, it, expect } from "vitest";
import { TriageSchema } from "@/domain/triage/triage.schema";

describe("Módulo Triagem — Validação Clínica e Elegibilidade", () => {
  it("deve validar uma triagem completa com sucesso", () => {
    const validTriage = {
      patientId: "pat_123",
      evaluatorId: "prof_456",
      evaluationDate: new Date(),
      location: "HOSPITAL" as const,
      modality: "PRESENCIAL" as const,
      mainDiagnosis: "DPOC Exacerbado com Insuficiência Respiratória",
      cid10: "J44.1",
      requestReason: "Desospitalização para continuidade de cuidados e oxigenoterapia domiciliar",
      generalState: "REGULAR" as const,
      consciousnessLevel: "ALERTA" as const,
      systolicBp: 130,
      diastolicBp: 85,
      heartRate: 78,
      respiratoryRate: 18,
      oxygenSaturation: 95,
      temperature: 36.5,
      bloodGlucose: 110,
      mobility: "RESTRITO_AO_LEITO" as const,
      feeding: "ORAL" as const,
      breathing: "OXIGENOTERAPIA" as const,
      eliminations: "DIURESE_ESPONTANEA" as const,
      skinCondition: "INTEGRA" as const,
      devices: ["PICC" as const],
      risks: ["QUEDA" as const, "BRONCOASPIRACAO" as const],
      careNeeds: ["MEDICO" as const, "ENFERMEIRO" as const, "FISIOTERAPEUTA" as const],
      eligibility: "ELEGIVEL" as const,
      complexityLevel: "MEDIA" as const,
      conclusion: "Paciente elegível para desospitalização com suporte de O2 e fisioterapia motora/respiratória.",
    };

    const parsed = TriageSchema.safeParse(validTriage);
    expect(parsed.success).toBe(true);
  });

  it("deve rejeitar triagem com sinais vitais fora de escala física plausível", () => {
    const invalidTriage = {
      patientId: "pat_123",
      evaluatorId: "prof_456",
      evaluationDate: new Date(),
      location: "HOSPITAL" as const,
      modality: "PRESENCIAL" as const,
      mainDiagnosis: "Teste",
      cid10: "J44",
      requestReason: "Teste motivo",
      generalState: "REGULAR" as const,
      consciousnessLevel: "ALERTA" as const,
      systolicBp: 500, // Impossível
      diastolicBp: 10,
      heartRate: 400, // Impossível
      respiratoryRate: 90,
      oxygenSaturation: 150, // Impossível > 100%
      temperature: 55, // Impossível
      mobility: "ACAMADO" as const,
      feeding: "ORAL" as const,
      breathing: "AR_AMBIENTE" as const,
      eliminations: "DIURESE_ESPONTANEA" as const,
      skinCondition: "INTEGRA" as const,
      eligibility: "ELEGIVEL" as const,
      complexityLevel: "BAIXA" as const,
      conclusion: "Conclusão teste",
    };

    const parsed = TriageSchema.safeParse(invalidTriage);
    expect(parsed.success).toBe(false);
  });
});

