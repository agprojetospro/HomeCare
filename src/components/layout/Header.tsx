"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Search,
  PlusCircle,
  Shield,
  User,
  LogOut,
  Building2,
  ChevronDown,
  Lock,
  Stethoscope,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { store, CurrentUser } from "@/services/store.service";

export function Header() {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(store.currentUser);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeUnit = currentUser.unitIds[0] === "unit_itabuna" ? "Unidade Itabuna" : "Unidade Ilhéus";

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    return name
      .replace(/^(Dr\.|Dra\.|Enf\.|Téc\.)\s*/, "")
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Busca Rápida */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar paciente, CPF, prontuário..."
            className="w-full h-9 pl-9 pr-4 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 transition-colors"
          />
        </div>
      </div>

      {/* Ações e Menu de Usuário Autenticado */}
      <div className="flex items-center gap-3">
        {/* CTAs Rápidos */}
        <div className="hidden sm:flex items-center gap-2">
          <Link href="/pacientes">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs text-slate-700 border-slate-300">
              <PlusCircle className="h-3.5 w-3.5 text-teal-600" />
              Novo Paciente
            </Button>
          </Link>
          <Link href="/triagem">
            <Button size="sm" className="gap-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white">
              <PlusCircle className="h-3.5 w-3.5" />
              Nova Triagem
            </Button>
          </Link>
        </div>

        {/* Central de Notificações */}
        <Link href="/alertas">
          <Button variant="ghost" size="icon" className="relative text-slate-600 hover:text-slate-900">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
          </Button>
        </Link>

        {/* Menu do Usuário Logado */}
        <div className="relative pl-2 border-l border-slate-200" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-600/20"
          >
            <Avatar className="h-8 w-8 ring-2 ring-teal-600/20">
              <AvatarFallback className="bg-teal-600 text-white text-xs font-bold">
                {getInitials(currentUser.name)}
              </AvatarFallback>
            </Avatar>

            <div className="text-left hidden md:block">
              <p className="text-xs font-semibold text-slate-900 leading-tight">
                {currentUser.name}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Badge variant="teal" className="text-[9px] py-0 px-1 font-mono leading-none">
                  {currentUser.role}
                </Badge>
                <span className="text-[10px] text-slate-500 font-medium flex items-center gap-0.5">
                  <MapPin className="h-2.5 w-2.5 text-slate-400" />
                  {activeUnit}
                </span>
              </div>
            </div>

            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden md:block" />
          </button>

          {/* Dropdown de Produção */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
              {/* Header do Menu */}
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Badge variant="secondary" className="text-[9px] font-mono">
                    {currentUser.role}
                  </Badge>
                  <span className="text-[10px] text-teal-700 font-medium">CuraHome Saúde</span>
                </div>
              </div>

              {/* Links de Acesso */}
              <div className="py-1">
                <Link
                  href="/perfil"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  Meu Perfil & Credenciais
                </Link>
                <Link
                  href="/unidades"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  Unidades Operacionais
                </Link>
                <Link
                  href="/auditoria"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <Shield className="h-3.5 w-3.5 text-slate-400" />
                  Trilha de Auditoria & LGPD
                </Link>
              </div>

              {/* Logout */}
              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    // Logout em ambiente real
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
                >
                  <LogOut className="h-3.5 w-3.5 text-red-500" />
                  Encerrar Sessão
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
