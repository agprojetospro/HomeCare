"use client";

import { useState, useEffect, use } from "react";
import { store } from "@/services/store.service";
import { Patient } from "@/domain/patient/patient.schema";
import {
  ClinicalEvolution,
  Prescription,
  VitalSigns,
  Procedure,
  Exam,
  evaluateVitalSignAlerts,
} from "@/domain/pep/pep.schema";
import { ClinicalScoreResult } from "@/domain/clinical-score/news2.schema";
import {
  WoundEvaluation,
  PatientOxygenTherapy,
  calculateOxygenAutonomy,
  evaluateWoundHealingProgress,
} from "@/domain/supplies/supplies.schema";
import { authorizePatientAccess } from "@/domain/security/rbac";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Stethoscope,
  Activity,
  HeartPulse,
  Pill,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShieldCheck,
  PlusCircle,
  History,
  FileCheck,
  Copy,
  Syringe,
  Microscope,
  FileSpreadsheet,
  Lock,
  ArrowLeft,
  AlertCircle,
  Flame,
  Bandage,
  Gauge,
} from "lucide-react";
import Link from "next/link";
import { formatDate, formatDateTime, formatTime } from "@/lib/utils";

export default function PatientPEPPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const patientId = resolvedParams.id;

  const [currentUser, setCurrentUser] = useState(store.currentUser);
  const [patient, setPatient] = useState<Patient | undefined>(undefined);
  const [episode, setEpisode] = useState(store.getEpisodeByPatientId(patientId));
  const [triage, setTriage] = useState(store.getTriages(patientId)[0]);
  const [carePlans, setCarePlans] = useState(store.getCarePlans(patientId));
  const [shifts, setShifts] = useState(store.getShifts());

  // Dados do PEP
  const [evolutions, setEvolutions] = useState<ClinicalEvolution[]>([]);
  const [vitals, setVitals] = useState<VitalSigns[]>([]);
  const [news2Scores, setNews2Scores] = useState<ClinicalScoreResult[]>(store.getNews2Scores(patientId));
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [timeline, setTimeline] = useState(store.getClinicalTimeline(patientId));
  const [wounds, setWounds] = useState<WoundEvaluation[]>(store.getWoundEvaluations(patientId));
  const [oxygenTherapy, setOxygenTherapy] = useState<PatientOxygenTherapy | undefined>(store.getPatientOxygenTherapy(patientId));

  // Modais
  const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState(false);
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isProcedureModalOpen, setIsProcedureModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isMedAdminModalOpen, setIsMedAdminModalOpen] = useState(false);
  const [isWoundModalOpen, setIsWoundModalOpen] = useState(false);
  const [isOxygenPressureModalOpen, setIsOxygenPressureModalOpen] = useState(false);
  const [newPressureInput, setNewPressureInput] = useState<number>(oxygenTherapy?.currentPressureBar || 100);
  const [selectedMedItem, setSelectedMedItem] = useState<{ prescId: string; item: any } | null>(null);
  const [medAdminForm, setMedAdminForm] = useState({
    status: "ADMINISTRADO" as "ADMINISTRADO" | "RECUSADO" | "SUSPENSO",
    batchNumber: "",
    refusalReason: "",
    notes: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forms
  const [evolutionForm, setEvolutionForm] = useState({
    evolutionType: "ENFERMAGEM" as const,
    content: "",
    status: "FINALIZADO" as "RASCUNHO" | "FINALIZADO",
  });

  const [vitalsForm, setVitalsForm] = useState({
    systolicBp: 120,
    diastolicBp: 80,
    heartRate: 75,
    respiratoryRate: 18,
    oxygenSaturation: 96,
    temperature: 36.5,
    bloodGlucose: 100,
    painScore: 0,
  });

  const [prescForm, setPrescForm] = useState({
    medicationName: "",
    dosage: "",
    unit: "mg",
    route: "ORAL" as const,
    frequency: "8/8h",
    instructions: "",
  });

  const [procForm, setProcForm] = useState({
    procedureName: "",
    quantity: 1,
    notes: "",
    materialName: "",
    materialQty: 1,
  });

  const [examForm, setExamForm] = useState({
    examName: "",
  });

  const [woundForm, setWoundForm] = useState({
    woundIdentifier: "Lesão por Pressão 1 — Região Sacral",
    location: "SACRO" as const,
    stage: "ESTAGIO_3" as const,
    lengthCm: 4.0,
    widthCm: 3.0,
    depthCm: 0.6,
    granulationPercent: 75,
    sloughPercent: 15,
    necrosisPercent: 0,
    epithelializationPercent: 10,
    exudateAmount: "MODERADO" as const,
    exudateType: "SEROSO" as const,
    odorPresent: false,
    painScoreVisualScale: 2,
    edgesCondition: "Íntegras",
    prescribedCovering: "ESPUMA_DE_POLIURETANO_SILICONE" as const,
    secondaryCovering: "Película protetora",
    cleaningSolution: "Soro Fisiológico 0,9% em jatos mornos",
    dressingChangeFrequencyHours: 48,
    clinicalNotes: "Evolução favorável com aumento do tecido de granulação e redução das dimensões.",
  });

  const [authCheck, setAuthCheck] = useState<{ authorized: boolean; reason?: string }>({ authorized: true });

  useEffect(() => {
    store.initClient();
    const p = store.getPatientById(patientId);
    setPatient(p);
    setAuthCheck(store.canAccessPatient(patientId));
    setEpisode(store.getEpisodeByPatientId(patientId));
    setTriage(store.getTriages(patientId)[0]);
    setCarePlans(store.getCarePlans(patientId));
    setEvolutions(store.getEvolutions(patientId));
    setVitals(store.getVitals(patientId));
    setPrescriptions(store.getPrescriptions(patientId));
    setProcedures(store.getProcedures(patientId));
    setExams(store.getExams(patientId));
    setTimeline(store.getClinicalTimeline(patientId));
    setWounds(store.getWoundEvaluations(patientId));
    setOxygenTherapy(store.getPatientOxygenTherapy(patientId));
    setCurrentUser(store.currentUser);
  }, [patientId]);

  if (!patient) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-slate-500">Paciente não encontrado.</p>
        <Link href="/pep">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar aos Meus Pacientes
          </Button>
        </Link>
      </div>
    );
  }

  // Se o profissional não possui vínculo e não for Admin -> Bloqueio Anti-IDOR
  if (!authCheck.authorized) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-red-200 rounded-2xl shadow-xl text-center space-y-4 animate-in fade-in">
        <div className="h-14 w-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Acesso Restrito ao Prontuário</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          {authCheck.reason || "Você não possui vínculo assistencial ativo com este paciente."}
        </p>
        <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-500 font-mono">
          Tentativa de acesso auditada sob usuário: {currentUser.name} ({currentUser.role})
        </div>
        <Link href="/pep">
          <Button className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar aos Meus Pacientes
          </Button>
        </Link>
      </div>
    );
  }

  const doctorInCharge = episode?.doctorInChargeId ? store.getProfessionalById(episode.doctorInChargeId) : null;
  const nurseInCharge = episode?.nurseInChargeId ? store.getProfessionalById(episode.nurseInChargeId) : null;
  const latestVitals = vitals[0];
  const vitalAlerts = latestVitals ? evaluateVitalSignAlerts(latestVitals) : [];

  // Handlers
  const handleSaveEvolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evolutionForm.content.trim()) return;

    const res = store.saveEvolution({
      episodeId: episode?.id || "",
      patientId: patient.id!,
      professionalId: currentUser.professionalId || "prof_anon",
      evolutionType: evolutionForm.evolutionType as any,
      content: evolutionForm.content,
      status: evolutionForm.status,
    });

    if (!res.success) {
      setErrorMessage(res.error || "Erro ao salvar evolução.");
      return;
    }

    setEvolutions(store.getEvolutions(patientId));
    setTimeline(store.getClinicalTimeline(patientId));
    setIsEvolutionModalOpen(false);
    setEvolutionForm({ evolutionType: "ENFERMAGEM", content: "", status: "FINALIZADO" });
  };

  const handleRecordVitals = (e: React.FormEvent) => {
    e.preventDefault();
    store.recordVitals({
      episodeId: episode?.id || "",
      patientId: patient.id!,
      professionalId: currentUser.professionalId || "prof_anon",
      measuredAt: new Date(),
      ...vitalsForm,
    });

    setVitals(store.getVitals(patientId));
    setNews2Scores(store.getNews2Scores(patientId));
    setTimeline(store.getClinicalTimeline(patientId));
    setIsVitalsModalOpen(false);
  };

  const handleCreatePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescForm.medicationName) return;

    store.createPrescription({
      episodeId: episode?.id || "",
      patientId: patient.id!,
      doctorId: currentUser.professionalId || "prof_roberta",
      startDate: new Date(),
      status: "ATIVA",
      items: [
        {
          medicationName: prescForm.medicationName,
          dosage: prescForm.dosage,
          unit: prescForm.unit,
          route: prescForm.route,
          frequency: prescForm.frequency,
          instructions: prescForm.instructions,
          scheduleTimes: ["08:00", "16:00", "00:00"],
        },
      ],
    });

    setPrescriptions(store.getPrescriptions(patientId));
    setTimeline(store.getClinicalTimeline(patientId));
    setIsPrescriptionModalOpen(false);
    setPrescForm({ medicationName: "", dosage: "", unit: "mg", route: "ORAL", frequency: "8/8h", instructions: "" });
  };

  const handleRecordProcedure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!procForm.procedureName) return;

    store.recordProcedure({
      episodeId: episode?.id || "",
      patientId: patient.id!,
      professionalId: currentUser.professionalId || "prof_anon",
      procedureName: procForm.procedureName,
      executedAt: new Date(),
      quantity: procForm.quantity,
      notes: procForm.notes,
      materialsUsed: procForm.materialName
        ? [{ materialName: procForm.materialName, quantity: procForm.materialQty, unit: "UN" }]
        : [],
    });

    setProcedures(store.getProcedures(patientId));
    setTimeline(store.getClinicalTimeline(patientId));
    setIsProcedureModalOpen(false);
    setProcForm({ procedureName: "", quantity: 1, notes: "", materialName: "", materialQty: 1 });
  };

  const handleRequestExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.examName) return;

    store.requestExam({
      episodeId: episode?.id || "",
      patientId: patient.id!,
      requesterId: currentUser.professionalId || "prof_roberta",
      examName: examForm.examName,
      requestedAt: new Date(),
      status: "SOLICITADO",
    });

    setExams(store.getExams(patientId));
    setTimeline(store.getClinicalTimeline(patientId));
    setIsExamModalOpen(false);
    setExamForm({ examName: "" });
  };

  const handleRecordMedAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedItem || !patient) return;

    store.recordMedicationAdministration({
      episodeId: episode?.id || `ep_${patientId}`,
      patientId: patient.id!,
      prescriptionId: selectedMedItem.prescId,
      medicationName: selectedMedItem.item.medicationName,
      dosage: `${selectedMedItem.item.dosage} ${selectedMedItem.item.unit}`,
      route: selectedMedItem.item.route,
      status: medAdminForm.status,
      administeredById: currentUser.professionalId || currentUser.id,
      batchNumber: medAdminForm.batchNumber || undefined,
      refusalReason: medAdminForm.status !== "ADMINISTRADO" ? medAdminForm.refusalReason : undefined,
      notes: medAdminForm.notes || undefined,
    });

    setTimeline(store.getClinicalTimeline(patientId));
    setIsMedAdminModalOpen(false);
    setSelectedMedItem(null);
    setMedAdminForm({
      status: "ADMINISTRADO",
      batchNumber: "",
      refusalReason: "",
      notes: "",
    });
  };

  const handleRecordWoundEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;
    setErrorMessage(null);

    const totalTissue =
      Number(woundForm.granulationPercent) +
      Number(woundForm.sloughPercent) +
      Number(woundForm.necrosisPercent) +
      Number(woundForm.epithelializationPercent);

    if (totalTissue > 100) {
      setErrorMessage(`A soma dos tecidos (${totalTissue}%) não pode ultrapassar 100%.`);
      return;
    }

    store.recordWoundEvaluation({
      patientId: patient.id!,
      episodeId: episode?.id || `ep_${patientId}`,
      professionalId: currentUser.professionalId || "prof_mariana",
      woundIdentifier: woundForm.woundIdentifier,
      location: woundForm.location,
      stage: woundForm.stage,
      lengthCm: Number(woundForm.lengthCm),
      widthCm: Number(woundForm.widthCm),
      depthCm: Number(woundForm.depthCm),
      granulationPercent: Number(woundForm.granulationPercent),
      sloughPercent: Number(woundForm.sloughPercent),
      necrosisPercent: Number(woundForm.necrosisPercent),
      epithelializationPercent: Number(woundForm.epithelializationPercent),
      exudateAmount: woundForm.exudateAmount,
      exudateType: woundForm.exudateType,
      odorPresent: woundForm.odorPresent,
      painScoreVisualScale: Number(woundForm.painScoreVisualScale),
      edgesCondition: woundForm.edgesCondition,
      prescribedCovering: woundForm.prescribedCovering,
      secondaryCovering: woundForm.secondaryCovering,
      cleaningSolution: woundForm.cleaningSolution,
      dressingChangeFrequencyHours: Number(woundForm.dressingChangeFrequencyHours),
      healingEvolutionStatus: "ESTAVEL",
      clinicalNotes: woundForm.clinicalNotes,
      evaluatedAt: new Date(),
    });

    setWounds(store.getWoundEvaluations(patientId));
    setTimeline(store.getClinicalTimeline(patientId));
    setIsWoundModalOpen(false);
  };

  const handleRecordOxygenCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patient) return;

    store.recordOxygenPressureCheck(patient.id!, Number(newPressureInput));
    setOxygenTherapy(store.getPatientOxygenTherapy(patientId));
    setTimeline(store.getClinicalTimeline(patientId));
    setIsOxygenPressureModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ------------------------------------------------------------- */}
      {/* CABEÇALHO CLÍNICO FIXO CONTEXTUAL DO PACIENTE */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        {/* Linha Superior: Identificação e Alertas */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link href="/pep" className="text-slate-400 hover:text-slate-700 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {patient.fullName}
              </h1>
              <Badge variant="teal" className="text-xs font-mono">
                PEP #{patient.id}
              </Badge>
              <Badge variant={patient.status === "ATIVO" ? "success" : "secondary"}>
                {patient.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 pl-8">
              Nascimento: {formatDate(patient.birthDate)} • CPF: {patient.cpf || "Sem CPF"} • Mãe: {patient.motherName}
            </p>
          </div>

          {/* Quick Clinical CTA Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={() => setIsVitalsModalOpen(true)} className="gap-1.5 text-xs bg-teal-600 hover:bg-teal-700">
              <HeartPulse className="h-3.5 w-3.5" />
              Aferir Sinais
            </Button>
            <Button size="sm" onClick={() => setIsEvolutionModalOpen(true)} className="gap-1.5 text-xs bg-slate-900 hover:bg-slate-800">
              <FileText className="h-3.5 w-3.5" />
              Nova Evolução
            </Button>
            {currentUser.role === "MEDICO" && (
              <Button size="sm" onClick={() => setIsPrescriptionModalOpen(true)} className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700">
                <Pill className="h-3.5 w-3.5" />
                Nova Prescrição
              </Button>
            )}
          </div>
        </div>

        {/* Linha de Contexto Clínico Integrado */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="space-y-0.5">
            <span className="text-slate-400 font-medium">Diagnóstico Principal</span>
            <p className="font-semibold text-slate-800 line-clamp-1">
              {triage?.mainDiagnosis || "Em avaliação"}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 font-medium">CID-10 Principal</span>
            <p className="font-semibold text-teal-800 font-mono">
              {triage?.cid10 || "N/A"}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 font-medium">Alergias Clínicas</span>
            <div>
              {patient.allergies && patient.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {patient.allergies.map((al, idx) => (
                    <Badge key={idx} variant="destructive" className="text-[10px] py-0">
                      {al}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-slate-500 font-medium">Nega alergias</span>
              )}
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 font-medium">Tipo de Atendimento</span>
            <p className="font-semibold text-slate-800">
              {episode?.careType.replace(/_/g, " ")}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 font-medium">Médico Responsável</span>
            <p className="font-semibold text-slate-800 truncate">
              {doctorInCharge?.fullName || "Dr. Designado"}
            </p>
          </div>

          <div className="space-y-0.5">
            <span className="text-slate-400 font-medium">Enfermeira Supervisora</span>
            <p className="font-semibold text-slate-800 truncate">
              {nurseInCharge?.fullName || "Enf. Designada"}
            </p>
          </div>
        </div>

        {/* Alerta de Descompensação Ativo */}
        {vitalAlerts.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-800 text-xs animate-in fade-in">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <span className="font-bold block">Alerta Clínico Beira-Leito:</span>
              <span>{vitalAlerts.map((a) => a.message).join(" • ")}</span>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ABAS DO PRONTUÁRIO ELETRÔNICO DO PACIENTE */}
      {/* ------------------------------------------------------------- */}
      <Tabs defaultValue="resumo" className="space-y-4">
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-xs overflow-x-auto max-w-full justify-start">
          <TabsTrigger value="resumo" className="gap-1.5 text-xs">
            <Activity className="h-3.5 w-3.5" /> Resumo
          </TabsTrigger>
          <TabsTrigger value="oxigenio" className="gap-1.5 text-xs">
            <Flame className="h-3.5 w-3.5 text-amber-500" /> Oxigênio (O₂)
          </TabsTrigger>
          <TabsTrigger value="curativos" className="gap-1.5 text-xs">
            <Bandage className="h-3.5 w-3.5 text-teal-600" /> Curativos ({wounds.length})
          </TabsTrigger>
          <TabsTrigger value="evolucao" className="gap-1.5 text-xs">
            <FileText className="h-3.5 w-3.5" /> Evolução ({evolutions.length})
          </TabsTrigger>
          <TabsTrigger value="prescricao" className="gap-1.5 text-xs">
            <Pill className="h-3.5 w-3.5" /> Prescrição ({prescriptions.length})
          </TabsTrigger>
          <TabsTrigger value="sinais" className="gap-1.5 text-xs">
            <HeartPulse className="h-3.5 w-3.5" /> Sinais Vitais ({vitals.length})
          </TabsTrigger>
          <TabsTrigger value="procedimentos" className="gap-1.5 text-xs">
            <Syringe className="h-3.5 w-3.5" /> Procedimentos ({procedures.length})
          </TabsTrigger>
          <TabsTrigger value="exames" className="gap-1.5 text-xs">
            <Microscope className="h-3.5 w-3.5" /> Exames ({exams.length})
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-1.5 text-xs">
            <History className="h-3.5 w-3.5" /> Linha do Tempo ({timeline.length})
          </TabsTrigger>
        </TabsList>

        {/* 1. ABA RESUMO */}
        <TabsContent value="resumo" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Últimos Sinais Vitais */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <HeartPulse className="h-4 w-4 text-teal-600" /> Sinais Vitais Recentes
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => setIsVitalsModalOpen(true)} className="h-7 text-xs text-teal-700">
                    Aferir
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {latestVitals ? (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">PA (Pressão)</span>
                      <span className="text-base font-bold text-slate-900">{latestVitals.systolicBp}x{latestVitals.diastolicBp}</span>
                      <span className="text-[10px] text-slate-400 ml-1">mmHg</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">SpO2 (Saturação)</span>
                      <span className={`text-base font-bold ${latestVitals.oxygenSaturation < 90 ? "text-red-600" : "text-slate-900"}`}>
                        {latestVitals.oxygenSaturation}%
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Frequência Cardíaca</span>
                      <span className="text-base font-bold text-slate-900">{latestVitals.heartRate}</span>
                      <span className="text-[10px] text-slate-400 ml-1">bpm</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Temperatura</span>
                      <span className="text-base font-bold text-slate-900">{latestVitals.temperature}°C</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">Nenhum sinal aferido hoje.</p>
                )}
              </CardContent>
            </Card>

            {/* Dispositivos Invasivos & Suportes */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-teal-600" /> Dispositivos & Suportes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {triage?.devices && triage.devices.length > 0 ? (
                  <div className="space-y-2">
                    {triage.devices.map((d, i) => (
                      <div key={i} className="p-2 rounded-lg bg-teal-50/60 border border-teal-100 text-xs font-semibold text-teal-900 flex items-center justify-between">
                        <span>{d}</span>
                        <Badge variant="teal" className="text-[10px]">Ativo</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">Sem dispositivos invasivos.</p>
                )}
              </CardContent>
            </Card>

            {/* Contatos & Endereço Domiciliar */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-teal-600" /> Residência & Localização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs pt-2">
                <p className="font-semibold text-slate-900">
                  {patient.addressStreet}, {patient.addressNumber} {patient.addressComplement && `(${patient.addressComplement})`}
                </p>
                <p className="text-slate-600">
                  {patient.addressNeighborhood} — {patient.addressCity}/{patient.addressState}
                </p>
                <p className="text-slate-500 font-mono">CEP: {patient.addressZip}</p>
              </CardContent>
            </Card>
          </div>

          {/* Plano Assistencial Vigente */}
          {carePlans.length > 0 && (
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileCheck className="h-4 w-4 text-teal-600" />
                  Plano Assistencial Vigente (Versão {carePlans[0].version})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Frequência</TableHead>
                      <TableHead>Prescrição / Procedimentos de Cuidado</TableHead>
                      <TableHead>Meta Terapêutica</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {carePlans[0].items.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell className="font-semibold text-slate-900">
                          {it.professionType.replace("_", " ")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {it.frequency}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700">
                          {it.procedureDescription}
                        </TableCell>
                        <TableCell className="text-xs text-teal-800 italic">
                          {it.goals || "Manutenção clínica"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ABA OXIGENOTERAPIA */}
        <TabsContent value="oxigenio" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Oxigenoterapia & Autonomia Residual</h3>
              <p className="text-xs text-slate-500">Monitoramento beira-leito, pressão manométrica e cálculo de autonomia física</p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsOxygenPressureModalOpen(true)}
              className="gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Gauge className="h-3.5 w-3.5" /> Aferir Pressão de O₂
            </Button>
          </div>

          {oxygenTherapy ? (
            (() => {
              const calc = calculateOxygenAutonomy(
                oxygenTherapy.currentPressureBar || 0,
                oxygenTherapy.flowRateLpm,
                oxygenTherapy.cylinderFactorK || 1.0,
                new Date()
              );
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="border-slate-200/80 shadow-xs md:col-span-2 space-y-4 p-5">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <div className="text-xs text-slate-500 font-medium">Prescrição Terapêutica de O₂</div>
                        <div className="text-lg font-bold text-slate-900 mt-0.5">
                          {oxygenTherapy.flowRateLpm} L/min • {oxygenTherapy.deliveryInterface.replace(/_/g, " ")}
                        </div>
                      </div>
                      <Badge variant={calc.status === "CRITICO" ? "destructive" : calc.status === "ATENCAO" ? "warning" : "success"}>
                        {calc.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block font-medium">Fonte de Suprimento</span>
                        <span className="font-bold text-slate-900">{oxygenTherapy.sourceType.replace(/_/g, " ")}</span>
                        {oxygenTherapy.cylinderType && (
                          <span className="block text-slate-500 text-[11px] font-mono mt-0.5">
                            {oxygenTherapy.cylinderType} (K={oxygenTherapy.cylinderFactorK})
                          </span>
                        )}
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block font-medium">Horas de Uso / Dia</span>
                        <span className="font-bold text-slate-900">{oxygenTherapy.usageHoursPerDay} horas / dia</span>
                        <span className="block text-teal-700 text-[11px] mt-0.5">
                          {oxygenTherapy.backupCylinderAvailable ? "Cilindro Reserva Disponível" : "Sem reserva"}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                        <span className="flex items-center gap-1.5">
                          <Gauge className="h-4 w-4 text-amber-600" />
                          Pressão Mensurada no Cilindro
                        </span>
                        <span className="font-mono text-sm">{oxygenTherapy.currentPressureBar || 0} / {oxygenTherapy.nominalPressureBar || 150} bar</span>
                      </div>

                      <div className="w-full bg-amber-200/60 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            (oxygenTherapy.currentPressureBar || 0) < 30 ? "bg-red-500" : (oxygenTherapy.currentPressureBar || 0) < 60 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, (((oxygenTherapy.currentPressureBar || 0) / (oxygenTherapy.nominalPressureBar || 150)) * 100))}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-amber-800 font-medium pt-1">
                        <span>Autonomia Estimada: <strong>{calc.autonomyHours} horas</strong> ({calc.autonomyMinutes} min)</span>
                        <span>{calc.totalUsableLiters}L utilizáveis</span>
                      </div>
                      <div className="text-[11px] text-amber-700 italic">{calc.alertMessage}</div>
                    </div>

                    {oxygenTherapy.notes && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                        <strong>Conduta Assistencial:</strong> {oxygenTherapy.notes}
                      </div>
                    )}
                  </Card>

                  <Card className="border-slate-200/80 shadow-xs p-5 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Diretrizes de Segurança</h4>
                    <ul className="text-xs text-slate-600 space-y-2 list-disc pl-4">
                      <li>Manter cilindro na vertical em suporte seguro, longe de fontes de calor.</li>
                      <li>Aferir manômetro a cada visita ou troca de plantão.</li>
                      <li>Programar recarga preventiva quando pressão atingir menos de 50 bar.</li>
                      <li>Manter umidificador com água estéril no nível adequado.</li>
                    </ul>
                  </Card>
                </div>
              );
            })()
          ) : (
            <Card className="border-slate-200 p-8 text-center text-slate-500">
              <p className="text-xs">Paciente sem prescrição de oxigenoterapia ativa cadastrada.</p>
            </Card>
          )}
        </TabsContent>

        {/* ABA CURATIVOS & LESÕES POR PRESSÃO (NPUAP) */}
        <TabsContent value="curativos" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Protocolo de Avaliação & Curativos de Lesões (NPUAP)</h3>
              <p className="text-xs text-slate-500">Classificação por estadiamento, dimensões, tecido do leito e conduta de cobertura</p>
            </div>
            <Button
              size="sm"
              onClick={() => setIsWoundModalOpen(true)}
              className="gap-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white"
            >
              <PlusCircle className="h-3.5 w-3.5" /> Nova Avaliação de Ferida
            </Button>
          </div>

          <div className="space-y-4">
            {wounds.map((w, idx) => {
              const prevWound = wounds[idx + 1];
              const healing = evaluateWoundHealingProgress(prevWound, w);
              const author = store.getProfessionalById(w.professionalId);
              return (
                <Card key={w.id} className="border-slate-200/80 shadow-xs">
                  <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="teal" className="text-xs font-semibold">
                          {w.woundIdentifier}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {w.stage.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-xs text-slate-500 font-mono">
                          Local: {w.location.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={w.healingEvolutionStatus === "MELHORA" ? "success" : w.healingEvolutionStatus === "PIORA" ? "destructive" : "secondary"}
                          className="text-[10px]"
                        >
                          {w.healingEvolutionStatus}
                        </Badge>
                        <span className="text-xs text-slate-400">{formatDateTime(w.evaluatedAt)}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block font-medium">Dimensões (CxLxP)</span>
                        <span className="text-sm font-bold text-slate-900 mt-0.5 block">
                          {w.lengthCm} x {w.widthCm} x {w.depthCm || 0} cm
                        </span>
                        <span className="text-[11px] text-teal-700 font-mono">Área: {w.areaCm2 || (w.lengthCm * w.widthCm).toFixed(2)} cm²</span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block font-medium">Tecido no Leito</span>
                        <div className="text-[11px] font-medium text-slate-800 mt-0.5 space-y-0.5">
                          <div>Granulação: <strong className="text-emerald-700">{w.granulationPercent}%</strong></div>
                          <div>Esfacelo: <strong className="text-amber-700">{w.sloughPercent}%</strong></div>
                          {w.necrosisPercent > 0 && <div>Necrose: <strong className="text-red-700">{w.necrosisPercent}%</strong></div>}
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-slate-400 block font-medium">Exsudato & Odor</span>
                        <span className="font-bold text-slate-900 block mt-0.5">
                          {w.exudateAmount} • {w.exudateType}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {w.odorPresent ? "Com odor fétido" : "Sem odor fétido"} • Dor: {w.painScoreVisualScale}/10
                        </span>
                      </div>

                      <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100">
                        <span className="text-teal-700 block font-medium">Cobertura Prescrita</span>
                        <span className="font-bold text-slate-900 block mt-0.5">
                          {w.prescribedCovering.replace(/_/g, " ")}
                        </span>
                        <span className="text-[11px] text-slate-600 block mt-0.5">
                          Troca a cada {w.dressingChangeFrequencyHours}h
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg text-xs border border-slate-200/60 space-y-1">
                      <div className="flex items-center justify-between text-slate-700">
                        <span><strong>Evolução Comparativa:</strong> {healing.summary}</span>
                        <span className="text-slate-400 font-mono">Avaliador: {author?.fullName || "Enf. Assistencial"}</span>
                      </div>
                      {w.clinicalNotes && <p className="text-slate-600 italic pt-1">{w.clinicalNotes}</p>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* 2. ABA EVOLUÇÃO CLÍNICA */}
        <TabsContent value="evolucao" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Evoluções Clínicas Registradas</h3>
            <Button size="sm" onClick={() => setIsEvolutionModalOpen(true)} className="gap-1.5 text-xs">
              <PlusCircle className="h-3.5 w-3.5" /> Nova Evolução
            </Button>
          </div>

          <div className="space-y-3">
            {evolutions.map((evo) => {
              const author = store.getProfessionalById(evo.professionalId);
              return (
                <Card key={evo.id} className="border-slate-200/80 shadow-xs">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="teal" className="text-xs font-semibold">
                          Evolução de {evo.evolutionType.replace("_", " ")}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {formatDateTime(evo.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {evo.status === "FINALIZADO" ? (
                          <Badge variant="success" className="gap-1 text-[10px]">
                            <Lock className="h-3 w-3" /> Registro Finalizado & Imutável
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            Rascunho
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="text-xs font-medium text-slate-700">
                      Profissional: {author?.fullName || evo.professionalId} ({author?.councilType}-{author?.councilUf} {author?.councilNumber})
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {evo.content}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* 3. ABA PRESCRIÇÃO */}
        <TabsContent value="prescricao" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Prescrições Médicas & Aprazamento</h3>
            {currentUser.role === "MEDICO" && (
              <Button size="sm" onClick={() => setIsPrescriptionModalOpen(true)} className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700">
                <PlusCircle className="h-3.5 w-3.5" /> Prescrever Medicamento
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {prescriptions.map((presc) => (
              <Card key={presc.id} className="border-slate-200/80 shadow-xs">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-800">
                      Prescrição Médica Ativa
                    </CardTitle>
                    <Badge variant="success" className="text-xs">
                      {presc.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Início: {formatDate(presc.startDate)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medicamento / Solução</TableHead>
                        <TableHead>Dosagem</TableHead>
                        <TableHead>Via</TableHead>
                        <TableHead>Frequência / Horários</TableHead>
                        <TableHead>Instruções</TableHead>
                        <TableHead className="text-right">Ação Beira-Leito</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {presc.items.map((it) => (
                        <TableRow key={it.id}>
                          <TableCell className="font-semibold text-slate-900">
                            {it.medicationName}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {it.dosage} {it.unit}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[10px]">
                              {it.route}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-teal-800">
                            {it.frequency}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {it.instructions || "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedMedItem({ prescId: presc.id || "", item: it });
                                setIsMedAdminModalOpen(true);
                              }}
                              className="text-xs gap-1 border-teal-600 text-teal-700 hover:bg-teal-50"
                            >
                              <Syringe className="h-3.5 w-3.5" /> Checar Dose
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 4. ABA SINAIS VITAIS & NEWS2 */}
        <TabsContent value="sinais" className="space-y-4">
          {/* Card de Estratificação NEWS2-BR */}
          {news2Scores.length > 0 && (
            <Card
              className={`border transition-all ${
                news2Scores[0].riskLevel === "HIGH"
                  ? "border-red-300 bg-red-50/50"
                  : news2Scores[0].riskLevel === "MEDIUM" || news2Scores[0].riskLevel === "LOW_MEDIUM"
                  ? "border-amber-300 bg-amber-50/50"
                  : "border-emerald-300 bg-emerald-50/50"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl text-white font-mono font-bold text-lg flex items-center justify-center ${
                        news2Scores[0].riskLevel === "HIGH"
                          ? "bg-red-600 animate-pulse"
                          : news2Scores[0].riskLevel === "MEDIUM" || news2Scores[0].riskLevel === "LOW_MEDIUM"
                          ? "bg-amber-600"
                          : "bg-emerald-600"
                      }`}
                    >
                      {news2Scores[0].score}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Escore NEWS2-BR (Deterioração Clínica)
                        </span>
                        <Badge
                          variant={
                            news2Scores[0].riskLevel === "HIGH"
                              ? "destructive"
                              : news2Scores[0].riskLevel === "MEDIUM" || news2Scores[0].riskLevel === "LOW_MEDIUM"
                              ? "warning"
                              : "success"
                          }
                          className="text-[10px]"
                        >
                          {news2Scores[0].riskLevel === "HIGH"
                            ? "ALTO RISCO (EMERGÊNCIA)"
                            : news2Scores[0].riskLevel === "MEDIUM"
                            ? "MÉDIO RISCO"
                            : news2Scores[0].riskLevel === "LOW_MEDIUM"
                            ? "RISCO MODERADO (PARÂMETRO 3)"
                            : "BAIXO RISCO"}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-700 mt-1 font-medium">
                        {news2Scores[0].recommendedAction}
                      </p>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono shrink-0">
                    Versão: {news2Scores[0].scoreVersion} • Aferido: {formatDateTime(news2Scores[0].calculatedAt)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Histórico de Sinais Vitais & Telemetria</h3>
            <Button size="sm" onClick={() => setIsVitalsModalOpen(true)} className="gap-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white">
              <PlusCircle className="h-3.5 w-3.5" /> Registrar Aferição
            </Button>
          </div>

          <Card className="border-slate-200/80 shadow-xs">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data / Hora</TableHead>
                    <TableHead>Pressão (PA)</TableHead>
                    <TableHead>Frequência (FC)</TableHead>
                    <TableHead>SpO2</TableHead>
                    <TableHead>Temp</TableHead>
                    <TableHead>Glicemia</TableHead>
                    <TableHead>NEWS2</TableHead>
                    <TableHead>Alertas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vitals.map((v) => {
                    const alerts = evaluateVitalSignAlerts(v);
                    const scoreForVital = news2Scores.find((s) => s.vitalSignsId === v.id) || (news2Scores.length > 0 ? news2Scores[0] : null);
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="text-xs font-medium text-slate-700">
                          {formatDateTime(v.measuredAt)}
                        </TableCell>
                        <TableCell className="font-bold text-slate-900 font-mono text-xs">
                          {v.systolicBp}x{v.diastolicBp}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{v.heartRate} bpm</TableCell>
                        <TableCell className={`font-mono text-xs font-bold ${v.oxygenSaturation < 90 ? "text-red-600" : ""}`}>
                          {v.oxygenSaturation}%
                        </TableCell>
                        <TableCell className="font-mono text-xs">{v.temperature}°C</TableCell>
                        <TableCell className="font-mono text-xs">{v.bloodGlucose ? `${v.bloodGlucose} mg/dL` : "—"}</TableCell>
                        <TableCell>
                          {scoreForVital ? (
                            <Badge
                              variant={
                                scoreForVital.riskLevel === "HIGH"
                                  ? "destructive"
                                  : scoreForVital.riskLevel === "MEDIUM" || scoreForVital.riskLevel === "LOW_MEDIUM"
                                  ? "warning"
                                  : "success"
                              }
                              className="text-[10px] font-mono"
                            >
                              Score: {scoreForVital.score}
                            </Badge>
                          ) : (
                            <span className="text-xs text-slate-400 font-mono">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {alerts.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {alerts.map((a, i) => (
                                <Badge key={i} variant={a.severity === "CRITICO" ? "destructive" : "warning"} className="text-[10px]">
                                  {a.parameter}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <Badge variant="success" className="text-[10px]">Normal</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. ABA PROCEDIMENTOS */}
        <TabsContent value="procedimentos" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Procedimentos Realizados & Materiais</h3>
            <Button size="sm" onClick={() => setIsProcedureModalOpen(true)} className="gap-1.5 text-xs">
              <PlusCircle className="h-3.5 w-3.5" /> Registrar Procedimento
            </Button>
          </div>

          <div className="space-y-3">
            {procedures.map((proc) => (
              <Card key={proc.id} className="border-slate-200/80 shadow-xs">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900">
                      {proc.procedureName}
                    </CardTitle>
                    <span className="text-xs text-slate-500">{formatDateTime(proc.executedAt)}</span>
                  </div>
                  <CardDescription className="text-xs">
                    Quantidade: {proc.quantity} {proc.notes && `• ${proc.notes}`}
                  </CardDescription>
                </CardHeader>
                {proc.materialsUsed && proc.materialsUsed.length > 0 && (
                  <CardContent className="pt-0">
                    <div className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="font-semibold block mb-1">Materiais Consumidos (Estoque Domiciliar):</span>
                      <div className="flex flex-wrap gap-2">
                        {proc.materialsUsed.map((m, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">
                            {m.materialName} ({m.quantity} {m.unit})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 6. ABA EXAMES */}
        <TabsContent value="exames" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">Exames Laboratoriais & Imagem</h3>
            <Button size="sm" onClick={() => setIsExamModalOpen(true)} className="gap-1.5 text-xs">
              <PlusCircle className="h-3.5 w-3.5" /> Solicitar Exame
            </Button>
          </div>

          <div className="space-y-3">
            {exams.map((ex) => (
              <Card key={ex.id} className="border-slate-200/80 shadow-xs">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-slate-900">{ex.examName}</CardTitle>
                    <Badge variant={ex.status === "LAUDADO" ? "success" : "warning"}>
                      {ex.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Solicitado em {formatDate(ex.requestedAt)}
                  </CardDescription>
                </CardHeader>
                {ex.resultSummary && (
                  <CardContent className="pt-0 text-xs text-slate-800 bg-teal-50/50 p-3 rounded-lg border border-teal-100">
                    <strong>Laudo / Resultado:</strong> {ex.resultSummary}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 7. ABA LINHA DO TEMPO CLÍNICA UNIFICADA */}
        <TabsContent value="historico" className="space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Linha do Tempo Clínica Unificada</h3>

          <div className="space-y-3">
            {timeline.map((event) => (
              <div
                key={event.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex items-start gap-3 text-xs"
              >
                <div className={`p-2 rounded-lg shrink-0 ${
                  event.severity === "CRITICO"
                    ? "bg-red-100 text-red-700"
                    : event.severity === "ATENCAO"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-teal-50 text-teal-700"
                }`}>
                  <Activity className="h-4 w-4" />
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{event.eventTitle}</span>
                    <span className="text-[11px] text-slate-400">{formatDateTime(event.eventTimestamp)}</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{event.summary}</p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Autor: {event.authorName} ({event.authorRole})
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ------------------------------------------------------------- */}
      {/* MODAIS CLÍNICOS DO PEP */}
      {/* ------------------------------------------------------------- */}

      {/* Modal: Nova Evolução */}
      <Dialog open={isEvolutionModalOpen} onOpenChange={setIsEvolutionModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-600" />
              Registrar Evolução Clínica
            </DialogTitle>
            <DialogDescription>
              Registros finalizados são estritamente imutáveis conforme normas do CFM e COREN.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSaveEvolution} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="evoType">Tipo de Evolução *</Label>
                <select
                  id="evoType"
                  value={evolutionForm.evolutionType}
                  onChange={(e) => setEvolutionForm({ ...evolutionForm, evolutionType: e.target.value as any })}
                  className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                >
                  <option value="MEDICA">Médica</option>
                  <option value="ENFERMAGEM">Enfermagem (Enfermeiro)</option>
                  <option value="TECNICO_ENFERMAGEM">Técnico de Enfermagem</option>
                  <option value="FISIOTERAPIA">Fisioterapia</option>
                  <option value="NUTRICAO">Nutrição</option>
                  <option value="RETIFICACAO">Retificação de Registro Anterior</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="evoStatus">Status de Gravação *</Label>
                <select
                  id="evoStatus"
                  value={evolutionForm.status}
                  onChange={(e) => setEvolutionForm({ ...evolutionForm, status: e.target.value as any })}
                  className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/30 font-medium"
                >
                  <option value="FINALIZADO">Finalizar & Assinar (Imutável)</option>
                  <option value="RASCUNHO">Salvar Rascunho (Permite Edição)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="evoContent">Descritivo da Evolução Clínica *</Label>
              <Textarea
                id="evoContent"
                required
                rows={6}
                value={evolutionForm.content}
                onChange={(e) => setEvolutionForm({ ...evolutionForm, content: e.target.value })}
                placeholder="Descreva o estado do paciente, condutas, sinais vitais, intercorrências e respostas terapêuticas..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEvolutionModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                {evolutionForm.status === "FINALIZADO" ? "Finalizar & Assinar Registro" : "Salvar Rascunho"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Aferir Sinais Vitais */}
      <Dialog open={isVitalsModalOpen} onOpenChange={setIsVitalsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HeartPulse className="h-5 w-5 text-teal-600" />
              Aferição Beira-Leito de Sinais Vitais
            </DialogTitle>
            <DialogDescription>
              Valores são verificados automaticamente para detecção de alertas clínicos de descompensação.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordVitals} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">PAS (mmHg) *</Label>
                <Input
                  type="number"
                  required
                  value={vitalsForm.systolicBp}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, systolicBp: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">PAD (mmHg) *</Label>
                <Input
                  type="number"
                  required
                  value={vitalsForm.diastolicBp}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, diastolicBp: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">FC (bpm) *</Label>
                <Input
                  type="number"
                  required
                  value={vitalsForm.heartRate}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, heartRate: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">FR (ipm) *</Label>
                <Input
                  type="number"
                  required
                  value={vitalsForm.respiratoryRate}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, respiratoryRate: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">SpO2 (%) *</Label>
                <Input
                  type="number"
                  required
                  value={vitalsForm.oxygenSaturation}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, oxygenSaturation: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Temp (°C) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  required
                  value={vitalsForm.temperature}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Glicemia (mg/dL)</Label>
                <Input
                  type="number"
                  value={vitalsForm.bloodGlucose}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, bloodGlucose: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Escala Dor (0-10)</Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={vitalsForm.painScore}
                  onChange={(e) => setVitalsForm({ ...vitalsForm, painScore: Number(e.target.value) })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsVitalsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2 bg-teal-600 hover:bg-teal-700">
                <CheckCircle2 className="h-4 w-4" />
                Registrar Sinais Vitais
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Nova Prescrição */}
      <Dialog open={isPrescriptionModalOpen} onOpenChange={setIsPrescriptionModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-emerald-600" />
              Prescrição Médica de Medicamentos
            </DialogTitle>
            <DialogDescription>
              Emissão de prescrição com posologia e aprazamento para a equipe de enfermagem.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePrescription} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="medName">Medicamento / Princípio Ativo *</Label>
              <Input
                id="medName"
                required
                value={prescForm.medicationName}
                onChange={(e) => setPrescForm({ ...prescForm, medicationName: e.target.value })}
                placeholder="Ex: Brometo de Ipratrópio"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="medDos">Dosagem *</Label>
                <Input
                  id="medDos"
                  required
                  value={prescForm.dosage}
                  onChange={(e) => setPrescForm({ ...prescForm, dosage: e.target.value })}
                  placeholder="Ex: 500"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="medUnit">Unidade *</Label>
                <Input
                  id="medUnit"
                  required
                  value={prescForm.unit}
                  onChange={(e) => setPrescForm({ ...prescForm, unit: e.target.value })}
                  placeholder="mg / gotas / ml"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="medRoute">Via de Administração *</Label>
                <select
                  id="medRoute"
                  value={prescForm.route}
                  onChange={(e) => setPrescForm({ ...prescForm, route: e.target.value as any })}
                  className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                >
                  <option value="ORAL">Oral</option>
                  <option value="EV">Endovenosa (EV)</option>
                  <option value="IM">Intramuscular (IM)</option>
                  <option value="SC">Subcutânea (SC)</option>
                  <option value="SONDA_SNE_GTT">Sonda (SNE / GTT)</option>
                  <option value="INALATORIA">Inalatória</option>
                  <option value="TOPICA">Tópica</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="medFreq">Frequência / Horários *</Label>
                <Input
                  id="medFreq"
                  required
                  value={prescForm.frequency}
                  onChange={(e) => setPrescForm({ ...prescForm, frequency: e.target.value })}
                  placeholder="Ex: 8/8h (06-14-22)"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="medInst">Instruções Adicionais</Label>
              <Input
                id="medInst"
                value={prescForm.instructions}
                onChange={(e) => setPrescForm({ ...prescForm, instructions: e.target.value })}
                placeholder="Ex: Diluir em 100ml de SF 0.9%"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPrescriptionModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Prescrever Medicamento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Procedimento */}
      <Dialog open={isProcedureModalOpen} onOpenChange={setIsProcedureModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Syringe className="h-5 w-5 text-teal-600" />
              Registrar Procedimento & Consumo
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRecordProcedure} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="prName">Nome do Procedimento *</Label>
              <Input
                id="prName"
                required
                value={procForm.procedureName}
                onChange={(e) => setProcForm({ ...procForm, procedureName: e.target.value })}
                placeholder="Ex: Curativo em Região Sacra com Hidrogel"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="prNotes">Observações / Detalhes</Label>
              <Input
                id="prNotes"
                value={procForm.notes}
                onChange={(e) => setProcForm({ ...procForm, notes: e.target.value })}
                placeholder="Ex: Lesão com 90% granulação, bordas limpas"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="text-xs font-semibold text-slate-700">Material Consumido</span>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1">
                  <Input
                    placeholder="Nome do Material"
                    value={procForm.materialName}
                    onChange={(e) => setProcForm({ ...procForm, materialName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Input
                    type="number"
                    value={procForm.materialQty}
                    onChange={(e) => setProcForm({ ...procForm, materialQty: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProcedureModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Registrar Procedimento
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Solicitar Exame */}
      <Dialog open={isExamModalOpen} onOpenChange={setIsExamModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Microscope className="h-5 w-5 text-teal-600" />
              Solicitar Exame Laboratorial / Imagem
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRequestExam} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="exName">Nome do Exame *</Label>
              <Input
                id="exName"
                required
                value={examForm.examName}
                onChange={(e) => setExamForm({ ...examForm, examName: e.target.value })}
                placeholder="Ex: Hemograma Completo com Plaquetas"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsExamModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Solicitar Exame
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Checagem & Administração Medicamentosa Beira-Leito */}
      <Dialog open={isMedAdminModalOpen} onOpenChange={setIsMedAdminModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Syringe className="h-5 w-5 text-teal-600" />
              Checagem & Administração de Medicamento
            </DialogTitle>
            <DialogDescription className="text-xs">
              Registro beira-leito com validação de aprazamento, dose prescrita e rastreabilidade.
            </DialogDescription>
          </DialogHeader>

          {selectedMedItem && (
            <form onSubmit={handleRecordMedAdmin} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="text-xs text-slate-500 font-medium">Item Prescrito</div>
                <div className="text-sm font-bold text-slate-900">{selectedMedItem.item.medicationName}</div>
                <div className="flex items-center gap-3 text-xs text-slate-600 font-mono">
                  <span>Dose: {selectedMedItem.item.dosage} {selectedMedItem.item.unit}</span>
                  <span>Via: {selectedMedItem.item.route}</span>
                  <span>Freq: {selectedMedItem.item.frequency}</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="medStatus">Status da Administração *</Label>
                <select
                  id="medStatus"
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={medAdminForm.status}
                  onChange={(e) => setMedAdminForm({ ...medAdminForm, status: e.target.value as any })}
                >
                  <option value="ADMINISTRADO">ADMINISTRADO (Dose checada e aplicada)</option>
                  <option value="RECUSADO">RECUSADO (Paciente recusou a medicação)</option>
                  <option value="SUSPENSO">SUSPENSO (Suspenso por conduta médica)</option>
                </select>
              </div>

              {medAdminForm.status === "ADMINISTRADO" && (
                <div className="space-y-1">
                  <Label htmlFor="batchNumber">Lote / Validade do Frasco/Ampola</Label>
                  <Input
                    id="batchNumber"
                    value={medAdminForm.batchNumber}
                    onChange={(e) => setMedAdminForm({ ...medAdminForm, batchNumber: e.target.value })}
                    placeholder="Ex: LOTE-2026-X49"
                    className="text-xs"
                  />
                </div>
              )}

              {medAdminForm.status !== "ADMINISTRADO" && (
                <div className="space-y-1">
                  <Label htmlFor="refusalReason">Justificativa / Motivo da Não Administração *</Label>
                  <Input
                    id="refusalReason"
                    required
                    value={medAdminForm.refusalReason}
                    onChange={(e) => setMedAdminForm({ ...medAdminForm, refusalReason: e.target.value })}
                    placeholder="Ex: Paciente relatou náusea intensa e recusou VO"
                    className="text-xs border-amber-300 focus:ring-amber-500"
                  />
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="medNotes">Observações de Enfermagem</Label>
                <Input
                  id="medNotes"
                  value={medAdminForm.notes}
                  onChange={(e) => setMedAdminForm({ ...medAdminForm, notes: e.target.value })}
                  placeholder="Ex: Administrado sem queixas, tolerado bem"
                  className="text-xs"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsMedAdminModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="gap-2 bg-teal-600 hover:bg-teal-700 text-white">
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar Checagem
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Aferir Pressão de O2 */}
      <Dialog open={isOxygenPressureModalOpen} onOpenChange={setIsOxygenPressureModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-amber-600" />
              Aferição de Pressão de O₂ (Manômetro)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Atualiza a pressão do cilindro e recalcula a autonomia física beira-leito.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordOxygenCheck} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-xs">Pressão Mensurada (bar) *</Label>
              <Input
                type="number"
                min="0"
                max="250"
                required
                value={newPressureInput}
                onChange={(e) => setNewPressureInput(Number(e.target.value))}
                className="text-sm font-mono"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOxygenPressureModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">
                Salvar Aferição
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Nova Avaliação de Ferida (NPUAP) */}
      <Dialog open={isWoundModalOpen} onOpenChange={setIsWoundModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bandage className="h-5 w-5 text-teal-600" />
              Avaliação de Ferida & Protocolo de Curativo (NPUAP)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Estadiamento clínico, percentuais de leito e prescrição de coberturas.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordWoundEvaluation} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Identificador da Lesão *</Label>
              <Input
                required
                value={woundForm.woundIdentifier}
                onChange={(e) => setWoundForm({ ...woundForm, woundIdentifier: e.target.value })}
                placeholder="Ex: Lesão por Pressão 1 — Região Sacral"
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Localização Anatômica *</Label>
                <select
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs"
                  value={woundForm.location}
                  onChange={(e) => setWoundForm({ ...woundForm, location: e.target.value as any })}
                >
                  <option value="SACRO">Região Sacral</option>
                  <option value="CALCANHAR_DIREITO">Calcâneo Direito</option>
                  <option value="CALCANHAR_ESQUERDO">Calcâneo Esquerdo</option>
                  <option value="TROCANTER_DIREITO">Trocânter Maior Direito</option>
                  <option value="TROCANTER_ESQUERDO">Trocânter Maior Esquerdo</option>
                  <option value="ISQUIO">Região Isquiática</option>
                  <option value="MALEOLO_LATERAL">Maléolo Lateral</option>
                  <option value="MEMBRO_INFERIOR">Membro Inferior</option>
                  <option value="OUTRO">Outro Local</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Estadiamento NPUAP *</Label>
                <select
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs"
                  value={woundForm.stage}
                  onChange={(e) => setWoundForm({ ...woundForm, stage: e.target.value as any })}
                >
                  <option value="ESTAGIO_1">Estágio 1 (Eritema não branqueável)</option>
                  <option value="ESTAGIO_2">Estágio 2 (Perda parcial da derme)</option>
                  <option value="ESTAGIO_3">Estágio 3 (Perda total da pele/subcutâneo)</option>
                  <option value="ESTAGIO_4">Estágio 4 (Perda total com exposição muscular/óssea)</option>
                  <option value="NAO_CLASSIFICAVEL">Não Classificável (Obscurecida por necrose/esfacelo)</option>
                  <option value="TISSULAR_PROFUNDA">Lesão por Pressão Tissular Profunda</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Comprimento (cm) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  required
                  value={woundForm.lengthCm}
                  onChange={(e) => setWoundForm({ ...woundForm, lengthCm: Number(e.target.value) })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Largura (cm) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  required
                  value={woundForm.widthCm}
                  onChange={(e) => setWoundForm({ ...woundForm, widthCm: Number(e.target.value) })}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Profundidade (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={woundForm.depthCm}
                  onChange={(e) => setWoundForm({ ...woundForm, depthCm: Number(e.target.value) })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <Label className="text-xs font-bold text-slate-800">Composição do Leito da Lesão (% total ≤ 100%)</Label>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <span className="text-[11px] text-emerald-700 block">Granulação (%)</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={woundForm.granulationPercent}
                    onChange={(e) => setWoundForm({ ...woundForm, granulationPercent: Number(e.target.value) })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-amber-700 block">Esfacelo (%)</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={woundForm.sloughPercent}
                    onChange={(e) => setWoundForm({ ...woundForm, sloughPercent: Number(e.target.value) })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-red-700 block">Necrose (%)</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={woundForm.necrosisPercent}
                    onChange={(e) => setWoundForm({ ...woundForm, necrosisPercent: Number(e.target.value) })}
                    className="text-xs"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-teal-700 block">Epitelização (%)</span>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={woundForm.epithelializationPercent}
                    onChange={(e) => setWoundForm({ ...woundForm, epithelializationPercent: Number(e.target.value) })}
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Exsudato *</Label>
                <select
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs"
                  value={woundForm.exudateAmount}
                  onChange={(e) => setWoundForm({ ...woundForm, exudateAmount: e.target.value as any })}
                >
                  <option value="AUSENTE">Ausente</option>
                  <option value="ESCASSO">Escasso</option>
                  <option value="MODERADO">Moderado</option>
                  <option value="ABUNDANTE">Abundante</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Cobertura Primária Prescrita *</Label>
                <select
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs"
                  value={woundForm.prescribedCovering}
                  onChange={(e) => setWoundForm({ ...woundForm, prescribedCovering: e.target.value as any })}
                >
                  <option value="ESPUMA_DE_POLIURETANO_SILICONE">Espuma de Poliuretano com Silicone / Prata</option>
                  <option value="HIDROCOLOIDE">Placa de Hidrocoloide Extra Fino</option>
                  <option value="ALGINATO_CALCIO">Alginato de Cálcio e Sódio</option>
                  <option value="HIDROGEL">Hidrogel com Alginato (Debridamento Autolítico)</option>
                  <option value="CARVAO_ATIVADO_PRATA">Carvão Ativado com Prata</option>
                  <option value="COLAGENASE">Colagenase com Cloranfenicol</option>
                  <option value="BOTA_UNNA">Bota de Unna</option>
                  <option value="OUTRA">Outra Cobertura</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Notas Clínicas e Evolução</Label>
              <Textarea
                rows={2}
                value={woundForm.clinicalNotes}
                onChange={(e) => setWoundForm({ ...woundForm, clinicalNotes: e.target.value })}
                className="text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsWoundModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">
                Salvar Avaliação
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
