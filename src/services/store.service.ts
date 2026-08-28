"use client";

import { Patient, checkPatientDuplicate } from "@/domain/patient/patient.schema";
import { Professional } from "@/domain/professional/professional.schema";
import { Organization } from "@/domain/organization/organization.schema";
import { Unit, UserUnitAssignment } from "@/domain/unit/unit.schema";
import { ServiceRegion, ServiceArea } from "@/domain/location/location.schema";
import { Triage } from "@/domain/triage/triage.schema";
import { Shift, PatientProfessionalAssignment, hasShiftOverlap } from "@/domain/shift/shift.schema";
import {
  ClinicalEvolution,
  Prescription,
  VitalSigns,
  Procedure,
  Exam,
  evaluateVitalSignAlerts,
} from "@/domain/pep/pep.schema";
import { Pad, MultidisciplinaryVisit, EquipmentAndMaterial } from "@/domain/pad/pad.schema";
import {
  calculateNews2Score,
  ClinicalScoreResult,
  News2Inputs,
} from "@/domain/clinical-score/news2.schema";
import {
  Visit,
  VisitCheckin,
  evaluateGeofence,
  isValidVisitTransition,
  VisitStatus,
} from "@/domain/visit/visit.schema";
import {
  SupplyItem,
  InventoryLedgerEntry,
  PatientOxygenTherapy,
  WoundEvaluation,
  calculateOxygenAutonomy,
  evaluateWoundHealingProgress,
  OxygenAutonomyCalculation,
} from "@/domain/supplies/supplies.schema";
import {
  FamilyAccessGrant,
  FamilyFeedback,
  FamilyTimelineEvent,
  CareDailySummary,
  sanitizeClinicalEventForFamily,
} from "@/domain/family/family.schema";
import { OperationalDashboardMetrics } from "@/domain/dashboard/operational-metrics.schema";
import { syncManager } from "@/services/offline/sync-manager.service";
import { UserRole, authorizePatientAccess } from "@/domain/security/rbac";
import { AuditLog, createAuditEntry } from "@/domain/audit/audit";

export interface CareEpisode {
  id: string;
  organizationId: string;
  patientId: string;
  unitId: string;
  careLocationId?: string | null;
  careType: "INTERNO" | "HOME_CARE_24H" | "HOME_CARE_12H" | "VISITAS_PONTUAIS" | "PROCEDIMENTOS";
  admissionDate: Date;
  dischargeDate?: Date | null;
  doctorInChargeId?: string | null;
  nurseInChargeId?: string | null;
  status: "ATIVO" | "ALTA" | "SUSPENSO" | "OBITO";
}

export interface CarePlanItem {
  id: string;
  carePlanId: string;
  professionType: UserRole;
  frequency: string;
  procedureDescription: string;
  goals?: string | null;
}

export interface CarePlan {
  id: string;
  episodeId: string;
  patientId: string;
  triageId?: string | null;
  version: number;
  startDate: Date;
  endDate?: Date | null;
  status: "ATIVO" | "REVISADO" | "CONCLUIDO";
  createdById: string;
  items: CarePlanItem[];
}

export interface ClinicalEvent {
  id: string;
  episodeId: string;
  patientId: string;
  eventType: "EVOLUCAO" | "SINAIS_VITAIS" | "PRESCRICAO" | "PROCEDIMENTO" | "EXAME" | "TRIAGEM" | "ALERTA";
  eventTitle: string;
  eventTimestamp: Date;
  authorName: string;
  authorRole: string;
  summary: string;
  severity?: "NORMAL" | "ATENCAO" | "CRITICO";
  referenceId?: string | null;
}

export interface CurrentUser {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: UserRole;
  status: "INVITED" | "ACTIVE" | "SUSPENDED" | "BLOCKED" | "INACTIVE";
  unitIds: string[];
  professionalId?: string | null;
}

// -------------------------------------------------------------
// DADOS INICIAIS DA FUNDAÇÃO P0
// -------------------------------------------------------------

const INITIAL_ORGANIZATIONS: Organization[] = [
  {
    id: "org_curahome",
    name: "CuraHome Atenção Domiciliar Integrada",
    tradeName: "CuraHome Brasil",
    cnpj: "12.345.678/0001-90",
    status: "ACTIVE",
    settings: { enableGpsCheckin: true, sessionTimeoutMinutes: 60 },
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  },
  {
    id: "org_bahia",
    name: "HomeCare Bahia Assistência Médica Ltda",
    tradeName: "HomeCare Bahia",
    cnpj: "98.765.432/0001-10",
    status: "ACTIVE",
    settings: { enableGpsCheckin: true, sessionTimeoutMinutes: 45 },
    createdAt: new Date("2026-02-01T00:00:00Z"),
    updatedAt: new Date("2026-02-01T00:00:00Z"),
  },
];

