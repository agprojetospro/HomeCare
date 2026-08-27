"use client";

import { useState, useEffect } from "react";
import { store } from "@/services/store.service";
import { billingRepository, Insurer } from "@/services/supabase";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  DollarSign,
  Receipt,
  FileCheck,
  Building2,
  Calendar,
  AlertTriangle,
  Download,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Filter,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function FaturamentoPage() {
  const [patients, setPatients] = useState(store.getPatients());
  const [pads, setPads] = useState(store.getPads());
  const [shifts, setShifts] = useState(store.getShifts());
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    store.initClient();
    setPatients(store.getPatients());
    setPads(store.getPads());
    setShifts(store.getShifts());
    billingRepository.getInsurers().then(setInsurers);
  }, []);

  const totalBilling = insurers.reduce((acc, curr) => acc + curr.monthlyBillingEstimated, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="teal" className="text-xs">
              Módulo Financeiro & Convênios
            </Badge>
            <span className="text-xs text-slate-500 font-medium">Padrão TISS / TUSS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Faturamento & Gestão de Convênios
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Controle de autorizações de diárias, fechamento de plantões executados e geração de lotes TISS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="text-xs gap-1.5 border-slate-300">
            <Download className="h-4 w-4" /> Exportar Relatório CSV
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-500 text-white text-xs font-medium gap-1.5 shadow-xs">
            <Receipt className="h-4 w-4" /> Gerar Lote TISS
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Faturamento Projetado (Mês)</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalBilling)}
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1">+12.4% vs mês anterior</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Diárias & Plantões Faturáveis</CardTitle>
            <Clock className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{shifts.length * 28} plantões</div>
            <p className="text-xs text-slate-500 mt-1">100% auditados por escala</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Guias a Vencer (PAD)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">2 autorizações</div>
            <p className="text-xs text-slate-500 mt-1">Exigem renovação em até 7 dias</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Taxa de Glosa Histórica</CardTitle>
            <ShieldCheck className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">0.4%</div>
            <p className="text-xs text-emerald-600 font-medium mt-1">Auditoria prévia ativa</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="autorizacoes" className="space-y-4">
        <TabsList className="bg-slate-100 p-1">
          <TabsTrigger value="autorizacoes" className="text-xs">
            Autorizações & Diárias (PAD)
          </TabsTrigger>
          <TabsTrigger value="convenios" className="text-xs">
            Operadoras & Convênios ({insurers.length})
          </TabsTrigger>
          <TabsTrigger value="plantoes" className="text-xs">
            Fechamento de Plantões
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: AUTORIZAÇÕES */}
        <TabsContent value="autorizacoes" className="space-y-4">
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Acompanhamento de Diárias Autorizadas pelos Convênios
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Vigência das autorizações de internação domiciliar vinculadas aos PADs ativos
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Filtrar por paciente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 pl-8 text-xs bg-slate-50"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Regime Contratado</TableHead>
                    <TableHead>Início Vigência</TableHead>
                    <TableHead>Dias Restantes</TableHead>
                    <TableHead>Status Autorização</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pads.map((pad) => {
                    const pat = patients.find((p) => p.id === pad.patientId);
                    return (
                      <TableRow key={pad.id}>
                        <TableCell>
                          <div className="font-bold text-slate-900 text-xs">{pat?.fullName || pad.patientId}</div>
                          <div className="text-[11px] text-slate-500">PAD #{pad.id} • Versão {pad.version}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs font-mono">
                            {pad.careRegime}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 font-mono">
                          {formatDate(pad.startDate)}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-bold text-amber-600">4 dias</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="warning" className="text-xs">
                            Prorrogação Solicitada
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" className="text-xs gap-1 border-slate-300">
                            <Receipt className="h-3.5 w-3.5 text-slate-600" /> Detalhes Guia
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: CONVÊNIOS */}
        <TabsContent value="convenios" className="space-y-4">
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">Operadoras de Saúde e Tabelas Contratadas</CardTitle>
              <CardDescription className="text-xs">Tabelas de diárias, taxas de visita e dados para faturamento TISS</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Operadora / Razão Social</TableHead>
                    <TableHead>Código ANS / TISS</TableHead>
                    <TableHead>Pacientes Atendidos</TableHead>
                    <TableHead>Faturamento Médio Mensal</TableHead>
                    <TableHead>Status Contratual</TableHead>
                    <TableHead className="text-right">Tabela de Preços</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insurers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-bold text-slate-900 text-xs">{c.name}</div>
                        {c.cnpj && <div className="text-[11px] text-slate-500 font-mono">CNPJ: {c.cnpj}</div>}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-600">
                        {c.ansCode || "—"}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-800">
                        {c.activePatientsCount} paciente(s)
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-900">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(c.monthlyBillingEstimated)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="success" className="text-xs">
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="text-xs text-teal-700">
                          Ver Tabela TUSS
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: PLANTÕES */}
        <TabsContent value="plantoes" className="space-y-4">
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">Fechamento de Plantões Executados</CardTitle>
              <CardDescription className="text-xs">Validação de horas assistenciais executadas para emissão de nota e repasse</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código Plantão</TableHead>
                    <TableHead>Tipo / Regime</TableHead>
                    <TableHead>Horário Início / Fim</TableHead>
                    <TableHead>Status Operacional</TableHead>
                    <TableHead>Status Financeiro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shifts.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs font-mono font-bold text-slate-900">
                        #{s.id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs font-mono">
                          {s.shiftType}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 font-mono">
                        {formatDate(s.startTime)} ({s.startTime instanceof Date ? s.startTime.toLocaleTimeString().slice(0, 5) : ""})
                      </TableCell>
                      <TableCell>
                        <Badge variant="teal" className="text-xs">
                          {s.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="success" className="text-xs">
                          Apto para Faturamento
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
