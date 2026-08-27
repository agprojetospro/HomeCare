"use client";

import { useState } from "react";
import { store } from "@/services/store.service";
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
import {
  Building2,
  MapPin,
  Compass,
  Layers,
  Phone,
  Mail,
  ShieldCheck,
  Search,
} from "lucide-react";

export default function UnitsPage() {
  const [organizations] = useState(store.getOrganizations());
  const [units] = useState(store.getUnits());
  const [regions] = useState(store.getServiceRegions());
  const [areas] = useState(store.getServiceAreas());
  const [search, setSearch] = useState("");

  const filteredUnits = units.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.code.toLowerCase().includes(search.toLowerCase()) ||
    u.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-teal-600" />
            Organização, Unidades & Regiões Operacionais
          </h1>
          <p className="text-sm text-slate-500">
            Estrutura organizacional em 4 níveis (Organização $\rightarrow$ Unidades $\rightarrow$ Regiões $\rightarrow$ Áreas).
          </p>
        </div>

        <Badge variant="teal" className="gap-1.5 py-1 px-3 text-xs shrink-0 font-mono">
          <ShieldCheck className="h-4 w-4" />
          Multi-Unidades Ativo
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">Organização Vigente</span>
              <p className="text-sm font-bold text-slate-900">{organizations[0]?.tradeName || "CuraHome"}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">Unidades Operacionais</span>
              <p className="text-lg font-bold text-slate-900">{units.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">Regiões de Atendimento</span>
              <p className="text-lg font-bold text-slate-900">{regions.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">Áreas Geográficas</span>
              <p className="text-lg font-bold text-slate-900">{areas.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Units Table */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Unidades & Bases Operacionais Cadastradas
            </CardTitle>
            <CardDescription className="text-xs">
              Bases de suporte, ambulatórios e almoxarifados da organização
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código / Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Município / UF</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUnits.map((unit) => (
                <TableRow key={unit.id}>
                  <TableCell>
                    <div className="font-semibold text-slate-900 text-xs flex items-center gap-1.5">
                      <span className="font-mono text-teal-700 font-bold bg-teal-50 px-1.5 py-0.5 rounded text-[11px]">
                        {unit.code}
                      </span>
                      {unit.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={unit.type === "SEDE" ? "teal" : "secondary"} className="text-[10px]">
                      {unit.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 font-medium">
                    {unit.city}/{unit.state}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {unit.addressStreet}, {unit.addressNumber} — {unit.addressNeighborhood}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    <div className="flex flex-col gap-0.5">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3 text-slate-400" /> {unit.phone}</span>
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-slate-400" /> {unit.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="success" className="text-[10px]">
                      {unit.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Regions & Areas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Regions */}
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Compass className="h-4 w-4 text-teal-600" />
              Regiões de Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {regions.map((reg) => (
              <div key={reg.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{reg.name}</span>
                  <p className="text-slate-500 font-mono text-[11px]">Código: {reg.code}</p>
                </div>
                <Badge variant="teal" className="text-[10px]">Ativa</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Areas */}
        <Card className="border-slate-200/80 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-indigo-600" />
              Áreas de Cobertura Geográfica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {areas.map((area) => (
              <div key={area.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{area.name} ({area.city}/{area.state})</span>
                  <span className="text-[11px] font-mono text-indigo-600 font-bold">Raio {area.radiusKm} km</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Bairros: {area.neighborhoods.join(", ")}
                </p>
                <p className="text-slate-400 font-mono text-[10px]">
                  Faixa de CEP: {area.postalCodeStart} até {area.postalCodeEnd}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

