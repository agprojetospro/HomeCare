"use client";

import { useState } from "react";
import { store } from "@/services/store.service";
import { Pad, MultidisciplinaryVisit, EquipmentAndMaterial, PadSchema } from "@/domain/pad/pad.schema";
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
  FileHeart,
  PlusCircle,
  Stethoscope,
  Activity,
  HeartPulse,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Layers,
  Box,
  Users,
  Search,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function PadPage() {
  const [pads, setPads] = useState<Pad[]>(store.getPads());
  const [patients] = useState(store.getPatients());
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    patientId: patients[0]?.id || "",
    careRegime: "HOME_CARE_12H_DIURNO" as const,
    clinicalGoals: "",
    reviewIntervalDays: 30,
    visits: [
      {
        profession: "FISIOTERAPEUTA" as const,
        frequencyPerWeek: 3,
        durationMinutes: 60,
        objective: "Cinesioterapia motora e fisioterapia respiratória.",
        professionalInChargeId: null,
      },
    ] as MultidisciplinaryVisit[],
    equipment: [
      {
        itemCategory: "RESPIRATORIO" as const,
        itemName: "Concentrador de Oxigênio 5L/min",
        quantity: 1,
        specifications: "Com copo umidificador",
        status: "EM_USO" as const,
      },
      {
        itemCategory: "MOBILIARIO" as const,
        itemName: "Cama Hospitalar Fawler",
        quantity: 1,
        specifications: "Com grades de proteção",
        status: "EM_USO" as const,
      },
    ] as EquipmentAndMaterial[],
  });

  const filteredPads = pads.filter((p) => {
    const pat = store.getPatientById(p.patientId);
    const patName = pat ? pat.fullName.toLowerCase() : "";
    const q = search.toLowerCase();
    return patName.includes(q) || p.careRegime.toLowerCase().includes(q) || p.status.toLowerCase().includes(q);
  });

  const handleAddVisit = () => {
    setFormData((prev) => ({
      ...prev,
      visits: [
        ...prev.visits,
        {
          profession: "FONOAUDIOLOGO",
          frequencyPerWeek: 2,
          durationMinutes: 45,
          objective: "Reabilitação fonoaudiológica.",
          professionalInChargeId: null,
        },
      ],
    }));
  };

  const handleRemoveVisit = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      visits: prev.visits.filter((_, i) => i !== index),
    }));
  };

  const handleAddEquipment = () => {
    setFormData((prev) => ({
      ...prev,
      equipment: [
        ...prev.equipment,
        {
          itemCategory: "CURATIVO_ESPECIAL",
          itemName: "Placa de Hidrocolóide 10x10cm",
          quantity: 10,
          specifications: "Para lesão sacral",
          status: "SOLICITADO",
        },
      ],
    }));
  };

  const handleRemoveEquipment = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== index),
    }));
  };

  const handleCreatePad = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const episode = store.getEpisodeByPatientId(formData.patientId);
    if (!episode) {
      setErrorMessage("O paciente selecionado não possui um episódio assistencial ativo.");
      return;
    }

    const parseResult = PadSchema.safeParse({
      organizationId: store.currentUser.organizationId,
      unitId: store.currentUser.unitIds[0] || "unit_ilheus",
      episodeId: episode.id,
      patientId: formData.patientId,
      version: 1,
      careRegime: formData.careRegime,
      startDate: new Date(),
      reviewIntervalDays: Number(formData.reviewIntervalDays),
      status: "ATIVO",
      createdById: store.currentUser.professionalId || "prof_roberta",
      clinicalGoals: formData.clinicalGoals,
      visits: formData.visits,
      equipment: formData.equipment,
    });

    if (!parseResult.success) {
      setErrorMessage(parseResult.error.errors[0].message);
      return;
    }

    const created = store.createPad(parseResult.data);
    setPads(store.getPads());
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="teal" className="text-xs">
              Módulo Assistencial
            </Badge>
            <span className="text-xs text-slate-500 font-medium">Projeto Terapêutico Singular</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Planos de Atenção Domiciliar (PAD)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Estruturação de regimes de atendimento, grade multiprofissional, metas clínicas e insumos.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-teal-600 hover:bg-teal-500 text-white font-medium gap-2 shadow-xs"
        >
          <PlusCircle className="h-4 w-4" /> Novo Plano (PAD)
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">PADs Ativos</CardTitle>
            <FileHeart className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {pads.filter((p) => p.status === "ATIVO").length}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Com acompanhamento beira-leito</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Visitas Multiprofissionais / Semana</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {pads.reduce((acc, p) => acc + p.visits.reduce((vAcc, v) => vAcc + v.frequencyPerWeek, 0), 0)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Fisioterapia, Fono, Nutrição e Psico</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Equipamentos em Campo</CardTitle>
            <Box className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {pads.reduce((acc, p) => acc + p.equipment.length, 0)}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Concentradores, camas e insumos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Planos Assistenciais Estruturados</CardTitle>
              <CardDescription className="text-xs">
                Projetos terapêuticos ativos e histórico de versões
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por paciente ou regime..."
                className="pl-8 text-xs h-9 bg-slate-50 border-slate-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Regime Assistencial</TableHead>
                <TableHead>Visitas Multiprofissionais</TableHead>
                <TableHead>Insumos / Equipamentos</TableHead>
                <TableHead>Metas & Reavaliação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                    Nenhum Plano de Atenção Domiciliar encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPads.map((pad) => {
                  const patient = store.getPatientById(pad.patientId);
                  return (
                    <TableRow key={pad.id}>
                      <TableCell>
                        <div className="font-bold text-slate-900 text-xs">{patient?.fullName || pad.patientId}</div>
                        <div className="text-[11px] text-slate-500">Início: {formatDate(pad.startDate)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-teal-300 bg-teal-50 text-teal-800 text-xs">
                          {pad.careRegime}
                        </Badge>
                        <div className="text-[10px] text-slate-400 mt-0.5">Versão {pad.version}.0</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          {pad.visits.map((v, i) => (
                            <div key={i} className="text-xs text-slate-700">
                              • <strong>{v.profession}</strong>: {v.frequencyPerWeek}x/sem ({v.durationMinutes}min)
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-slate-700">
                          {pad.equipment.length} item(ns) alocado(s)
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                          {pad.equipment.map((e) => e.itemName).join(", ")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-slate-800 font-medium line-clamp-2 max-w-[220px]">
                          {pad.clinicalGoals}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Ciclo de {pad.reviewIntervalDays} dias
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={pad.status === "ATIVO" ? "success" : "secondary"}>
                          {pad.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1.5">
                        <Link href={`/pacientes/${pad.patientId}`}>
                          <Button size="sm" variant="ghost" className="text-xs gap-1 text-slate-700">
                            <Users className="h-3.5 w-3.5 text-slate-500" /> Dossiê
                          </Button>
                        </Link>
                        <Link href={`/pep/${pad.patientId}`}>
                          <Button size="sm" variant="outline" className="text-xs gap-1 text-teal-700 border-teal-200">
                            <Stethoscope className="h-3.5 w-3.5 text-teal-600" /> PEP
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal: Novo PAD */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <FileHeart className="h-5 w-5 text-teal-600" />
              Estruturar Novo Plano de Atenção Domiciliar (PAD)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Defina o regime de plantão, frequência de visitas da equipe multidisciplinar, metas clínicas e insumos.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleCreatePad} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="patientId" className="text-xs font-semibold">Paciente *</Label>
                <select
                  id="patientId"
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  required
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} (CPF: {p.cpf || "Sem CPF"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="careRegime" className="text-xs font-semibold">Regime de Cuidado *</Label>
                <select
                  id="careRegime"
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  value={formData.careRegime}
                  onChange={(e) => setFormData({ ...formData, careRegime: e.target.value as any })}
                >
                  <option value="HOME_CARE_24H">Home Care 24 Horas Contínuo</option>
                  <option value="HOME_CARE_12H_DIURNO">Home Care 12 Horas Diurno (07h às 19h)</option>
                  <option value="HOME_CARE_12H_NOTURNO">Home Care 12 Horas Noturno (19h às 07h)</option>
                  <option value="VISITAS_PONTUAIS">Apenas Visitas Multidisciplinares Pontuais</option>
                  <option value="PROCEDIMENTOS_ESPECIAIS">Procedimentos Especiais e Curativos</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="clinicalGoals" className="text-xs font-semibold">Metas Terapêuticas & Objetivos Clínicos *</Label>
              <Textarea
                id="clinicalGoals"
                rows={3}
                className="text-xs"
                placeholder="Descreva as metas do paciente (Ex: desmame ventilatório, ganho de amplitude motora, cicatrização de lesão por pressão)..."
                value={formData.clinicalGoals}
                onChange={(e) => setFormData({ ...formData, clinicalGoals: e.target.value })}
                required
              />
            </div>

            {/* Seção de Visitas Multidisciplinares */}
            <div className="space-y-2 border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-teal-600" /> Grade de Visitas Multiprofissionais
                </Label>
                <Button type="button" size="sm" variant="outline" onClick={handleAddVisit} className="text-xs h-7">
                  + Adicionar Profissão
                </Button>
              </div>

              <div className="space-y-2">
                {formData.visits.map((v, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="space-y-0.5">
                      <Label className="text-[10px] text-slate-500">Profissão</Label>
                      <select
                        className="w-full h-8 rounded border border-slate-300 text-xs px-2 bg-white"
                        value={v.profession}
                        onChange={(e) => {
                          const updated = [...formData.visits];
                          updated[index].profession = e.target.value as any;
                          setFormData({ ...formData, visits: updated });
                        }}
                      >
                        <option value="FISIOTERAPEUTA">Fisioterapeuta</option>
                        <option value="FONOAUDIOLOGO">Fonoaudiólogo</option>
                        <option value="NUTRICIONISTA">Nutricionista</option>
                        <option value="PSICOLOGO">Psicólogo</option>
                        <option value="TERAPEUTA_OCUPACIONAL">Terapeuta Ocupacional</option>
                        <option value="ENFERMEIRO">Enfermeiro Supervisor</option>
                        <option value="MEDICO">Médico Assistente</option>
                      </select>
                    </div>

                    <div className="space-y-0.5">
                      <Label className="text-[10px] text-slate-500">Freq/Semana</Label>
                      <Input
                        type="number"
                        min={1}
                        max={7}
                        className="h-8 text-xs bg-white"
                        value={v.frequencyPerWeek}
                        onChange={(e) => {
                          const updated = [...formData.visits];
                          updated[index].frequencyPerWeek = Number(e.target.value);
                          setFormData({ ...formData, visits: updated });
                        }}
                      />
                    </div>

                    <div className="space-y-0.5">
                      <Label className="text-[10px] text-slate-500">Objetivo Terapêutico</Label>
                      <Input
                        className="h-8 text-xs bg-white"
                        value={v.objective}
                        onChange={(e) => {
                          const updated = [...formData.visits];
                          updated[index].objective = e.target.value;
                          setFormData({ ...formData, visits: updated });
                        }}
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveVisit(index)}
                        className="h-8 text-xs text-rose-600 hover:bg-rose-50 w-full"
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seção de Equipamentos */}
            <div className="space-y-2 border-t border-slate-200 pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Box className="h-4 w-4 text-amber-600" /> Prescrição de Equipamentos e Insumos
                </Label>
                <Button type="button" size="sm" variant="outline" onClick={handleAddEquipment} className="text-xs h-7">
                  + Adicionar Item
                </Button>
              </div>

              <div className="space-y-2">
                {formData.equipment.map((eq, index) => (
                  <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <div className="space-y-0.5">
                      <Label className="text-[10px] text-slate-500">Categoria</Label>
                      <select
                        className="w-full h-8 rounded border border-slate-300 text-xs px-2 bg-white"
                        value={eq.itemCategory}
                        onChange={(e) => {
                          const updated = [...formData.equipment];
                          updated[index].itemCategory = e.target.value as any;
                          setFormData({ ...formData, equipment: updated });
                        }}
                      >
                        <option value="RESPIRATORIO">Respiratório (O2/Aspirador)</option>
                        <option value="MOBILIARIO">Mobiliário (Cama/Colchão)</option>
                        <option value="CURATIVO_ESPECIAL">Curativos Especiais</option>
                        <option value="NUTRICAO_ENTERAL">Nutrição Enteral/Dietas</option>
                        <option value="HIGIENE_E_CONFORTO">Higiene & Conforto</option>
                      </select>
                    </div>

                    <div className="space-y-0.5">
                      <Label className="text-[10px] text-slate-500">Nome do Item</Label>
                      <Input
                        className="h-8 text-xs bg-white"
                        value={eq.itemName}
                        onChange={(e) => {
                          const updated = [...formData.equipment];
                          updated[index].itemName = e.target.value;
                          setFormData({ ...formData, equipment: updated });
                        }}
                      />
                    </div>

                    <div className="space-y-0.5">
                      <Label className="text-[10px] text-slate-500">Quantidade</Label>
                      <Input
                        type="number"
                        min={1}
                        className="h-8 text-xs bg-white"
                        value={eq.quantity}
                        onChange={(e) => {
                          const updated = [...formData.equipment];
                          updated[index].quantity = Number(e.target.value);
                          setFormData({ ...formData, equipment: updated });
                        }}
                      />
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveEquipment(index)}
                        className="h-8 text-xs text-rose-600 hover:bg-rose-50 w-full"
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="pt-2 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="text-xs">
                Cancelar
              </Button>
              <Button type="submit" className="bg-teal-600 hover:bg-teal-500 text-white text-xs">
                Salvar e Homologar PAD
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
