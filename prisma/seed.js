const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando o Seed da base de dados do CuraHome CRM...");

  // Limpar tabelas
  await prisma.financialTransaction.deleteMany();
  await prisma.homeSupply.deleteMany();
  await prisma.medicationLog.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.clinicalEvolution.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.professional.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.user.deleteMany();

  // 1. Criar Usuários
  const userAdmin = await prisma.user.create({
    data: {
      name: "Dra. Roberta Mendes",
      email: "roberta.mendes@curahome.com.br",
      passwordHash: "hash_super_seguro",
      role: "ADMIN",
      phone: "(11) 98765-4321",
    },
  });

  const userGestor = await prisma.user.create({
    data: {
      name: "Carlos Eduardo Silva",
      email: "carlos.escala@curahome.com.br",
      passwordHash: "hash_super_seguro",
      role: "GESTOR_ESCALA",
      phone: "(11) 97654-3210",
    },
  });

  // 2. Criar Profissionais de Saúde
  const prof1 = await prisma.professional.create({
    data: {
      fullName: "Mariana Costa Santos",
      cpf: "345.678.901-22",
      councilNumber: "COREN-SP 543210-TE",
      profession: "TEC_ENFERMAGEM",
      phone: "(11) 98111-2233",
      email: "mariana.santos@email.com",
      address: "Rua Vergueiro, 1200",
      neighborhood: "Vila Mariana",
      city: "São Paulo",
      status: "ATIVO",
      specialties: "GTT, Traqueostomia, Aspiração de VAS, Curativos Complexos",
      hourlyRate: 25.0,
      shift12hRate: 220.0,
      pixKey: "mariana.santos@email.com",
    },
  });

  const prof2 = await prisma.professional.create({
    data: {
      fullName: "Luciana Prado Alencar",
      cpf: "234.567.890-11",
      councilNumber: "COREN-SP 432109-ENF",
      profession: "ENFERMEIRO",
      phone: "(11) 98222-3344",
      email: "luciana.enf@email.com",
      address: "Av. Paulista, 900",
      neighborhood: "Bela Vista",
      city: "São Paulo",
      status: "ATIVO",
      specialties: "SVD/SNG, Avaliação de Lesões por Pressão, Cuidados Críticos",
      hourlyRate: 45.0,
      shift12hRate: 350.0,
      pixKey: "23456789011",
    },
  });

  const prof3 = await prisma.professional.create({
    data: {
      fullName: "Dr. Rodrigo Fagundes",
      cpf: "123.456.789-00",
      councilNumber: "CRM-SP 189432",
      profession: "MEDICO",
      phone: "(11) 98333-4455",
      email: "rodrigo.fagundes@email.com",
      address: "Rua Pamplona, 450",
      neighborhood: "Jardins",
      city: "São Paulo",
      status: "ATIVO",
      specialties: "Geriatria, Cuidados Paliativos, Clínica Médica",
      hourlyRate: 150.0,
      shift12hRate: 1200.0,
      pixKey: "12345678900",
    },
  });

  const prof4 = await prisma.professional.create({
    data: {
      fullName: "Juliana Meireles",
      cpf: "456.789.012-33",
      councilNumber: "CREFITO-3 98765-F",
      profession: "FISIOTERAPEUTA",
      phone: "(11) 98444-5566",
      email: "juliana.fisio@email.com",
      address: "Rua Teodoro Sampaio, 800",
      neighborhood: "Pinheiros",
      city: "São Paulo",
      status: "ATIVO",
      specialties: "Fisioterapia Respiratória, Reabilitação Motora Domiciliar",
      hourlyRate: 90.0,
      shift12hRate: 0.0,
      pixKey: "(11) 98444-5566",
    },
  });

  const prof5 = await prisma.professional.create({
    data: {
      fullName: "Ana Paula Nogueira",
      cpf: "567.890.123-44",
      councilNumber: "CUID-SP 12389",
      profession: "CUIDADOR",
      phone: "(11) 98555-6677",
      email: "anapaula.cuid@email.com",
      address: "Av. Santo Amaro, 2300",
      neighborhood: "Moema",
      city: "São Paulo",
      status: "ATIVO",
      specialties: "Idoso Dependente, Higiene no Leito, Auxílio Alimentar",
      hourlyRate: 18.0,
      shift12hRate: 160.0,
      pixKey: "anapaula.cuid@email.com",
    },
  });

  // 3. Criar Leads no Funil Comercial do CRM
  await prisma.lead.create({
    data: {
      patientName: "Geraldo Alcantara",
      contactName: "Patrícia Alcantara (Filha)",
      contactPhone: "(11) 97111-9988",
      contactEmail: "patricia.alcantara@gmail.com",
      city: "São Paulo",
      neighborhood: "Moema",
      source: "PARTICULAR",
      status: "NOVO",
      careType: "PLANTAO_12H",
      complexity: "MEDIA",
      estimatedValue: 6500.0,
      notes: "Paciente com sequelas de AVC recente, necessita de técnico de enfermagem 12h diurno para reabilitação e higiene.",
      assignedToId: userAdmin.id,
    },
  });

  await prisma.lead.create({
    data: {
      patientName: "Helena Bittencourt",
      contactName: "Marcos Bittencourt",
      contactPhone: "(11) 97222-8877",
      contactEmail: "marcos.bit@outlook.com",
      city: "São Paulo",
      neighborhood: "Higienópolis",
      source: "HOSPITAL",
      status: "AVALIACAO_CLINICA",
      careType: "PLANTAO_24H",
      complexity: "ALTA",
      estimatedValue: 14200.0,
      notes: "Em alta hospitalar programada do Hospital Sírio-Libanês. Traqueostomia, sonda GTT e oxigenoterapia contínua.",
      assignedToId: userAdmin.id,
    },
  });

  await prisma.lead.create({
    data: {
      patientName: "Osvaldo Queiroz",
      contactName: "Beatriz Queiroz",
      contactPhone: "(11) 97333-7766",
      contactEmail: "beatriz.q@uol.com.br",
      city: "São Paulo",
      neighborhood: "Perdizes",
      source: "INDICACAO",
      status: "PROPOSTA_ENVIADA",
      careType: "PLANTAO_12H",
      complexity: "BAIXA",
      estimatedValue: 4800.0,
      notes: "Proposta de cuidador 12x36 enviada para a família. Aguardando aprovação.",
      assignedToId: userAdmin.id,
    },
  });

  // 4. Criar Pacientes Ativos
  const patient1 = await prisma.patient.create({
    data: {
      fullName: "Antônio Carlos de Albuquerque",
      cpf: "111.222.333-44",
      birthDate: new Date("1942-05-14"),
      gender: "Masculino",
      diagnosis: "DPOC Grave (GOLD IV), Hipertensão Arterial, Traqueostomizado",
      careComplexity: "ALTA",
      status: "ATIVO",
      address: "Rua Pamplona",
      number: "1420",
      complement: "Apto 82",
      neighborhood: "Jardins",
      city: "São Paulo",
      state: "SP",
      zipCode: "01405-002",
      latitude: -23.5658,
      longitude: -46.6578,
      emergencyContactName: "Cláudia Albuquerque (Filha)",
      emergencyContactPhone: "(11) 99123-4567",
      emergencyContactRel: "Filha",
      doctorInCharge: "Dr. Rodrigo Fagundes",
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      fullName: "Dona Lourdes Vasconcelos",
      cpf: "222.333.444-55",
      birthDate: new Date("1938-11-20"),
      gender: "Feminino",
      diagnosis: "Demência de Alzheimer Avançada, Lesão por Pressão Sacro Grau II",
      careComplexity: "MEDIA",
      status: "ATIVO",
      address: "Alameda dos Anapurus",
      number: "850",
      neighborhood: "Moema",
      city: "São Paulo",
      state: "SP",
      zipCode: "04087-002",
      latitude: -23.6062,
      longitude: -46.6625,
      emergencyContactName: "Eduardo Vasconcelos (Filho)",
      emergencyContactPhone: "(11) 99876-5432",
      emergencyContactRel: "Filho",
      doctorInCharge: "Dra. Cecília Morais",
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      fullName: "Seu Sebastião Miranda",
      cpf: "333.444.555-66",
      birthDate: new Date("1949-03-08"),
      gender: "Masculino",
      diagnosis: "Sequela de AVE Isquêmico, Hemiplegia à Esquerda, Disfagia Neurogênica",
      careComplexity: "MEDIA",
      status: "ATIVO",
      address: "Rua Apiacás",
      number: "320",
      neighborhood: "Perdizes",
      city: "São Paulo",
      state: "SP",
      zipCode: "05017-020",
      latitude: -23.5385,
      longitude: -46.6811,
      emergencyContactName: "Teresa Miranda (Esposa)",
      emergencyContactPhone: "(11) 99765-1122",
      emergencyContactRel: "Esposa",
      doctorInCharge: "Dr. Rodrigo Fagundes",
    },
  });

  // 5. Criar Escalas e Plantões do Dia
  const today = new Date();
  const shiftStartToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 0);
  const shiftEndToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 19, 0);

  const shift1 = await prisma.shift.create({
    data: {
      patientId: patient1.id,
      professionalId: prof1.id,
      shiftType: "DIURNO_12H",
      status: "EM_ANDAMENTO",
      startDateTime: shiftStartToday,
      endDateTime: shiftEndToday,
      checkInTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 6, 55),
      checkInLat: -23.5658,
      checkInLng: -46.6578,
      valuePayable: 220.0,
      valueReceivable: 450.0,
      notes: "Plantão diurno - Checagem de oxigenoterapia e aspiração de TQT conforme rotina.",
    },
  });

  const shift2 = await prisma.shift.create({
    data: {
      patientId: patient2.id,
      professionalId: prof5.id,
      shiftType: "DIURNO_12H",
      status: "EM_ANDAMENTO",
      startDateTime: shiftStartToday,
      endDateTime: shiftEndToday,
      checkInTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 5),
      checkInLat: -23.6062,
      checkInLng: -46.6625,
      valuePayable: 160.0,
      valueReceivable: 320.0,
      notes: "Cuidados diários de higiene, mobilização no leito e hidratação.",
    },
  });

  const shift3 = await prisma.shift.create({
    data: {
      patientId: patient3.id,
      professionalId: prof4.id,
      shiftType: "VISITA_PONTUAL",
      status: "AGENDADO",
      startDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
      endDateTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0),
      valuePayable: 90.0,
      valueReceivable: 180.0,
      notes: "Sessão de fisioterapia motora e treino de marcha assistida.",
    },
  });

  // 6. Criar Evoluções Clínicas e Sinais Vitais Beira-Leito
  await prisma.clinicalEvolution.create({
    data: {
      patientId: patient1.id,
      professionalId: prof1.id,
      shiftId: shift1.id,
      type: "ENFERMAGEM",
      content: "Paciente consciente, orientado em tempo e espaço. Mantendo ventilação em ar ambiente com suporte de O2 a 2L/min via macronebulização em TQT. Cânula sem sinais flogísticos. Realizada aspiração de cânula com saída de secreção mucoide esbranquiçada em média quantidade. Diurese clara via cateter. Aceitou dieta pastosa ofertada por via oral sem episódios de engasgo.",
      systolicBP: 125,
      diastolicBP: 80,
      heartRate: 74,
      temperature: 36.4,
      oxygenSaturation: 97,
      bloodGlucose: 108,
      painScore: 0,
      dietAcceptance: "BOA",
      diuresis: "PRESENTE",
      bowelMovement: "PRESENTE",
      intercurrences: "Sem intercorrências no período matutino.",
    },
  });

  await prisma.clinicalEvolution.create({
    data: {
      patientId: patient2.id,
      professionalId: prof2.id,
      type: "ENFERMAGEM",
      content: "Visita de supervisão de enfermagem. Realizado curativo em região sacra (LPP grau II) com hidrogel e placa de hidrocoloide. Lesão com leito 80% granulação, bordas íntegras, sem secreção purulenta. Orientado cuidador sobre mudança de decúbito rigorosa de 2 em 2 horas.",
      systolicBP: 130,
      diastolicBP: 85,
      heartRate: 68,
      temperature: 36.6,
      oxygenSaturation: 96,
      painScore: 2,
      dietAcceptance: "PARCIAL",
      diuresis: "PRESENTE",
      bowelMovement: "AUSENTE",
    },
  });

  // 7. Criar Prescrições de Medicamentos
  const presc1 = await prisma.prescription.create({
    data: {
      patientId: patient1.id,
      medicationName: "Brometo de Ipratrópio + Fenoterol",
      dosage: "20 gotas + 3ml SF 0.9%",
      route: "INALATORIA",
      frequency: "8/8h",
      instructions: "Inalação via TQT às 06h, 14h e 22h.",
      active: true,
    },
  });

  const presc2 = await prisma.prescription.create({
    data: {
      patientId: patient1.id,
      medicationName: "Losartana Potássica",
      dosage: "50mg",
      route: "ORAL",
      frequency: "1x ao dia",
      instructions: "Administrar pela manhã em jejum com água.",
      active: true,
    },
  });

  const presc3 = await prisma.prescription.create({
    data: {
      patientId: patient2.id,
      medicationName: "Donepezila",
      dosage: "10mg",
      route: "ORAL",
      frequency: "1x ao dia à noite",
      instructions: "Administrar após o jantar.",
      active: true,
    },
  });

  // Registro de administração
  await prisma.medicationLog.create({
    data: {
      prescriptionId: presc1.id,
      professionalId: prof1.id,
      scheduledTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 6, 0),
      administeredAt: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 6, 15),
      status: "ADMINISTRADO",
      notes: "Inalação realizada com boa tolerância, SpO2 subiu para 98%.",
    },
  });

  // 8. Equipamentos e Estoque no Domicílio
  await prisma.homeSupply.create({
    data: {
      patientId: patient1.id,
      itemName: "Concentrador de Oxigênio 5L Philips EverFlo",
      category: "EQUIPAMENTO",
      quantity: 1,
      unit: "UN",
      serialNumber: "SN-984210",
      status: "EM_USO",
    },
  });

  await prisma.homeSupply.create({
    data: {
      patientId: patient1.id,
      itemName: "Aspirador de Secreção Cirúrgico Portátil",
      category: "EQUIPAMENTO",
      quantity: 1,
      unit: "UN",
      serialNumber: "ASP-44321",
      status: "EM_USO",
    },
  });

  await prisma.homeSupply.create({
    data: {
      patientId: patient2.id,
      itemName: "Colchão Pneumático Anti-escaras com Motor",
      category: "EQUIPAMENTO",
      quantity: 1,
      unit: "UN",
      serialNumber: "CP-12009",
      status: "EM_USO",
    },
  });

  // 9. Transações Financeiras (Faturamento e Repasse)
  await prisma.financialTransaction.create({
    data: {
      type: "RECEITA_PARTICULAR",
      status: "PAGO",
      amount: 6800.0,
      dueDate: new Date(today.getFullYear(), today.getMonth(), 5),
      paymentDate: new Date(today.getFullYear(), today.getMonth(), 4),
      description: "Mensalidade Home Care - Paciente Antônio Carlos (Mês Referência)",
      patientId: patient1.id,
    },
  });

  await prisma.financialTransaction.create({
    data: {
      type: "DESPESA_REPASSE",
      status: "PENDENTE",
      amount: 2200.0,
      dueDate: new Date(today.getFullYear(), today.getMonth(), 10),
      description: "Repasse de Plantões - Mariana Costa Santos",
      professionalId: prof1.id,
    },
  });

  await prisma.financialTransaction.create({
    data: {
      type: "RECEITA_PARTICULAR",
      status: "PENDENTE",
      amount: 4900.0,
      dueDate: new Date(today.getFullYear(), today.getMonth(), 15),
      description: "Mensalidade Home Care - Dona Lourdes Vasconcelos",
      patientId: patient2.id,
    },
  });

  console.log("Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
