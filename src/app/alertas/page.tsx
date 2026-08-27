"use client";

import { useState, useEffect } from "react";
import { store } from "@/services/store.service";
import { alertsRepository, SystemAlert } from "@/services/supabase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Bell,
  AlertTriangle,
  HeartPulse,
  Activity,
  ShieldAlert,
  CheckCircle2,
  Clock,
  PhoneCall,
  Ambulance,
  Stethoscope,
  Users,
  Search,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [patients, setPatients] = useState(store.getPatients());
  const [search, setSearch] = useState("");

  useEffect(() => {
    store.initClient();
    setPatients(store.getPatients());
    alertsRepository.getActiveAlerts().then(setAlerts);
  }, []);

  const criticalCount = alerts.filter((a) => a.severity === "CRITICO").length;
  const warningCount = alerts.filter((a) => a.severity === "ALERTA").length;

  const filtered = alerts.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.patientName.toLowerCase().includes(q) ||
      a.alertType.toLowerCase().includes(q) ||
      a.doctorInCharge.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">
              Monitoramento Fisiológico & Clínico
            </Badge>
            <span className="text-xs text-slate-500 font-medium">Telemetria em Tempo Real</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Central de Alertas & Beira-Leito
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Triagem automatizada de desvios de sinais vitais, intercorrências e acionamento de suporte médico imediato.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="text-xs gap-1.5 border-slate-300">
            <Clock className="h-4 w-4" /> Histórico de Alertas
          </Button>
          <Button className="bg-red-600 hover:bg-red-500 text-white text-xs font-medium gap-1.5 shadow-xs">
            <Ambulance className="h-4 w-4" /> Acionar Suporte Avançado (SAMU)
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-red-200 bg-red-50/40 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-red-900">Alertas Críticos (Nível 1)</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{criticalCount} paciente(s)</div>
            <p className="text-xs text-red-600 mt-1">Exige intervenção médica imediata</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/40 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-amber-900">Atenção Clínica (Nível 2)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">{warningCount} ocorrência(s)</div>
            <p className="text-xs text-amber-600 mt-1">Reavaliação de conduta de enfermagem</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Tempo Médio de Resposta</CardTitle>
            <Clock className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">4.2 min</div>
            <p className="text-xs text-emerald-600 font-medium mt-1">Meta SLA: &lt; 15 min</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Pacientes Conectados</CardTitle>
            <Activity className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{patients.length} pacientes</div>
            <p className="text-xs text-slate-500 mt-1">100% monitorados na rede</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Alert List */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">Fila Operacional de Intercorrências</CardTitle>
              <CardDescription className="text-xs">Eventos em aberto aguardando fechamento de conduta médica ou de enfermagem</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Filtrar por paciente ou médico..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs bg-slate-50"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filtered.map((alt) => (
            <div
              key={alt.id}
              className={`p-4 rounded-xl border transition-all ${
                alt.severity === "CRITICO"
                  ? "bg-red-50/50 border-red-200"
                  : alt.severity === "ALERTA"
                  ? "bg-amber-50/50 border-amber-200"
                  : "bg-slate-50/70 border-slate-200"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={alt.severity === "CRITICO" ? "destructive" : alt.severity === "ALERTA" ? "warning" : "secondary"}
                      className="text-xs"
                    >
                      {alt.severity}
                    </Badge>
                    <span className="font-bold text-sm text-slate-900">{alt.alertType}</span>
                    <span className="text-xs text-slate-400 font-mono">• {alt.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-700">{alt.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <span className="font-semibold text-slate-800">Paciente: {alt.patientName}</span>
                    <span>Local: {alt.careLocation}</span>
                    <span>Responsável: {alt.doctorInCharge}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {alt.patientId && (
                    <Link href={`/pep/${alt.patientId}`}>
                      <Button size="sm" variant="outline" className="text-xs gap-1 border-slate-300">
                        <HeartPulse className="h-3.5 w-3.5 text-teal-600" /> Abrir PEP
                      </Button>
                    </Link>
                  )}
                  <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Registrar Conduta
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
