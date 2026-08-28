"use client";

import { useState, useEffect } from "react";
import { store } from "@/services/store.service";
import { Shift, PatientProfessionalAssignment, ShiftSchema } from "@/domain/shift/shift.schema";
import { Visit, VisitCheckin } from "@/domain/visit/visit.schema";
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
  CalendarCheck,
  PlusCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Link as LinkIcon,
  MapPin,
  Navigation,
  CheckCheck,
  LocateFixed,
} from "lucide-react";
import { formatDateTime, formatDate } from "@/lib/utils";

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>(store.getShifts());
  const [assignments, setAssignments] = useState<PatientProfessionalAssignment[]>(store.getAssignments());
  const [visits, setVisits] = useState<Visit[]>(store.getVisits());
  const [patients, setPatients] = useState(store.getPatients());
  const [professionals, setProfessionals] = useState(store.getProfessionals());

  // Modais
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isCheckinModalOpen, setIsCheckinModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check-in State
  const [checkinCoords, setCheckinCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  }>({
    latitude: -14.7935,
    longitude: -39.0465,
    accuracy: 10,
  });
  const [overrideReason, setOverrideReason] = useState("");
  const [checkoutNotes, setCheckoutNotes] = useState("");

  useEffect(() => {
    store.initClient();
    setShifts(store.getShifts());
    setAssignments(store.getAssignments());
    setVisits(store.getVisits());
    setPatients(store.getPatients());
    setProfessionals(store.getProfessionals());
  }, []);

  // Forms
  const [shiftForm, setShiftForm] = useState({
    startTime: "2026-08-28T07:00",
    endTime: "2026-08-28T19:00",
    shiftType: "DIURNO_12H" as const,
    doctorInChargeId: professionals.find((p) => p.profession === "MEDICO")?.id || professionals[0]?.id || "",
    nurseInChargeId: professionals.find((p) => p.profession === "ENFERMEIRO")?.id || "",
    notes: "",
  });

  const [assignForm, setAssignForm] = useState({
    patientId: patients[0]?.id || "",
    professionalId: professionals[0]?.id || "",
    role: "Técnica de Enfermagem Assistencial",
    startDate: "2026-08-28",
  });

  const [visitForm, setVisitForm] = useState({
    patientId: patients[0]?.id || "",
    professionalId: professionals[0]?.id || "",
    scheduledStart: "2026-08-28T08:00",
    scheduledEnd: "2026-08-28T10:00",
    procedureSummary: "Atendimento multidisciplinar e checagem de sinais vitais",
    notes: "",
  });

  const handleCreateShift = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parseResult = ShiftSchema.safeParse({
      ...shiftForm,
      startTime: new Date(shiftForm.startTime),
      endTime: new Date(shiftForm.endTime),
    });

    if (!parseResult.success) {
      setErrorMessage(parseResult.error.errors[0]?.message || "Dados inválidos");
      return;
    }

    const result = store.allocateShift({
      ...shiftForm,
      status: "CONFIRMADO",
      startTime: new Date(shiftForm.startTime),
      endTime: new Date(shiftForm.endTime),
    });

    if (!result.success) {
      setErrorMessage(result.error || "Erro ao alocar plantão.");
      return;
    }

    setShifts(store.getShifts());
    setIsShiftModalOpen(false);
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = store.assignProfessionalToPatient({
      patientId: assignForm.patientId,
      episodeId: `ep_${assignForm.patientId}`,
      professionalId: assignForm.professionalId || store.currentUser.professionalId || "prof_roberta",
      role: assignForm.role,
      startDate: new Date(assignForm.startDate),
      isActive: true,
    });

    if (!result.success) {
      setErrorMessage(result.error || "Erro ao criar vínculo.");
      return;
    }

    setAssignments(store.getAssignments());
    setIsAssignModalOpen(false);
  };

  const handleCreateVisit = (e: React.FormEvent) => {
    e.preventDefault();
    store.createVisit({
      organizationId: store.currentUser.organizationId,
      unitId: store.currentUser.unitIds[0] || "unit_ilheus",
      patientId: visitForm.patientId,
      careEpisodeId: `ep_${visitForm.patientId}`,
      professionalId: visitForm.professionalId,
      scheduledStart: new Date(visitForm.scheduledStart),
      scheduledEnd: new Date(visitForm.scheduledEnd),
      status: "SCHEDULED",
      procedureSummary: visitForm.procedureSummary,
      notes: visitForm.notes,
    });

    setVisits(store.getVisits());
    setIsVisitModalOpen(false);
  };

  const handleOpenCheckin = (visit: Visit) => {
    setSelectedVisit(visit);
    setOverrideReason("");
    setErrorMessage(null);
    setIsCheckinModalOpen(true);

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCheckinCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => {
          console.warn("GPS unavailable, using fallback:", err.message);
          setCheckinCoords({ latitude: -14.7935, longitude: -39.0465, accuracy: 15 });
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  const handleConfirmCheckin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;

    const res = store.recordVisitCheckin({
      visitId: selectedVisit.id!,
      professionalId: selectedVisit.professionalId,
      latitude: checkinCoords.latitude,
      longitude: checkinCoords.longitude,
      accuracy: checkinCoords.accuracy,
      overrideReason: overrideReason || null,
    });

    if (!res.success) {
      setErrorMessage(res.error || "Erro ao realizar check-in beira-leito.");
      return;
    }

    setVisits(store.getVisits());
    setIsCheckinModalOpen(false);
    setSelectedVisit(null);
  };

  const handleOpenCheckout = (visit: Visit) => {
    setSelectedVisit(visit);
    setCheckoutNotes("");
    setIsCheckoutModalOpen(true);
  };

  const handleConfirmCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVisit) return;

    const res = store.recordVisitCheckout({
      visitId: selectedVisit.id!,
      latitude: checkinCoords.latitude,
      longitude: checkinCoords.longitude,
      accuracy: checkinCoords.accuracy,
      notes: checkoutNotes,
    });

    if (!res.success) {
      setErrorMessage(res.error || "Erro ao finalizar visita.");
      return;
    }

    setVisits(store.getVisits());
    setIsCheckoutModalOpen(false);
    setSelectedVisit(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="teal" className="text-xs">
              Operação & Logística de Campo
            </Badge>
            <span className="text-xs text-slate-500 font-medium">Gestão Integrada de Visitas & Escalas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Escalas, Plantões & Vínculos Assistenciais
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Coordenação de turnos 12h/24h, vínculos explícitos e check-in georreferenciado (Geofencing 100m).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsAssignModalOpen(true)} className="gap-1.5 text-xs">
            <LinkIcon className="h-4 w-4 text-teal-600" />
            Vincular Paciente ↔ Profissional
          </Button>
          <Button variant="outline" onClick={() => setIsVisitModalOpen(true)} className="gap-1.5 text-xs">
            <Navigation className="h-4 w-4 text-emerald-600" />
            Nova Visita
          </Button>
          <Button onClick={() => setIsShiftModalOpen(true)} className="gap-2 shrink-0 bg-slate-900 hover:bg-slate-800 text-white">
            <PlusCircle className="h-4 w-4" />
            Agendar Plantão
          </Button>
        </div>
      </div>

      {/* Tabs Principais */}
      <Tabs defaultValue="visitas" className="space-y-4">
        <TabsList className="bg-slate-100 p-1 border border-slate-200">
          <TabsTrigger value="visitas" className="gap-2 text-xs">
            <MapPin className="h-4 w-4 text-teal-600" />
            Visitas de Campo & Check-in GPS ({visits.length})
          </TabsTrigger>
          <TabsTrigger value="plantoes" className="gap-2 text-xs">
            <CalendarCheck className="h-4 w-4 text-indigo-600" />
            Plantões 12h/24h ({shifts.length})
          </TabsTrigger>
          <TabsTrigger value="vinculos" className="gap-2 text-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Vínculos Paciente ↔ Profissional ({assignments.length})
          </TabsTrigger>
        </TabsList>

        {/* 1. ABA VISITAS DE CAMPO & GEOFENCE */}
        <TabsContent value="visitas" className="space-y-4">
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Fila de Visitas Assistenciais Programadas
                </CardTitle>
                <CardDescription className="text-xs">
                  Comprovação beira-leito via GPS, prevenção de glosas e cálculo de cerca virtual (100m)
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Horário Previsto</TableHead>
                    <TableHead>Paciente & Domicílio</TableHead>
                    <TableHead>Profissional Designado</TableHead>
                    <TableHead>Procedimento Previsto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Geofence / Distância</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.map((v) => {
                    const pat = store.getPatientById(v.patientId);
                    const prof = store.getProfessionalById(v.professionalId);
                    const checkin = store.getCheckinByVisitId(v.id!);
                    return (
                      <TableRow key={v.id}>
                        <TableCell>
                          <div className="font-semibold text-slate-900 text-xs">
                            {formatDateTime(v.scheduledStart)}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            até {formatDateTime(v.scheduledEnd)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-slate-900 text-xs">{pat?.fullName || v.patientId}</div>
                          <div className="text-[11px] text-slate-500">
                            {pat?.addressStreet}, {pat?.addressNumber} - {pat?.addressNeighborhood}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-800 text-xs">{prof?.fullName || v.professionalId}</div>
                          <div className="text-[11px] text-teal-700 font-medium">{prof?.profession}</div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 max-w-xs truncate">
                          {v.procedureSummary || "Visita assistencial padrão"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              v.status === "COMPLETED"
                                ? "success"
                                : v.status === "CHECKED_IN" || v.status === "IN_PROGRESS"
                                ? "teal"
                                : "secondary"
                            }
                            className="text-[10px]"
                          >
                            {v.status === "SCHEDULED" ? "AGENDADA" : v.status === "CHECKED_IN" ? "CHECK-IN FEITO" : v.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {checkin ? (
                            <div className="space-y-0.5">
                              <Badge
                                variant={checkin.geofenceResult === "INSIDE_GEOFENCE" ? "success" : "warning"}
                                className="text-[10px] gap-1"
                              >
                                <LocateFixed className="h-3 w-3" />
                                {checkin.geofenceResult === "INSIDE_GEOFENCE"
                                  ? `No local (${Math.round(checkin.distanceFromCareLocation || 0)}m)`
                                  : `Fora do raio (${Math.round(checkin.distanceFromCareLocation || 0)}m)`}
                              </Badge>
                              {checkin.overrideReason && (
                                <div className="text-[10px] text-amber-700 truncate max-w-[140px]" title={checkin.overrideReason}>
                                  Justif: {checkin.overrideReason}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-mono">Aguardando</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {v.status === "SCHEDULED" || v.status === "EN_ROUTE" ? (
                            <Button
                              size="sm"
                              onClick={() => handleOpenCheckin(v)}
                              className="gap-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white"
                            >
                              <MapPin className="h-3.5 w-3.5" /> Check-in GPS
                            </Button>
                          ) : v.status === "CHECKED_IN" || v.status === "IN_PROGRESS" ? (
                            <Button
                              size="sm"
                              onClick={() => handleOpenCheckout(v)}
                              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <CheckCheck className="h-3.5 w-3.5" /> Check-out
                            </Button>
                          ) : (
                            <Badge variant="success" className="text-[10px]">Concluída</Badge>
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

        {/* 2. ABA PLANTÕES 12H/24H */}
        <TabsContent value="plantoes" className="space-y-4">
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>Grade de Plantões Cadastrados</span>
                <Badge variant="teal" className="text-xs">Médico Obrigatório</Badge>
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
                          <div className="font-semibold text-slate-900">{s.shiftType.replace("_", " ")}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {formatDateTime(s.startTime)} às {formatDateTime(s.endTime)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-800">{doc?.fullName || s.doctorInChargeId}</div>
                          <div className="text-xs text-slate-500">{doc?.credentials[0]?.councilType}: {doc?.credentials[0]?.registrationNumber}</div>
                        </TableCell>
                        <TableCell>
                          {nurse ? (
                            <div>
                              <div className="font-medium text-slate-800">{nurse.fullName}</div>
                              <div className="text-xs text-slate-500">COREN: {nurse.credentials[0]?.registrationNumber}</div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Não designada</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.status === "EM_ANDAMENTO" ? "success" : s.status === "CONFIRMADO" ? "teal" : "secondary"}>
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
        </TabsContent>

        {/* 3. ABA VÍNCULOS PACIENTE X PROFISSIONAL */}
        <TabsContent value="vinculos" className="space-y-4">
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                Vínculos Assistenciais Ativos (Anti-IDOR)
              </CardTitle>
              <CardDescription className="text-xs">
                O acesso ao PEP exige vínculo formal explícito e ativo.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Função</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((a) => {
                    const pat = store.getPatientById(a.patientId);
                    const prof = store.getProfessionalById(a.professionalId);
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-bold text-slate-900 text-xs">{pat?.fullName || a.patientId}</TableCell>
                        <TableCell className="font-medium text-slate-800 text-xs">{prof?.fullName || a.professionalId}</TableCell>
                        <TableCell className="text-xs text-slate-600">{a.role}</TableCell>
                        <TableCell className="text-xs text-slate-500 font-mono">{formatDate(a.startDate)}</TableCell>
                        <TableCell>
                          <Badge variant={a.isActive ? "success" : "secondary"} className="text-[10px]">
                            {a.isActive ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal: Check-in Beira-Leito com Geolocalização */}
      <Dialog open={isCheckinModalOpen} onOpenChange={setIsCheckinModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-teal-600" />
              Check-in Beira-Leito (GPS & Geofencing)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Validação da presença física do profissional no domicílio do paciente (Raio de 100m).
            </DialogDescription>
          </DialogHeader>

          {selectedVisit && (
            <form onSubmit={handleConfirmCheckin} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                  {errorMessage}
                </div>
              )}

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="font-bold text-slate-900">
                  Paciente: {store.getPatientById(selectedVisit.patientId)?.fullName}
                </div>
                <div className="text-slate-600">
                  Endereço: {store.getPatientById(selectedVisit.patientId)?.addressStreet}, {store.getPatientById(selectedVisit.patientId)?.addressNumber} - {store.getPatientById(selectedVisit.patientId)?.addressCity}
                </div>
                <div className="text-slate-500 font-mono">
                  Horário: {formatDateTime(selectedVisit.scheduledStart)}
                </div>
              </div>

              {/* Seletor de Simulação / Coordenadas Reais */}
              <div className="space-y-2">
                <Label className="text-xs">Simulação / Posição GPS Capturada</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={checkinCoords.latitude === -14.7935 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCheckinCoords({ latitude: -14.7935, longitude: -39.0465, accuracy: 10 })}
                    className="text-[11px] h-8"
                  >
                    📍 Beira-Leito (0m - Dentro)
                  </Button>
                  <Button
                    type="button"
                    variant={checkinCoords.latitude !== -14.7935 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCheckinCoords({ latitude: -14.7970, longitude: -39.0465, accuracy: 12 })}
                    className="text-[11px] h-8"
                  >
                    ⚠️ Fora da Cerca (+380m)
                  </Button>
                </div>
                <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between">
                  <span>Lat: {checkinCoords.latitude.toFixed(4)}, Lng: {checkinCoords.longitude.toFixed(4)}</span>
                  <span>Acurácia: ±{Math.round(checkinCoords.accuracy)}m</span>
                </div>
              </div>

              {/* Justificativa Assistencial se Fora da Cerca */}
              <div className="space-y-1">
                <Label htmlFor="overrideReason" className="text-xs">
                  Justificativa Operacional (Obrigatória se fora do raio de 100m)
                </Label>
                <Textarea
                  id="overrideReason"
                  rows={2}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Ex: Sinal de GPS com reflexão em condomínio fechado; atendimento realizado no leito."
                  className="text-xs"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCheckinModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="gap-2 bg-teal-600 hover:bg-teal-700 text-white">
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar Check-in
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Check-out / Conclusão */}
      <Dialog open={isCheckoutModalOpen} onOpenChange={setIsCheckoutModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCheck className="h-5 w-5 text-emerald-600" />
              Finalizar Atendimento (Check-out)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Registro do término da visita beira-leito e notas de fechamento do procedimento.
            </DialogDescription>
          </DialogHeader>

          {selectedVisit && (
            <form onSubmit={handleConfirmCheckout} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="checkoutNotes" className="text-xs">Notas do Atendimento / Conclusão</Label>
                <Textarea
                  id="checkoutNotes"
                  rows={3}
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  placeholder="Ex: Procedimento executado com sucesso. Paciente calmo e orientado."
                  className="text-xs"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCheckoutModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <CheckCheck className="h-4 w-4" />
                  Confirmar Check-out
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Nova Visita */}
      <Dialog open={isVisitModalOpen} onOpenChange={setIsVisitModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-emerald-600" />
              Agendar Visita Assistencial
            </DialogTitle>
            <DialogDescription className="text-xs">
              Designação de visita domiciliar com horário e metas terapêuticas.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateVisit} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Paciente *</Label>
              <select
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs"
                value={visitForm.patientId}
                onChange={(e) => setVisitForm({ ...visitForm, patientId: e.target.value })}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.fullName}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Profissional *</Label>
              <select
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs"
                value={visitForm.professionalId}
                onChange={(e) => setVisitForm({ ...visitForm, professionalId: e.target.value })}
              >
                {professionals.map((pr) => (
                  <option key={pr.id} value={pr.id}>{pr.fullName} ({pr.profession})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Início Previsto *</Label>
                <Input
                  type="datetime-local"
                  required
                  value={visitForm.scheduledStart}
                  onChange={(e) => setVisitForm({ ...visitForm, scheduledStart: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fim Previsto *</Label>
                <Input
                  type="datetime-local"
                  required
                  value={visitForm.scheduledEnd}
                  onChange={(e) => setVisitForm({ ...visitForm, scheduledEnd: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Resumo do Procedimento *</Label>
              <Input
                required
                value={visitForm.procedureSummary}
                onChange={(e) => setVisitForm({ ...visitForm, procedureSummary: e.target.value })}
                className="text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsVisitModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">Agendar Visita</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Agendar Plantão */}
      <Dialog open={isShiftModalOpen} onOpenChange={setIsShiftModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-indigo-600" />
              Agendar Novo Plantão
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configuração de escala médica e enfermagem com validação anti-sobreposição.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateShift} className="space-y-3">
            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Data/Hora Início *</Label>
                <Input
                  type="datetime-local"
                  required
                  value={shiftForm.startTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Data/Hora Fim *</Label>
                <Input
                  type="datetime-local"
                  required
                  value={shiftForm.endTime}
                  onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tipo de Plantão *</Label>
              <select
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs"
                value={shiftForm.shiftType}
                onChange={(e) => setShiftForm({ ...shiftForm, shiftType: e.target.value as any })}
              >
                <option value="DIURNO_12H">DIURNO (12h - 07:00 às 19:00)</option>
                <option value="NOTURNO_12H">NOTURNO (12h - 19:00 às 07:00)</option>
                <option value="HORAS_24">24 HORAS</option>
                <option value="FINAL_DE_SEMANA">FINAL DE SEMANA</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-900">Médico Responsável * (Obrigatório)</Label>
              <select
                id="sDoc"
                required
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs"
                value={shiftForm.doctorInChargeId}
                onChange={(e) => setShiftForm({ ...shiftForm, doctorInChargeId: e.target.value })}
              >
                {professionals
                  .filter((p) => p.profession === "MEDICO")
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} — {m.credentials[0]?.councilType}: {m.credentials[0]?.registrationNumber}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Enfermeira Supervisora (Opcional)</Label>
              <select
                id="sNurse"
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs"
                value={shiftForm.nurseInChargeId}
                onChange={(e) => setShiftForm({ ...shiftForm, nurseInChargeId: e.target.value })}
              >
                <option value="">Nenhuma designada</option>
                {professionals
                  .filter((p) => p.profession === "ENFERMEIRO")
                  .map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.fullName} — COREN: {n.credentials[0]?.registrationNumber}
                    </option>
                  ))}
              </select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsShiftModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white">Salvar Plantão</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Vincular Paciente x Profissional */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-teal-600" />
              Atribuição Assistencial (Vínculo)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Concede autorização explícita para visualização e evolução no PEP (Anti-IDOR).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAssignment} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Paciente *</Label>
              <select
                id="asPat"
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs"
                value={assignForm.patientId}
                onChange={(e) => setAssignForm({ ...assignForm, patientId: e.target.value })}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.fullName}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Profissional de Saúde *</Label>
              <select
                id="asProf"
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs"
                value={assignForm.professionalId}
                onChange={(e) => setAssignForm({ ...assignForm, professionalId: e.target.value })}
              >
                {professionals.map((pr) => (
                  <option key={pr.id} value={pr.id}>{pr.fullName} ({pr.profession})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Função / Papel Assistencial *</Label>
              <Input
                id="asRole"
                required
                value={assignForm.role}
                onChange={(e) => setAssignForm({ ...assignForm, role: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Data de Início do Vínculo *</Label>
              <Input
                type="date"
                required
                value={assignForm.startDate}
                onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                className="text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAssignModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white">Confirmar Vínculo</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
