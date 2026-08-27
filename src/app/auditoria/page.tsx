"use client";

import { useState, useEffect } from "react";
import { store } from "@/services/store.service";
import { AuditLog } from "@/domain/audit/audit";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { History, ShieldCheck, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>(store.getAuditLogs());
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setLogs(store.getAuditLogs());
  }, []);

  // Reset page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const filtered = logs.filter((log) => {
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q) ||
      log.userRole.toLowerCase().includes(q) ||
      log.entityTable.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedLogs = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const startIdx = filtered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endIdx = Math.min(currentPage * pageSize, filtered.length);

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
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-900">
            Eventos Registrados ({filtered.length})
          </CardTitle>
          <span className="text-xs text-slate-500 font-medium">
            Página {currentPage} de {totalPages}
          </span>
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
              {paginatedLogs.map((log, idx) => (
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

          {/* Paginação */}
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Exibindo <span className="font-semibold text-slate-700">{startIdx}</span> a{" "}
              <span className="font-semibold text-slate-700">{endIdx}</span> de{" "}
              <span className="font-semibold text-slate-700">{filtered.length}</span> registros
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="h-8 gap-1 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
              </Button>
              <span className="text-xs font-medium text-slate-700 px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="h-8 gap-1 text-xs"
              >
                Próximo <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
