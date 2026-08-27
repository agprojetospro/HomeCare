"use client";

import { useState } from "react";
import { store } from "@/services/store.service";
import { Patient, PatientSchema } from "@/domain/patient/patient.schema";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Users,
  Search,
  PlusCircle,
  Stethoscope,
  AlertCircle,
  CheckCircle2,
  MapPin,
  HeartCrack,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>(store.getPatients());
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    socialName: "",
    motherName: "",
    fatherName: "",
    cpf: "",
    rg: "",
    birthDate: "1950-01-01",
    gender: "MASCULINO" as const,
    nationality: "Brasileira",
    raceColor: "BRANCA" as const,
    naturalness: "São Paulo - SP",
    maritalStatus: "CASADO" as const,
    addressStreet: "",
    addressNumber: "",
    addressComplement: "",
    addressNeighborhood: "",
    addressCity: "São Paulo",
    addressState: "SP",
    addressZip: "",
    allergies: "",
  });

  const filteredPatients = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(q) ||
      (p.cpf && p.cpf.includes(q)) ||
      p.addressNeighborhood.toLowerCase().includes(q) ||
      p.addressCity.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredPatients.length / pageSize) || 1;
  const paginatedPatients = filteredPatients.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const startIdx = filteredPatients.length > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endIdx = Math.min(currentPage * pageSize, filteredPatients.length);

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parseResult = PatientSchema.safeParse({
      ...formData,
      birthDate: new Date(formData.birthDate),
      allergies: formData.allergies
        ? formData.allergies.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    });

    if (!parseResult.success) {
      setErrorMessage(parseResult.error.errors[0].message);
      return;
    }

    const res = store.createPatient(parseResult.data);
    if (!res.success) {
      setErrorMessage(res.error || "Erro ao cadastrar paciente.");
      return;
    }

    setPatients(store.getPatients());
    setIsModalOpen(false);
    // Reset form
    setFormData({
      fullName: "",
      socialName: "",
      motherName: "",
      fatherName: "",
      cpf: "",
      rg: "",
      birthDate: "1950-01-01",
      gender: "MASCULINO",
      nationality: "Brasileira",
      raceColor: "BRANCA",
      naturalness: "São Paulo - SP",
      maritalStatus: "CASADO",
      addressStreet: "",
      addressNumber: "",
      addressComplement: "",
      addressNeighborhood: "",
      addressCity: "São Paulo",
      addressState: "SP",
      addressZip: "",
      allergies: "",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-teal-600" />
            Cadastro Central de Pacientes
          </h1>
          <p className="text-sm text-slate-500">
            Controle de dados demográficos, filiação, endereços e prevenção de duplicidades.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shrink-0">
          <PlusCircle className="h-4 w-4" />
          Novo Paciente
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Pesquisar por nome do paciente, CPF, bairro ou cidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-slate-900">
              Pacientes Cadastrados ({filteredPatients.length})
            </CardTitle>
            <Badge variant="teal" className="text-xs">
              Prevenção de Duplicidade Ativa
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente / Filiação</TableHead>
                <TableHead>CPF / Documento</TableHead>
                <TableHead>Nascimento</TableHead>
                <TableHead>Endereço Domiciliar</TableHead>
                <TableHead>Alergias</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPatients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                    Nenhum paciente encontrado para os critérios de busca.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div className="font-semibold text-slate-900">{patient.fullName}</div>
                      <div className="text-xs text-slate-500">Mãe: {patient.motherName}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-xs text-slate-700">{patient.cpf || "Sem CPF"}</div>
                      {patient.rg && <div className="text-[11px] text-slate-400">RG: {patient.rg}</div>}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {formatDate(patient.birthDate)}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-slate-800 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        {patient.addressStreet}, {patient.addressNumber}
                      </div>
                      <div className="text-[11px] text-slate-500 pl-4.5">
                        {patient.addressNeighborhood} — {patient.addressCity}/{patient.addressState}
                      </div>
                    </TableCell>
                    <TableCell>
                      {patient.allergies && patient.allergies.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {patient.allergies.map((al, idx) => (
                            <Badge key={idx} variant="destructive" className="text-[10px] py-0">
                              {al}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Nega alergias</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={patient.status === "ATIVO" ? "success" : "secondary"}>
                        {patient.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1.5">
                      <Link href={`/pacientes/${patient.id}`}>
                        <Button size="sm" variant="ghost" className="gap-1 text-xs text-slate-700 hover:bg-slate-100">
                          <Users className="h-3.5 w-3.5 text-slate-500" />
                          Dossiê 360°
                        </Button>
                      </Link>
                      <Link href={`/pep/${patient.id}`}>
                        <Button size="sm" variant="outline" className="gap-1 text-xs text-teal-700 hover:bg-teal-50 border-teal-200">
                          <Stethoscope className="h-3.5 w-3.5 text-teal-600" />
                          PEP
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Paginação */}
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">
              Exibindo <span className="font-semibold text-slate-700">{startIdx}</span> a{" "}
              <span className="font-semibold text-slate-700">{endIdx}</span> de{" "}
              <span className="font-semibold text-slate-700">{filteredPatients.length}</span> pacientes
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

      {/* Modal: Cadastro de Novo Paciente */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-600" />
              Cadastrar Novo Paciente
            </DialogTitle>
            <DialogDescription>
              Preencha os dados completos. O sistema realiza validação em tempo real contra duplicidades.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleCreatePatient} className="space-y-4">
            {/* Dados Pessoais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input
                  id="fullName"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Ex: Maria das Dores Silva"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="socialName">Nome Social (Opcional)</Label>
                <Input
                  id="socialName"
                  value={formData.socialName}
                  onChange={(e) => setFormData({ ...formData, socialName: e.target.value })}
                  placeholder="Se aplicável"
                />
              </div>
            </div>

            {/* Filiação */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="motherName">Nome da Mãe * (Chave Unicidade)</Label>
                <Input
                  id="motherName"
                  required
                  value={formData.motherName}
                  onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                  placeholder="Ex: Joana Dores Silva"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="fatherName">Nome do Pai</Label>
                <Input
                  id="fatherName"
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                  placeholder="Ex: José da Silva"
                />
              </div>
            </div>

            {/* Documentos & Demografia */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  required
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  value={formData.rg}
                  onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                  placeholder="00.000.000-0"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="birthDate">Nascimento *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  required
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="gender">Sexo Biológico *</Label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                  className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                >
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMININO">Feminino</option>
                  <option value="OUTRO">Outro</option>
                </select>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Endereço de Atendimento Domiciliar
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                <div className="col-span-3 sm:col-span-4 space-y-1">
                  <Label htmlFor="addressStreet">Logradouro / Rua *</Label>
                  <Input
                    id="addressStreet"
                    required
                    value={formData.addressStreet}
                    onChange={(e) => setFormData({ ...formData, addressStreet: e.target.value })}
                    placeholder="Rua, Avenida..."
                  />
                </div>

                <div className="col-span-1 sm:col-span-2 space-y-1">
                  <Label htmlFor="addressNumber">Número *</Label>
                  <Input
                    id="addressNumber"
                    required
                    value={formData.addressNumber}
                    onChange={(e) => setFormData({ ...formData, addressNumber: e.target.value })}
                    placeholder="123"
                  />
                </div>

                <div className="col-span-2 sm:col-span-2 space-y-1">
                  <Label htmlFor="addressNeighborhood">Bairro *</Label>
                  <Input
                    id="addressNeighborhood"
                    required
                    value={formData.addressNeighborhood}
                    onChange={(e) => setFormData({ ...formData, addressNeighborhood: e.target.value })}
                    placeholder="Bairro"
                  />
                </div>

                <div className="col-span-2 sm:col-span-2 space-y-1">
                  <Label htmlFor="addressCity">Cidade *</Label>
                  <Input
                    id="addressCity"
                    required
                    value={formData.addressCity}
                    onChange={(e) => setFormData({ ...formData, addressCity: e.target.value })}
                    placeholder="Cidade"
                  />
                </div>

                <div className="col-span-1 sm:col-span-1 space-y-1">
                  <Label htmlFor="addressState">UF *</Label>
                  <Input
                    id="addressState"
                    required
                    maxLength={2}
                    value={formData.addressState}
                    onChange={(e) => setFormData({ ...formData, addressState: e.target.value.toUpperCase() })}
                    placeholder="SP"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 space-y-1">
                  <Label htmlFor="addressZip">CEP *</Label>
                  <Input
                    id="addressZip"
                    required
                    value={formData.addressZip}
                    onChange={(e) => setFormData({ ...formData, addressZip: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>

            {/* Alergias */}
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <Label htmlFor="allergies">Alergias Conhecidas (Separadas por vírgula)</Label>
              <Input
                id="allergies"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                placeholder="Ex: Dipirona, Penicilina, Látex"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Salvar Paciente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

