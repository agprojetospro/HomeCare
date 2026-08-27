"use client";

import { useState, useEffect } from "react";
import { store } from "@/services/store.service";
import { Shift, PatientProfessionalAssignment, ShiftSchema } from "@/domain/shift/shift.schema";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  CalendarCheck,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserCheck,
  Users,
  ShieldCheck,
  Link as LinkIcon,
} from "lucide-react";
import { formatDateTime, formatDate } from "@/lib/utils";

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>(store.getShifts());
  const [assignments, setAssignments] = useState<PatientProfessionalAssignment[]>(store.getAssignments());
  const [patients, setPatients] = useState(store.getPatients());
  const [professionals, setProfessionals] = useState(store.getProfessionals());
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    store.initClient();
    setShifts(store.getShifts());
    setAssignments(store.getAssignments());
    setPatients(store.getPatients());
    setProfessionals(store.getProfessionals());
  }, []);

  // Shift Form
  const [shiftForm, setShiftForm] = useState({
    startTime: "2026-08-28T07:00",
    endTime: "2026-08-28T19:00",
    shiftType: "DIURNO_12H" as const,
    doctorInChargeId: professionals.find((p) => p.profession === "MEDICO")?.id || professionals[0]?.id || "",
    nurseInChargeId: professionals.find((p) => p.profession === "ENFERMEIRO")?.id || "",
    notes: "",
  });

  // Assignment Form
  const [assignForm, setAssignForm] = useState({
    patientId: patients[0]?.id || "",
    professionalId: professionals[0]?.id || "",
    role: "Técnica de Enfermagem Assistencial",
    startDate: "2026-08-28",
  });

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parseResult = ShiftSchema.safeParse({
      ...shiftForm,
      startTime: new Date(shiftForm.startTime),
      endTime: new Date(shiftForm.endTime),
      nurseInChargeId: shiftForm.nurseInChargeId || null,
    });

    if (!parseResult.success) {
      setErrorMessage(parseResult.error.errors[0].message);
      return;
    }

    const res = store.createShift(parseResult.data);
    if (!res.success) {
      setErrorMessage(res.error || "Erro ao agendar plantão.");
      return;
    }

    setShifts(store.getShifts());
    setIsShiftModalOpen(false);
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    const episode = store.getEpisodeByPatientId(assignForm.patientId);

    store.createAssignment({
      episodeId: episode?.id || "",
      patientId: assignForm.patientId,
      professionalId: assignForm.professionalId || store.currentUser.professionalId || "prof_roberta",
      role: assignForm.role,
      startDate: new Date(assignForm.startDate),
      isActive: true,
    });

    setAssignments(store.getAssignments());
    setIsAssignModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-teal-600" />
            Escalas, Plantões & Vínculos Assistenciais
          </h1>
          <p className="text-sm text-slate-500">
            Definição de plantões com responsabilidade médica obrigatória e atribuição explícita de pacientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsAssignModalOpen(true)} className="gap-1.5 text-xs">
            <LinkIcon className="h-4 w-4 text-teal-600" />
            Vincular Paciente ↔ Profissional
          </Button>
          <Button onClick={() => setIsShiftModalOpen(true)} className="gap-2 shrink-0">
            <PlusCircle className="h-4 w-4" />
            Agendar Plantão
          </Button>
        </div>
      </div>

      {/* Grid: Plantões & Vínculos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plantões (2 Colunas) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>Grade de Plantões Cadastrados</span>
                <Badge variant="teal" className="text-xs">
                  Médico Obrigatório
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Turno / Período</TableHead>
                    <TableHead>Médico Responsável *</TableHead>
                    <TableHead>Enfermeira Supervisora</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map((s) => {
                    const doc = store.getProfessionalById(s.doctorInChargeId);
                    const nurse = s.nurseInChargeId ? store.getProfessionalById(s.nurseInChargeId) : null;
                    return (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="font-semibold text-slate-900">
                            {s.shiftType.replace("_", " ")}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {formatDateTime(s.startTime)} às {formatDateTime(s.endTime)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs font-semibold text-teal-800">
                            {doc?.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            {doc?.councilType}-{doc?.councilUf} {doc?.councilNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          {nurse ? (
                            <>
                              <div className="text-xs text-slate-800">{nurse.fullName}</div>
                              <div className="text-[11px] text-slate-500 font-mono">
                                {nurse.councilType} {nurse.councilNumber}
                              </div>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">Não designada</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.status === "EM_ANDAMENTO" ? "success" : "secondary"}>
                            {s.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Vínculos Ativos (1 Coluna) */}
        <div className="space-y-4">
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                Vínculos Ativos (Anti-IDOR)
              </CardTitle>
              <CardDescription>
                Acesso ao PEP é liberado apenas para profissionais explicitamente vinculados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {assignments.map((as) => {
                const patient = store.getPatientById(as.patientId);
                const prof = store.getProfessionalById(as.professionalId);
                return (
                  <div
                    key={as.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{patient?.fullName}</span>
                      <Badge variant="teal" className="text-[10px]">
                        Ativo
                      </Badge>
                    </div>
                    <p className="text-slate-700">
                      <strong>Profissional:</strong> {prof?.fullName} ({prof?.profession})
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      <strong>Função:</strong> {as.role}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal: Agendar Plantão */}
      <Dialog open={isShiftModalOpen} onOpenChange={setIsShiftModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-teal-600" />
              Agendar Novo Plantão
            </DialogTitle>
            <DialogDescription>
              A designação de um Médico Responsável é obrigatória conforme regras de atenção domiciliar.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleCreateShift} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="sStart">Início do Plantão *</Label>
                <Input
                  id="sStart"
                  type="datetime-local"
                  required
                  value={shiftForm.startTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="sEnd">Término do Plantão *</Label>
                <Input
                  id="sEnd"
                  type="datetime-local"
                  required
                  value={shiftForm.endTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="sType">Tipo de Turno *</Label>
              <select
                id="sType"
                value={shiftForm.shiftType}
                onChange={(e) => setShiftForm({ ...shiftForm, shiftType: e.target.value as any })}
                className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/30"
              >
                <option value="DIURNO_12H">Diurno (12 Horas)</option>
                <option value="NOTURNO_12H">Noturno (12 Horas)</option>
                <option value="HORAS_24">Integral (24 Horas)</option>
                <option value="FINAL_DE_SEMANA">Final de Semana</option>
                <option value="FERIADO">Feriado</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="sDoc">Médico Responsável * (OBRIGATÓRIO)</Label>
              <select
                id="sDoc"
                required
                value={shiftForm.doctorInChargeId}
                onChange={(e) => setShiftForm({ ...shiftForm, doctorInChargeId: e.target.value })}
                className="w-full h-9 px-3 text-sm bg-white border border-teal-300 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/30"
              >
                {professionals
                  .filter((p) => p.profession === "MEDICO")
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.councilType}-{p.councilUf} {p.councilNumber})
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="sNurse">Enfermeira Responsável (Opcional)</Label>
              <select
                id="sNurse"
                value={shiftForm.nurseInChargeId}
                onChange={(e) => setShiftForm({ ...shiftForm, nurseInChargeId: e.target.value })}
                className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/30"
              >
                <option value="">Nenhuma / Sem supervisão direta no turno</option>
                {professionals
                  .filter((p) => p.profession === "ENFERMEIRO")
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.councilType}-{p.councilUf} {p.councilNumber})
                    </option>
                  ))}
              </select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsShiftModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Criar Plantão
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Vincular Paciente ↔ Profissional */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-teal-600" />
              Atribuição Assistencial (Vínculo)
            </DialogTitle>
            <DialogDescription>
              Concede autorização clínica para visualização e registros no Prontuário Eletrônico do Paciente (PEP).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="asPat">Paciente *</Label>
              <select
                id="asPat"
                value={assignForm.patientId}
                onChange={(e) => setAssignForm({ ...assignForm, patientId: e.target.value })}
                className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/30"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="asProf">Profissional *</Label>
              <select
                id="asProf"
                value={assignForm.professionalId}
                onChange={(e) => setAssignForm({ ...assignForm, professionalId: e.target.value })}
                className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/30"
              >
                {professionals.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.fullName} ({pr.profession})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="asRole">Função / Papel Assistencial *</Label>
              <Input
                id="asRole"
                required
                value={assignForm.role}
                onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value })}
                placeholder="Ex: Técnica de Enfermagem 12x36 Diurno"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAssignModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Confirmar Vínculo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

