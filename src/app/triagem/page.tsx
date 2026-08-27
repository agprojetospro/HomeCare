"use client";

import { useState } from "react";
import { store } from "@/services/store.service";
import { Triage, TriageSchema } from "@/domain/triage/triage.schema";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  ClipboardList,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Stethoscope,
  Activity,
  HeartPulse,
  ShieldAlert,
  FileCheck,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function TriagePage() {
  const [triages, setTriages] = useState<Triage[]>(store.getTriages());
  const [patients] = useState(store.getPatients());
  const [professionals] = useState(store.getProfessionals());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    patientId: patients[0]?.id || "",
    evaluatorId: store.currentUser.professionalId || professionals[0]?.id || "",
    evaluationDate: new Date().toISOString().split("T")[0],
    location: "HOSPITAL" as const,
    modality: "PRESENCIAL" as const,
    mainDiagnosis: "",
    cid10: "",
    secondaryDiagnoses: "",
    requestReason: "",
    generalState: "REGULAR" as const,
    consciousnessLevel: "ALERTA" as const,
    systolicBp: 120,
    diastolicBp: 80,
    heartRate: 75,
    respiratoryRate: 18,
    oxygenSaturation: 96,
    temperature: 36.5,
    bloodGlucose: 100,
    mobility: "RESTRITO_AO_LEITO" as const,
    feeding: "ORAL" as const,
    breathing: "AR_AMBIENTE" as const,
    eliminations: "DIURESE_ESPONTANEA" as const,
    skinCondition: "INTEGRA" as const,
    devices: [] as string[],
    risks: [] as string[],
    careNeeds: [] as string[],
    eligibility: "ELEGIVEL" as const,
    complexityLevel: "MEDIA" as const,
    conclusion: "",
  });

  const handleDeviceToggle = (device: string) => {
    setFormData((prev) => ({
      ...prev,
      devices: prev.devices.includes(device)
        ? prev.devices.filter((d) => d !== device)
        : [...prev.devices, device],
    }));
  };

  const handleRiskToggle = (risk: string) => {
    setFormData((prev) => ({
      ...prev,
      risks: prev.risks.includes(risk)
        ? prev.risks.filter((r) => r !== risk)
        : [...prev.risks, risk],
    }));
  };

  const handleCareNeedToggle = (need: string) => {
    setFormData((prev) => ({
      ...prev,
      careNeeds: prev.careNeeds.includes(need)
        ? prev.careNeeds.filter((n) => n !== need)
        : [...prev.careNeeds, need],
    }));
  };

  const handleCreateTriage = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const episode = store.getEpisodeByPatientId(formData.patientId);

    const parseResult = TriageSchema.safeParse({
      ...formData,
      episodeId: episode?.id,
      evaluationDate: new Date(formData.evaluationDate),
      secondaryDiagnoses: formData.secondaryDiagnoses
        ? formData.secondaryDiagnoses.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    });

    if (!parseResult.success) {
      setErrorMessage(parseResult.error.errors[0].message);
      return;
    }

    store.createTriage(parseResult.data);
    setTriages(store.getTriages());
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-teal-600" />
            Triagem Clínica & Elegibilidade
          </h1>
          <p className="text-sm text-slate-500">
            Avaliação clínica de desospitalização, escala de complexidade e geração do plano terapêutico.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shrink-0">
          <PlusCircle className="h-4 w-4" />
          Nova Avaliação de Triagem
        </Button>
      </div>

      {/* Triages List */}
      <div className="grid grid-cols-1 gap-4">
        {triages.map((triage) => {
          const patient = store.getPatientById(triage.patientId);
          const evaluator = store.getProfessionalById(triage.evaluatorId);
          const carePlans = patient ? store.getCarePlans(patient.id!) : [];

          return (
            <Card key={triage.id} className="border-slate-200/80 shadow-xs hover:border-teal-500/30 transition-all">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-bold text-slate-900">
                      {patient?.fullName}
                    </CardTitle>
                    <Badge variant="teal" className="text-xs font-mono">
                      CID-10: {triage.cid10}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={triage.eligibility === "ELEGIVEL" ? "success" : "destructive"}>
                      {triage.eligibility === "ELEGIVEL" ? "Elegível para Home Care" : "Não Elegível"}
                    </Badge>
                    <Badge variant={triage.complexityLevel === "ALTA" ? "warning" : "secondary"}>
                      Complexidade: {triage.complexityLevel}
                    </Badge>
                  </div>
                </div>
                <CardDescription>
                  Avaliado por {evaluator?.fullName} ({evaluator?.credentials?.[0]?.councilType || evaluator?.profession}-{evaluator?.credentials?.[0]?.state || "BA"} {evaluator?.credentials?.[0]?.registrationNumber || ""}) em {formatDate(triage.evaluationDate)} • Local: {triage.location} ({triage.modality})
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="font-semibold text-slate-500 block mb-0.5">Diagnóstico Principal</span>
                    <span className="font-medium text-slate-800">{triage.mainDiagnosis}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block mb-0.5">Sinais Vitais na Avaliação</span>
                    <span className="font-medium text-slate-800">
                      PA {triage.systolicBp}x{triage.diastolicBp} • FC {triage.heartRate} bpm • SpO2 {triage.oxygenSaturation}% • Temp {triage.temperature}°C
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 block mb-0.5">Sistemas & Suportes</span>
                    <span className="font-medium text-slate-800">
                      Resp: {triage.breathing} • Alim: {triage.feeding} • Mob: {triage.mobility}
                    </span>
                  </div>
                </div>

                {/* Dispositivos e Riscos */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-500">Dispositivos:</span>
                  {triage.devices.length > 0 ? (
                    triage.devices.map((d, i) => (
                      <Badge key={i} variant="teal" className="text-[10px]">
                        {d}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-slate-400">Nenhum</span>
                  )}

                  <span className="font-semibold text-slate-500 ml-4">Riscos:</span>
                  {triage.risks.length > 0 ? (
                    triage.risks.map((r, i) => (
                      <Badge key={i} variant="destructive" className="text-[10px]">
                        {r}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-slate-400">Nenhum</span>
                  )}
                </div>

                {/* Parecer Conclusivo */}
                <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200/80">
                  <strong>Parecer Conclusivo:</strong> {triage.conclusion}
                </div>

                {/* Plano Assistencial Vinculado */}
                {carePlans.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <h5 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                      <FileCheck className="h-3.5 w-3.5 text-teal-600" />
                      Plano Assistencial Estruturado (v{carePlans[0].version})
                    </h5>
                    <div className="space-y-2">
                      {carePlans[0].items.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-lg border border-teal-100 bg-teal-50/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div>
                            <span className="font-semibold text-teal-900">
                              {item.professionType.replace("_", " ")} — {item.frequency}
                            </span>
                            <p className="text-slate-600 mt-0.5">{item.procedureDescription}</p>
                          </div>
                          {item.goals && (
                            <span className="text-[11px] text-teal-700 italic shrink-0">
                              Meta: {item.goals}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  {patient && (
                    <Link href={`/pep/${patient.id}`}>
                      <Button size="sm" variant="outline" className="gap-1.5 text-xs text-teal-700">
                        <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
                        Abrir PEP do Paciente
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal: Formulário de Triagem */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-teal-600" />
              Realizar Avaliação de Triagem Clínica
            </DialogTitle>
            <DialogDescription>
              Avaliação completa para admissão, determinação de elegibilidade e plano terapêutico.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleCreateTriage} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="triagePat">Paciente *</Label>
                <select
                  id="triagePat"
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} (CPF: {p.cpf || "S/N"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="triageEval">Profissional Avaliador *</Label>
                <select
                  id="triageEval"
                  value={formData.evaluatorId}
                  onChange={(e) => setFormData({ ...formData, evaluatorId: e.target.value })}
                  className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                >
                  {professionals.map((pr) => (
                    <option key={pr.id} value={pr.id}>
                      {pr.fullName} ({pr.profession})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label htmlFor="triageDate">Data Avaliação *</Label>
                <Input
                  id="triageDate"
                  type="date"
                  required
                  value={formData.evaluationDate}
                  onChange={(e) => setFormData({ ...formData, evaluationDate: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="triageLoc">Local *</Label>
                <select
                  id="triageLoc"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value as any })}
                  className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                >
                  <option value="HOSPITAL">Hospital</option>
                  <option value="RESIDENCIA">Residência</option>
                  <option value="CLINICA">Clínica</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="triageMod">Tipo/Modalidade *</Label>
                <select
                  id="triageMod"
                  value={formData.modality}
                  onChange={(e) => setFormData({ ...formData, modality: e.target.value as any })}
                  className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                >
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="TELEATENDIMENTO">Teleatendimento</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="triageGenState">Estado Geral *</Label>
                <select
                  id="triageGenState"
                  value={formData.generalState}
                  onChange={(e) => setFormData({ ...formData, generalState: e.target.value as any })}
                  className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                >
                  <option value="BOM">Bom</option>
                  <option value="REGULAR">Regular</option>
                  <option value="GRAVE">Grave</option>
                </select>
              </div>
            </div>

            {/* Diagnósticos */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <Label htmlFor="triageDiag">Diagnóstico Principal *</Label>
                <Input
                  id="triageDiag"
                  required
                  value={formData.mainDiagnosis}
                  onChange={(e) => setFormData({ ...formData, mainDiagnosis: e.target.value })}
                  placeholder="Ex: DPOC Exacerbado com Traqueostomia"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="triageCid">CID-10 Principal *</Label>
                <Input
                  id="triageCid"
                  required
                  value={formData.cid10}
                  onChange={(e) => setFormData({ ...formData, cid10: e.target.value })}
                  placeholder="Ex: J44.1"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="triageReason">Motivo da Solicitação de Home Care *</Label>
              <Input
                id="triageReason"
                required
                value={formData.requestReason}
                onChange={(e) => setFormData({ ...formData, requestReason: e.target.value })}
                placeholder="Ex: Desospitalização segura para suporte ventilatório e reabilitação"
              />
            </div>

            {/* Sinais Vitais */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <span className="text-xs font-bold text-slate-700">Sinais Vitais na Avaliação</span>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px]">PAS (mmHg)</Label>
                  <Input
                    type="number"
                    value={formData.systolicBp}
                    onChange={(e) => setFormData({ ...formData, systolicBp: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">PAD (mmHg)</Label>
                  <Input
                    type="number"
                    value={formData.diastolicBp}
                    onChange={(e) => setFormData({ ...formData, diastolicBp: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">FC (bpm)</Label>
                  <Input
                    type="number"
                    value={formData.heartRate}
                    onChange={(e) => setFormData({ ...formData, heartRate: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">FR (ipm)</Label>
                  <Input
                    type="number"
                    value={formData.respiratoryRate}
                    onChange={(e) => setFormData({ ...formData, respiratoryRate: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">SpO2 (%)</Label>
                  <Input
                    type="number"
                    value={formData.oxygenSaturation}
                    onChange={(e) => setFormData({ ...formData, oxygenSaturation: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px]">Temp (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {/* Avaliação de Dispositivos e Riscos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1.5 p-3 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800 block">Dispositivos Invasivos</span>
                <div className="flex flex-wrap gap-1.5">
                  {["GTT", "SNE", "SVD", "PICC", "CATETER_VENOSO_CENTRAL", "TRAQUEOSTOMIA", "COLOSTOMIA", "DRENO"].map((dev) => (
                    <button
                      type="button"
                      key={dev}
                      onClick={() => handleDeviceToggle(dev)}
                      className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                        formData.devices.includes(dev)
                          ? "bg-teal-600 text-white border-teal-700"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      {dev}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 p-3 rounded-lg border border-slate-200">
                <span className="font-semibold text-slate-800 block">Mapeamento de Riscos</span>
                <div className="flex flex-wrap gap-1.5">
                  {["QUEDA", "LESAO_POR_PRESSAO", "BRONCOASPIRACAO", "INFECCAO", "AGITACAO", "CONVULSAO"].map((risk) => (
                    <button
                      type="button"
                      key={risk}
                      onClick={() => handleRiskToggle(risk)}
                      className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
                        formData.risks.includes(risk)
                          ? "bg-red-600 text-white border-red-700"
                          : "bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      {risk}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Resultado & Elegibilidade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-teal-50/50 rounded-xl border border-teal-200">
              <div className="space-y-1">
                <Label htmlFor="triageElig" className="text-teal-900 font-bold">Resultado da Elegibilidade *</Label>
                <select
                  id="triageElig"
                  value={formData.eligibility}
                  onChange={(e) => setFormData({ ...formData, eligibility: e.target.value as any })}
                  className="w-full h-9 px-3 text-sm bg-white border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                >
                  <option value="ELEGIVEL">Elegível para Home Care</option>
                  <option value="NAO_ELEGIVEL">Não Elegível</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="triageComp" className="text-teal-900 font-bold">Grau de Complexidade *</Label>
                <select
                  id="triageComp"
                  value={formData.complexityLevel}
                  onChange={(e) => setFormData({ ...formData, complexityLevel: e.target.value as any })}
                  className="w-full h-9 px-3 text-sm bg-white border border-teal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                >
                  <option value="BAIXA">Baixa Complexidade</option>
                  <option value="MEDIA">Média Complexidade</option>
                  <option value="ALTA">Alta Complexidade</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="triageConc">Parecer Conclusivo / Justificativa Clínica *</Label>
              <Textarea
                id="triageConc"
                required
                rows={3}
                value={formData.conclusion}
                onChange={(e) => setFormData({ ...formData, conclusion: e.target.value })}
                placeholder="Detalhe o plano terapêutico inicial e a indicação de cuidados domiciliares..."
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Concluir Avaliação & Gerar Plano
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

