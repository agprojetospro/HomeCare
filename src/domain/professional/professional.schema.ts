import { z } from "zod";

export const CouncilTypeEnum = z.enum([
  "CRM",
  "COREN",
  "CREFITO",
  "CRN",
  "CREFONO",
  "CRP",
  "OUTRO",
]);

export const ProfessionCategoryEnum = z.enum([
  "MEDICO",
  "ENFERMEIRO",
  "TECNICO_ENFERMAGEM",
  "FISIOTERAPEUTA",
  "NUTRICIONISTA",
  "FONOAUDIOLOGO",
  "PSICOLOGO",
  "TERAPEUTA_OCUPACIONAL",
  "CUIDADOR",
  "ADMINISTRATIVO",
  "OUTRO",
]);

export const ProfessionalStatusEnum = z.enum([
  "ACTIVE",
  "INACTIVE",
  "VACATION",
  "BLOCKED",
]);

export const ProfessionalCredentialSchema = z.object({
  id: z.string().optional(),
  professionalId: z.string().optional(),
  councilType: CouncilTypeEnum,
  registrationNumber: z.string().min(2, "Número de registro obrigatório"),
  state: z.string().length(2, "UF do conselho obrigatória"),
  validFrom: z.coerce.date().default(() => new Date()),
  validUntil: z.coerce.date().optional().nullable(),
  status: z.enum(["ACTIVE", "EXPIRED", "SUSPENDED"]).default("ACTIVE"),
  verifiedAt: z.coerce.date().optional().nullable(),
  verifiedBy: z.string().optional().nullable(),
});

export type ProfessionalCredential = z.infer<typeof ProfessionalCredentialSchema>;

export const ProfessionalSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().default("org_curahome"),
  profileId: z.string().optional().nullable(),
  fullName: z.string().min(3, "Nome completo é obrigatório"),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, "CPF inválido"),
  profession: ProfessionCategoryEnum,
  phone: z.string().min(10, "Telefone de contato obrigatório"),
  email: z.string().email("E-mail inválido").optional().nullable(),
  status: ProfessionalStatusEnum.default("ACTIVE"),
  
  // Suporte a compatibilidade direta
  councilType: CouncilTypeEnum.optional().nullable(),
  councilNumber: z.string().optional().nullable(),
  councilUf: z.string().optional().nullable(),

  credentials: z.array(ProfessionalCredentialSchema).default([]),
  specialties: z.array(z.string()).default([]),
  unitIds: z.array(z.string()).default([]),
  serviceAreaIds: z.array(z.string()).default([]),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().default(() => new Date()),
});

export type Professional = z.infer<typeof ProfessionalSchema>;

export function getProfessionalCouncilLabel(p?: Professional | null): string {
  if (!p) return "";
  if (p.credentials && p.credentials.length > 0) {
    const cred = p.credentials[0];
    return `${cred.councilType}-${cred.state} ${cred.registrationNumber}`;
  }
  if (p.councilType && p.councilNumber) {
    return `${p.councilType}-${p.councilUf || "BA"} ${p.councilNumber}`;
  }
  return p.profession;
}
