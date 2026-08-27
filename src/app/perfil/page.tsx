"use client";

import { useState } from "react";
import { store } from "@/services/store.service";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Shield,
  KeyRound,
  Building2,
  CheckCircle2,
  LogOut,
  Smartphone,
  History,
  Lock,
  Stethoscope,
  MapPin,
} from "lucide-react";

export default function PerfilPage() {
  const [currentUser] = useState(store.currentUser);
  const [selectedUnit, setSelectedUnit] = useState(currentUser.unitIds[0] || "unit_ilheus");
  const [passwordSaved, setPasswordSaved] = useState(false);

  const units = store.getUnits();
  const professional = currentUser.professionalId ? store.getProfessionalById(currentUser.professionalId) : null;

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSaved(true);
    setTimeout(() => setPasswordSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="teal" className="text-xs">
            Configurações da Conta
          </Badge>
          <span className="text-xs text-slate-500 font-medium">Identidade & Segurança</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
          Meu Perfil & Credenciais
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Gerenciamento de identificação profissional, seleção de unidade operacional ativa e segurança.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <Card className="border-slate-200/80 shadow-xs md:col-span-1">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-3">
              <Avatar className="h-20 w-20 border-2 border-teal-500/30">
                <AvatarFallback className="bg-teal-700 text-white font-bold text-xl">
                  {currentUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-lg font-bold text-slate-900">{currentUser.name}</CardTitle>
            <CardDescription className="text-xs">{currentUser.email}</CardDescription>
            <div className="pt-2 flex justify-center">
              <Badge variant="teal" className="text-xs">
                {currentUser.role}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Status:</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> {currentUser.status}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Organização:</span>
              <span className="font-semibold text-slate-800">CuraHome Saúde</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Conselho:</span>
              <span className="font-semibold text-slate-800">CRM-BA 28941</span>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Settings */}
        <div className="md:col-span-2 space-y-6">
          {/* Active Unit Selection */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-teal-600" />
                Unidade de Atuação Ativa
              </CardTitle>
              <CardDescription className="text-xs">
                Selecione a filial/base onde você está prestando assistência no momento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {units.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => u.id && setSelectedUnit(u.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedUnit === u.id
                        ? "border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-slate-900">{u.name}</div>
                      {selectedUnit === u.id && <CheckCircle2 className="h-4 w-4 text-teal-600" />}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {u.city} - {u.state} ({u.type})
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Password and Security */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-700" />
                Segurança da Conta
              </CardTitle>
              <CardDescription className="text-xs">
                Atualize sua senha de acesso e configure credenciais de segurança
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSavePassword}>
              <CardContent className="space-y-3 text-xs">
                {passwordSaved && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Senha atualizada com sucesso!</span>
                  </div>
                )}
                <div className="space-y-1">
                  <Label htmlFor="currentPass" className="text-xs">Senha Atual</Label>
                  <Input id="currentPass" type="password" placeholder="••••••••" className="text-xs h-9" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="newPass" className="text-xs">Nova Senha</Label>
                    <Input id="newPass" type="password" placeholder="Mínimo 8 caracteres" className="text-xs h-9" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirmPass" className="text-xs">Confirmar Nova Senha</Label>
                    <Input id="confirmPass" type="password" placeholder="Repita a nova senha" className="text-xs h-9" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t border-slate-100 flex justify-end">
                <Button type="submit" className="bg-teal-600 hover:bg-teal-500 text-white text-xs">
                  Atualizar Senha
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
