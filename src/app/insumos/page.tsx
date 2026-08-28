"use client";

import { useState, useEffect } from "react";
import { store } from "@/services/store.service";
import {
  SupplyItem,
  InventoryLedgerEntry,
  PatientOxygenTherapy,
  calculateOxygenAutonomy,
} from "@/domain/supplies/supplies.schema";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Boxes,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowDownRight,
  ArrowUpRight,
  History,
  Activity,
  Gauge,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { formatDateTime, formatDate } from "@/lib/utils";

export default function SuppliesPage() {
  const [supplies, setSupplies] = useState<SupplyItem[]>(store.getSupplyCatalog());
  const [ledger, setLedger] = useState<InventoryLedgerEntry[]>(store.getInventoryLedger());
  const [patients, setPatients] = useState(store.getPatients());

  // Modais
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isOxygenCheckModalOpen, setIsOxygenCheckModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || "");
  const [newPressureInput, setNewPressureInput] = useState<number>(100);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form de Movimentação
  const [movementForm, setMovementForm] = useState({
    supplyItemId: supplies[0]?.id || "",
    movementType: "SAIDA_PACIENTE" as InventoryLedgerEntry["movementType"],
    quantity: 1,
    patientId: patients[0]?.id || "",
    batchNumber: "LOTE-2026-HC",
    reason: "Dispensação assistencial beira-leito",
  });

  useEffect(() => {
    store.initClient();
    setSupplies(store.getSupplyCatalog());
    setLedger(store.getInventoryLedger());
    setPatients(store.getPatients());
  }, []);

  const handleRecordMovement = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = store.recordInventoryMovement({
      supplyItemId: movementForm.supplyItemId,
      movementType: movementForm.movementType,
      quantity: Number(movementForm.quantity),
      patientId: movementForm.movementType === "SAIDA_PACIENTE" ? movementForm.patientId : null,
      batchNumber: movementForm.batchNumber,
      reason: movementForm.reason,
    });

    if (!res.success) {
      setErrorMessage(res.error || "Erro ao movimentar estoque.");
      return;
    }

    setSupplies(store.getSupplyCatalog());
    setLedger(store.getInventoryLedger());
    setIsMovementModalOpen(false);
  };

  const handleRecordOxygenCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) return;

    store.recordOxygenPressureCheck(selectedPatientId, Number(newPressureInput));
    setIsOxygenCheckModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="teal" className="text-xs">
              Logística & Suprimentos Clínicos (Onda 3)
            </Badge>
            <span className="text-xs text-slate-500 font-medium">Controle de Insumos & Oxigenoterapia</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Gestão de Insumos, Oxigênio & Estoque Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Rastreabilidade de lotes, dispensação beira-leito e cálculo de autonomia de oxigênio ($V = P \times K$).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOxygenCheckModalOpen(true)}
            className="gap-1.5 text-xs border-amber-300 text-amber-800 hover:bg-amber-50"
          >
            <Gauge className="h-4 w-4 text-amber-600" />
            Aferir Pressão de O₂
          </Button>
          <Button
            onClick={() => setIsMovementModalOpen(true)}
            className="gap-2 shrink-0 bg-slate-900 hover:bg-slate-800 text-white text-xs"
          >
            <PlusCircle className="h-4 w-4" />
            Nova Movimentação
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="catalogo" className="space-y-4">
        <TabsList className="bg-slate-100 p-1 border border-slate-200">
          <TabsTrigger value="catalogo" className="gap-2 text-xs">
            <Boxes className="h-4 w-4 text-teal-600" />
            Catálogo & Níveis de Estoque ({supplies.length})
          </TabsTrigger>
          <TabsTrigger value="oxigenio" className="gap-2 text-xs">
            <Flame className="h-4 w-4 text-amber-600" />
            Monitoramento de Oxigenoterapia Beira-Leito
          </TabsTrigger>
          <TabsTrigger value="ledger" className="gap-2 text-xs">
            <History className="h-4 w-4 text-indigo-600" />
            Livro-Razão de Movimentações ({ledger.length})
          </TabsTrigger>
        </TabsList>

        {/* 1. ABA CATÁLOGO */}
        <TabsContent value="catalogo" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-slate-200/80 shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Total de Itens Ativos</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{supplies.length}</div>
                </div>
                <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
                  <Boxes className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Itens em Ponto de Reposição</div>
                  <div className="text-2xl font-bold text-amber-700 mt-1">
                    {supplies.filter((s) => s.currentStock <= s.reorderPoint).length}
                  </div>
                </div>
                <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80 shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Rastreabilidade / Lote</div>
                  <div className="text-2xl font-bold text-emerald-700 mt-1">100% Auditado</div>
                </div>
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">Catálogo de Insumos & Medicamentos</CardTitle>
              <CardDescription className="text-xs">
                Controle de saldos físicos com alerta automático de ressuprimento
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código & Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Estoque Atual</TableHead>
                    <TableHead>Mínimo / Reposição</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplies.map((s) => {
                    const isLow = s.currentStock <= s.reorderPoint;
                    const isCritical = s.currentStock <= s.minimumStock;
                    return (
                      <TableRow key={s.id}>
                        <TableCell>
                          <div className="font-bold text-slate-900 text-xs">{s.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{s.code}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">
                            {s.category.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600">{s.unitOfMeasure}</TableCell>
                        <TableCell>
                          <span className={`text-sm font-bold ${isCritical ? "text-red-600" : isLow ? "text-amber-600" : "text-slate-900"}`}>
                            {s.currentStock}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 font-mono">
                          Mín: {s.minimumStock} | Repor em: {s.reorderPoint}
                        </TableCell>
                        <TableCell>
                          <Badge variant={isCritical ? "destructive" : isLow ? "warning" : "success"} className="text-[10px]">
                            {isCritical ? "CRÍTICO" : isLow ? "RESSUPRIR" : "ESTÁVEL"}
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

        {/* 2. ABA OXIGENOTERAPIA */}
        <TabsContent value="oxigenio" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {patients.map((p) => {
              const o2 = store.getPatientOxygenTherapy(p.id!);
              if (!o2) return null;

              const autonomy = calculateOxygenAutonomy(
                o2.currentPressureBar || 0,
                o2.flowRateLpm,
                o2.cylinderFactorK || 1.0,
                new Date()
              );

              return (
                <Card key={p.id} className="border-slate-200 shadow-xs">
                  <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-bold text-slate-900">{p.fullName}</CardTitle>
                        <CardDescription className="text-xs">
                          {p.addressStreet}, {p.addressNumber} - {p.addressCity}
                        </CardDescription>
                      </div>
                      <Badge variant={autonomy.status === "CRITICO" ? "destructive" : autonomy.status === "ATENCAO" ? "warning" : "success"}>
                        {autonomy.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <div className="text-slate-500 font-medium">Fonte Primária</div>
                        <div className="font-bold text-slate-900 mt-0.5">{o2.sourceType.replace(/_/g, " ")}</div>
                        <div className="text-[11px] text-teal-700 mt-1">{o2.deliveryInterface.replace(/_/g, " ")}</div>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        <div className="text-slate-500 font-medium">Fluxo Prescrito</div>
                        <div className="text-lg font-bold text-teal-700 mt-0.5">{o2.flowRateLpm} L/min</div>
                        <div className="text-[11px] text-slate-500">{o2.usageHoursPerDay} horas / dia</div>
                      </div>
                    </div>

                    {o2.sourceType === "CILINDRO_O2" || o2.cylinderType ? (
                      <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-amber-900">
                          <span className="flex items-center gap-1.5">
                            <Gauge className="h-4 w-4 text-amber-600" />
                            Pressão do Cilindro ({o2.cylinderType?.replace(/_/g, " ") || "Padrão"})
                          </span>
                          <span className="font-mono text-sm">{o2.currentPressureBar || 0} / {o2.nominalPressureBar || 150} bar</span>
                        </div>

                        {/* Barra de Pressão */}
                        <div className="w-full bg-amber-200/60 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              (o2.currentPressureBar || 0) < 30 ? "bg-red-500" : (o2.currentPressureBar || 0) < 60 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, (((o2.currentPressureBar || 0) / (o2.nominalPressureBar || 150)) * 100))}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-amber-800 font-medium pt-1">
                          <span>Autonomia: <strong>{autonomy.autonomyHours} horas</strong> ({autonomy.autonomyMinutes} min)</span>
                          <span>{autonomy.totalUsableLiters} Litros O₂</span>
                        </div>
                        <div className="text-[11px] text-amber-700 italic">{autonomy.alertMessage}</div>
                      </div>
                    ) : null}

                    {o2.notes && (
                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                        <strong>Conduta:</strong> {o2.notes}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* 3. ABA LIVRO-RAZÃO */}
        <TabsContent value="ledger" className="space-y-4">
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">Livro-Razão de Movimentações (Ledger)</CardTitle>
              <CardDescription className="text-xs">
                Trilha imutável de todas as entradas, baixas por paciente e descartes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Insumo</TableHead>
                    <TableHead>Tipo de Movimento</TableHead>
                    <TableHead>Qtd / Saldo</TableHead>
                    <TableHead>Lote / Validade</TableHead>
                    <TableHead>Paciente / Destino</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.map((l) => {
                    const item = store.getSupplyItemById(l.supplyItemId);
                    const pat = l.patientId ? store.getPatientById(l.patientId) : null;
                    const isOut = l.movementType === "SAIDA_PACIENTE" || l.movementType === "PERDA_AVARIA" || l.movementType === "PERDA_VALIDADE";
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="text-xs text-slate-500 font-mono">
                          {formatDateTime(l.createdAt || new Date())}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-slate-900 text-xs">{item?.name || l.supplyItemId}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{item?.code}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isOut ? "outline" : "success"} className="text-[10px] gap-1">
                            {isOut ? <ArrowDownRight className="h-3 w-3 text-red-500" /> : <ArrowUpRight className="h-3 w-3 text-emerald-500" />}
                            {l.movementType.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-xs">{isOut ? `-${l.quantity}` : `+${l.quantity}`} {item?.unitOfMeasure}</div>
                          <div className="text-[11px] text-slate-400 font-mono">Saldo: {l.balanceAfter}</div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 font-mono">
                          {l.batchNumber || "—"}
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-800">
                          {pat?.fullName || (l.patientId ? l.patientId : "Almoxarifado Central")}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 max-w-xs truncate">
                          {l.reason || "Uso clínico"}
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

      {/* Modal: Nova Movimentação de Estoque */}
      <Dialog open={isMovementModalOpen} onOpenChange={setIsMovementModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-teal-600" />
              Lançamento no Livro-Razão de Estoque
            </DialogTitle>
            <DialogDescription className="text-xs">
              Registro auditado de entrada, baixa beira-leito por paciente ou descarte.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordMovement} className="space-y-3">
            {errorMessage && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {errorMessage}
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Insumo / Medicamento *</Label>
              <select
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs"
                value={movementForm.supplyItemId}
                onChange={(e) => setMovementForm({ ...movementForm, supplyItemId: e.target.value })}
              >
                {supplies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (Saldo: {s.currentStock} {s.unitOfMeasure})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Tipo de Movimento *</Label>
                <select
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs"
                  value={movementForm.movementType}
                  onChange={(e) => setMovementForm({ ...movementForm, movementType: e.target.value as any })}
                >
                  <option value="SAIDA_PACIENTE">Saída / Uso em Paciente</option>
                  <option value="ENTRADA">Entrada / Recebimento</option>
                  <option value="PERDA_AVARIA">Perda por Avaria</option>
                  <option value="PERDA_VALIDADE">Descarte por Validade</option>
                  <option value="DEVOLUCAO">Devolução ao Estoque</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Quantidade *</Label>
                <Input
                  type="number"
                  min={1}
                  required
                  value={movementForm.quantity}
                  onChange={(e) => setMovementForm({ ...movementForm, quantity: Number(e.target.value) })}
                  className="text-xs"
                />
              </div>
            </div>

            {movementForm.movementType === "SAIDA_PACIENTE" && (
              <div className="space-y-1">
                <Label className="text-xs">Paciente Destino *</Label>
                <select
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs"
                  value={movementForm.patientId}
                  onChange={(e) => setMovementForm({ ...movementForm, patientId: e.target.value })}
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.fullName}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Lote</Label>
              <Input
                value={movementForm.batchNumber}
                onChange={(e) => setMovementForm({ ...movementForm, batchNumber: e.target.value })}
                className="text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Motivo / Justificativa *</Label>
              <Input
                required
                value={movementForm.reason}
                onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })}
                className="text-xs"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsMovementModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white">Registrar no Ledger</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Aferir Pressão de O2 */}
      <Dialog open={isOxygenCheckModalOpen} onOpenChange={setIsOxygenCheckModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-amber-600" />
              Aferição de Pressão do Cilindro de Oxigênio
            </DialogTitle>
            <DialogDescription className="text-xs">
              Recalcula automaticamente a autonomia residual do paciente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordOxygenCheck} className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Paciente *</Label>
              <select
                className="w-full h-9 rounded-md border border-slate-300 bg-white px-3 py-1 text-xs"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.fullName}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Pressão Mensurada no Manômetro (bar) *</Label>
              <Input
                type="number"
                min={0}
                max={200}
                required
                value={newPressureInput}
                onChange={(e) => setNewPressureInput(Number(e.target.value))}
                className="text-xs font-bold text-slate-900"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOxygenCheckModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700 text-white">Salvar & Recalcular</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
