import { z } from "zod";

export const OrganizationSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Nome da organização é obrigatório"),
  tradeName: z.string().optional().nullable(),
  cnpj: z
    .string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/, "CNPJ inválido"),
  status: z.enum(["ACTIVE", "SUSPENDED", "INACTIVE"]).default("ACTIVE"),
  settings: z.record(z.any()).default({}),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().default(() => new Date()),
});

export type Organization = z.infer<typeof OrganizationSchema>;

