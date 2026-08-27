import { z } from "zod";

export const TriageSchema = z.object({
  id: z.string().optional(),
  episodeId: z.string().optional().nullable(),
  patientId: z.string().min(1, "Paciente é obrigatório"),
  evaluatorId: z.string().min(1, "Profissional avaliador é obrigatório"),
  evaluationDate: z.coerce.date({ required_error: "Data da avaliação é obrigatória" }),
  
  location: z.enum(["HOSPITAL", "RESIDENCIA", "CLINICA"]),
  modality: z.enum(["PRESENCIAL", "TELEATENDIMENTO"]),

  // Quadro Clínico
  mainDiagnosis: z.string().min(2, "Diagnóstico principal é obrigatório"),
  cid10: z.string().min(3, "CID-10 principal é obrigatório"),
  secondaryDiagnoses: z.array(z.string()).default([]),
  requestReason: z.string().min(5, "Motivo da solicitação do Home Care é obrigatório"),
  generalState: z.enum(["BOM", "REGULAR", "GRAVE"]),
  consciousnessLevel: z.enum(["ALERTA", "SONOLENTO", "CONFUSO", "SEDADO"]),

  // Sinais Vitais na Avaliação
  systolicBp: z.number().int().min(40).max(300),
  diastolicBp: z.number().int().min(20).max(200),
  heartRate: z.number().int().min(20).max(260),
  respiratoryRate: z.number().int().min(6).max(60),
  oxygenSaturation: z.number().int().min(40).max(100),
  temperature: z.number().min(30).max(45),
  bloodGlucose: z.number().int().min(20).max(800).optional().nullable(),

  // Mobilidade
  mobility: z.enum([
    "INDEPENDENTE",
    "NECESSITA_AUXILIO",
    "CADEIRANTE",
    "RESTRITO_AO_LEITO",
    "ACAMADO",
  ]),

  // Avaliação Clínica dos Sistemas
  feeding: z.enum([
    "ORAL",
    "ENTERAL",
    "GASTROSTOMIA",
    "NUTRICAO_PARENTERAL",
  ]),
  breathing: z.enum([
    "AR_AMBIENTE",
    "OXIGENOTERAPIA",
    "TRAQUEOSTOMIA",
    "VENTILACAO_MECANICA",
  ]),
  eliminations: z.enum([
    "DIURESE_ESPONTANEA",
    "SONDA_VESICAL",
    "FRALDAS",
    "OSTOMIA",
  ]),
  skinCondition: z.enum([
    "INTEGRA",
    "LESAO_POR_PRESSAO",
    "FERIDA_OPERATORIA",
    "NECESSITA_CURATIVO",
  ]),

  // Dispositivos Invasivos Presentes
  devices: z.array(
    z.enum([
      "GTT",
      "SNE",
      "SVD",
      "PICC",
      "CATETER_VENOSO_CENTRAL",
      "TRAQUEOSTOMIA",
      "COLOSTOMIA",
      "DRENO",
    ])
  ).default([]),

  // Riscos Mapeados
  risks: z.array(
    z.enum([
      "QUEDA",
      "LESAO_POR_PRESSAO",
      "BRONCOASPIRACAO",
      "INFECCAO",
      "AGITACAO",
      "CONVULSAO",
      "OUTRO",
    ])
  ).default([]),

  // Necessidades Assistenciais Identificadas
  careNeeds: z.array(
    z.enum([
      "MEDICO",
      "ENFERMEIRO",
      "TECNICO_ENFERMAGEM",
      "FISIOTERAPEUTA",
      "NUTRICIONISTA",
      "FONOAUDIOLOGO",
      "PSICOLOGO",
      "TERAPEUTA_OCUPACIONAL",
    ])
  ).default([]),

  // Resultado
  eligibility: z.enum(["ELEGIVEL", "NAO_ELEGIVEL"]),
  complexityLevel: z.enum(["BAIXA", "MEDIA", "ALTA"]),
  observations: z.string().optional().nullable(),
  conclusion: z.string().min(5, "Parecer conclusivo da triagem é obrigatório"),
});

export type Triage = z.infer<typeof TriageSchema>;

