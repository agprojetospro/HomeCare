import { z } from "zod";

export const AddressTypeEnum = z.enum([
  "RESIDENTIAL",
  "CARE_LOCATION",
  "TEMPORARY",
  "BILLING",
  "OTHER",
]);

export const PatientAddressSchema = z.object({
  id: z.string().optional(),
  patientId: z.string().optional(),
  addressType: AddressTypeEnum.default("RESIDENTIAL"),
  street: z.string().min(2, "Logradouro é obrigatório"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().length(2, "UF deve ter 2 caracteres"),
  postalCode: z.string().min(8, "CEP inválido"),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  isPrimary: z.boolean().default(true),
  validFrom: z.coerce.date().default(() => new Date()),
  validUntil: z.coerce.date().optional().nullable(),
});

export type PatientAddress = z.infer<typeof PatientAddressSchema>;

export const PatientSchema = z.object({
  id: z.string().optional(),
  organizationId: z.string().default("org_principal"),
  unitId: z.string().default("unit_sede"),
  fullName: z.string().min(3, "Nome completo deve ter no mínimo 3 caracteres"),
  socialName: z.string().optional().nullable(),
  fatherName: z.string().optional().nullable(),
  motherName: z.string().min(3, "Nome da mãe é obrigatório para identificação inequívoca"),
  cpf: z
    .string()
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/, "CPF inválido")
    .optional()
    .nullable(),
  rg: z.string().optional().nullable(),
  birthDate: z.coerce.date({ required_error: "Data de nascimento é obrigatória" }),
  nationality: z.string().default("Brasileira"),
  raceColor: z.enum(["BRANCA", "PRETA", "PARDA", "AMARELA", "INDIGENA", "NAO_INFORMADO"]).default("NAO_INFORMADO"),
  naturalness: z.string().optional().nullable(),
  maritalStatus: z.enum(["SOLTEIRO", "CASADO", "DIVORCIADO", "VIUVO", "UNIAO_ESTAVEL", "OUTRO"]).default("SOLTEIRO"),
  gender: z.enum(["MASCULINO", "FEMININO", "OUTRO"]),
  
  // Endereço de referência principal
  addressStreet: z.string().min(2, "Logradouro é obrigatório"),
  addressNumber: z.string().min(1, "Número é obrigatório"),
  addressComplement: z.string().optional().nullable(),
  addressNeighborhood: z.string().min(2, "Bairro é obrigatório"),
  addressCity: z.string().min(2, "Cidade é obrigatória"),
  addressState: z.string().length(2, "UF deve ter 2 letras"),
  addressZip: z.string().min(8, "CEP inválido"),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),

  addresses: z.array(PatientAddressSchema).default([]),
  allergies: z.array(z.string()).default([]),
  status: z.enum(["ATIVO", "ALTA", "INTERNADO_HOSPITAL", "SUSPENSO", "OBITO"]).default("ATIVO"),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().default(() => new Date()),
});

export type Patient = z.infer<typeof PatientSchema>;

export function checkPatientDuplicate(
  existingPatients: Patient[],
  candidate: { organizationId?: string; cpf?: string | null; fullName: string; birthDate: Date; motherName: string }
): { isDuplicate: boolean; matchedPatient?: Patient; reason?: string } {
  // Filtrar pela mesma organização (ou geral se não especificada)
  const scopedPatients = candidate.organizationId
    ? existingPatients.filter((p) => p.organizationId === candidate.organizationId)
    : existingPatients;

  // 1. Verificação por CPF
  if (candidate.cpf) {
    const cleanCandidateCpf = candidate.cpf.replace(/\D/g, "");
    const matchByCpf = scopedPatients.find(
      (p) => p.cpf && p.cpf.replace(/\D/g, "") === cleanCandidateCpf
    );
    if (matchByCpf) {
      return {
        isDuplicate: true,
        matchedPatient: matchByCpf,
        reason: `Paciente já cadastrado nesta organização com o CPF ${candidate.cpf}`,
      };
    }
  }

  // 2. Verificação fonética / Nome + Nascimento + Mãe
  const normName = candidate.fullName.trim().toLowerCase();
  const normMother = candidate.motherName.trim().toLowerCase();
  const candidateBirthStr = candidate.birthDate.toISOString().split("T")[0];

  const matchByDetails = scopedPatients.find((p) => {
    const pBirthStr = new Date(p.birthDate).toISOString().split("T")[0];
    return (
      p.fullName.trim().toLowerCase() === normName &&
      p.motherName.trim().toLowerCase() === normMother &&
      pBirthStr === candidateBirthStr
    );
  });

  if (matchByDetails) {
    return {
      isDuplicate: true,
      matchedPatient: matchByDetails,
      reason: "Paciente já cadastrado com mesmo Nome, Data de Nascimento e Nome da Mãe",
    };
  }

  return { isDuplicate: false };
}
