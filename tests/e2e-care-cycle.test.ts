import { describe, it, expect } from "vitest";
import { store } from "@/services/store.service";
import { authorizePatientAccess } from "@/domain/security/rbac";

describe("E2E — Ciclo Completo de Admissão e Assistência Domiciliar HomeCare", () => {
  it("deve executar o fluxo operacional e clínico de ponta a ponta com sucesso", () => {
    // 1. Cadastrar novo paciente com prevenção de duplicidade
    const patientResult = store.createPatient({
      fullName: "Benedita Ferreira da Silva",
      motherName: "Clarice Ferreira",
      birthDate: new Date("1945-07-12"),
      cpf: "444.555.666-77",
      gender: "FEMININO",
      addressStreet: "Rua Domingos de Morais",
      addressNumber: "1500",
      addressNeighborhood: "Vila Mariana",
      addressCity: "São Paulo",
      addressState: "SP",
      addressZip: "04010-200",
      allergies: ["Iodo"],
      status: "ATIVO",
      nationality: "Brasileira",
      raceColor: "PARDA",
      maritalStatus: "VIUVO",
    });

    expect(patientResult.success).toBe(true);
    const patient = patientResult.patient!;
    expect(patient.id).toBeDefined();

    // Teste de duplicidade: tentar cadastrar o mesmo paciente de novo
    const duplicateTry = store.createPatient({
      fullName: "Benedita Ferreira da Silva",
      motherName: "Clarice Ferreira",
      birthDate: new Date("1945-07-12"),
      cpf: "444.555.666-77",
      gender: "FEMININO",
      addressStreet: "Rua Domingos de Morais",
      addressNumber: "1500",
      addressNeighborhood: "Vila Mariana",
      addressCity: "São Paulo",
      addressState: "SP",
      addressZip: "04010-200",
      allergies: [],
      status: "ATIVO",
      nationality: "Brasileira",
      raceColor: "PARDA",
      maritalStatus: "VIUVO",
    });
    expect(duplicateTry.success).toBe(false);
    expect(duplicateTry.error).toContain("CPF");

    // 2. Localizar episódio assistencial gerado
    const episode = store.getEpisodeByPatientId(patient.id!);
    expect(episode).toBeDefined();
    expect(episode?.status).toBe("ATIVO");

    // 3. Realizar Triagem Clínica Multidimensional
    const triage = store.createTriage({
      episodeId: episode?.id,
      patientId: patient.id!,
      evaluatorId: "prof_roberta",
      evaluationDate: new Date(),
      location: "RESIDENCIA",
      modality: "PRESENCIAL",
      mainDiagnosis: "Insuficiência Cardíaca Congestiva (NYHA III)",
      cid10: "I50.0",
      secondaryDiagnoses: ["Hipertensão Arterial Sistêmica", "Diabetes Mellitus Tipo 2"],
      requestReason: "Acompanhamento de descompensação e controle glicêmico/pressórico",
      generalState: "REGULAR",
      consciousnessLevel: "ALERTA",
      systolicBp: 140,
      diastolicBp: 90,
      heartRate: 82,
      respiratoryRate: 19,
      oxygenSaturation: 94,
      temperature: 36.6,
      bloodGlucose: 140,
      mobility: "NECESSITA_AUXILIO",
      feeding: "ORAL",
      breathing: "AR_AMBIENTE",
      eliminations: "DIURESE_ESPONTANEA",
      skinCondition: "INTEGRA",
      devices: [],
      risks: ["QUEDA", "LESAO_POR_PRESSAO"],
      careNeeds: ["MEDICO", "ENFERMEIRO", "FISIOTERAPEUTA"],
      eligibility: "ELEGIVEL",
      complexityLevel: "MEDIA",
      conclusion: "Paciente elegível para plano de visitas multidisciplinares semanais.",
    });

    expect(triage.id).toBeDefined();
    expect(triage.eligibility).toBe("ELEGIVEL");

    // 4. Criar Plano Assistencial Estruturado
    const carePlan = store.createCarePlan({
      episodeId: episode?.id || "",
      patientId: patient.id!,
      triageId: triage.id,
      version: 1,
      startDate: new Date(),
      status: "ATIVO",
      createdById: "prof_roberta",
      items: [
        {
          id: "item_1",
          carePlanId: "cp_test",
          professionType: "ENFERMEIRO",
          frequency: "2x por semana",
          procedureDescription: "Supervisão clínica, controle de peso/edema e checagem de sinais vitais.",
          goals: "Evitar descompensação volêmica da IC.",
        },
      ],
    });
    expect(carePlan.id).toBeDefined();
    expect(carePlan.items.length).toBe(1);

    // 5. Criar Plantão com Médico Obrigatório
    const shiftResult = store.createShift({
      startTime: new Date("2026-08-29T07:00:00Z"),
      endTime: new Date("2026-08-29T19:00:00Z"),
      shiftType: "DIURNO_12H",
      doctorInChargeId: "prof_roberta",
      nurseInChargeId: "prof_luciana",
      status: "PLANEJADO",
      notes: "Plantão do final de semana",
    });
    expect(shiftResult.success).toBe(true);

    // 6. Criar Vínculo Explícito Paciente ↔ Profissional (Enfermeira Luciana)
    const assignment = store.createAssignment({
      episodeId: episode?.id || "",
      patientId: patient.id!,
      professionalId: "prof_luciana",
      role: "Enfermeira Supervisora",
      startDate: new Date(),
      isActive: true,
    });
    expect(assignment.id).toBeDefined();

    // 7. Simular Login da Enf. Luciana e Acesso ao PEP (Anti-IDOR)
    store.setCurrentUser({
      id: "user_luciana",
      organizationId: "org_curahome",
      name: "Enf. Luciana Prado Alencar",
      email: "luciana.enf@curahome.com.br",
      role: "ENFERMEIRO",
      status: "ACTIVE",
      unitIds: ["unit_ilheus"],
      professionalId: "prof_luciana",
    });

    const accessCheck = authorizePatientAccess({
      userRole: store.currentUser.role,
      userId: store.currentUser.professionalId || store.currentUser.id,
      patientId: patient.id!,
      activeAssignments: [
        { professionalUserId: "prof_luciana", patientId: patient.id!, isActive: true },
      ],
    });
    expect(accessCheck.authorized).toBe(true);

    // 8. Registrar Sinais Vitais no PEP
    const vitalsResult = store.recordVitals({
      episodeId: episode?.id || "",
      patientId: patient.id!,
      professionalId: "prof_luciana",
      measuredAt: new Date(),
      systolicBp: 135,
      diastolicBp: 85,
      heartRate: 78,
      respiratoryRate: 18,
      oxygenSaturation: 96,
      temperature: 36.5,
      bloodGlucose: 125,
      painScore: 0,
    });
    expect(vitalsResult.vitals.id).toBeDefined();

    // 9. Registrar Evolução Clínica (Rascunho -> Finalizado -> Imutabilidade)
    const draftEvo = store.saveEvolution({
      episodeId: episode?.id || "",
      patientId: patient.id!,
      professionalId: "prof_luciana",
      evolutionType: "ENFERMAGEM",
      content: "Visita domiciliar inicial. Paciente lúcida, afebril, eupneica. Sem queixas de dispneia.",
      status: "RASCUNHO",
    });
    expect(draftEvo.success).toBe(true);

    // Finalizar evolução
    const finalizedEvo = store.saveEvolution({
      id: draftEvo.evolution!.id,
      episodeId: episode?.id || "",
      patientId: patient.id!,
      professionalId: "prof_luciana",
      evolutionType: "ENFERMAGEM",
      content: "Visita domiciliar inicial. Paciente lúcida, afebril, eupneica. Sem queixas de dispneia. Orientada quanto ao uso correto das medicações prescritas.",
      status: "FINALIZADO",
    });
    expect(finalizedEvo.success).toBe(true);
    expect(finalizedEvo.evolution?.status).toBe("FINALIZADO");

    // Tentativa de alterar evolução já FINALIZADA (Bloqueio de Imutabilidade)
    const illegalEdit = store.saveEvolution({
      id: finalizedEvo.evolution!.id,
      episodeId: episode?.id || "",
      patientId: patient.id!,
      professionalId: "prof_luciana",
      evolutionType: "ENFERMAGEM",
      content: "Tentativa de alteração indevida",
      status: "FINALIZADO",
    });
    expect(illegalEdit.success).toBe(false);
    expect(illegalEdit.error).toContain("imutáveis");

    // 10. Criar Prescrição Médica
    const prescription = store.createPrescription({
      episodeId: episode?.id || "",
      patientId: patient.id!,
      doctorId: "prof_roberta",
      startDate: new Date(),
      status: "ATIVA",
      items: [
        {
          medicationName: "Carvedilol",
          dosage: "12.5",
          unit: "mg",
          route: "ORAL",
          frequency: "12/12h",
          scheduleTimes: ["08:00", "20:00"],
          instructions: "Tomar após as refeições.",
        },
      ],
    });
    expect(prescription.id).toBeDefined();
    expect(prescription.items.length).toBe(1);

    // 11. Registrar Procedimento
    const proc = store.recordProcedure({
      episodeId: episode?.id || "",
      patientId: patient.id!,
      professionalId: "prof_luciana",
      procedureName: "Supervisão e Orientação Terapêutica de Enfermagem",
      executedAt: new Date(),
      quantity: 1,
      notes: "Orientação nutricional sobre hipossódica e hidratação.",
    });
    expect(proc.id).toBeDefined();

    // 12. Solicitar Exame
    const exam = store.requestExam({
      episodeId: episode?.id || "",
      patientId: patient.id!,
      requesterId: "prof_roberta",
      examName: "Eletrocardiograma de Repouso",
      requestedAt: new Date(),
      status: "SOLICITADO",
    });
    expect(exam.id).toBeDefined();

    // 13. Consultar Linha do Tempo Clínica Unificada
    const timeline = store.getClinicalTimeline(patient.id!);
    expect(timeline.length).toBeGreaterThanOrEqual(4);

    // 14. Verificar Trilha de Auditoria Universal
    const logs = store.getAuditLogs();
    expect(logs.some((l) => l.action === "PATIENT_CREATE")).toBe(true);
    expect(logs.some((l) => l.action === "CLINICAL_EVOLUTION_FINALIZE")).toBe(true);
    expect(logs.some((l) => l.action === "VITAL_SIGNS_RECORD")).toBe(true);
  });
});
