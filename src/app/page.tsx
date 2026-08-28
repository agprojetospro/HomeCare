"use client";

import { useState, useEffect } from "react";
import { store } from "@/services/store.service";
import { OperationalDashboardMetrics } from "@/domain/dashboard/operational-metrics.schema";
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
  Boxes,
  HeartHandshake,
  Flame,
  Bandage,
  Wifi,
  Smile,
  Navigation,
  FileHeart,
} from "lucide-react";

export default function DashboardPage() {
  const [selectedUnitId, setSelectedUnitId] = useState<string>("ALL");
  const [metrics, setMetrics] = useState<OperationalDashboardMetrics | null>(null);
  const [patients, setPatients] = useState(store.getPatients());
  const [currentUser, setCurrentUser] = useState(store.currentUser);
  const [alerts, setAlerts] = useState(store.getActiveAlerts());

  useEffect(() => {
    store.initClient();
    const unitArg = selectedUnitId === "ALL" ? undefined : selectedUnitId;
    setMetrics(store.getOperationalDashboardMetrics(unitArg));
    setPatients(store.getPatients(unitArg));
    const allPats = store.getPatients();
    setPatients(unitArg ? allPats.filter((p) => p.unitId === unitArg) : allPats);
    setCurrentUser(store.currentUser);
    setAlerts(store.getActiveAlerts());
  }, [selectedUnitId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ------------------------------------------------------------- */}
      {/* CABEÇALHO EXECUTIVO & SELETOR DE UNIDADES */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-teal-900 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="teal" className="bg-teal-500/20 text-teal-300 border-teal-400/30 text-xs px-3 py-1">
              Central Operacional HomeCare — Comando Unificado
            </Badge>
            <Badge variant="outline" className="text-white/70 border-white/20 text-[11px] gap-1">
              <ShieldCheck className="h-3 w-3 text-teal-400" /> Sessão Auditada
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Olá, {currentUser.name}
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Monitoramento em tempo real de estabilidade clínica (NEWS2), visitas beira-leito com GPS, logística de $\text{O}_2$, curativos NPUAP e portal familiar.
            Monitoramento em tempo real de estabilidade clínica (NEWS2), visitas beira-leito com GPS, logística de O₂, curativos NPUAP e portal familiar.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Seletor de Unidade */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20">
            <label className="block text-[10px] text-teal-300 uppercase font-bold px-2 pb-0.5">Unidade Operacional</label>
            <select
              className="bg-transparent text-white font-semibold text-xs border-none focus:outline-none px-2 cursor-pointer"
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
            >
              <option value="ALL" className="text-slate-900">Todas as Unidades (Ilhéus + Itabuna)</option>
              <option value="unit_ilheus" className="text-slate-900">Polo Ilhéus (BA)</option>
              <option value="unit_itabuna" className="text-slate-900">Polo Itabuna (BA)</option>
            </select>
          </div>

          <Link href="/pep">
            <Button className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold gap-2 shadow-md text-xs">
              <Stethoscope className="h-4 w-4" />
              Meus Prontuários (PEP)
            </Button>
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5 CARDS ESTRATÉGICOS DE KPIs CONSOLIDADOS */}
      {/* ------------------------------------------------------------- */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. NEWS2 Clínico */}
          <Card className="border-slate-200/80 shadow-xs hover:border-teal-300 transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">Segurança Clínica</span>
                <HeartPulse className="h-4 w-4 text-teal-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900 mt-1">
                {metrics.news2CriticalCount + metrics.news2MediumCount > 0 ? (
                  <span className="text-amber-600 font-mono">{metrics.news2CriticalCount + metrics.news2MediumCount} Atenção</span>
                ) : (
                  <span className="text-emerald-600 font-mono">100% Estável</span>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                {metrics.news2StableCount} paciente(s) estáveis (NEWS2)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/alertas" className="text-[11px] text-teal-700 font-semibold flex items-center gap-1 hover:underline">
                Ver Alertas Beira-Leito <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>

          {/* 2. Operação & Visitas GPS */}
          <Card className="border-slate-200/80 shadow-xs hover:border-teal-300 transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">Visitas do Dia</span>
                <Navigation className="h-4 w-4 text-indigo-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                {metrics.visitsCompleted} / {metrics.visitsTodayTotal}
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                {metrics.visitsInProgress} em andamento • {metrics.visitsScheduled} agendada(s)
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/escalas" className="text-[11px] text-indigo-700 font-semibold flex items-center gap-1 hover:underline">
                Escalas & Check-in GPS <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>

          {/* 3. Insumos & Oxigênio */}
          <Card className="border-slate-200/80 shadow-xs hover:border-teal-300 transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">Insumos & O₂</span>
                <Boxes className="h-4 w-4 text-amber-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                {metrics.criticalSuppliesCount} Insumos
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                {metrics.criticalOxygenCount} paciente(s) com cilindro crítico
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/insumos" className="text-[11px] text-amber-700 font-semibold flex items-center gap-1 hover:underline">
                Logística & Estoque <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>

          {/* 4. Curativos & Lesões */}
          <Card className="border-slate-200/80 shadow-xs hover:border-teal-300 transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">Curativos NPUAP</span>
                <Bandage className="h-4 w-4 text-teal-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                {metrics.activeWoundsCount} Lesão(ões)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Classificadas e sob acompanhamento
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/pep/pat_antonio" className="text-[11px] text-teal-700 font-semibold flex items-center gap-1 hover:underline">
                Abrir Protocolo no PEP <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>

          {/* 5. Portal da Família */}
          <Card className="border-slate-200/80 shadow-xs hover:border-teal-300 transition-all">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase">Portal do Familiar</span>
                <HeartHandshake className="h-4 w-4 text-rose-500" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900 mt-1 font-mono flex items-center gap-1">
                ⭐ {metrics.familySatisfactionRating}
                <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                {metrics.totalFamilyFeedbacks} avaliações recebidas
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/portal-familiar" className="text-[11px] text-rose-700 font-semibold flex items-center gap-1 hover:underline">
                Ver Diário da Família <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PAINEL OPERACIONAL PRINCIPAL: PACIENTES VINCULADOS & ALERTAS */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Pacientes em Atendimento Ativo */}
        <Card className="border-slate-200/80 shadow-xs lg:col-span-2">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-teal-600" />
                Pacientes em Assistência Domiciliar ({patients.length})
              </CardTitle>
              <CardDescription className="text-xs">
                Acesso direto ao prontuário eletrônico com histórico, NEWS2 e plano terapêutico
              </CardDescription>
            </div>
            <Link href="/pacientes">
              <Button variant="outline" size="sm" className="text-xs gap-1">
                Ver Todos <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {patients.map((pat) => {
                const scores = store.getNews2Scores(pat.id!);
                const latestScore = scores[0];
                const oxygen = store.getPatientOxygenTherapy(pat.id!);
                const wounds = store.getWoundEvaluations(pat.id!);

                return (
                  <div key={pat.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link href={`/pep/${pat.id}`} className="font-bold text-slate-900 hover:text-teal-700 text-sm">
                          {pat.fullName}
                        </Link>
                        <Badge variant="secondary" className="text-[10px] font-mono">
                          {pat.healthInsuranceCompany}
                          {pat.status}
                        </Badge>
                        {latestScore && (
                          <Badge
                            variant={latestScore.score >= 7 ? "destructive" : latestScore.score >= 5 ? "warning" : "success"}
                            className="text-[10px]"
                          >
                            NEWS2: {latestScore.score} ({latestScore.riskLevel})
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span>{pat.addressCity}/{pat.addressState} — {pat.addressNeighborhood}</span>
                        {oxygen && (
                          <span className="text-amber-700 font-medium flex items-center gap-1">
                            <Flame className="h-3 w-3" /> O₂: {oxygen.flowRateLpm} L/min ({oxygen.currentPressureBar || 0} bar)
                          </span>
                        )}
                        {wounds.length > 0 && (
                          <span className="text-teal-700 font-medium flex items-center gap-1">
                            <Bandage className="h-3 w-3" /> {wounds.length} Lesão(ões)
                          </span>
                        )}
                      </div>
                    </div>

                    <Link href={`/pep/${pat.id}`}>
                      <Button size="sm" variant="secondary" className="text-xs gap-1 text-slate-800 font-semibold">
                        Abrir PEP <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Painel Lateral de Ações Rápidas & Alertas Ativos */}
        <div className="space-y-6">
          {/* Alertas Ativos Beira-Leito */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Alertas Beira-Leito Ativos ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {alerts.length > 0 ? (
                alerts.map((al) => (
                alerts.map((al: { id: string; patientName: string; severity: string; message: string; triggerParam: string }) => (
                  <div key={al.id} className="p-3 bg-red-50/80 border border-red-200 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-red-900">{al.patientName}</strong>
                      <Badge variant="destructive" className="text-[10px]">{al.severity}</Badge>
                    </div>
                    <p className="text-red-800 text-[11px]">{al.message}</p>
                    <div className="text-[10px] text-red-600 font-mono pt-1">Gatilho: {al.triggerParam}</div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Todos os pacientes monitorados encontram-se estáveis no momento.</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Atalhos Rápidos */}
          <Card className="border-slate-200/80 shadow-xs p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Ações Rápidas</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/pacientes">
                <Button variant="outline" className="w-full justify-start text-xs gap-1.5 h-10">
                  <Users className="h-3.5 w-3.5 text-teal-600" /> Admissão
                </Button>
              </Link>
              <Link href="/triagem">
                <Button variant="outline" className="w-full justify-start text-xs gap-1.5 h-10">
                  <ClipboardList className="h-3.5 w-3.5 text-indigo-600" /> Triagem
                </Button>
              </Link>
              <Link href="/escalas">
                <Button variant="outline" className="w-full justify-start text-xs gap-1.5 h-10">
                  <CalendarCheck className="h-3.5 w-3.5 text-emerald-600" /> Escalas
                </Button>
              </Link>
              <Link href="/insumos">
                <Button variant="outline" className="w-full justify-start text-xs gap-1.5 h-10">
                  <Boxes className="h-3.5 w-3.5 text-amber-600" /> Insumos & O₂
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
