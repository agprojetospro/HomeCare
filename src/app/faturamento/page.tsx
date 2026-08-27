"use client";

import { useState } from "react";
import { store } from "@/services/store.service";
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
  const [patients] = useState(store.getPatients());
  const [pads] = useState(store.getPads());
  const [shifts] = useState(store.getShifts());
  const [search, setSearch] = useState("");

  const convênios = [
    { id: "conv_1", name: "Unimed Sul da Bahia", code: "30554", activePatients: 4, monthlyBilling: "R$ 48.600,00", status: "ATIVO" },
    { id: "conv_2", name: "Bradesco Saúde Top Nacional", code: "10022", activePatients: 2, monthlyBilling: "R$ 31.200,00", status: "ATIVO" },
    { id: "conv_3", name: "SulAmérica Saúde Especial", code: "20199", activePatients: 1, monthlyBilling: "R$ 14.800,00", status: "ATIVO" },
    { id: "conv_4", name: "Particular / Cuidado Direto", code: "00000", activePatients: 1, monthlyBilling: "R$ 18.000,00", status: "ATIVO" },
  ];

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
            <DollarSign className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">R$ 112.600,00</div>
            <p className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> 8 pacientes faturáveis
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Diárias Executadas no Mês</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">186 diárias</div>
            <p className="text-xs text-slate-500 mt-0.5">100% auditadas com check-in</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Autorizações a Vencer (7 dias)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">2 pacientes</div>
            <p className="text-xs text-amber-700 font-medium mt-0.5">Prorrogação pendente</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-slate-600">Operadoras Ativas</CardTitle>
            <Building2 className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{convênios.length}</div>
            <p className="text-xs text-slate-500 mt-0.5">Contratos vigentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="autorizacoes" className="space-y-4">
        <TabsList className="bg-slate-100/80 p-1 border border-slate-200/80">
          <TabsTrigger value="autorizacoes" className="text-xs font-semibold gap-1.5">
            <FileCheck className="h-3.5 w-3.5" /> Prorrogações & Autorizações
          </TabsTrigger>
          <TabsTrigger value="convenios" className="text-xs font-semibold gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Operadoras Cadastradas
          </TabsTrigger>
          <TabsTrigger value="fechamento" className="text-xs font-semibold gap-1.5">
            <Receipt className="h-3.5 w-3.5" /> Fechamento de Plantões
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: AUTORIZAÇÕES */}
        <TabsContent value="autorizacoes" className="space-y-4">
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">Controle de Autorizações e Prorrogações</CardTitle>
              <CardDescription className="text-xs">
                Acompanhamento de prazos de autorização emitidos pelas operadoras de saúde
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Convênio / Plano</TableHead>
                    <TableHead>Regime Autorizado</TableHead>
                    <TableHead>Vigência da Guia</TableHead>
                    <TableHead>Dias Restantes</TableHead>
                    <TableHead>Status da Autorização</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((pat) => (
                    <TableRow key={pat.id}>
                      <TableCell>
                        <div className="font-bold text-slate-900 text-xs">{pat.fullName}</div>
                        <div className="text-[11px] text-slate-500">CPF: {pat.cpf || "—"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-slate-800 font-medium">Unimed Sul da Bahia</div>
                        <div className="text-[10px] text-slate-400">Plano Especial Domiciliar</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-teal-300 bg-teal-50 text-teal-800 text-xs">
                          Home Care 12h
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        01/08/2026 a 31/08/2026
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
                  ))}
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
                  {convênios.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-bold text-slate-900 text-xs">{c.name}</div>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-600">
                        {c.code}
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-slate-800">
                        {c.activePatients} paciente(s)
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-900">
                        {c.monthlyBilling}
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

        {/* TAB 3: FECHAMENTO */}
        <TabsContent value="fechamento" className="space-y-4">
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">Conferência de Plantões e Horas Executadas</CardTitle>
              <CardDescription className="text-xs">
                Auditoria cruzada entre plantão agendado, presença do profissional e checagem no PEP
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-slate-600">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold text-emerald-950 text-sm">Fechamento do Período Atual em Conformidade</div>
                    <div className="text-emerald-800 text-xs mt-0.5">
                      100% dos plantões realizados possuem prescrição médica e evoluções de enfermagem auditadas.
                    </div>
                  </div>
                </div>
                <Button className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium">
                  Homologar Lote do Mês
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
