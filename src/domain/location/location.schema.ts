import { z } from "zod";

export const ServiceRegionSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().min(1, "Organização obrigatória"),
  unitId: z.string().min(1, "Unidade obrigatória"),
  name: z.string().min(2, "Nome da região é obrigatório"),
  code: z.string().min(2, "Código da região é obrigatório"),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  createdAt: z.coerce.date().default(() => new Date()),
});

export type ServiceRegion = z.infer<typeof ServiceRegionSchema>;

export const ServiceAreaSchema = z.object({
  id: z.string().optional(),
  serviceRegionId: z.string().min(1, "Região de serviço é obrigatória"),
  name: z.string().min(2, "Nome da área é obrigatório"),
  city: z.string().min(2, "Cidade obrigatória"),
  state: z.string().length(2, "UF obrigatória"),
  postalCodeStart: z.string().optional().nullable(),
  postalCodeEnd: z.string().optional().nullable(),
  centerLatitude: z.number().optional().nullable(),
  centerLongitude: z.number().optional().nullable(),
  radiusKm: z.number().positive().optional().nullable(),
  neighborhoods: z.array(z.string()).default([]),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  createdAt: z.coerce.date().default(() => new Date()),
});

export type ServiceArea = z.infer<typeof ServiceAreaSchema>;

