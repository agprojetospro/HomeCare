"use client";

import { Bell, Search, PlusCircle, Shield, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { store, CurrentUser } from "@/services/store.service";
import { useState } from "react";

const DEMO_USERS: CurrentUser[] = [
  {
    id: "user_roberta",
    organizationId: "org_curahome",
    name: "Dra. Roberta Mendes",
    email: "roberta.mendes@curahome.com.br",
    role: "MEDICO",
    status: "ACTIVE",
    unitIds: ["unit_ilheus", "unit_itabuna"],
    professionalId: "prof_roberta",
  },
  {
    id: "user_mariana",
    organizationId: "org_curahome",
    name: "Téc. Mariana Santos",
    email: "mariana.costa@curahome.com.br",
    role: "TECNICO_ENFERMAGEM",
    status: "ACTIVE",
    unitIds: ["unit_ilheus"],
    professionalId: "prof_mariana",
  },
  {
    id: "user_luciana",
    organizationId: "org_curahome",
    name: "Enf. Luciana Alencar",
    email: "luciana.enf@curahome.com.br",
    role: "ENFERMEIRO",
    status: "ACTIVE",
    unitIds: ["unit_ilheus"],
    professionalId: "prof_luciana",
  },
  {
    id: "user_admin",
    organizationId: "org_curahome",
    name: "Carlos Gestão (Admin)",
    email: "carlos.admin@curahome.com.br",
    role: "ADMIN",
    status: "ACTIVE",
    unitIds: ["unit_ilheus", "unit_itabuna"],
    professionalId: null,
  },
];

export function Header() {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(store.currentUser);

  const handleSwitchUser = (user: CurrentUser) => {
    store.setCurrentUser(user);
    setCurrentUser(user);
    window.location.reload();
  };

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search and context */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar paciente, CPF, diagnóstico ou prontuário..."
            className="w-full h-9 pl-9 pr-4 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 transition-colors"
          />
        </div>
      </div>

      {/* Action Buttons & Profile Switcher */}
      <div className="flex items-center gap-3">
        {/* Quick CTA */}
        <div className="hidden sm:flex items-center gap-2">
          <Link href="/pacientes">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs text-slate-700">
              <PlusCircle className="h-3.5 w-3.5 text-teal-600" />
              Novo Paciente
            </Button>
          </Link>
          <Link href="/triagem">
            <Button size="sm" className="gap-1.5 text-xs">
              <PlusCircle className="h-3.5 w-3.5" />
              Nova Triagem
            </Button>
          </Link>
        </div>

        {/* Profile Switcher Demo */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="text-right hidden md:block">
            <p className="text-xs font-semibold text-slate-900 leading-tight">{currentUser.name}</p>
            <div className="flex items-center justify-end gap-1">
              <Badge variant="teal" className="text-[9px] py-0 px-1 font-mono">
                {currentUser.role}
              </Badge>
            </div>
          </div>

          <select
            value={currentUser.id}
            onChange={(e) => {
              const selected = DEMO_USERS.find((u) => u.id === e.target.value);
              if (selected) handleSwitchUser(selected);
            }}
            className="text-xs bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-600/30"
          >
            {DEMO_USERS.map((u) => (
              <option key={u.id} value={u.id}>
                Simular: {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
