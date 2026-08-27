import { z } from "zod";

export const UnitTypeEnum = z.enum([
  "SEDE",
  "FILIAL",
  "BASE_OPERACIONAL",
  "CLINICA",
  "HOSPITAL",
  "ALMOXARIFADO",
]);

export const UnitSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().min(1, "Organização é obrigatória"),
  name: z.string().min(2, "Nome da unidade é obrigatório"),
  code: z.string().min(2, "Código identificador da unidade é obrigatório"),
  type: UnitTypeEnum.default("BASE_OPERACIONAL"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  phone: z.string().optional().nullable(),
  email: z.string().email("E-mail inválido").optional().nullable(),
  addressStreet: z.string().min(2, "Logradouro é obrigatório"),
  addressNumber: z.string().min(1, "Número é obrigatório"),
  addressComplement: z.string().optional().nullable(),
  addressNeighborhood: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().length(2, "UF deve ter 2 caracteres"),
  postalCode: z.string().min(8, "CEP inválido"),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  timezone: z.string().default("America/Sao_Paulo"),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().default(() => new Date()),
});

export type Unit = z.infer<typeof UnitSchema>;

export const UserUnitAssignmentSchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, "Usuário é obrigatório"),
  unitId: z.string().min(1, "Unidade é obrigatória"),
  isPrimary: z.boolean().default(false),
  startsAt: z.coerce.date().default(() => new Date()),
  endsAt: z.coerce.date().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  createdAt: z.coerce.date().default(() => new Date()),
});

export type UserUnitAssignment = z.infer<typeof UserUnitAssignmentSchema>;

