"use client";

import { useState, useEffect } from "react";
import { store } from "@/services/store.service";
import { AuditLog } from "@/domain/audit/audit";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { History, ShieldCheck, Search, Lock, UserCheck, Activity } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>(store.getAuditLogs());
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLogs(store.getAuditLogs());
  }, []);

  const filtered = logs.filter((log) => {
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q) ||
      log.userRole.toLowerCase().includes(q) ||
      log.entityTable.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <History className="h-6 w-6 text-teal-600" />
            Trilha de Auditoria & Conformidade (LGPD/CFM)
          </h1>
          <p className="text-sm text-slate-500">
            Registro indelével de acessos ao PEP, registros clínicos, mutações e eventos de segurança.
          </p>
        </div>

        <Badge variant="teal" className="gap-1.5 py-1 px-3 text-xs shrink-0 font-mono">
          <ShieldCheck className="h-4 w-4" />
          Logs Criptografados & Imutáveis
        </Badge>
      </div>

      {/* Search */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Pesquisar por ação, usuário, papel ou tabela auditada..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-slate-900">
            Eventos Registrados ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data / Hora</TableHead>
                <TableHead>Ação Realizada</TableHead>
                <TableHead>Usuário Responsável</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Entidade / Tabela</TableHead>
                <TableHead>ID Registro / Paciente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((log, idx) => (
                <TableRow key={idx}>
                  <TableCell suppressHydrationWarning className="text-xs font-mono text-slate-600 whitespace-nowrap">
                    {formatDateTime(log.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        log.action.includes("FINALIZE")
                          ? "success"
                          : log.action.includes("DENIED")
                          ? "destructive"
                          : "teal"
                      }
                      className="text-[10px] font-mono"
                    >
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900 text-xs">
                    {log.userName}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">
                      {log.userRole}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-700">
                    {log.entityTable}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-slate-500">
                    {log.recordId || log.patientId || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

