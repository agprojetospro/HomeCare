"use client";

import { useState, useEffect } from "react";
import { store } from "@/services/store.service";
import { Patient } from "@/domain/patient/patient.schema";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Stethoscope,
  Search,
  UserCheck,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  HeartPulse,
  MapPin,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function MyPatientsPage() {
  const [myPatients, setMyPatients] = useState<Patient[]>(store.getMyPatients());
  const [search, setSearch] = useState("");
  const [currentUser] = useState(store.currentUser);

  useEffect(() => {
    setMyPatients(store.getMyPatients());
  }, []);

  const filtered = myPatients.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      (p.cpf && p.cpf.includes(q)) ||
      p.addressNeighborhood.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-teal-600" />
            PEP — Meus Pacientes Vinculados
          </h1>
          <p className="text-sm text-slate-500">
            Acesso seguro aos prontuários dos pacientes sob sua responsabilidade assistencial direta.
          </p>
        </div>

        <Badge variant="teal" className="gap-1.5 py-1 px-3 text-xs shrink-0">
          <ShieldCheck className="h-4 w-4" />
          Perfil: {currentUser.name} ({currentUser.role})
        </Badge>
      </div>

      {/* Search */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar entre meus pacientes vinculados..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <Stethoscope className="h-10 w-10 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">Nenhum paciente vinculado encontrado.</p>
            <p className="text-xs text-slate-500 mt-1">
              Verifique sua escala ou solicite ao gestor a atribuição assistencial do paciente.
            </p>
          </div>
        ) : (
          filtered.map((patient) => {
            const triages = store.getTriages(patient.id!);
            const triage = triages[0];
            const vitals = store.getVitals(patient.id!);
            const latestVitals = vitals[0];

            return (
              <Card
                key={patient.id}
                className="border-slate-200/80 shadow-xs hover:border-teal-500/40 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-bold text-slate-900 leading-tight">
                        {patient.fullName}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Nasc: {formatDate(patient.birthDate)} • CPF: {patient.cpf || "S/N"}
                      </CardDescription>
                    </div>
                    {triage && (
                      <Badge variant={triage.complexityLevel === "ALTA" ? "warning" : "secondary"}>
                        {triage.complexityLevel}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 flex-1">
                  <div className="text-xs text-slate-600 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {patient.addressNeighborhood} — {patient.addressCity}/{patient.addressState}
                    </span>
                  </div>

                  {triage && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                      <span className="font-semibold text-slate-700 block text-[11px] uppercase tracking-wider mb-0.5">
                        Diagnóstico / CID
                      </span>
                      <p className="text-slate-800 font-medium line-clamp-2">
                        {triage.mainDiagnosis} ({triage.cid10})
                      </p>
                    </div>
                  )}

                  {latestVitals && (
                    <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-teal-50/60 border border-teal-100/80">
                      <span className="text-teal-900 font-medium">Últimos Sinais:</span>
                      <span className="font-bold text-teal-950 font-mono">
                        PA {latestVitals.systolicBp}x{latestVitals.diastolicBp} | SpO2 {latestVitals.oxygenSaturation}%
                      </span>
                    </div>
                  )}

                  {patient.allergies && patient.allergies.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {patient.allergies.map((al, idx) => (
                        <Badge key={idx} variant="destructive" className="text-[10px] py-0">
                          Alergia: {al}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>

                <div className="p-5 pt-0">
                  <Link href={`/pep/${patient.id}`} className="w-full">
                    <Button className="w-full gap-2 text-xs font-semibold">
                      <Stethoscope className="h-4 w-4" />
                      Abrir Prontuário Eletrônico
                      <ArrowRight className="h-3.5 w-3.5 ml-auto" />
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

