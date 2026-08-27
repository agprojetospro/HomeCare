import { z } from "zod";

export const ShiftTypeEnum = z.enum([
  "HORAS_24",
  "DIURNO_12H",
  "NOTURNO_12H",
  "FERIADO",
  "FINAL_DE_SEMANA",
  "OUTRO",
]);

export const ShiftStatusEnum = z.enum([
  "PLANEJADO",
  "CONFIRMADO",
  "EM_ANDAMENTO",
  "CONCLUIDO",
  "CANCELADO",
]);

export const ShiftSchema = z
  .object({
    id: z.string().optional(),
    startTime: z.coerce.date({ required_error: "Data e hora inicial são obrigatórias" }),
    endTime: z.coerce.date({ required_error: "Data e hora final são obrigatórias" }),
    shiftType: ShiftTypeEnum,
    doctorInChargeId: z.string().min(1, "Médico responsável é obrigatório no plantão"),
    nurseInChargeId: z.string().optional().nullable(),
    status: ShiftStatusEnum.default("PLANEJADO"),
    notes: z.string().optional().nullable(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "Data final do plantão deve ser posterior à data inicial",
    path: ["endTime"],
  });

export type Shift = z.infer<typeof ShiftSchema>;

export const PatientProfessionalAssignmentSchema = z.object({
  id: z.string().optional(),
  episodeId: z.string().min(1, "Episódio assistencial é obrigatório"),
  patientId: z.string().min(1, "Paciente é obrigatório"),
  professionalId: z.string().min(1, "Profissional é obrigatório"),
  role: z.string().min(2, "Função/Papel assistencial é obrigatório"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type PatientProfessionalAssignment = z.infer<
  typeof PatientProfessionalAssignmentSchema
>;

export function hasShiftOverlap(
  existingShifts: Array<{ startTime: Date; endTime: Date }>,
  candidate: { startTime: Date; endTime: Date }
): boolean {
  return existingShifts.some((shift) => {
    const sStart = new Date(shift.startTime).getTime();
    const sEnd = new Date(shift.endTime).getTime();
    const cStart = new Date(candidate.startTime).getTime();
    const cEnd = new Date(candidate.endTime).getTime();
    return cStart < sEnd && cEnd > sStart;
  });
}

