"use client";

import { useState, useEffect } from "react";
import { store } from "@/services/store.service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Users,
  CalendarCheck,
  ClipboardList,
  AlertTriangle,
  HeartPulse,
  Stethoscope,
  ArrowRight,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Clock,
} from "lucide-react";

export default function DashboardPage() {
  const [patients, setPatients] = useState(store.getPatients());
  const [myPatients, setMyPatients] = useState(store.getMyPatients());
  const [shifts, setShifts] = useState(store.getShifts());
  const [triages, setTriages] = useState(store.getTriages());
  const [currentUser, setCurrentUser] = useState(store.currentUser);

  useEffect(() => {
    store.initClient();
    setPatients(store.getPatients());
    setMyPatients(store.getMyPatients());
    setShifts(store.getShifts());
    setTriages(store.getTriages());
    setCurrentUser(store.currentUser);
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome & Context Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="teal" className="bg-teal-500/20 text-teal-300 border-teal-400/30 text-xs">
              Central Operacional HomeCare
            </Badge>
            <span className="text-xs text-slate-400 font-medium">Sessão Segura & Auditada</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Olá, {currentUser.name}
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Visão geral da assistência domiciliar, escalas ativas, elegibilidade clínica e prontuários vinculados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/pep">
            <Button className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold gap-2 shadow-md">
              <Stethoscope className="h-4 w-4" />
              Abrir PEP (Meus Pacientes)
            </Button>
          </Link>
          <Link href="/pacientes">
            <Button variant="outline" className="border-slate-700 bg-slate-800/60 text-white hover:bg-slate-800 gap-2">
              <Users className="h-4 w-4" />
              Cadastrar Paciente
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-slate-200/80 shadow-xs hover:border-teal-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Pacientes em Atenção Domiciliar</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{patients.length}</div>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> 100% com episódios ativos
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs hover:border-teal-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Meus Pacientes Vinculados</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Stethoscope className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{myPatients.length}</div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Vínculo explícito ({currentUser.role})
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs hover:border-teal-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Plantões Hoje</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <CalendarCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{shifts.length}</div>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Médico responsável definido
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs hover:border-teal-500/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-slate-600">Triagens Realizadas</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <ClipboardList className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{triages.length}</div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Elegibilidade & Plano gerado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grid: 2 Ciclos Fundamentais do HomeCare */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ciclo 1: Admissão & Triagem */}
        <Card className="border-slate-200/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-teal-600" />
                  Ciclo de Admissão & Elegibilidade
                </CardTitle>
                <CardDescription>
                  Cadastro centralizado, avaliação multidimensional e plano assistencial.
                </CardDescription>
              </div>
              <Link href="/triagem">
                <Button size="sm" variant="ghost" className="gap-1 text-xs text-teal-700">
                  Ver Todas <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {triages.slice(0, 3).map((triage) => {
              const patient = store.getPatientById(triage.patientId);
              return (
                <div
                  key={triage.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">{patient?.fullName}</span>
                      <Badge variant="teal" className="text-[10px]">
                        CID: {triage.cid10}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">{triage.mainDiagnosis}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant={triage.eligibility === "ELEGIVEL" ? "success" : "destructive"}>
                      {triage.eligibility === "ELEGIVEL" ? "Elegível" : "Não Elegível"}
                    </Badge>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      Complexidade: {triage.complexityLevel}
                    </p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Ciclo 2: Operação, Plantões & Assistência Beira-Leito */}
        <Card className="border-slate-200/80">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-teal-600" />
                  Ciclo Assistencial & Plantões
                </CardTitle>
                <CardDescription>
                  Escalas com médico obrigatório e prontuário eletrônico contextual.
                </CardDescription>
              </div>
              <Link href="/escalas">
                <Button size="sm" variant="ghost" className="gap-1 text-xs text-teal-700">
                  Ver Grade <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {shifts.map((shift) => {
              const doc = store.getProfessionalById(shift.doctorInChargeId);
              const nurse = shift.nurseInChargeId ? store.getProfessionalById(shift.nurseInChargeId) : null;
              return (
                <div
                  key={shift.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">
                        Turno: {shift.shiftType.replace("_", " ")}
                      </span>
                      <Badge variant="success" className="text-[10px]">
                        {shift.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600">
                      <strong>Médico Resp:</strong> {doc?.fullName || "Definido"} ({doc?.councilType})
                    </p>
                    {nurse && (
                      <p className="text-xs text-slate-500">
                        <strong>Enfermeira:</strong> {nurse.fullName}
                      </p>
                    )}
                  </div>

                  <Link href="/pep">
                    <Button size="sm" className="gap-1 text-xs shrink-0">
                      Abrir PEP <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

