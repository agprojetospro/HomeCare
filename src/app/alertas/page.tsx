"use client";

import { useState } from "react";
import { store } from "@/services/store.service";
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
  const [patients] = useState(store.getPatients());
  const [search, setSearch] = useState("");

  const activeAlerts = [
    {
      id: "alt_1",
      patientId: "pat_antonio",
      patientName: "Seu Antônio Silva",
      severity: "CRITICO" as const,
      alertType: "SpO2 Abaixo da Faixa Segura (88%)",
      description: "Paciente sob macronebulização apresentou queda transitória de saturação de oxigênio.",
      timestamp: "Há 12 minutos",
      status: "EM_ATENDIMENTO" as const,
      careLocation: "Rua das Bromélias, 120 - Ilhéus (BA)",
      doctorInCharge: "Dra. Roberta Mendes (CRM-BA 28941)",
    },
    {
      id: "alt_2",
      patientId: "pat_maria",
      patientName: "Dona Maria Francisca",
      severity: "ALERTA" as const,
      alertType: "Pressão Arterial Elevada (175/100 mmHg)",
      description: "Paciente queixou-se de cefaleia occipital leve. Sinais vitais reavaliados.",
      timestamp: "Há 45 minutos",
      status: "CONDUTA_REGISTRADA" as const,
      careLocation: "Av. Soares Lopes, 450 - Ilhéus (BA)",
      doctorInCharge: "Dr. André Santos (CRM-BA 31204)",
    },
    {
      id: "alt_3",
      patientId: "pat_antonio",
      patientName: "Seu Antônio Silva",
      severity: "INFO" as const,
      alertType: "Troca de Plantão 12h Realizada",
      description: "Passagem de plantão diurno para noturno concluída com sucesso.",
      timestamp: "Há 3 horas",
      status: "RESOLVIDO" as const,
      careLocation: "Rua das Bromélias, 120 - Ilhéus (BA)",
      doctorInCharge: "Dra. Roberta Mendes (CRM-BA 28941)",
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-xs">
              Monitoramento Beira-Leito
            </Badge>
            <span className="text-xs text-slate-500 font-medium">Segurança do Paciente</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Central de Alertas & Intercorrências
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitoramento em tempo real de instabilidades fisiológicas, recusas medicamentosas e intercorrências clínicas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 text-xs py-1.5 px-3">
            <Activity className="h-3.5 w-3.5 mr-1 text-emerald-600 animate-pulse" /> Telemetria Ativa
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-rose-200 bg-rose-50/40 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-rose-900">Alertas Críticos Ativos</CardTitle>
            <ShieldAlert className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-950">1 alerta</div>
            <p className="text-xs text-rose-700 font-medium mt-0.5">Exige conduta médica imediata</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/40 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-amber-900">Alertas em Observação</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-950">1 alerta</div>
            <p className="text-xs text-amber-700 font-medium mt-0.5">Sob vigilância da equipe</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Tempo Médio de Resposta</CardTitle>
            <Clock className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">4.2 min</div>
            <p className="text-xs text-emerald-600 font-medium mt-0.5">Excelente desempenho</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Feed */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900">Feed de Alertas em Tempo Real</CardTitle>
          <CardDescription className="text-xs">
            Alertas disparados automaticamente por limites de sinais vitais no PEP ou reportados pela equipe
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-xl border transition-all ${
                alert.severity === "CRITICO"
                  ? "bg-rose-50/70 border-rose-200 text-rose-950"
                  : alert.severity === "ALERTA"
                  ? "bg-amber-50/60 border-amber-200 text-amber-950"
                  : "bg-slate-50 border-slate-200 text-slate-900"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-black/5">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      alert.severity === "CRITICO"
                        ? "destructive"
                        : alert.severity === "ALERTA"
                        ? "warning"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {alert.severity}
                  </Badge>
                  <span className="font-bold text-sm">{alert.alertType}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs opacity-75">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{alert.timestamp}</span>
                </div>
              </div>

              <div className="py-2.5 space-y-1 text-xs">
                <p className="font-medium leading-relaxed">{alert.description}</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 opacity-80">
                  <span>
                    Paciente: <strong>{alert.patientName}</strong>
                  </span>
                  <span>Local: {alert.careLocation}</span>
                  <span>Médico: {alert.doctorInCharge}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/5">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[11px] bg-white/60">
                    Status: {alert.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/pep/${alert.patientId}`}>
                    <Button size="sm" variant="outline" className="text-xs gap-1 bg-white hover:bg-slate-50">
                      <Stethoscope className="h-3.5 w-3.5 text-teal-600" /> Abrir PEP
                    </Button>
                  </Link>
                  <Button size="sm" className="bg-rose-700 hover:bg-rose-600 text-white text-xs gap-1 shadow-xs">
                    <PhoneCall className="h-3.5 w-3.5" /> Acionar Médico
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
