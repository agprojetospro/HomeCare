"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { store, PatientProfessionalAssignment } from "@/services/store.service";
import { Patient, PatientAddress } from "@/domain/patient/patient.schema";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Users,
  Stethoscope,
  MapPin,
  Calendar,
  AlertTriangle,
  FileText,
  Clock,
  ShieldCheck,
  ArrowLeft,
  HeartPulse,
  Activity,
  CheckCircle2,
  Phone,
  Building2,
  UserCheck,
  History,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [canAccessPep, setCanAccessPep] = useState(false);
  const [currentUser, setCurrentUser] = useState(store.currentUser);

  useEffect(() => {
    const p = store.getPatientById(patientId);
    if (p) {
      setPatient(p);
      const access = store.canAccessPatient(patientId);
      setCanAccessPep(access.authorized);
    }
    setCurrentUser(store.currentUser);
  }, [patientId]);

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Users className="h-16 w-16 text-slate-300 animate-pulse" />
        <h2 className="text-xl font-semibold text-slate-700">Paciente não encontrado</h2>
        <p className="text-sm text-slate-500 max-w-md text-center">
          O paciente solicitado não existe ou você não possui autorização de visualização no seu escopo atual.
        </p>
        <Link href="/pacientes">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar para Pacientes
          </Button>
        </Link>
      </div>
    );
  }

  const episode = store.getEpisodeByPatientId(patientId);
  const assignments: PatientProfessionalAssignment[] = store.getAssignments(patientId);
  const vitalSigns = store.getVitals(patientId);
  const latestVitals = vitalSigns.length > 0 ? vitalSigns[0] : null;
  const triages = store.getTriages().filter((t) => t.patientId === patientId);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Navigation & Back Button */}
      <div className="flex items-center justify-between">
        <Link href="/pacientes">
          <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Voltar à lista de pacientes
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {canAccessPep ? (
            <Link href={`/pep/${patient.id}`}>
              <Button className="bg-teal-600 hover:bg-teal-500 text-white font-medium gap-2 shadow-xs">
                <Stethoscope className="h-4 w-4" /> Abrir PEP Beira-Leito
              </Button>
            </Link>
          ) : (
            <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 text-xs py-1 px-2.5">
              PEP restrito (Sem vínculo assistencial ativo)
            </Badge>
          )}
        </div>
      </div>

      {/* Patient Dossier Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{patient.fullName}</h1>
              <Badge variant={patient.status === "ATIVO" ? "success" : "secondary"}>
                {patient.status}
              </Badge>
              <Badge variant="outline" className="border-slate-300 text-slate-700">
                {patient.gender}
              </Badge>
              <Badge variant="outline" className="border-teal-300 bg-teal-50 text-teal-800">
                {episode?.careType || "HOME_CARE_12H"}
              </Badge>
            </div>
            <p className="text-sm text-slate-500">
              Mãe: <strong className="text-slate-700">{patient.motherName}</strong> | Nasc:{" "}
              {formatDate(patient.birthDate)} | CPF: {patient.cpf || "Não informado"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {patient.allergies && patient.allergies.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-rose-900 uppercase tracking-wider">Alergias Conhecidas</div>
                  <div className="text-xs font-semibold text-rose-700">{patient.allergies.join(", ")}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Clinical Snapshot */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="space-y-0.5">
            <span className="text-slate-400">Local da Assistência:</span>
            <div className="font-semibold text-slate-700 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-teal-600 shrink-0" />
              <span className="truncate">{patient.addressStreet}, {patient.addressNumber} - {patient.addressCity}</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-400">Unidade Operacional:</span>
            <div className="font-semibold text-slate-700 flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span>{patient.unitId === "unit_ilheus" ? "Sede Ilhéus (BA)" : "Base Itabuna (BA)"}</span>
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-400">Últimos Sinais Vitais:</span>
            <div className="font-semibold text-slate-700">
              {latestVitals ? (
                <span className="text-teal-700 font-bold">
                  PA {latestVitals.systolicBp}/{latestVitals.diastolicBp} | SpO2 {latestVitals.oxygenSaturation}%
                </span>
              ) : (
                <span className="text-slate-400">Nenhum registro</span>
              )}
            </div>
          </div>
          <div className="space-y-0.5">
            <span className="text-slate-400">Equipe Vinculada:</span>
            <div className="font-semibold text-slate-700">
              {assignments.length} profissional(is) ativo(s)
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="geral" className="w-full space-y-4">
        <TabsList className="bg-slate-100/80 p-1 border border-slate-200/80">
          <TabsTrigger value="geral" className="text-xs font-semibold gap-1.5">
            <Users className="h-3.5 w-3.5" /> Visão Geral & Endereços
          </TabsTrigger>
          <TabsTrigger value="equipe" className="text-xs font-semibold gap-1.5">
            <UserCheck className="h-3.5 w-3.5" /> Equipe Assistencial ({assignments.length})
          </TabsTrigger>
          <TabsTrigger value="triagem" className="text-xs font-semibold gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Triagens & Pareceres ({triages.length})
          </TabsTrigger>
          <TabsTrigger value="historico" className="text-xs font-semibold gap-1.5">
            <History className="h-3.5 w-3.5" /> Histórico do Episódio
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: VISÃO GERAL */}
        <TabsContent value="geral" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-200/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-800">Dados Demográficos & Pessoais</CardTitle>
                <CardDescription className="text-xs">Informações cadastrais centrais</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Nome Completo:</span>
                  <span className="font-semibold text-slate-800">{patient.fullName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Nome Social:</span>
                  <span className="text-slate-800">{patient.socialName || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Nome da Mãe:</span>
                  <span className="font-semibold text-slate-800">{patient.motherName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">CPF:</span>
                  <span className="font-semibold text-slate-800">{patient.cpf || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">RG:</span>
                  <span className="text-slate-800">{patient.rg || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Nacionalidade / Naturalidade:</span>
                  <span className="text-slate-800">{patient.nationality} / {patient.naturalness || "—"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Estado Civil:</span>
                  <span className="text-slate-800">{patient.maritalStatus}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-slate-800">Endereço do Cuidado (Care Location)</CardTitle>
                <CardDescription className="text-xs">Local físico onde a assistência beira-leito é realizada</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Logradouro:</span>
                  <span className="font-semibold text-slate-800">{patient.addressStreet}, nº {patient.addressNumber}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Complemento:</span>
                  <span className="text-slate-800">{patient.addressComplement || "—"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Bairro:</span>
                  <span className="text-slate-800">{patient.addressNeighborhood}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Cidade / UF:</span>
                  <span className="font-semibold text-slate-800">{patient.addressCity} - {patient.addressState}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">CEP:</span>
                  <span className="font-semibold text-slate-800">{patient.addressZip}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: EQUIPE ASSISTENCIAL */}
        <TabsContent value="equipe" className="space-y-4">
          <Card className="border-slate-200/80">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-800">Profissionais com Vínculo Ativo</CardTitle>
              <CardDescription className="text-xs">
                Somente profissionais listados abaixo possuem permissão legal e técnica (Anti-IDOR) de visualização e escrita no PEP.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Nenhum profissional vinculado a este paciente no momento.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {assignments.map((asg: PatientProfessionalAssignment) => {
                    const prof = store.getProfessionalById(asg.professionalId);
                    return (
                      <div key={asg.id} className="py-3 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 text-xs">{prof?.fullName || asg.professionalId}</div>
                          <div className="text-[11px] text-slate-500">
                            Função: {asg.role || prof?.profession} | Vínculo desde: {formatDate(asg.startDate)}
                          </div>
                        </div>
                        <Badge variant="teal" className="text-xs">
                          Vínculo Ativo
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: TRIAGENS */}
        <TabsContent value="triagem" className="space-y-4">
          <Card className="border-slate-200/80">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-800">Avaliações Clínicas de Elegibilidade</CardTitle>
              <CardDescription className="text-xs">Histórico de triagens multidimensionais realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              {triages.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Nenhuma triagem registrada para este paciente.
                </div>
              ) : (
                <div className="space-y-3">
                  {triages.map((t) => (
                    <div key={t.id} className="border border-slate-200 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-800 text-xs">
                          Triagem realizada em {formatDate(t.evaluationDate)}
                        </div>
                        <Badge variant={t.eligibility === "ELEGIVEL" ? "success" : "destructive"}>
                          {t.eligibility}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Parecer Técnico: {t.observations || "Parecer de admissão em atenção domiciliar emitido."}
                      </p>
                      <div className="text-[11px] text-slate-500">
                        Diagnóstico Principal: {t.mainDiagnosis} | Local da Avaliação: {t.location}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: HISTÓRICO DO EPISÓDIO */}
        <TabsContent value="historico" className="space-y-4">
          <Card className="border-slate-200/80">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-800">Episódio Assistencial de Atenção Domiciliar</CardTitle>
              <CardDescription className="text-xs">Dados de admissão, médico responsável e status do episódio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-slate-500">Status do Episódio:</span>
                  <div className="font-bold text-slate-800">{episode?.status || "ATIVO"}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500">Tipo de Assistência:</span>
                  <div className="font-bold text-slate-800">{episode?.careType || "HOME_CARE_12H"}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500">Data de Admissão:</span>
                  <div className="font-bold text-slate-800">
                    {episode?.admissionDate ? formatDate(episode.admissionDate) : "—"}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500">Médico Responsável:</span>
                  <div className="font-bold text-slate-800">{episode?.doctorInChargeId || "Dra. Roberta Santana"}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
