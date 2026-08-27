import { describe, it, expect } from "vitest";
import { store } from "@/services/store.service";
import { authorizePatientAccess } from "@/domain/security/rbac";
import { checkPatientDuplicate, Patient } from "@/domain/patient/patient.schema";
import { evaluateVitalSignAlerts, VitalSigns } from "@/domain/pep/pep.schema";
import { hasShiftOverlap, Shift } from "@/domain/shift/shift.schema";
import { PadSchema } from "@/domain/pad/pad.schema";

describe("CERTIFICAÇÃO TÉCNICA DO SISTEMA HOMECARE — SUÍTE DE HOMOLOGAÇÃO", () => {
  // ==========================================================================
  // 1. IDENTIDADE, MULTITENANCY & RBAC CONTEXTUAL (ANTI-IDOR)
  // ==========================================================================
  describe("[1] Identidade, Multitenancy & RBAC Contextual", () => {
    const mockAssignments = [
      {
        id: "asg_1",
        professionalId: "prof_mariana",
        patientId: "pat_antonio",
        isActive: true,
        startDate: new Date("2026-08-01"),
      },
      {
        id: "asg_2",
        professionalId: "prof_roberta",
        patientId: "pat_antonio",
        isActive: true,
        startDate: new Date("2026-08-01"),
      },
      {
        id: "asg_3_expired",
        professionalId: "prof_mariana",
        patientId: "pat_maria",
        isActive: false, // Vínculo inativo / expirado
        startDate: new Date("2026-07-01"),
      },
    ];

    it("deve PERMITIR acesso ao PEP quando o profissional possui vínculo assistencial ativo (Anti-IDOR Positivo)", () => {
      const auth = authorizePatientAccess({
        userRole: "TECNICO_ENFERMAGEM",
        userStatus: "ACTIVE",
        userOrgId: "org_curahome",
        patientOrgId: "org_curahome",
        professionalId: "prof_mariana",
        patientId: "pat_antonio",
        activeAssignments: mockAssignments,
      });

      expect(auth.authorized).toBe(true);
    });

    it("deve BLOQUEAR acesso ao PEP quando o profissional tenta acessar paciente sem vínculo (Anti-IDOR Negativo)", () => {
      const auth = authorizePatientAccess({
        userRole: "TECNICO_ENFERMAGEM",
        userStatus: "ACTIVE",
        userOrgId: "org_curahome",
        patientOrgId: "org_curahome",
        professionalId: "prof_mariana",
        patientId: "pat_outro_paciente_sem_vinculo",
        activeAssignments: mockAssignments,
      });

      expect(auth.authorized).toBe(false);
      expect(auth.reason).toContain("vínculo assistencial ativo");
    });

    it("deve BLOQUEAR acesso quando o vínculo do profissional está INATIVO ou EXPIRADO", () => {
      const auth = authorizePatientAccess({
        userRole: "TECNICO_ENFERMAGEM",
        userStatus: "ACTIVE",
        userOrgId: "org_curahome",
        patientOrgId: "org_curahome",
        professionalId: "prof_mariana",
        patientId: "pat_maria",
        activeAssignments: mockAssignments,
      });

      expect(auth.authorized).toBe(false);
    });

    it("deve BLOQUEAR acesso entre organizações distintas (Isolamento Multitenant Estrito)", () => {
      const auth = authorizePatientAccess({
        userRole: "ADMIN",
        userStatus: "ACTIVE",
        userOrgId: "org_curahome",
        patientOrgId: "org_concorrente_hospital_x",
        patientId: "pat_antonio",
        activeAssignments: mockAssignments,
      });

      expect(auth.authorized).toBe(false);
      expect(auth.reason).toContain("outra organização");
    });

    it("deve BLOQUEAR acesso quando a conta do usuário está SUSPENSA ou BLOQUEADA", () => {
      const auth = authorizePatientAccess({
        userRole: "MEDICO",
        userStatus: "SUSPENDED",
        userOrgId: "org_curahome",
        patientOrgId: "org_curahome",
        professionalId: "prof_roberta",
        patientId: "pat_antonio",
        activeAssignments: mockAssignments,
      });

      expect(auth.authorized).toBe(false);
      expect(auth.reason).toContain("SUSPENDED");
    });

    it("deve PERMITIR acesso global ao PEP para Administradores da mesma organização", () => {
      const auth = authorizePatientAccess({
        userRole: "ADMIN",
        userStatus: "ACTIVE",
        userOrgId: "org_curahome",
        patientOrgId: "org_curahome",
        patientId: "pat_qualquer",
        activeAssignments: [],
      });

      expect(auth.authorized).toBe(true);
    });
  });

  // ==========================================================================
  // 2. UNICIDADE CADASTRAL & PREVENÇÃO DE DUPLICIDADE DE PACIENTES
  // ==========================================================================
  describe("[2] Unicidade Cadastral & Pacientes", () => {
    const existingPatients: Patient[] = [
      {
        id: "pat_1",
        organizationId: "org_curahome",
        unitId: "unit_ilheus",
        fullName: "Antônio Carlos Silva",
        motherName: "Maria Helena Silva",
        birthDate: new Date("1952-05-14"),
        cpf: "123.456.789-00",
        gender: "MASCULINO",
        maritalStatus: "CASADO",
        nationality: "Brasileira",
        raceColor: "BRANCA",
        addressStreet: "Rua das Bromélias",
        addressNumber: "120",
        addressNeighborhood: "Centro",
        addressCity: "Ilhéus",
        addressState: "BA",
        addressZip: "45650-000",
        status: "ATIVO",
        allergies: [],
        addresses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    it("deve BLOQUEAR cadastro com CPF duplicado na mesma organização", () => {
      const dup = checkPatientDuplicate(existingPatients, {
        organizationId: "org_curahome",
        cpf: "123.456.789-00",
        fullName: "Antônio Carlos Santos",
        birthDate: new Date("1980-01-01"),
        motherName: "Outra Mãe",
      });

      expect(dup.isDuplicate).toBe(true);
      expect(dup.reason).toContain("CPF");
    });

    it("deve BLOQUEAR cadastro com o trio idêntico (Nome + Data Nascimento + Nome da Mãe) mesmo sem CPF", () => {
      const dup = checkPatientDuplicate(existingPatients, {
        organizationId: "org_curahome",
        cpf: null,
        fullName: "Antônio Carlos Silva",
        birthDate: new Date("1952-05-14"),
        motherName: "Maria Helena Silva",
      });

      expect(dup.isDuplicate).toBe(true);
      expect(dup.reason).toContain("Nome da Mãe");
    });

    it("deve PERMITIR cadastro de paciente com dados distintos", () => {
      const dup = checkPatientDuplicate(existingPatients, {
        organizationId: "org_curahome",
        cpf: "999.888.777-66",
        fullName: "João Batista Souza",
        birthDate: new Date("1970-10-20"),
        motherName: "Francisca Souza",
      });

      expect(dup.isDuplicate).toBe(false);
    });
  });

  // ==========================================================================
  // 3. IMUTABILIDADE CLÍNICA & RESOLUÇÃO ÉTICA (CFM/COREN)
  // ==========================================================================
  describe("[3] Imutabilidade Clínica & Resolução CFM/COREN", () => {
    it("deve PERMITIR salvar evolução clínica como RASCUNHO e editá-la enquanto rascunho", () => {
      const draft = store.saveEvolution({
        episodeId: "ep_antonio",
        patientId: "pat_antonio",
        professionalId: "prof_mariana",
        evolutionType: "ENFERMAGEM",
        content: "Evolução preliminar em rascunho...",
        status: "RASCUNHO",
      });

      expect(draft.success).toBe(true);
      expect(draft.evolution).toBeDefined();

      const editedDraft = store.saveEvolution({
        id: draft.evolution!.id,
        episodeId: "ep_antonio",
        patientId: "pat_antonio",
        professionalId: "prof_mariana",
        evolutionType: "ENFERMAGEM",
        content: "Evolução em rascunho atualizada com novos achados.",
        status: "RASCUNHO",
      });

      expect(editedDraft.success).toBe(true);
      expect(editedDraft.evolution?.content).toContain("atualizada com novos achados");
    });

    it("deve BLOQUEAR estritamente qualquer tentativa de UPDATE ou substituição de evolução FINALIZADA", () => {
      const finalizeRes = store.saveEvolution({
        episodeId: "ep_antonio",
        patientId: "pat_antonio",
        professionalId: "prof_mariana",
        evolutionType: "ENFERMAGEM",
        content: "Evolução finalizada e assinada digitalmente.",
        status: "FINALIZADO",
      });

      expect(finalizeRes.success).toBe(true);
      const finalizedId = finalizeRes.evolution!.id;

      // Tentativa de alterar o texto de um registro finalizado
      const tamperAttempt = store.saveEvolution({
        id: finalizedId,
        episodeId: "ep_antonio",
        patientId: "pat_antonio",
        professionalId: "prof_mariana",
        evolutionType: "ENFERMAGEM",
        content: "Tentativa indevida de alteração de prontuário finalizado!",
        status: "FINALIZADO",
      });

      expect(tamperAttempt.success).toBe(false);
      expect(tamperAttempt.error).toContain("estritamente imutáveis conforme normas do CFM e COREN");
    });
  });

  // ==========================================================================
  // 4. ESCALAS, PLANTÕES & DETECÇÃO DE CONFLITOS (ANTI-OVERLAP)
  // ==========================================================================
  describe("[4] Escalas, Plantões & Detecção de Sobreposição", () => {
    const activeShifts: Shift[] = [
      {
        id: "sh_1",
        startTime: new Date("2026-08-28T07:00:00Z"),
        endTime: new Date("2026-08-28T19:00:00Z"),
        shiftType: "DIURNO_12H",
        doctorInChargeId: "prof_roberta",
        nurseInChargeId: "prof_luciana",
        status: "CONFIRMADO",
      },
    ];

    it("deve BLOQUEAR agendamento de plantão com sobreposição de horário para o mesmo médico", () => {
      const overlap = hasShiftOverlap(activeShifts, {
        startTime: new Date("2026-08-28T12:00:00Z"),
        endTime: new Date("2026-08-28T22:00:00Z"),
        doctorInChargeId: "prof_roberta",
        nurseInChargeId: null,
      });

      expect(overlap).toBe(true);
    });

    it("deve PERMITIR agendamento de plantão para outro médico no mesmo horário", () => {
      const overlap = hasShiftOverlap(activeShifts, {
        startTime: new Date("2026-08-28T07:00:00Z"),
        endTime: new Date("2026-08-28T19:00:00Z"),
        doctorInChargeId: "prof_andre",
        nurseInChargeId: "prof_carla",
      });

      expect(overlap).toBe(false);
    });

    it("deve EXIGIR obrigatoriamente um Médico Responsável para criação de qualquer plantão", () => {
      const res = store.createShift({
        startTime: new Date("2026-08-29T07:00:00Z"),
        endTime: new Date("2026-08-29T19:00:00Z"),
        shiftType: "DIURNO_12H",
        doctorInChargeId: "" as any, // Sem médico
        status: "PLANEJADO",
      });

      expect(res.success).toBe(false);
      expect(res.error).toContain("Médico Responsável");
    });
  });

  // ==========================================================================
  // 5. MONITORAMENTO FISIOLÓGICO, ALERTAS & TELEMETRIA BEIRA-LEITO
  // ==========================================================================
  describe("[5] Monitoramento Fisiológico & Alertas Críticos", () => {
    const createBaseVitals = (overrides: Partial<VitalSigns>): VitalSigns => ({
      episodeId: "ep_antonio",
      patientId: "pat_antonio",
      professionalId: "prof_mariana",
      measuredAt: new Date(),
      systolicBp: 120,
      diastolicBp: 80,
      heartRate: 75,
      respiratoryRate: 18,
      oxygenSaturation: 98,
      temperature: 36.5,
      painScore: 0,
      ...overrides,
    });

    it("deve DISPARAR alerta CRÍTICO quando SpO2 < 90% (Hipóxia grave)", () => {
      const vitals = createBaseVitals({ oxygenSaturation: 88 });
      const alerts = evaluateVitalSignAlerts(vitals);

      expect(alerts.length).toBeGreaterThan(0);
      const spo2Alert = alerts.find((a) => a.parameter === "SpO2");
      expect(spo2Alert?.severity).toBe("CRITICO");
    });

    it("deve DISPARAR alerta CRÍTICO quando Pressão Arterial Sistólica >= 180 mmHg (Crise Hipertensiva)", () => {
      const vitals = createBaseVitals({ systolicBp: 195, diastolicBp: 110 });
      const alerts = evaluateVitalSignAlerts(vitals);

      const bpAlert = alerts.find((a) => a.parameter === "PA");
      expect(bpAlert?.severity).toBe("CRITICO");
    });

    it("deve DISPARAR alerta CRÍTICO quando Glicemia Capilar < 50 mg/dL (Hipoglicemia Severa)", () => {
      const vitals = createBaseVitals({ bloodGlucose: 42 });
      const alerts = evaluateVitalSignAlerts(vitals);

      const hgtAlert = alerts.find((a) => a.parameter === "Glicemia");
      expect(hgtAlert?.severity).toBe("CRITICO");
    });

    it("deve RETORNAR lista vazia de alertas quando todos os parâmetros estão normais", () => {
      const vitals = createBaseVitals({ bloodGlucose: 95 });
      const alerts = evaluateVitalSignAlerts(vitals);

      expect(alerts.length).toBe(0);
    });
  });

  // ==========================================================================
  // 6. PLANO DE ATENÇÃO DOMICILIAR (PAD) & VISITAS MULTIDISCIPLINARES
  // ==========================================================================
  describe("[6] Plano de Atenção Domiciliar (PAD)", () => {
    it("deve VALIDAR com sucesso um PAD completo com visitas e equipamentos", () => {
      const validPad = PadSchema.safeParse({
        episodeId: "ep_antonio",
        patientId: "pat_antonio",
        version: 1,
        careRegime: "HOME_CARE_12H_DIURNO",
        startDate: new Date(),
        reviewIntervalDays: 30,
        status: "ATIVO",
        createdById: "prof_roberta",
        clinicalGoals: "Desmame de macronebulização e reabilitação motora",
        visits: [
          {
            profession: "FISIOTERAPEUTA",
            frequencyPerWeek: 3,
            durationMinutes: 60,
            objective: "Fisioterapia motora e respiratória",
          },
        ],
        equipment: [
          {
            itemCategory: "RESPIRATORIO",
            itemName: "Concentrador de O2 5L/min",
            quantity: 1,
            status: "EM_USO",
          },
        ],
      });

      expect(validPad.success).toBe(true);
    });

    it("deve REJEITAR PAD sem metas terapêuticas definidas", () => {
      const invalidPad = PadSchema.safeParse({
        episodeId: "ep_antonio",
        patientId: "pat_antonio",
        careRegime: "HOME_CARE_12H_DIURNO",
        clinicalGoals: "", // Inválido
      });

      expect(invalidPad.success).toBe(false);
    });
  });

  // ==========================================================================
  // 7. TRILHA DE AUDITORIA FORENSE UNIVERSAL (LGPD)
  // ==========================================================================
  describe("[7] Trilha de Auditoria Forense Universal (LGPD)", () => {
    it("deve REGISTRAR automaticamente evento na trilha de auditoria para cada ação clínica", () => {
      const initialCount = store.getAuditLogs().length;

      // Registrar aferição de sinais vitais
      store.recordVitals({
        episodeId: "ep_antonio",
        patientId: "pat_antonio",
        professionalId: "prof_mariana",
        measuredAt: new Date(),
        systolicBp: 120,
        diastolicBp: 80,
        heartRate: 72,
        respiratoryRate: 16,
        oxygenSaturation: 98,
        temperature: 36.6,
        painScore: 0,
      });

      const updatedLogs = store.getAuditLogs();
      expect(updatedLogs.length).toBeGreaterThan(initialCount);

      const latestLog = updatedLogs[0];
      expect(latestLog.action).toBe("VITAL_SIGNS_RECORD");
      expect(latestLog.entityTable).toBe("vital_signs");
      expect(latestLog.patientId).toBe("pat_antonio");
      expect(latestLog.userId).toBe(store.currentUser.id);
      expect(latestLog.userRole).toBe(store.currentUser.role);
    });
  });
});
