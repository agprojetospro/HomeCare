"use client";

import { useState } from "react";
import { store } from "@/services/store.service";
import { Professional, ProfessionalSchema } from "@/domain/professional/professional.schema";
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
  UserCheck,
  Search,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  ShieldCheck,
  Building2,
} from "lucide-react";

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>(store.getProfessionals());
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    cpf: "",
    profession: "TECNICO_ENFERMAGEM" as const,
    councilType: "COREN" as const,
    councilNumber: "",
    councilUf: "BA",
    specialties: "",
    phone: "",
    email: "",
    status: "ACTIVE" as const,
  });

  const filtered = professionals.filter((p) => {
    const q = search.toLowerCase();
    const cred = p.credentials?.[0];
    return (
      p.fullName.toLowerCase().includes(q) ||
      p.cpf.includes(q) ||
      (cred && cred.registrationNumber.toLowerCase().includes(q)) ||
      p.profession.toLowerCase().includes(q)
    );
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parseResult = ProfessionalSchema.safeParse({
      fullName: formData.fullName,
      cpf: formData.cpf,
      profession: formData.profession,
      phone: formData.phone,
      email: formData.email || undefined,
      status: formData.status,
      credentials: [
        {
          councilType: formData.councilType,
          registrationNumber: formData.councilNumber,
          state: formData.councilUf,
          validFrom: new Date(),
          status: "ACTIVE",
        },
      ],
      specialties: formData.specialties
        ? formData.specialties.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    });

    if (!parseResult.success) {
      setErrorMessage(parseResult.error.errors[0].message);
      return;
    }

    store.createProfessional(parseResult.data);
    setProfessionals(store.getProfessionals());
    setIsModalOpen(false);

    setFormData({
      fullName: "",
      cpf: "",
      profession: "TECNICO_ENFERMAGEM",
      councilType: "COREN",
      councilNumber: "",
      councilUf: "BA",
      specialties: "",
      phone: "",
      email: "",
      status: "ACTIVE",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-teal-600" />
            Corpo Clínico & Profissionais
          </h1>
          <p className="text-sm text-slate-500">
            Cadastro centralizado de médicos, enfermeiros, técnicos e terapeutas com validação de conselho.
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} className="gap-2 shrink-0">
          <PlusCircle className="h-4 w-4" />
          Novo Profissional
        </Button>
      </div>

      {/* Search */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Pesquisar por nome, CPF, conselho ou especialidade..."
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
            Profissionais Ativos ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profissional</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Conselho de Classe</TableHead>
                <TableHead>Especialidades</TableHead>
                <TableHead>Unidades / Contato</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const cred = p.credentials?.[0];
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-semibold text-slate-900">{p.fullName}</div>
                      <div className="text-xs font-mono text-slate-500">CPF: {p.cpf}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="teal" className="text-xs">
                        {p.profession.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {cred ? (
                        <div className="text-xs font-semibold text-slate-800">
                          {cred.councilType}-{cred.state} {cred.registrationNumber}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Sem registro</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {p.specialties.map((spec, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">
                            {spec}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-slate-700 flex items-center gap-1">
                        <Phone className="h-3 w-3 text-slate-400" /> {p.phone}
                      </div>
                      {p.email && (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-400" /> {p.email}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.status === "ACTIVE" ? "success" : "secondary"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal Novo Profissional */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cadastrar Profissional de Saúde</DialogTitle>
            <DialogDescription>
              Insira os dados profissionais e de conselho de classe para habilitação assistencial.
            </DialogDescription>
          </DialogHeader>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input
                  id="fullName"
                  placeholder="Ex: Dra. Ana Beatriz Souza"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="profession">Categoria Profissional *</Label>
                <select
                  id="profession"
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={formData.profession}
                  onChange={(e) =>
                    setFormData({ ...formData, profession: e.target.value as any })
                  }
                >
                  <option value="MEDICO">Médico(a)</option>
                  <option value="ENFERMEIRO">Enfermeiro(a)</option>
                  <option value="TECNICO_ENFERMAGEM">Técnico(a) de Enfermagem</option>
                  <option value="FISIOTERAPEUTA">Fisioterapeuta</option>
                  <option value="NUTRICIONISTA">Nutricionista</option>
                  <option value="FONOAUDIOLOGO">Fonoaudiólogo(a)</option>
                  <option value="PSICOLOGO">Psicólogo(a)</option>
                  <option value="TERAPEUTA_OCUPACIONAL">Terapeuta Ocupacional</option>
                  <option value="CUIDADOR">Cuidador(a)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="councilType">Conselho de Classe *</Label>
                <select
                  id="councilType"
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={formData.councilType}
                  onChange={(e) =>
                    setFormData({ ...formData, councilType: e.target.value as any })
                  }
                >
                  <option value="CRM">CRM</option>
                  <option value="COREN">COREN</option>
                  <option value="CREFITO">CREFITO</option>
                  <option value="CRN">CRN</option>
                  <option value="CREFONO">CREFONO</option>
                  <option value="CRP">CRP</option>
                  <option value="OUTRO">OUTRO</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="councilNumber">Número de Registro *</Label>
                  <Input
                    id="councilNumber"
                    placeholder="123456"
                    value={formData.councilNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, councilNumber: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="councilUf">UF *</Label>
                  <Input
                    id="councilUf"
                    maxLength={2}
                    placeholder="BA"
                    value={formData.councilUf}
                    onChange={(e) =>
                      setFormData({ ...formData, councilUf: e.target.value.toUpperCase() })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="specialties">Especialidades (separadas por vírgula)</Label>
                <Input
                  id="specialties"
                  placeholder="Ex: Geriatria, Cuidados Paliativos, Ventilação Mecânica"
                  value={formData.specialties}
                  onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefone / WhatsApp *</Label>
                <Input
                  id="phone"
                  placeholder="(73) 90000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail Profissional</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="profissional@curahome.com.br"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">Cadastrar Profissional</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
