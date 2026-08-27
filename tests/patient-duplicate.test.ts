import { describe, it, expect } from "vitest";
import {
  Patient,
  PatientSchema,
  checkPatientDuplicate,
} from "@/domain/patient/patient.schema";

describe("Módulo Pacientes — Prevenção de Duplicidade e Validação", () => {
  const existingPatients: Patient[] = [
    {
      organizationId: "org_curahome",
      unitId: "unit_ilheus",
      fullName: "Antônio Carlos de Albuquerque",
      motherName: "Maria de Lourdes Albuquerque",
      birthDate: new Date("1942-05-14T00:00:00.000Z"),
      cpf: "111.222.333-44",
      gender: "MASCULINO",
      maritalStatus: "CASADO",
      nationality: "Brasileira",
      raceColor: "BRANCA",
      addressStreet: "Rua Pamplona",
      addressNumber: "1420",
      addressNeighborhood: "Jardins",
      addressCity: "São Paulo",
      addressState: "SP",
      addressZip: "01405-002",
      addresses: [],
      allergies: ["Dipirona"],
      status: "ATIVO",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it("deve validar com sucesso um paciente válido", () => {
    const validPatient = {
      fullName: "Sebastião Miranda",
      motherName: "Francisca Miranda",
      birthDate: new Date("1949-03-08T00:00:00.000Z"),
      cpf: "333.444.555-66",
      gender: "MASCULINO" as const,
      maritalStatus: "CASADO" as const,
      addressStreet: "Rua Apiacás",
      addressNumber: "320",
      addressNeighborhood: "Perdizes",
      addressCity: "São Paulo",
      addressState: "SP",
      addressZip: "05017-020",
    };

    const parsed = PatientSchema.safeParse(validPatient);
    expect(parsed.success).toBe(true);
  });

  it("deve detectar duplicidade pelo CPF", () => {
    const candidate = {
      fullName: "Antônio C Albuquerque",
      motherName: "Lourdes Albuquerque",
      birthDate: new Date("1942-05-14T00:00:00.000Z"),
      cpf: "11122233344", // Mesmo CPF sem pontuação
    };

    const check = checkPatientDuplicate(existingPatients, candidate);
    expect(check.isDuplicate).toBe(true);
    expect(check.reason).toContain("CPF");
  });

  it("deve detectar duplicidade por Nome + Data Nascimento + Nome da Mãe", () => {
    const candidate = {
      fullName: "Antônio Carlos de Albuquerque",
      motherName: "Maria de Lourdes Albuquerque",
      birthDate: new Date("1942-05-14T00:00:00.000Z"),
      cpf: null, // Sem CPF informado
    };

    const check = checkPatientDuplicate(existingPatients, candidate);
    expect(check.isDuplicate).toBe(true);
    expect(check.reason).toContain("Nome, Data de Nascimento e Nome da Mãe");
  });

  it("não deve apontar duplicidade para paciente genuinamente novo", () => {
    const candidate = {
      fullName: "Carlos Eduardo da Silva",
      motherName: "Joana da Silva",
      birthDate: new Date("1975-08-20T00:00:00.000Z"),
      cpf: "999.888.777-66",
    };

    const check = checkPatientDuplicate(existingPatients, candidate);
    expect(check.isDuplicate).toBe(false);
  });
});