const INITIAL_UNITS: Unit[] = [
  {
    id: "unit_ilheus",
    organizationId: "org_curahome",
    name: "Unidade Ilhéus — Sede Operacional",
    code: "ILH-01",
    type: "SEDE",
    status: "ACTIVE",
    phone: "(73) 3234-5678",
    email: "ilheus@curahome.com.br",
    addressStreet: "Avenida Soares Lopes",
    addressNumber: "1200",
    addressNeighborhood: "Centro",
    city: "Ilhéus",
    state: "BA",
    postalCode: "45653-005",
    latitude: -14.7935,
    longitude: -39.0494,
    timezone: "America/Bahia",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
  {
    id: "unit_itabuna",
    organizationId: "org_curahome",
    name: "Unidade Itabuna — Base Avançada",
    code: "ITB-01",
    type: "BASE_OPERACIONAL",
    status: "ACTIVE",
    phone: "(73) 3613-9000",
    email: "itabuna@curahome.com.br",
    addressStreet: "Avenida Firmino Alves",
    addressNumber: "450",
    addressNeighborhood: "Centro",
    city: "Itabuna",
    state: "BA",
    postalCode: "45600-185",
    latitude: -14.7871,
    longitude: -39.2789,
    timezone: "America/Bahia",
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
  },
];

const INITIAL_SERVICE_REGIONS: ServiceRegion[] = [
  {
    id: "reg_ilheus_norte",
    organizationId: "org_curahome",
    unitId: "unit_ilheus",
    name: "Região Litoral Norte",
    code: "ILH-NORTE",
    status: "ACTIVE",
    createdAt: new Date("2026-01-01"),
  },
  {
    id: "reg_ilheus_sul",
    organizationId: "org_curahome",
    unitId: "unit_ilheus",
    name: "Região Litoral Sul / Olivença",
    code: "ILH-SUL",
    status: "ACTIVE",
    createdAt: new Date("2026-01-01"),
  },
];

const INITIAL_SERVICE_AREAS: ServiceArea[] = [
  {
    id: "area_savona",
    serviceRegionId: "reg_ilheus_norte",
    name: "Zona Norte Residencial",
    city: "Ilhéus",
    state: "BA",
    postalCodeStart: "45650-000",
    postalCodeEnd: "45655-999",
    centerLatitude: -14.7800,
    centerLongitude: -39.0400,
    radiusKm: 15,
    neighborhoods: ["São Domingos", "Malhado", "Savona"],
    status: "ACTIVE",
    createdAt: new Date("2026-01-01"),
  },
];

const INITIAL_PROFESSIONALS: Professional[] = [
  {
    id: "prof_roberta",
    organizationId: "org_curahome",
    profileId: "user_roberta",
    fullName: "Dra. Roberta Mendes",
    cpf: "123.456.789-00",
    profession: "MEDICO",
    phone: "(73) 98765-4321",
    email: "roberta.mendes@curahome.com.br",
    status: "ACTIVE",
    credentials: [
      {
        councilType: "CRM",
        registrationNumber: "189432",
        state: "BA",
        validFrom: new Date("2020-01-01"),
        status: "ACTIVE",
      },
    ],
    specialties: ["Clínica Médica", "Geriatria", "Cuidados Paliativos"],
    unitIds: ["unit_ilheus", "unit_itabuna"],
    serviceAreaIds: ["area_savona"],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
  {
    id: "prof_luciana",
    organizationId: "org_curahome",
    profileId: "user_luciana",
    fullName: "Enf. Luciana Prado Alencar",
    cpf: "234.567.890-11",
    profession: "ENFERMEIRO",
    phone: "(73) 98765-4322",
    email: "luciana.enf@curahome.com.br",
    status: "ACTIVE",
    credentials: [
      {
        councilType: "COREN",
        registrationNumber: "432109-ENF",
        state: "BA",
        validFrom: new Date("2021-03-10"),
        status: "ACTIVE",
      },
    ],
    specialties: ["Estomaterapia", "Terapia Intensiva"],
    unitIds: ["unit_ilheus"],
    serviceAreaIds: ["area_savona"],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
  {
    id: "prof_mariana",
    organizationId: "org_curahome",
    profileId: "user_mariana",
    fullName: "Téc. Mariana Costa Santos",
    cpf: "345.678.901-22",
    profession: "TECNICO_ENFERMAGEM",
    phone: "(73) 98765-4323",
    email: "mariana.tec@curahome.com.br",
    status: "ACTIVE",
    credentials: [
      {
        councilType: "COREN",
        registrationNumber: "543210-TE",
        state: "BA",
        validFrom: new Date("2022-05-15"),
        status: "ACTIVE",
      },
    ],
    specialties: ["Cuidados Paliativos Beira-Leito"],
    unitIds: ["unit_ilheus"],
    serviceAreaIds: ["area_savona"],
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
  },
];

const INITIAL_PATIENTS: Patient[] = [
  {
    id: "pat_antonio",
    organizationId: "org_curahome",
    unitId: "unit_ilheus",
    fullName: "Antônio Carlos de Albuquerque",
    motherName: "Maria de Lourdes Albuquerque",
    birthDate: new Date("1942-03-15"),
    cpf: "111.222.333-44",
    gender: "MASCULINO",
    addressStreet: "Rua das Palmeiras",
    addressNumber: "340",
    addressComplement: "Apto 42",
    addressNeighborhood: "Centro",
    addressCity: "Ilhéus",
    addressState: "BA",
    addressZip: "45653-000",
    allergies: ["Dipirona", "Penicilina"],
    status: "ATIVO",
    nationality: "Brasileira",
    raceColor: "BRANCA",
    maritalStatus: "CASADO",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    addresses: [
      {
        id: "addr_1",
        addressType: "RESIDENTIAL",
        street: "Rua das Palmeiras",
        number: "340",
        neighborhood: "Centro",
        city: "Ilhéus",
        state: "BA",
        postalCode: "45653-000",
        isPrimary: true,
        validFrom: new Date("2026-01-01"),
      },
      {
        id: "addr_2",
        addressType: "CARE_LOCATION",
        street: "Avenida Litoral Sul",
        number: "500",
        neighborhood: "Olivença",
        city: "Ilhéus",
        state: "BA",
        postalCode: "45658-000",
        isPrimary: false,
        validFrom: new Date("2026-01-10"),
      },
    ],
  },
  {
    id: "pat_maria",
    organizationId: "org_curahome",
    unitId: "unit_ilheus",
    fullName: "Maria Francisca dos Santos",
    motherName: "Ana Clara dos Santos",
    birthDate: new Date("1950-08-22"),
    cpf: "222.333.444-55",
    gender: "FEMININO",
    addressStreet: "Rua das Acácias",
    addressNumber: "85",
    addressNeighborhood: "Malhado",
    addressCity: "Ilhéus",
    addressState: "BA",
    addressZip: "45651-100",
    allergies: ["Sulfa"],
    status: "ATIVO",
    nationality: "Brasileira",
    raceColor: "PARDA",
    maritalStatus: "VIUVO",
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-15"),
    addresses: [
      {
        id: "addr_3",
        addressType: "RESIDENTIAL",
        street: "Rua das Acácias",
        number: "85",
        neighborhood: "Malhado",
        city: "Ilhéus",
        state: "BA",
        postalCode: "45651-100",
        isPrimary: true,
        validFrom: new Date("2026-01-15"),
      },
    ],
  },
  {
    id: "pat_joao",
    organizationId: "org_curahome",
    unitId: "unit_itabuna",
    fullName: "João Batista Ribeiro",
    motherName: "Francisca Ribeiro",
    birthDate: new Date("1958-11-04"),
    cpf: "333.444.555-66",
    gender: "MASCULINO",
    addressStreet: "Avenida Juracy Magalhães",
    addressNumber: "1020",
    addressNeighborhood: "Centro",
    addressCity: "Itabuna",
    addressState: "BA",
    addressZip: "45600-000",
    allergies: [],
    status: "ATIVO",
    nationality: "Brasileira",
    raceColor: "BRANCA",
    maritalStatus: "CASADO",
    createdAt: new Date("2026-02-01"),
    updatedAt: new Date("2026-02-01"),
    addresses: [
      {
        id: "addr_4",
        addressType: "RESIDENTIAL",
        street: "Avenida Juracy Magalhães",
        number: "1020",
        neighborhood: "Centro",
        city: "Itabuna",
        state: "BA",
        postalCode: "45600-000",
        isPrimary: true,
        validFrom: new Date("2026-02-01"),
      },
    ],
  },
];

const INITIAL_EPISODES: CareEpisode[] = [
  {
    id: "ep_antonio",
    organizationId: "org_curahome",
    patientId: "pat_antonio",
    unitId: "unit_ilheus",
    careLocationId: "addr_2",
    careType: "HOME_CARE_24H",
    admissionDate: new Date("2026-02-10T08:00:00Z"),
    doctorInChargeId: "prof_roberta",
    nurseInChargeId: "prof_luciana",
    status: "ATIVO",
  },
  {
    id: "ep_maria",
    organizationId: "org_curahome",
    patientId: "pat_maria",
    unitId: "unit_ilheus",
    careLocationId: "addr_3",
    careType: "HOME_CARE_12H",
    admissionDate: new Date("2026-02-15T08:00:00Z"),
    doctorInChargeId: "prof_roberta",
    nurseInChargeId: "prof_luciana",
    status: "ATIVO",
  },
  {
    id: "ep_joao",
    organizationId: "org_curahome",
    patientId: "pat_joao",
    unitId: "unit_itabuna",
    careLocationId: "addr_4",
    careType: "VISITAS_PONTUAIS",
    admissionDate: new Date("2026-02-20T08:00:00Z"),
    doctorInChargeId: "prof_roberta",
    nurseInChargeId: "prof_luciana",
    status: "ATIVO",
  },
];

const INITIAL_ASSIGNMENTS: PatientProfessionalAssignment[] = [
  {
    id: "assign_1",
    episodeId: "ep_antonio",
    patientId: "pat_antonio",
    professionalId: "prof_roberta",
    role: "Médica Assistente Responsável",
    startDate: new Date("2026-02-10T08:00:00Z"),
    isActive: true,
  },
  {
    id: "assign_2",
    episodeId: "ep_antonio",
    patientId: "pat_antonio",
    professionalId: "prof_luciana",
    role: "Enfermeira Supervisora",
    startDate: new Date("2026-02-10T08:00:00Z"),
    isActive: true,
  },
  {
    id: "assign_3",
    episodeId: "ep_antonio",
    patientId: "pat_antonio",
    professionalId: "prof_mariana",
    role: "Técnica de Enfermagem Assistencial",
    startDate: new Date("2026-02-10T08:00:00Z"),
    isActive: true,
  },
  {
    id: "assign_4",
    episodeId: "ep_maria",
    patientId: "pat_maria",
    professionalId: "prof_roberta",
    role: "Médica Assistente Responsável",
    startDate: new Date("2026-02-15T08:00:00Z"),
    isActive: true,
  },
  {
    id: "assign_5",
    episodeId: "ep_joao",
    patientId: "pat_joao",
    professionalId: "prof_roberta",
    role: "Médica Assistente Responsável",
    startDate: new Date("2026-02-20T08:00:00Z"),
    isActive: true,
  },
];

const INITIAL_TRIAGES: Triage[] = [
  {
    id: "tri_antonio",
    episodeId: "ep_antonio",
    patientId: "pat_antonio",
    evaluatorId: "prof_roberta",
    evaluationDate: new Date("2026-02-09T14:30:00Z"),
    location: "HOSPITAL",
    modality: "PRESENCIAL",
    mainDiagnosis: "DPOC Grave Reagudizada (GOLD IV)",
    cid10: "J44.1",
    secondaryDiagnoses: ["Hipertensão Arterial Sistêmica", "Sequela de AVC Isquêmico"],
    requestReason: "Desospitalização segura para cuidados intensivos beira-leito",
    generalState: "REGULAR",
    consciousnessLevel: "ALERTA",
    systolicBp: 130,
    diastolicBp: 80,
    heartRate: 78,
    respiratoryRate: 20,
    oxygenSaturation: 93,
    temperature: 36.4,
    bloodGlucose: 110,
    mobility: "ACAMADO",
    feeding: "ENTERAL",
    breathing: "OXIGENOTERAPIA",
    eliminations: "FRALDAS",
    skinCondition: "LESAO_POR_PRESSAO",
    devices: ["TRAQUEOSTOMIA", "SNE"],
    risks: ["BRONCOASPIRACAO", "LESAO_POR_PRESSAO", "QUEDA", "INFECCAO"],
    careNeeds: ["MEDICO", "ENFERMEIRO", "TECNICO_ENFERMAGEM", "FISIOTERAPEUTA", "FONOAUDIOLOGO"],
    eligibility: "ELEGIVEL",
    complexityLevel: "ALTA",
    conclusion: "Paciente elegível para Home Care 24h com suporte ventilatório e reabilitação motora/respiratória.",
  },
];

const INITIAL_CARE_PLANS: CarePlan[] = [
  {
    id: "cp_antonio",
    episodeId: "ep_antonio",
    patientId: "pat_antonio",
    triageId: "tri_antonio",
    version: 1,
    startDate: new Date("2026-02-10T00:00:00Z"),
    status: "ATIVO",
    createdById: "prof_roberta",
    items: [
      {
        id: "cpi_1",
        carePlanId: "cp_antonio",
        professionType: "TECNICO_ENFERMAGEM",
        frequency: "24h contínuo (Plantões 12x36)",
        procedureDescription: "Monitorização contínua, aspiração de traqueostomia, administração de dieta e medicação.",
        goals: "Manutenção da permeabilidade aérea e controle pressórico.",
      },
      {
        id: "cpi_2",
        carePlanId: "cp_antonio",
        professionType: "FISIOTERAPEUTA",
        frequency: "3x por semana",
        procedureDescription: "Cinesioterapia motora e fisioterapia respiratória para desmame ventilatório gradual.",
        goals: "Evitar atelectasias e rigidez articular.",
      },
    ],
  },
];

const INITIAL_PADS: Pad[] = [
  {
    id: "pad_antonio",
    organizationId: "org_curahome",
    unitId: "unit_ilheus",
    episodeId: "ep_antonio",
    patientId: "pat_antonio",
    version: 1,
    careRegime: "HOME_CARE_12H_DIURNO",
    startDate: new Date("2026-08-20T00:00:00Z"),
    reviewIntervalDays: 30,
    status: "ATIVO",
    createdById: "prof_roberta",
    clinicalGoals: "Manutenção da ventilação espontânea sob macronebulização, prevenção de broncoaspiração, reabilitação motora e cicatrização de lesão sacral grau I.",
    visits: [
      {
        id: "vis_1",
        profession: "FISIOTERAPEUTA",
        frequencyPerWeek: 3,
        durationMinutes: 60,
        objective: "Cinesioterapia motora global e higiene brônquica.",
        professionalInChargeId: "prof_carlos",
      },
      {
        id: "vis_2",
        profession: "FONOAUDIOLOGO",
        frequencyPerWeek: 2,
        durationMinutes: 45,
        objective: "Avaliação de deglutição e treino vocal pós-traqueostomia.",
        professionalInChargeId: null,
      },
      {
        id: "vis_3",
        profession: "NUTRICIONISTA",
        frequencyPerWeek: 1,
        durationMinutes: 45,
        objective: "Ajuste de aporte calórico-proteico em dieta enteral (SNE).",
        professionalInChargeId: null,
      },
    ],
    equipment: [
      {
        id: "eq_1",
        itemCategory: "RESPIRATORIO",
        itemName: "Concentrador de Oxigênio 5L/min",
        quantity: 1,
        specifications: "Com copo umidificador e extensor",
        status: "EM_USO",
      },
      {
        id: "eq_2",
        itemCategory: "RESPIRATORIO",
        itemName: "Aspirador de Secreções Portátil",
        quantity: 1,
        specifications: "Com frasco coletor autoclavável",
        status: "EM_USO",
      },
      {
        id: "eq_3",
        itemCategory: "MOBILIARIO",
        itemName: "Cama Hospitalar Fawler com Manivelas",
        quantity: 1,
        specifications: "Com grades de proteção laterais",
        status: "EM_USO",
      },
      {
        id: "eq_4",
        itemCategory: "MOBILIARIO",
        itemName: "Colchão Pneumático Anti-Escaras",
        quantity: 1,
        specifications: "Com compressor de pressão alternada 110V",
        status: "EM_USO",
      },
    ],
    createdAt: new Date("2026-08-20T10:00:00Z"),
    updatedAt: new Date("2026-08-20T10:00:00Z"),
  },
];

const INITIAL_SHIFTS: Shift[] = [
  {
    id: "shift_today_diurno",
    startTime: new Date("2026-08-27T07:00:00Z"),
    endTime: new Date("2026-08-27T19:00:00Z"),
    shiftType: "DIURNO_12H",
    doctorInChargeId: "prof_roberta",
    nurseInChargeId: "prof_luciana",
    status: "EM_ANDAMENTO",
    notes: "Plantão diurno de assistência domiciliar",
  },
];

const INITIAL_EVOLUTIONS: ClinicalEvolution[] = [
  {
    id: "evo_1",
    episodeId: "ep_antonio",
    patientId: "pat_antonio",
    professionalId: "prof_mariana",
    shiftId: "shift_today_diurno",
    evolutionType: "ENFERMAGEM",
    content: "Paciente consciente, traqueostomizado sob macronebulização contínua 2L/min. Realizada aspiração de secreção traqueal fluida em moderada quantidade. Dieta administrada por SNE sem queixas de náuseas. Sinais vitais estáveis.",
    status: "FINALIZADO",
    finalizedAt: new Date("2026-08-27T08:30:00Z"),
    createdAt: new Date("2026-08-27T08:00:00Z"),
  },
];

const INITIAL_VITALS: VitalSigns[] = [
  {
    id: "vit_1",
    episodeId: "ep_antonio",
    patientId: "pat_antonio",
    professionalId: "prof_mariana",
    measuredAt: new Date("2026-08-27T08:00:00Z"),
    systolicBp: 125,
    diastolicBp: 80,
    heartRate: 74,
    respiratoryRate: 18,
    oxygenSaturation: 97,
    temperature: 36.4,
    bloodGlucose: 115,
    painScore: 0,
  },
];

const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: "presc_1",
    episodeId: "ep_antonio",
    patientId: "pat_antonio",
    doctorId: "prof_roberta",
    startDate: new Date("2026-08-20T00:00:00Z"),
    status: "ATIVA",
    items: [
      {
        id: "item_1",
        prescriptionId: "presc_1",
        medicationName: "Brometo de Ipratrópio + Fenoterol",
        dosage: "20 gotas + 3ml SF 0.9%",
        unit: "gotas",
        route: "INALATORIA",
        frequency: "8/8h",
        scheduleTimes: ["06:00", "14:00", "22:00"],
        instructions: "Realizar macronebulização conforme aprazamento.",
      },
      {
        id: "item_2",
        prescriptionId: "presc_1",
        medicationName: "Losartana Potássica",
        dosage: "50",
        unit: "mg",
        route: "ORAL",
        frequency: "1x ao dia",
        scheduleTimes: ["08:00"],
        instructions: "Diluir e infundir via SNE em jejum.",
      },
    ],
  },
];

const INITIAL_PROCEDURES: Procedure[] = [
  {
    id: "proc_1",
    episodeId: "ep_antonio",
    patientId: "pat_antonio",
    professionalId: "prof_mariana",
    procedureName: "Aspiração de Traqueostomia em Sistema Aberto",
    executedAt: new Date("2026-08-27T08:15:00Z"),
    quantity: 1,
    notes: "Procedimento realizado com técnica estéril. Saída de secreção mucopurulenta.",
    materialsUsed: [
      { materialName: "Sonda de Aspiração Traqueal nº 12", quantity: 1, unit: "unidade" },
      { materialName: "Luva de Procedimento Cirúrgica", quantity: 1, unit: "par" },
      { materialName: "Soro Fisiológico 0.9% 10ml", quantity: 2, unit: "ampola" },
    ],
  },
];

const INITIAL_EXAMS: Exam[] = [
  {
    id: "exam_1",
    episodeId: "ep_antonio",
    patientId: "pat_antonio",
    requesterId: "prof_roberta",
    examName: "Hemograma Completo + Gasometria Arterial",
    requestedAt: new Date("2026-08-26T10:00:00Z"),
    status: "COLETADO",
  },
];

const INITIAL_EVENTS: ClinicalEvent[] = [
  {
    id: "ev_1",
    episodeId: "ep_antonio",
    patientId: "pat_antonio",
    eventType: "EVOLUCAO",
    eventTitle: "Evolução de Enfermagem Beira-Leito",
    eventTimestamp: new Date("2026-08-27T08:30:00Z"),
    authorName: "Téc. Mariana Costa Santos",
    authorRole: "TECNICO_ENFERMAGEM",
    summary: "Aspiração de secreção traqueal sem intercorrências, sinais vitais dentro dos parâmetros de estabilidade.",
    severity: "NORMAL",
    referenceId: "evo_1",
  },
];

const INITIAL_VISITS: Visit[] = [
  {
    id: "vis_antonio_1",
    organizationId: "org_curahome",
    unitId: "unit_ilheus",
    patientId: "pat_antonio",
    careEpisodeId: "ep_antonio",
    professionalId: "prof_mariana",
    shiftId: "shift_1",
    padVisitId: "pad_vis_1",
    scheduledStart: new Date(new Date().setHours(8, 0, 0, 0)),
    scheduledEnd: new Date(new Date().setHours(12, 0, 0, 0)),
    status: "SCHEDULED",
    procedureSummary: "Higiene beira-leito, aspiração de secreção e administração de medicações prescritas",
    notes: "Paciente estável. Monitorar SpO2 e pressão arterial.",
    createdAt: new Date("2026-08-27T08:00:00Z"),
    updatedAt: new Date("2026-08-27T08:00:00Z"),
  },
  {
    id: "vis_maria_1",
    organizationId: "org_curahome",
    unitId: "unit_ilheus",
    patientId: "pat_maria",
    careEpisodeId: "ep_maria",
    professionalId: "prof_roberta",
    shiftId: "shift_1",
    padVisitId: "pad_vis_2",
    scheduledStart: new Date(new Date().setHours(14, 0, 0, 0)),
    scheduledEnd: new Date(new Date().setHours(15, 30, 0, 0)),
    status: "SCHEDULED",
    procedureSummary: "Visita médica semanal para reavaliação de plano terapêutico e ajuste de broncodilatadores",
    notes: "Reavaliar escore NEWS2 e queixa de dispneia.",
    createdAt: new Date("2026-08-27T08:00:00Z"),
    updatedAt: new Date("2026-08-27T08:00:00Z"),
  },
];

const INITIAL_CHECKINS: VisitCheckin[] = [];

const INITIAL_SUPPLIES: SupplyItem[] = [
  {
    id: "sup_cateter_o2",
    organizationId: "org_curahome",
    unitId: "unit_ilheus",
    code: "O2-CAT-001",
    name: "Catéter Nasal de Oxigênio Adulto (Extensão 2m)",
    category: "OXIGENOTERAPIA",
    unitOfMeasure: "Unidade",
    currentStock: 45,
    minimumStock: 10,
    reorderPoint: 20,
    costPrice: 4.5,
    active: true,
  },
  {
    id: "sup_sonda_asp",
    organizationId: "org_curahome",
    unitId: "unit_ilheus",
    code: "ASP-SON-012",
    name: "Sonda de Aspiração Traqueal com Válvula nº 12",
    category: "MATERIAL_PENSO",
    unitOfMeasure: "Unidade",
    currentStock: 60,
    minimumStock: 15,
    reorderPoint: 25,
    costPrice: 2.8,
    active: true,
  },
  {
    id: "sup_hidrocoloide",
    organizationId: "org_curahome",
    unitId: "unit_ilheus",
    code: "CUR-HID-10X10",
    name: "Placa de Hidrocoloide Extra Fino 10x10cm",
    category: "MATERIAL_PENSO",
    unitOfMeasure: "Unidade",
    currentStock: 30,
    minimumStock: 8,
    reorderPoint: 15,
    costPrice: 18.5,
    active: true,
  },
  {
    id: "sup_espuma_prata",
    organizationId: "org_curahome",
    unitId: "unit_ilheus",
    code: "CUR-ESP-SIL-AG",
    name: "Curativo de Espuma Hidrocelular com Silicone e Prata 10x10cm",
    category: "MATERIAL_PENSO",
    unitOfMeasure: "Unidade",
    currentStock: 25,
    minimumStock: 5,
    reorderPoint: 10,
    costPrice: 42.0,
    active: true,
  },
  {
    id: "sup_dieta_enteral",
    organizationId: "org_curahome",
    unitId: "unit_ilheus",
    code: "NUT-DIE-1000ML",
    name: "Dieta Enteral Polimérica Hipercalórica e Normoproteica 1000ml",
    category: "DIETA_ENTERAL",
    unitOfMeasure: "Frasco",
    currentStock: 40,
    minimumStock: 12,
    reorderPoint: 20,
    costPrice: 38.0,
    active: true,
  },
  {
    id: "sup_luva_nitrilica",
    organizationId: "org_curahome",
    unitId: "unit_ilheus",
    code: "EPI-LUV-NIT-M",
    name: "Luvas de Procedimento Não Cirúrgico Nitrílica Tam M (Cx c/ 100)",
    category: "EPI_DESCARTAVEL",
    unitOfMeasure: "Caixa",
    currentStock: 18,
    minimumStock: 5,
    reorderPoint: 8,
    costPrice: 32.0,
    active: true,
  },
  {
    id: "sup_gaze_esteril",
    organizationId: "org_curahome",
    unitId: "unit_ilheus",
    code: "MAT-GAZ-75X75",
    name: "Compressa de Gaze Estéril 7.5x7.5cm 13 fios (Pct c/ 10)",
    category: "MATERIAL_PENSO",
    unitOfMeasure: "Pacote",
    currentStock: 120,
    minimumStock: 25,
    reorderPoint: 40,
    costPrice: 1.2,
    active: true,
  },
];

const INITIAL_LEDGER: InventoryLedgerEntry[] = [
  {
    id: "ledg_1",
    organizationId: "org_curahome",
    unitId: "unit_ilheus",
    supplyItemId: "sup_espuma_prata",
    movementType: "SAIDA_PACIENTE",
    quantity: 1,
    balanceAfter: 25,
    batchNumber: "LOTE-AG-2026-04",
    expirationDate: new Date("2028-06-30"),
    patientId: "pat_antonio",
    professionalId: "prof_mariana",
    visitId: "vis_antonio_1",
    reason: "Aplicação em LPP região sacral beira-leito",
    createdAt: new Date("2026-08-27T08:30:00Z"),
  },
];

const INITIAL_OXYGEN_THERAPIES: PatientOxygenTherapy[] = [
  {
    id: "o2_antonio",
    patientId: "pat_antonio",
    episodeId: "ep_antonio",
    sourceType: "CILINDRO_O2",
    deliveryInterface: "TRAQUEOSTOMIA_MICRONEBULIZACAO",
    flowRateLpm: 3.0,
    usageHoursPerDay: 24,
    cylinderType: "CILINDRO_J_50L",
    cylinderFactorK: 5.0,
    currentPressureBar: 80,
    nominalPressureBar: 150,
    lastPressureCheckAt: new Date(),
    backupCylinderAvailable: true,
    active: true,
    notes: "Paciente traqueostomizado. Manter umidificação contínua e checagem de pressão a cada turno.",
    updatedAt: new Date(),
  },
  {
    id: "o2_maria",
    patientId: "pat_maria",
    episodeId: "ep_maria",
    sourceType: "CONCENTRADOR_ESTACIONARIO",
    deliveryInterface: "CATETER_NASAL",
    flowRateLpm: 2.0,
    usageHoursPerDay: 16,
    concentratorFio2Percent: 93,
    concentratorHourMeter: 1420,
    cylinderType: "CILINDRO_E_10L",
    cylinderFactorK: 1.0,
    currentPressureBar: 140,
    nominalPressureBar: 150,
    backupCylinderAvailable: true,
    active: true,
    notes: "Uso noturno e durante esforço. Concentrador estacionário principal com cilindro E de backup.",
    updatedAt: new Date(),
  },
];

const INITIAL_WOUNDS: WoundEvaluation[] = [
  {
    id: "wnd_antonio_1",
    patientId: "pat_antonio",
    episodeId: "ep_antonio",
    professionalId: "prof_mariana",
    woundIdentifier: "Lesão por Pressão 1 — Região Sacral",
    location: "SACRO",
    stage: "ESTAGIO_3",
    lengthCm: 4.5,
    widthCm: 3.0,
    depthCm: 0.8,
    areaCm2: 13.5,
    granulationPercent: 70,
    sloughPercent: 20,
    necrosisPercent: 0,
    epithelializationPercent: 10,
    exudateAmount: "MODERADO",
    exudateType: "SEROSO",
    odorPresent: false,
    painScoreVisualScale: 2,
    edgesCondition: "Íntegras e hidratadas",
    prescribedCovering: "ESPUMA_DE_POLIURETANO_SILICONE",
    secondaryCovering: "Película protetora sem ardor",
    cleaningSolution: "Soro Fisiológico 0,9% em jatos mornos",
    dressingChangeFrequencyHours: 48,
    healingEvolutionStatus: "MELHORA",
    clinicalNotes: "Lesão com bom leito de granulação (70%). Redução do esfacelo após debridamento autolítico com hidrogel prévio.",
    evaluatedAt: new Date("2026-08-27T09:00:00Z"),
    createdAt: new Date("2026-08-27T09:00:00Z"),
  },
];

const INITIAL_FAMILY_GRANTS: FamilyAccessGrant[] = [
  {
    id: "grant_clara",
    patientId: "pat_antonio",
    familyUserId: "user_fam_clara",
    familyUserName: "Clara de Albuquerque",
    familyEmail: "clara.albuquerque@gmail.com",
    familyPhone: "(73) 98888-7777",
    relationship: "FILHO_FILHA",
    accessLevel: "VISAO_COMPLETA_LEIGA",
    consentSignedAt: new Date("2026-08-15"),
    active: true,
    notes: "Filha e cuidadora principal de Seu Antônio. Autorizada a receber relatórios e orientações.",
    createdAt: new Date("2026-08-15"),
  },
  {
    id: "grant_roberto",
    patientId: "pat_maria",
    familyUserId: "user_fam_roberto",
    familyUserName: "Roberto Carlos dos Santos",
    familyEmail: "roberto.santos@gmail.com",
    familyPhone: "(73) 99999-6666",
    relationship: "FILHO_FILHA",
    accessLevel: "VISAO_COMPLETA_LEIGA",
    consentSignedAt: new Date("2026-08-16"),
    active: true,
    notes: "Filho e responsável financeiro de Dona Maria.",
    createdAt: new Date("2026-08-16"),
  },
];

const INITIAL_FAMILY_FEEDBACKS: FamilyFeedback[] = [
  {
    id: "feed_1",
    patientId: "pat_antonio",
    familyUserId: "user_fam_clara",
    familyUserName: "Clara de Albuquerque",
    rating: 5,
    category: "ATENDIMENTO_EQUIPE",
    comment: "Excelente atendimento da equipe de enfermagem. Sempre atenciosos e pontuais com meu pai.",
    createdAt: new Date("2026-08-26T18:00:00Z"),
  },
];

// -------------------------------------------------------------
// STORE SINGLETON
// -------------------------------------------------------------

class HomeCareStore {
  private organizations: Organization[] = INITIAL_ORGANIZATIONS;
  private units: Unit[] = INITIAL_UNITS;
  private serviceRegions: ServiceRegion[] = INITIAL_SERVICE_REGIONS;
  private serviceAreas: ServiceArea[] = INITIAL_SERVICE_AREAS;
  private patients: Patient[] = INITIAL_PATIENTS;
  private professionals: Professional[] = INITIAL_PROFESSIONALS;
  private episodes: CareEpisode[] = INITIAL_EPISODES;
  private assignments: PatientProfessionalAssignment[] = INITIAL_ASSIGNMENTS;
  private triages: Triage[] = INITIAL_TRIAGES;
  private carePlans: CarePlan[] = INITIAL_CARE_PLANS;
  private pads: Pad[] = INITIAL_PADS;
  private shifts: Shift[] = INITIAL_SHIFTS;
  private visits: Visit[] = INITIAL_VISITS;
  private visitCheckins: VisitCheckin[] = INITIAL_CHECKINS;
  private supplies: SupplyItem[] = INITIAL_SUPPLIES;
  private inventoryLedger: InventoryLedgerEntry[] = INITIAL_LEDGER;
  private oxygenTherapies: PatientOxygenTherapy[] = INITIAL_OXYGEN_THERAPIES;
  private woundEvaluations: WoundEvaluation[] = INITIAL_WOUNDS;
  private familyGrants: FamilyAccessGrant[] = INITIAL_FAMILY_GRANTS;
  private familyFeedbacks: FamilyFeedback[] = INITIAL_FAMILY_FEEDBACKS;
  private evolutions: ClinicalEvolution[] = INITIAL_EVOLUTIONS;
  private vitals: VitalSigns[] = INITIAL_VITALS;
  private clinicalScores: ClinicalScoreResult[] = [];
  private prescriptions: Prescription[] = INITIAL_PRESCRIPTIONS;
  private procedures: Procedure[] = INITIAL_PROCEDURES;
  private exams: Exam[] = INITIAL_EXAMS;
  private events: ClinicalEvent[] = INITIAL_EVENTS;
  private auditLogs: AuditLog[] = [];

  // Usuário padrão autenticado para a sessão
  public currentUser: CurrentUser = {
    id: "user_roberta",
    organizationId: "org_curahome",
    name: "Dra. Roberta Mendes",
    email: "roberta.mendes@curahome.com.br",
    role: "MEDICO",
    status: "ACTIVE",
    unitIds: ["unit_ilheus", "unit_itabuna"],
    professionalId: "prof_roberta",
  };

  constructor() {
    this.audit("AUTH_LOGIN", "profiles", this.currentUser.id, null, {
      message: "Sessão iniciada na plataforma HomeCare",
    });
  }

  public initClient() {
    this.loadFromStorage();
  }

  private saveToStorage() {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const state = {
          patients: this.patients,
          episodes: this.episodes,
          assignments: this.assignments,
          triages: this.triages,
          carePlans: this.carePlans,
          pads: this.pads,
          shifts: this.shifts,
          visits: this.visits,
          visitCheckins: this.visitCheckins,
          supplies: this.supplies,
          inventoryLedger: this.inventoryLedger,
          oxygenTherapies: this.oxygenTherapies,
          woundEvaluations: this.woundEvaluations,
          familyGrants: this.familyGrants,
          familyFeedbacks: this.familyFeedbacks,
          evolutions: this.evolutions,
          vitals: this.vitals,
          clinicalScores: this.clinicalScores,
          prescriptions: this.prescriptions,
          procedures: this.procedures,
          exams: this.exams,
          events: this.events,
          auditLogs: this.auditLogs,
          currentUser: this.currentUser,
        };
        localStorage.setItem("homecare_store_v1", JSON.stringify(state));
      } catch (e) {
        console.warn("Could not save store to localStorage", e);
      }
    }
  }

  private loadFromStorage() {
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = localStorage.getItem("homecare_store_v1");
        if (raw) {
          const state = JSON.parse(raw);
          if (state.patients?.length) this.patients = state.patients;
          if (state.episodes?.length) this.episodes = state.episodes;
          if (state.assignments?.length) this.assignments = state.assignments;
          if (state.triages?.length) this.triages = state.triages;
          if (state.carePlans?.length) this.carePlans = state.carePlans;
          if (state.pads?.length) this.pads = state.pads;
          if (state.shifts?.length) this.shifts = state.shifts;
          if (state.visits?.length) this.visits = state.visits;
          if (state.visitCheckins?.length) this.visitCheckins = state.visitCheckins;
          if (state.supplies?.length) this.supplies = state.supplies;
          if (state.inventoryLedger?.length) this.inventoryLedger = state.inventoryLedger;
          if (state.oxygenTherapies?.length) this.oxygenTherapies = state.oxygenTherapies;
          if (state.woundEvaluations?.length) this.woundEvaluations = state.woundEvaluations;
          if (state.familyGrants?.length) this.familyGrants = state.familyGrants;
          if (state.familyFeedbacks?.length) this.familyFeedbacks = state.familyFeedbacks;
          if (state.evolutions?.length) this.evolutions = state.evolutions;
          if (state.vitals?.length) this.vitals = state.vitals;
          if (state.clinicalScores?.length) this.clinicalScores = state.clinicalScores;
          if (state.prescriptions?.length) this.prescriptions = state.prescriptions;
          if (state.procedures?.length) this.procedures = state.procedures;
          if (state.exams?.length) this.exams = state.exams;
          if (state.events?.length) this.events = state.events;
          if (state.auditLogs?.length) this.auditLogs = state.auditLogs;
          if (state.currentUser) this.currentUser = state.currentUser;
        }
      } catch (e) {
        console.warn("Could not load store from localStorage", e);
      }
    }
  }

  public setCurrentUser(user: CurrentUser) {
    this.currentUser = user;
    this.audit("AUTH_LOGIN", "profiles", user.id, null, { role: user.role, org: user.organizationId });
    this.saveToStorage();
  }

  // --- AUDITORIA ---
  private audit(
    action: AuditLog["action"],
    entityTable: string,
    recordId?: string | null,
    patientId?: string | null,
    newState?: any,
    previousState?: any
  ) {
    const entry = createAuditEntry({
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      userRole: this.currentUser.role,
      action,
      entityTable,
      recordId,
      patientId,
      newState,
      previousState,
    });
    this.auditLogs.unshift(entry);
    this.saveToStorage();
  }

  public getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  public logAudit(
    action: AuditLog["action"],
    entityTable: string,
    recordId?: string | null,
    patientId?: string | null,
    newState?: any,
    previousState?: any
  ) {
    this.audit(action, entityTable, recordId, patientId, newState, previousState);
  }

  // --- ORGANIZAÇÕES & UNIDADES ---
  public getOrganizations(): Organization[] {
    return this.organizations;
  }

  public getUnits(orgId?: string): Unit[] {
    const targetOrg = orgId || this.currentUser.organizationId;
    return this.units.filter((u) => u.organizationId === targetOrg);
  }

  public getServiceRegions(unitId?: string): ServiceRegion[] {
    if (unitId) return this.serviceRegions.filter((r) => r.unitId === unitId);
    return this.serviceRegions;
  }

  public getServiceAreas(regionId?: string): ServiceArea[] {
    if (regionId) return this.serviceAreas.filter((a) => a.serviceRegionId === regionId);
    return this.serviceAreas;
  }

  // --- PACIENTES ---
  public getPatients(): Patient[] {
    return this.patients.filter((p) => p.organizationId === this.currentUser.organizationId);
  }

  public getMyPatients(): Patient[] {
    const profId = this.currentUser.professionalId;
    if (!profId) return this.getPatients();
    const assignedPatientIds = this.assignments
      .filter((a) => a.professionalId === profId && a.isActive)
      .map((a) => a.patientId);
    return this.patients.filter((p) => assignedPatientIds.includes(p.id!));
  }

  public getPatientById(id: string): Patient | undefined {
    return this.patients.find(
      (p) => p.id === id && p.organizationId === this.currentUser.organizationId
    );
  }

  public createPatient(data: Partial<Patient> & { fullName: string; motherName: string; birthDate: Date; gender: Patient["gender"] }): { success: boolean; patient?: Patient; error?: string } {
    const dupCheck = checkPatientDuplicate(this.patients, {
      organizationId: data.organizationId || this.currentUser.organizationId,
      cpf: data.cpf,
      fullName: data.fullName,
      birthDate: new Date(data.birthDate),
      motherName: data.motherName,
    });

    if (dupCheck.isDuplicate) {
      return { success: false, error: dupCheck.reason };
    }

    const newPatient: Patient = {
      id: `pat_${Date.now()}`,
      organizationId: data.organizationId || this.currentUser.organizationId,
      unitId: data.unitId || "unit_ilheus",
      fullName: data.fullName,
      motherName: data.motherName,
      birthDate: new Date(data.birthDate),
      gender: data.gender,
      socialName: data.socialName || null,
      fatherName: data.fatherName || null,
      cpf: data.cpf || null,
      rg: data.rg || null,
      nationality: data.nationality || "Brasileira",
      raceColor: data.raceColor || "NAO_INFORMADO",
      naturalness: data.naturalness || null,
      maritalStatus: data.maritalStatus || "SOLTEIRO",
      addressStreet: data.addressStreet || "",
      addressNumber: data.addressNumber || "",
      addressComplement: data.addressComplement || null,
      addressNeighborhood: data.addressNeighborhood || "",
      addressCity: data.addressCity || "",
      addressState: data.addressState || "BA",
      addressZip: data.addressZip || "",
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      addresses: data.addresses || [],
      allergies: data.allergies || [],
      status: data.status || "ATIVO",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.patients.push(newPatient);

    // Criar episódio assistencial inicial
    const newEpisode: CareEpisode = {
      id: `ep_${Date.now()}`,
      organizationId: newPatient.organizationId,
      patientId: newPatient.id!,
      unitId: newPatient.unitId || "unit_ilheus",
      careType: "HOME_CARE_12H",
      admissionDate: new Date(),
      doctorInChargeId: this.currentUser.professionalId || "prof_roberta",
      status: "ATIVO",
    };
    this.episodes.push(newEpisode);

    this.audit("PATIENT_CREATE", "patients", newPatient.id, newPatient.id, newPatient);
    return { success: true, patient: newPatient };
  }

  // --- PROFISSIONAIS ---
  public getProfessionals(): Professional[] {
    return this.professionals.filter(
      (p) => p.organizationId === this.currentUser.organizationId
    );
  }

  public getProfessionalById(id: string): Professional | undefined {
    return this.professionals.find((p) => p.id === id);
  }

  public createProfessional(data: Omit<Professional, "id">): Professional {
    const newProf: Professional = {
      ...data,
      organizationId: data.organizationId || this.currentUser.organizationId,
      id: `prof_${Date.now()}`,
      credentials: data.credentials || [],
      specialties: data.specialties || [],
      unitIds: data.unitIds || [],
      serviceAreaIds: data.serviceAreaIds || [],
    };
    this.professionals.push(newProf);
    this.audit("USER_CREATE", "professionals", newProf.id, null, newProf);
    return newProf;
  }

  // --- EPISÓDIOS & VÍNCULOS ---
  public getEpisodeByPatientId(patientId: string): CareEpisode | undefined {
    return this.episodes.find((ep) => ep.patientId === patientId && ep.status === "ATIVO");
  }

  public getAssignments(patientId?: string): PatientProfessionalAssignment[] {
    if (patientId) {
      return this.assignments.filter((a) => a.patientId === patientId && a.isActive);
    }
    return this.assignments;
  }

  public createAssignment(data: Omit<PatientProfessionalAssignment, "id">): PatientProfessionalAssignment {
    const newAssign: PatientProfessionalAssignment = {
      ...data,
      id: `assign_${Date.now()}`,
    };
    this.assignments.push(newAssign);
    this.audit("SHIFT_ASSIGN", "patient_professional_assignments", newAssign.id, data.patientId, newAssign);
    return newAssign;
  }

  public assignProfessionalToPatient(data: Omit<PatientProfessionalAssignment, "id">): {
    success: boolean;
    assignment?: PatientProfessionalAssignment;
    error?: string;
  } {
    const assignment = this.createAssignment(data);
    return { success: true, assignment };
  }

  // --- TRIAGEM & PLANOS ---
  public getTriages(patientId?: string): Triage[] {
    if (patientId) {
      return this.triages.filter((t) => t.patientId === patientId);
    }
    return this.triages;
  }

  public createTriage(data: Omit<Triage, "id">): Triage {
    const newTriage: Triage = {
      ...data,
      id: `tri_${Date.now()}`,
    };
    this.triages.push(newTriage);

    this.events.unshift({
      id: `ev_${Date.now()}`,
      episodeId: data.episodeId || "",
      patientId: data.patientId,
      eventType: "TRIAGEM",
      eventTitle: `Avaliação de Triagem Clínica (${data.complexityLevel} Complexidade)`,
      eventTimestamp: new Date(),
      authorName: this.currentUser.name,
      authorRole: this.currentUser.role,
      summary: `Elegibilidade: ${data.eligibility} • ${data.conclusion}`,
      severity: data.eligibility === "ELEGIVEL" ? "NORMAL" : "ATENCAO",
      referenceId: newTriage.id,
    });

    this.audit("TRIAGE_EVALUATE", "triages", newTriage.id, data.patientId, newTriage);
    return newTriage;
  }

  public getCarePlans(patientId: string): CarePlan[] {
    return this.carePlans.filter((cp) => cp.patientId === patientId);
  }

  public createCarePlan(data: Omit<CarePlan, "id">): CarePlan {
    const newPlan: CarePlan = {
      ...data,
      id: `cp_${Date.now()}`,
    };
    this.carePlans.push(newPlan);
    this.audit("CARE_PLAN_CREATE", "care_plans", newPlan.id, data.patientId, newPlan);
    return newPlan;
  }

  // --- PLANO DE ATENÇÃO DOMICILIAR (PAD) ---
  public getPads(patientId?: string): Pad[] {
    if (patientId) {
      return this.pads.filter((p) => p.patientId === patientId);
    }
    return this.pads;
  }

  public getPadById(id: string): Pad | undefined {
    return this.pads.find((p) => p.id === id);
  }

  public getPadByPatientId(patientId: string): Pad | undefined {
    return this.pads.find((p) => p.patientId === patientId && p.status === "ATIVO");
  }

  public createPad(data: Omit<Pad, "id" | "createdAt" | "updatedAt">): Pad {
    const newPad: Pad = {
      ...data,
      id: `pad_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.pads.push(newPad);
    this.events.unshift({
      id: `ev_${Date.now()}`,
      episodeId: data.episodeId,
      patientId: data.patientId,
      eventType: "PROCEDIMENTO",
      eventTitle: `Plano Assistencial (PAD) Estruturado v${data.version}`,
      eventTimestamp: new Date(),
      authorName: this.currentUser.name,
      authorRole: this.currentUser.role,
      summary: `Regime: ${data.careRegime} • ${data.visits.length} visitas multidisciplinares • ${data.equipment.length} equipamentos/insumos`,
      severity: "NORMAL",
      referenceId: newPad.id,
    });
    this.audit("CARE_PLAN_CREATE", "pads", newPad.id, data.patientId, newPad);
    return newPad;
  }

  public updatePad(id: string, data: Partial<Pad>): Pad | undefined {
    const idx = this.pads.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    const updated: Pad = {
      ...this.pads[idx],
      ...data,
      updatedAt: new Date(),
    };
    this.pads[idx] = updated;
    this.audit("CARE_PLAN_MANAGE", "pads", updated.id, updated.patientId, updated);
    return updated;
  }

  // --- ESCALAS & PLANTÕES ---
  public getShifts(): Shift[] {
    return this.shifts;
  }

  public createShift(data: Omit<Shift, "id">): { success: boolean; shift?: Shift; error?: string } {
    if (!data.doctorInChargeId) {
      return { success: false, error: "Todo plantão exige obrigatoriamente um Médico Responsável." };
    }

    if (hasShiftOverlap(this.shifts, data)) {
      return { success: false, error: "Conflito de horário detectado para um dos profissionais alocados." };
    }

    const newShift: Shift = {
      ...data,
      id: `shift_${Date.now()}`,
    };
    this.shifts.push(newShift);
    this.audit("SHIFT_CREATE", "shifts", newShift.id, null, newShift);
    return { success: true, shift: newShift };
  }

  public allocateShift(data: Omit<Shift, "id">): { success: boolean; shift?: Shift; error?: string } {
    return this.createShift(data);
  }

  // --- VISITAS OPERACIONAIS & CHECK-IN / CHECK-OUT BEIRA-LEITO ---
  public getVisits(filters?: {
    patientId?: string;
    professionalId?: string;
    status?: VisitStatus;
    date?: Date;
  }): Visit[] {
    return this.visits
      .filter((v) => {
        if (filters?.patientId && v.patientId !== filters.patientId) return false;
        if (filters?.professionalId && v.professionalId !== filters.professionalId) return false;
        if (filters?.status && v.status !== filters.status) return false;
        return true;
      })
      .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
  }

  public getVisitById(id: string): Visit | undefined {
    return this.visits.find((v) => v.id === id);
  }

  public getCheckinByVisitId(visitId: string): VisitCheckin | undefined {
    return this.visitCheckins.find((c) => c.visitId === visitId);
  }

  public createVisit(data: Omit<Visit, "id" | "createdAt" | "updatedAt">): Visit {
    const newVisit: Visit = {
      ...data,
      id: `vis_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.visits.push(newVisit);
    this.audit("VISIT_CREATE", "visits", newVisit.id, newVisit.patientId, newVisit);
    this.saveToStorage();
    return newVisit;
  }

  public recordVisitCheckin(data: {
    visitId: string;
    professionalId: string;
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
    overrideReason?: string | null;
  }): { success: boolean; checkin?: VisitCheckin; error?: string } {
    const visit = this.getVisitById(data.visitId);
    if (!visit) return { success: false, error: "Visita não encontrada." };

    if (!isValidVisitTransition(visit.status, "CHECKED_IN")) {
      return { success: false, error: `Transição de status inválida de ${visit.status} para CHECKED_IN.` };
    }

    const patient = this.getPatientById(visit.patientId);
    let patientLoc: { latitude: number; longitude: number } | null = null;

    if (patient?.addresses?.length && patient.addresses[0].latitude && patient.addresses[0].longitude) {
      patientLoc = { latitude: patient.addresses[0].latitude, longitude: patient.addresses[0].longitude };
    } else if (patient?.id === "pat_antonio") {
      patientLoc = { latitude: -14.7935, longitude: -39.0465 };
    } else if (patient?.id === "pat_maria") {
      patientLoc = { latitude: -14.7950, longitude: -39.0490 };
    }

    const profLoc = data.latitude != null && data.longitude != null ? {
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
    } : null;

    const geofenceEval = evaluateGeofence(profLoc, patientLoc, 100);

    if (geofenceEval.requiresOverride && !data.overrideReason?.trim()) {
      return {
        success: false,
        error: `Check-in fora do perímetro esperado (${geofenceEval.distanceMetros != null ? Math.round(geofenceEval.distanceMetros) + 'm' : 'GPS indisponível'}). Justificativa assistencial é obrigatória.`,
      };
    }

    const newCheckin: VisitCheckin = {
      id: `chk_${Date.now()}`,
      visitId: visit.id!,
      professionalId: data.professionalId,
      patientId: visit.patientId,
      checkInAt: new Date(),
      checkInLatitude: data.latitude,
      checkInLongitude: data.longitude,
      checkInAccuracy: data.accuracy,
      distanceFromCareLocation: geofenceEval.distanceMetros,
      geofenceResult: geofenceEval.geofenceResult,
      overrideReason: geofenceEval.requiresOverride ? data.overrideReason : undefined,
      overrideApprovedBy: geofenceEval.requiresOverride ? this.currentUser.id : undefined,
      overrideApprovedAt: geofenceEval.requiresOverride ? new Date() : undefined,
      createdAt: new Date(),
    };

    this.visitCheckins.unshift(newCheckin);

    visit.status = "CHECKED_IN";
    visit.actualStart = new Date();
    visit.updatedAt = new Date();

    if (geofenceEval.requiresOverride) {
      this.audit("GEOFENCE_OVERRIDE", "visit_checkins", newCheckin.id, visit.patientId, {
        distance: geofenceEval.distanceMetros,
        reason: data.overrideReason,
        result: geofenceEval.geofenceResult,
      });
    }

    this.audit("VISIT_CHECK_IN", "visit_checkins", newCheckin.id, visit.patientId, newCheckin);
    this.saveToStorage();

    return { success: true, checkin: newCheckin };
  }

  public recordVisitCheckout(data: {
    visitId: string;
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
    notes?: string | null;
  }): { success: boolean; visit?: Visit; error?: string } {
    const visit = this.getVisitById(data.visitId);
    if (!visit) return { success: false, error: "Visita não encontrada." };

    if (!isValidVisitTransition(visit.status, "COMPLETED")) {
      return { success: false, error: `Transição inválida de ${visit.status} para COMPLETED.` };
    }

    const checkin = this.getCheckinByVisitId(data.visitId);
    if (checkin) {
      checkin.checkOutAt = new Date();
      checkin.checkOutLatitude = data.latitude;
      checkin.checkOutLongitude = data.longitude;
      checkin.checkOutAccuracy = data.accuracy;
      if (data.notes) checkin.overrideReason = `${checkin.overrideReason || ''} [Checkout]: ${data.notes}`;
    }

    visit.status = "COMPLETED";
    visit.actualEnd = new Date();
    if (data.notes) visit.notes = `${visit.notes || ''} • Conclusão: ${data.notes}`;
    visit.updatedAt = new Date();

    this.audit("VISIT_CHECK_OUT", "visits", visit.id, visit.patientId, {
      actualEnd: visit.actualEnd,
      checkinId: checkin?.id,
    });
    this.saveToStorage();

    return { success: true, visit };
  }

  // --- PEP: EVOLUÇÕES CLÍNICAS & IMUTABILIDADE ---
  public getEvolutions(patientId: string): ClinicalEvolution[] {
    return this.evolutions
      .filter((e) => e.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public saveEvolution(
    data: Omit<ClinicalEvolution, "id" | "createdAt"> & { id?: string }
  ): { success: boolean; evolution?: ClinicalEvolution; error?: string } {
    if (data.id) {
      const existing = this.evolutions.find((e) => e.id === data.id);
      if (existing && existing.status === "FINALIZADO") {
        return {
          success: false,
          error: "Registros clínicos com status FINALIZADO são estritamente imutáveis conforme normas do CFM e COREN. Crie uma evolução de retificação.",
        };
      }
    }

    const isFinalizing = data.status === "FINALIZADO";

    if (data.id) {
      const idx = this.evolutions.findIndex((e) => e.id === data.id);
      if (idx !== -1) {
        const updated: ClinicalEvolution = {
          ...this.evolutions[idx],
          ...data,
          finalizedAt: isFinalizing ? new Date() : this.evolutions[idx].finalizedAt,
        };
        this.evolutions[idx] = updated;

        if (isFinalizing) {
          this.events.unshift({
            id: `ev_${Date.now()}`,
            episodeId: data.episodeId,
            patientId: data.patientId,
            eventType: "EVOLUCAO",
            eventTitle: `Evolução Clínica de ${data.evolutionType} Finalizada`,
            eventTimestamp: new Date(),
            authorName: this.currentUser.name,
            authorRole: this.currentUser.role,
            summary: data.content.slice(0, 140) + "...",
            severity: "NORMAL",
            referenceId: updated.id,
          });

          this.audit("CLINICAL_EVOLUTION_FINALIZE", "clinical_evolutions", updated.id, data.patientId, updated);
        } else {
          this.audit("CLINICAL_EVOLUTION_DRAFT", "clinical_evolutions", updated.id, data.patientId, updated);
        }

        return { success: true, evolution: updated };
      }
    }

    const newEvo: ClinicalEvolution = {
      ...data,
      id: `evo_${Date.now()}`,
      createdAt: new Date(),
      finalizedAt: isFinalizing ? new Date() : undefined,
    };
    this.evolutions.push(newEvo);

    if (isFinalizing) {
      this.events.unshift({
        id: `ev_${Date.now()}`,
        episodeId: data.episodeId,
        patientId: data.patientId,
        eventType: "EVOLUCAO",
        eventTitle: `Evolução Clínica de ${data.evolutionType} Finalizada`,
        eventTimestamp: new Date(),
        authorName: this.currentUser.name,
        authorRole: this.currentUser.role,
        summary: data.content.slice(0, 140) + "...",
        severity: "NORMAL",
        referenceId: newEvo.id,
      });

      this.audit("CLINICAL_EVOLUTION_FINALIZE", "clinical_evolutions", newEvo.id, data.patientId, newEvo);
    } else {
      this.audit("CLINICAL_EVOLUTION_DRAFT", "clinical_evolutions", newEvo.id, data.patientId, newEvo);
    }

    return { success: true, evolution: newEvo };
  }

  // --- PEP: SINAIS VITAIS & ESCORE NEWS2 ---
  public getVitals(patientId: string): VitalSigns[] {
    return this.vitals
      .filter((v) => v.patientId === patientId)
      .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime());
  }

  public getNews2Scores(patientId: string): ClinicalScoreResult[] {
    return this.clinicalScores
      .filter((s) => s.patientId === patientId)
      .sort((a, b) => new Date(b.calculatedAt).getTime() - new Date(a.calculatedAt).getTime());
  }

  public getLatestNews2(patientId: string): ClinicalScoreResult | undefined {
    return this.getNews2Scores(patientId)[0];
  }

  public recordVitals(data: Omit<VitalSigns, "id">): {
    vitals: VitalSigns;
    alerts: any[];
    news2: ClinicalScoreResult;
  } {
    const newVitals: VitalSigns = {
      ...data,
      id: `vit_${Date.now()}`,
    };
    this.vitals.push(newVitals);

    const alerts = evaluateVitalSignAlerts(newVitals);

    const news2Inputs: News2Inputs = {
      respiratoryRate: newVitals.respiratoryRate,
      oxygenSaturation: newVitals.oxygenSaturation,
      onSupplementalOxygen: false,
      isHypercapnicRespiratoryFailure: false,
      systolicBp: newVitals.systolicBp,
      heartRate: newVitals.heartRate,
      consciousnessLevel: "A",
      temperature: newVitals.temperature,
    };

    const calculation = calculateNews2Score(news2Inputs);

    const scoreResult: ClinicalScoreResult = {
      id: `score_news2_${Date.now()}`,
      scoreType: "NEWS2",
      scoreVersion: "1.0",
      patientId: data.patientId,
      episodeId: data.episodeId,
      vitalSignsId: newVitals.id,
      professionalId: data.professionalId || this.currentUser.professionalId || "prof_mariana",
      inputsSnapshot: news2Inputs,
      subscores: calculation.subscores,
      score: calculation.score,
      riskLevel: calculation.riskLevel,
      recommendedAction: calculation.recommendedAction,
      calculatedAt: new Date(),
    };

    this.clinicalScores.unshift(scoreResult);

    const maxSeverity =
      calculation.riskLevel === "HIGH" || alerts.some((a) => a.severity === "CRITICO")
        ? "CRITICO"
        : calculation.riskLevel === "MEDIUM" || calculation.hasSingleParamMaxScore || alerts.length > 0
        ? "ATENCAO"
        : "NORMAL";

    this.events.unshift({
      id: `ev_${Date.now()}`,
      episodeId: data.episodeId,
      patientId: data.patientId,
      eventType: "SINAIS_VITAIS",
      eventTitle: `Aferição de Sinais Vitais — NEWS2 Score: ${calculation.score} (${calculation.riskLevel})`,
      eventTimestamp: new Date(),
      authorName: this.currentUser.name,
      authorRole: this.currentUser.role,
      summary: `PA ${data.systolicBp}x${data.diastolicBp} • SpO2 ${data.oxygenSaturation}% • FC ${data.heartRate} bpm • Temp ${data.temperature}°C | ${calculation.recommendedAction}`,
      severity: maxSeverity,
      referenceId: newVitals.id,
    });

    this.audit("NEWS2_CALCULATE", "clinical_score_results", scoreResult.id, data.patientId, scoreResult);
    this.audit("VITAL_SIGNS_RECORD", "vital_signs", newVitals.id, data.patientId, newVitals);
    this.saveToStorage();

    return { vitals: newVitals, alerts, news2: scoreResult };
  }

  // --- PEP: PRESCRIÇÕES ---
  public getPrescriptions(patientId: string): Prescription[] {
    return this.prescriptions.filter((p) => p.patientId === patientId);
  }

  public createPrescription(data: Omit<Prescription, "id">): Prescription {
    const newPresc: Prescription = {
      ...data,
      id: `presc_${Date.now()}`,
    };
    this.prescriptions.push(newPresc);

    this.events.unshift({
      id: `ev_${Date.now()}`,
      episodeId: data.episodeId,
      patientId: data.patientId,
      eventType: "PRESCRICAO",
      eventTitle: `Nova Prescrição Médica (${data.items.length} itens)`,
      eventTimestamp: new Date(),
      authorName: this.currentUser.name,
      authorRole: this.currentUser.role,
      summary: data.items.map((i) => `${i.medicationName} ${i.dosage}${i.unit} (${i.frequency})`).join(", "),
      severity: "NORMAL",
      referenceId: newPresc.id,
    });

    this.audit("PRESCRIPTION_CREATE", "prescriptions", newPresc.id, data.patientId, newPresc);
    return newPresc;
  }

  // --- PEP: ADMINISTRAÇÃO MEDICAMENTOSA & CHECAGEM BEIRA-LEITO ---
  public recordMedicationAdministration(data: {
    episodeId: string;
    patientId: string;
    prescriptionId: string;
    medicationName: string;
    dosage: string;
    route: string;
    status: "ADMINISTRADO" | "RECUSADO" | "SUSPENSO" | "NAO_ADMINISTRADO";
    administeredById: string;
    secondCheckerId?: string;
    refusalReason?: string;
    batchNumber?: string;
    notes?: string;
  }) {
    const record = {
      ...data,
      id: `med_adm_${Date.now()}`,
      administeredAt: new Date(),
    };

    this.events.unshift({
      id: `ev_${Date.now()}`,
      episodeId: data.episodeId,
      patientId: data.patientId,
      eventType: "PROCEDIMENTO",
      eventTitle: `Administração Medicamentosa: ${data.medicationName} (${data.status})`,
      eventTimestamp: new Date(),
      authorName: this.currentUser.name,
      authorRole: this.currentUser.role,
      summary: `Dose: ${data.dosage} • Via: ${data.route} • Status: ${data.status}${data.batchNumber ? ` • Lote: ${data.batchNumber}` : ""}${data.refusalReason ? ` • Motivo: ${data.refusalReason}` : ""}`,
      severity: data.status === "RECUSADO" || data.status === "SUSPENSO" ? "ATENCAO" : "NORMAL",
      referenceId: record.id,
    });

    this.audit("MEDICATION_ADMINISTER", "medication_administrations", record.id, data.patientId, record);
    this.saveToStorage();
    return record;
  }

  // --- PEP: PROCEDIMENTOS ---
  public getProcedures(patientId: string): Procedure[] {
    return this.procedures
      .filter((p) => p.patientId === patientId)
      .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());
  }

  public recordProcedure(
    data: Omit<Procedure, "id" | "materialsUsed"> & { materialsUsed?: Procedure["materialsUsed"] }
  ): Procedure {
    const newProc: Procedure = {
      materialsUsed: [],
      ...data,
      id: `proc_${Date.now()}`,
    };
    this.procedures.push(newProc);

    this.events.unshift({
      id: `ev_${Date.now()}`,
      episodeId: data.episodeId,
      patientId: data.patientId,
      eventType: "PROCEDIMENTO",
      eventTitle: `Procedimento: ${data.procedureName}`,
      eventTimestamp: new Date(),
      authorName: this.currentUser.name,
      authorRole: this.currentUser.role,
      summary: data.notes || "Procedimento executado conforme protocolo assistencial.",
      severity: "NORMAL",
      referenceId: newProc.id,
    });

    this.audit("PROCEDURE_RECORD", "procedures", newProc.id, data.patientId, newProc);
    return newProc;
  }

  // --- PEP: EXAMES ---
  public getExams(patientId: string): Exam[] {
    return this.exams
      .filter((e) => e.patientId === patientId)
      .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  }

  public requestExam(data: Omit<Exam, "id">): Exam {
    const newExam: Exam = {
      ...data,
      id: `exam_${Date.now()}`,
    };
    this.exams.push(newExam);

    this.events.unshift({
      id: `ev_${Date.now()}`,
      episodeId: data.episodeId,
      patientId: data.patientId,
      eventType: "EXAME",
      eventTitle: `Solicitação de Exame: ${data.examName}`,
      eventTimestamp: new Date(),
      authorName: this.currentUser.name,
      authorRole: this.currentUser.role,
      summary: `Status: ${data.status}`,
      severity: "NORMAL",
      referenceId: newExam.id,
    });

    this.audit("EXAM_REQUEST", "exams", newExam.id, data.patientId, newExam);
    return newExam;
  }

  // --- LINHA DO TEMPO CLÍNICA ---
  public getClinicalTimeline(patientId: string): ClinicalEvent[] {
    return this.events
      .filter((ev) => ev.patientId === patientId)
      .sort((a, b) => new Date(b.eventTimestamp).getTime() - new Date(a.eventTimestamp).getTime());
  }

  // --- ONDA 3: GESTÃO DE INSUMOS & ESTOQUE LEDGER ---
  public getSupplyCatalog(unitId?: string): SupplyItem[] {
    const orgSupplies = this.supplies.filter(
      (s) => s.organizationId === this.currentUser.organizationId && s.active
    );
    if (unitId) return orgSupplies.filter((s) => s.unitId === unitId);
    return orgSupplies;
  }

  public getSupplyItemById(id: string): SupplyItem | undefined {
    return this.supplies.find((s) => s.id === id);
  }

  public createSupplyItem(data: Omit<SupplyItem, "id" | "createdAt" | "updatedAt">): SupplyItem {
    const newItem: SupplyItem = {
      ...data,
      id: `sup_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.supplies.push(newItem);
    this.audit("SUPPLY_ITEM_CREATE", "supplies_catalog", newItem.id, null, newItem);
    this.saveToStorage();
    return newItem;
  }

  public recordInventoryMovement(data: {
    supplyItemId: string;
    movementType: InventoryLedgerEntry["movementType"];
    quantity: number;
    patientId?: string | null;
    visitId?: string | null;
    batchNumber?: string | null;
    expirationDate?: Date | null;
    reason?: string | null;
  }): { success: boolean; entry?: InventoryLedgerEntry; error?: string } {
    const item = this.getSupplyItemById(data.supplyItemId);
    if (!item) return { success: false, error: "Insumo não encontrado no catálogo." };

    let newBalance = item.currentStock;
    if (data.movementType === "ENTRADA" || data.movementType === "DEVOLUCAO") {
      newBalance += data.quantity;
    } else {
      if (item.currentStock < data.quantity) {
        return {
          success: false,
          error: `Saldo insuficiente em estoque. Disponível: ${item.currentStock} ${item.unitOfMeasure}(s), Solicitado: ${data.quantity}.`,
        };
      }
      newBalance -= data.quantity;
    }

    item.currentStock = newBalance;
    item.updatedAt = new Date();

    const newEntry: InventoryLedgerEntry = {
      id: `ledg_${Date.now()}`,
      organizationId: item.organizationId,
      unitId: item.unitId,
      supplyItemId: item.id!,
      movementType: data.movementType,
      quantity: data.quantity,
      balanceAfter: newBalance,
      batchNumber: data.batchNumber,
      expirationDate: data.expirationDate,
      patientId: data.patientId,
      professionalId: this.currentUser.professionalId || "prof_mariana",
      visitId: data.visitId,
      reason: data.reason,
      createdAt: new Date(),
    };

    this.inventoryLedger.unshift(newEntry);

    if (data.patientId) {
      this.events.unshift({
        id: `ev_${Date.now()}`,
        episodeId: `ep_${data.patientId}`,
        patientId: data.patientId,
        eventType: "PROCEDIMENTO",
        eventTitle: `Dispensação / Aplicação de Insumo (${item.name})`,
        eventTimestamp: new Date(),
        authorName: this.currentUser.name,
        authorRole: this.currentUser.role,
        summary: `Quantidade: ${data.quantity} ${item.unitOfMeasure} • Lote: ${data.batchNumber || "Padrão"} • Motivo: ${data.reason || "Uso beira-leito"}`,
        severity: "NORMAL",
        referenceId: newEntry.id,
      });
    }

    this.audit("INVENTORY_MOVEMENT_RECORD", "inventory_ledger", newEntry.id, data.patientId, newEntry);
    this.saveToStorage();

    return { success: true, entry: newEntry };
  }

  public getInventoryLedger(patientId?: string): InventoryLedgerEntry[] {
    if (patientId) {
      return this.inventoryLedger.filter((l) => l.patientId === patientId);
    }
    return this.inventoryLedger;
  }

  // --- ONDA 3: MONITORAMENTO DE OXIGENOTERAPIA ---
  public getPatientOxygenTherapy(patientId: string): PatientOxygenTherapy | undefined {
    return this.oxygenTherapies.find((o) => o.patientId === patientId && o.active);
  }

  public updateOxygenTherapy(patientId: string, data: Partial<PatientOxygenTherapy>): PatientOxygenTherapy {
    let therapy = this.getPatientOxygenTherapy(patientId);
    if (!therapy) {
      therapy = {
        id: `o2_${patientId}`,
        patientId,
        episodeId: `ep_${patientId}`,
        sourceType: data.sourceType || "CILINDRO_O2",
        deliveryInterface: data.deliveryInterface || "CATETER_NASAL",
        flowRateLpm: data.flowRateLpm || 2.0,
        usageHoursPerDay: data.usageHoursPerDay || 24,
        cylinderType: data.cylinderType || "CILINDRO_J_50L",
        cylinderFactorK: data.cylinderFactorK || 5.0,
        currentPressureBar: data.currentPressureBar || 150,
        nominalPressureBar: 150,
        lastPressureCheckAt: new Date(),
        backupCylinderAvailable: true,
        active: true,
        updatedAt: new Date(),
      };
      this.oxygenTherapies.push(therapy);
    } else {
      Object.assign(therapy, data, { updatedAt: new Date() });
    }

    this.audit("OXYGEN_THERAPY_UPDATE", "patient_oxygen_therapy", therapy.id, patientId, therapy);
    this.saveToStorage();
    return therapy;
  }

  public recordOxygenPressureCheck(
    patientId: string,
    pressureBar: number
  ): { therapy: PatientOxygenTherapy; calculation: OxygenAutonomyCalculation } {
    let therapy = this.getPatientOxygenTherapy(patientId);
    if (!therapy) {
      therapy = this.updateOxygenTherapy(patientId, { currentPressureBar: pressureBar });
    } else {
      therapy.currentPressureBar = pressureBar;
      therapy.lastPressureCheckAt = new Date();
      therapy.updatedAt = new Date();
    }

    const calculation = calculateOxygenAutonomy(
      pressureBar,
      therapy.flowRateLpm,
      therapy.cylinderFactorK || 1.0,
      new Date()
    );

    this.events.unshift({
      id: `ev_${Date.now()}`,
      episodeId: therapy.episodeId,
      patientId,
      eventType: "SINAIS_VITAIS",
      eventTitle: `Checagem de Oxigenoterapia — Pressão ${pressureBar} bar (${calculation.status})`,
      eventTimestamp: new Date(),
      authorName: this.currentUser.name,
      authorRole: this.currentUser.role,
      summary: `${calculation.alertMessage} • Fluxo: ${therapy.flowRateLpm} L/min via ${therapy.deliveryInterface.replace(/_/g, " ")}`,
      severity: calculation.status === "CRITICO" ? "CRITICO" : calculation.status === "ATENCAO" ? "ATENCAO" : "NORMAL",
      referenceId: therapy.id,
    });

    this.audit("OXYGEN_PRESSURE_CHECK", "patient_oxygen_therapy", therapy.id, patientId, {
      pressureBar,
      calculation,
    });
    this.saveToStorage();

    return { therapy, calculation };
  }

  // --- ONDA 3: PROTOCOLO DE CURATIVOS & LESÕES POR PRESSÃO ---
  public getWoundEvaluations(patientId: string): WoundEvaluation[] {
    return this.woundEvaluations
      .filter((w) => w.patientId === patientId)
      .sort((a, b) => new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime());
  }

  public recordWoundEvaluation(data: Omit<WoundEvaluation, "id" | "createdAt">): {
    wound: WoundEvaluation;
    progress: ReturnType<typeof evaluateWoundHealingProgress>;
  } {
    const previous = this.getWoundEvaluations(data.patientId).find(
      (w) => w.woundIdentifier === data.woundIdentifier
    );

    const newWound: WoundEvaluation = {
      ...data,
      id: `wnd_${Date.now()}`,
      areaCm2: Number((data.lengthCm * data.widthCm).toFixed(2)),
      createdAt: new Date(),
    };

    const progress = evaluateWoundHealingProgress(previous, newWound);
    newWound.healingEvolutionStatus =
      progress.healingTrajectory === "REGRESSAO_POSITIVA"
        ? "MELHORA"
        : progress.healingTrajectory === "EXPANSAO_NEGATIVA"
        ? "PIORA"
        : "ESTAVEL";

    this.woundEvaluations.unshift(newWound);

    this.events.unshift({
      id: `ev_${Date.now()}`,
      episodeId: data.episodeId,
      patientId: data.patientId,
      eventType: "EVOLUCAO",
      eventTitle: `Avaliação de Curativo Beira-Leito: ${data.woundIdentifier} (${data.stage.replace(/_/g, " ")})`,
      eventTimestamp: new Date(),
      authorName: this.currentUser.name,
      authorRole: this.currentUser.role,
      summary: `Área: ${newWound.areaCm2} cm² (${data.lengthCm}x${data.widthCm}cm) • Granulação: ${data.granulationPercent}% • Cobertura: ${data.prescribedCovering.replace(/_/g, " ")} | ${progress.summary}`,
      severity: progress.healingTrajectory === "EXPANSAO_NEGATIVA" ? "ATENCAO" : "NORMAL",
      referenceId: newWound.id,
    });

    this.audit("WOUND_EVALUATION_RECORD", "wound_evaluations", newWound.id, data.patientId, newWound);
    this.saveToStorage();

    return { wound: newWound, progress };
  }

  // --- ONDA 4: PORTAL DO FAMILIAR & LGPD ---
  public getFamilyAccessGrants(patientId?: string): FamilyAccessGrant[] {
    if (patientId) {
      return this.familyGrants.filter((g) => g.patientId === patientId && g.active);
    }
    return this.familyGrants;
  }

  public grantFamilyAccess(data: Omit<FamilyAccessGrant, "id" | "createdAt" | "consentSignedAt">): FamilyAccessGrant {
    const newGrant: FamilyAccessGrant = {
      ...data,
      id: `grant_${Date.now()}`,
      consentSignedAt: new Date(),
      createdAt: new Date(),
    };
    this.familyGrants.push(newGrant);
    this.audit("FAMILY_ACCESS_GRANT", "family_access_grants", newGrant.id, data.patientId, newGrant);
    this.saveToStorage();
    return newGrant;
  }

  public revokeFamilyAccess(id: string): void {
    const grant = this.familyGrants.find((g) => g.id === id);
    if (grant) {
      grant.active = false;
      this.saveToStorage();
    }
  }

  public getFamilyTimeline(patientId: string): FamilyTimelineEvent[] {
    const clinicalEvents = this.getClinicalTimeline(patientId);
    const sanitized: FamilyTimelineEvent[] = [];

    for (const ev of clinicalEvents) {
      const clean = sanitizeClinicalEventForFamily(ev);
      if (clean) sanitized.push(clean);
    }

    return sanitized;
  }

  public getFamilyDailySummary(patientId: string, date: Date = new Date()): CareDailySummary {
    const patient = this.getPatientById(patientId);
    const visits = this.getVisits({ patientId });
    const vitals = this.getVitals(patientId);
    const evolutions = this.getEvolutions(patientId);

    const completedVisits = visits.filter((v) => v.status === "COMPLETED" || v.status === "CHECKED_IN" || v.status === "IN_PROGRESS");
    const upcomingVisits = visits.filter((v) => v.status === "SCHEDULED" || v.status === "EN_ROUTE");

    const latestVital = vitals[0];
    let overallStatus: CareDailySummary["overallStatus"] = "ESTAVEL_CONFORTAVEL";
    let statusTitle = "Paciente Estável & Confortável";
    let statusMessage = "Todos os cuidados prescritos estão sendo administrados e os sinais vitais encontram-se dentro da faixa de normalidade.";

    if (latestVital && (latestVital.oxygenSaturation < 92 || latestVital.systolicBp > 160 || latestVital.temperature >= 37.8)) {
      overallStatus = "EM_OBSERVACAO";
      statusTitle = "Acompanhamento Continuado";
      statusMessage = "A equipe médica e de enfermagem está monitorando de perto os parâmetros do paciente neste plantão.";
    }

    return {
      patientId,
      patientName: patient?.fullName || "Paciente",
      date,
      overallStatus,
      statusTitle,
      statusMessage,
      completedVisitsCount: completedVisits.length,
      upcomingVisitsCount: upcomingVisits.length,
      medsAdministeredCount: evolutions.length + 2,
      nutritionStatus: "Dieta administrada conforme prescrição nutricional",
      hygieneComfortStatus: "Mudança de decúbito e higiene de rotina realizadas",
      latestVitalsFriendly: latestVital
        ? `Pressão Arterial: ${latestVital.systolicBp}x${latestVital.diastolicBp} mmHg • Saturação: ${latestVital.oxygenSaturation}% • Temperatura: ${latestVital.temperature}°C`
        : "Sinais vitais checados e estáveis",
    };
  }

  public submitFamilyFeedback(data: Omit<FamilyFeedback, "id" | "createdAt">): FamilyFeedback {
    const newFeedback: FamilyFeedback = {
      ...data,
      id: `feed_${Date.now()}`,
      createdAt: new Date(),
    };
    this.familyFeedbacks.unshift(newFeedback);
    this.audit("FAMILY_FEEDBACK_SUBMIT", "family_feedbacks", newFeedback.id, data.patientId, newFeedback);
    this.saveToStorage();
    return newFeedback;
  }

  public getFamilyFeedbacks(patientId?: string): FamilyFeedback[] {
    if (patientId) {
      return this.familyFeedbacks.filter((f) => f.patientId === patientId);
    }
    return this.familyFeedbacks;
  }

  public getOperationalDashboardMetrics(unitId?: string): OperationalDashboardMetrics {
    const patients = unitId ? this.patients.filter((p) => p.unitId === unitId) : this.patients;
    const episodes = this.episodes.filter(
      (ep) => ep.organizationId === this.currentUser.organizationId && ep.status === "ATIVO"
    );
    const visits = this.getVisits();
    const supplies = this.getSupplyCatalog(unitId);
    const oxygenTherapies = this.oxygenTherapies.filter((o) => o.active);
    const wounds = this.woundEvaluations;
    const feedbacks = this.getFamilyFeedbacks();

    // 1. NEWS2 Clínico
    let news2CriticalCount = 0;
    let news2MediumCount = 0;
    let news2StableCount = 0;

    for (const patient of patients) {
      const scores = this.getNews2Scores(patient.id!);
      const latestScore = scores[0];
      if (latestScore) {
        if (latestScore.score >= 7 || latestScore.riskLevel === "HIGH") news2CriticalCount++;
        else if (latestScore.score >= 5 || latestScore.riskLevel === "MEDIUM") news2MediumCount++;
        else news2StableCount++;
      } else {
        news2StableCount++;
      }
    }

    // 2. Visitas
    const visitsCompleted = visits.filter((v) => v.status === "COMPLETED").length;
    const visitsInProgress = visits.filter((v) => v.status === "CHECKED_IN" || v.status === "IN_PROGRESS").length;
    const visitsScheduled = visits.filter((v) => v.status === "SCHEDULED" || v.status === "EN_ROUTE").length;

    // 3. Logística e Oxigênio
    const criticalSuppliesCount = supplies.filter((s) => s.currentStock <= s.reorderPoint).length;
    const criticalOxygenCount = oxygenTherapies.filter((o) => {
      const calc = calculateOxygenAutonomy(o.currentPressureBar || 0, o.flowRateLpm, o.cylinderFactorK || 1.0, new Date());
      return calc.status === "CRITICO" || calc.status === "ATENCAO";
    }).length;

    // 4. Curativos & Lesões
    const activeWoundsCount = wounds.length;

    // 5. Família & Satisfação
    const totalRating = feedbacks.reduce((acc, f) => acc + f.rating, 0);
    const familySatisfactionRating = feedbacks.length > 0 ? Number((totalRating / feedbacks.length).toFixed(1)) : 5.0;

    // 6. Resiliência Offline
    const offlineSyncPendingCount = syncManager.getPendingCount();

    return {
      totalPatients: patients.length,
      activeEpisodes: episodes.length,
      news2CriticalCount,
      news2MediumCount,
      news2StableCount,
      visitsTodayTotal: visits.length,
      visitsCompleted,
      visitsInProgress,
      visitsScheduled,
      criticalSuppliesCount,
      criticalOxygenCount,
      activeWoundsCount,
      familySatisfactionRating,
      totalFamilyFeedbacks: feedbacks.length,
      offlineSyncPendingCount,
    };
  }

  public getActiveAlerts(): Array<{
    id: string;
    patientId: string;
    patientName: string;
    severity: "CRITICO" | "ATENCAO";
    message: string;
    triggerParam: string;
  }> {
    const alerts: Array<{
      id: string;
      patientId: string;
      patientName: string;
      severity: "CRITICO" | "ATENCAO";
      message: string;
      triggerParam: string;
    }> = [];

    for (const pat of this.patients) {
      const news2 = this.getNews2Scores(pat.id!)[0];
      if (news2 && news2.score >= 5) {
        alerts.push({
          id: `al_${pat.id}_news2`,
          patientId: pat.id!,
          patientName: pat.fullName,
          severity: news2.score >= 7 ? "CRITICO" : "ATENCAO",
          message: `Escore NEWS2 elevado (${news2.score} pontos). ${news2.recommendedAction}`,
          triggerParam: `NEWS2 = ${news2.score} (${news2.riskLevel})`,
        });
      }
      const vitals = this.getVitals(pat.id!)[0];
      if (vitals && (vitals.oxygenSaturation < 92 || vitals.systolicBp > 160)) {
        alerts.push({
          id: `al_${pat.id}_vital`,
          patientId: pat.id!,
          patientName: pat.fullName,
          severity: vitals.oxygenSaturation < 90 ? "CRITICO" : "ATENCAO",
          message: `Saturação de O₂ em ${vitals.oxygenSaturation}% e PA ${vitals.systolicBp}x${vitals.diastolicBp} mmHg.`,
          triggerParam: `SpO2: ${vitals.oxygenSaturation}%`,
        });
      }
    }
    return alerts;
  }

  public canAccessPatient(patientId: string): { authorized: boolean; reason?: string } {
    const patient = this.getPatientById(patientId);
    if (!patient) return { authorized: false, reason: "Paciente não encontrado." };
    return authorizePatientAccess({
      userRole: this.currentUser.role,
      userStatus: this.currentUser.status,
      userOrgId: this.currentUser.organizationId,
      patientOrgId: patient.organizationId,
      userUnitIds: this.currentUser.unitIds,
      patientUnitId: patient.unitId,
      professionalId: this.currentUser.professionalId,
      userId: this.currentUser.id,
      patientId: patient.id!,
      activeAssignments: this.assignments,
    });
  }
}

export type { PatientProfessionalAssignment };
export const store = new HomeCareStore();
