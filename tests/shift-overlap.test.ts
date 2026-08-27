import { describe, it, expect } from "vitest";
import {
  ShiftSchema,
  hasShiftOverlap,
} from "@/domain/shift/shift.schema";

describe("Módulo Escalas & Plantões — Validação e Conflito de Horários", () => {
  it("deve validar com sucesso um plantão com médico responsável obrigatório", () => {
    const validShift = {
      startTime: new Date("2026-08-27T07:00:00.000Z"),
      endTime: new Date("2026-08-27T19:00:00.000Z"),
      shiftType: "DIURNO_12H" as const,
      doctorInChargeId: "doc_rodrigo_123",
      nurseInChargeId: "enf_luciana_456",
      status: "PLANEJADO" as const,
    };

    const parsed = ShiftSchema.safeParse(validShift);
    expect(parsed.success).toBe(true);
  });

  it("deve REJEITAR plantão sem médico responsável", () => {
    const invalidShift = {
      startTime: new Date("2026-08-27T07:00:00.000Z"),
      endTime: new Date("2026-08-27T19:00:00.000Z"),
      shiftType: "DIURNO_12H" as const,
      doctorInChargeId: "", // Vazio / não informado
      nurseInChargeId: "enf_luciana_456",
      status: "PLANEJADO" as const,
    };

    const parsed = ShiftSchema.safeParse(invalidShift);
    expect(parsed.success).toBe(false);
  });

  it("deve detectar sobreposição/conflito de horários de plantão", () => {
    const existingShifts = [
      {
        startTime: new Date("2026-08-27T07:00:00.000Z"),
        endTime: new Date("2026-08-27T19:00:00.000Z"),
      },
    ];

    // Conflito total
    expect(
      hasShiftOverlap(existingShifts, {
        startTime: new Date("2026-08-27T08:00:00.000Z"),
        endTime: new Date("2026-08-27T14:00:00.000Z"),
      })
    ).toBe(true);

    // Conflito parcial (início antes do fim do anterior)
    expect(
      hasShiftOverlap(existingShifts, {
        startTime: new Date("2026-08-27T18:00:00.000Z"),
        endTime: new Date("2026-08-28T06:00:00.000Z"),
      })
    ).toBe(true);

    // Sem conflito (inicia exatamente após o término)
    expect(
      hasShiftOverlap(existingShifts, {
        startTime: new Date("2026-08-27T19:00:00.000Z"),
        endTime: new Date("2026-08-28T07:00:00.000Z"),
      })
    ).toBe(false);
  });
});

