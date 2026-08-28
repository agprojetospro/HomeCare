"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  ClipboardList,
  CalendarCheck,
  Stethoscope,
  ShieldCheck,
  ChevronRight,
  HeartPulse,
  History,
  FileHeart,
  Receipt,
  User,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { store } from "@/services/store.service";
import { useState, useEffect } from "react";

const navigation = [
  {
    title: "Gestão & Admissão",
    items: [
      { name: "Painel Geral", href: "/", icon: LayoutDashboard },
      { name: "Pacientes & Admissão", href: "/pacientes", icon: Users },
      { name: "Triagem & Elegibilidade", href: "/triagem", icon: ClipboardList },
      { name: "Planos de Cuidado (PAD)", href: "/pad", icon: FileHeart },
      { name: "Profissionais de Saúde", href: "/profissionais", icon: UserCheck },
    ],
  },
  {
    title: "Operação & Assistência",
    items: [
      { name: "Escalas & Plantões", href: "/escalas", icon: CalendarCheck },
      { name: "Insumos & Oxigênio", href: "/insumos", icon: Boxes },
      { name: "PEP (Meus Pacientes)", href: "/pep", icon: Stethoscope },
      { name: "Central de Alertas", href: "/alertas", icon: HeartPulse },
    ],
  },
  {
    title: "Governança & Financeiro",
    items: [
      { name: "Faturamento & Convênios", href: "/faturamento", icon: Receipt },
      { name: "Unidades & Regiões", href: "/unidades", icon: ShieldCheck },
      { name: "Trilha de Auditoria", href: "/auditoria", icon: History },
      { name: "Meu Perfil", href: "/perfil", icon: User },
    ],
  },
];

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState(store.currentUser);

  useEffect(() => {
    setCurrentUser(store.currentUser);
  }, []);

  return (
    <aside
      className={cn(
        "flex flex-col w-64 border-r border-slate-200/80 bg-white min-h-screen text-slate-700 select-none shrink-0",
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200/80">
        <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-teal-600 text-white shadow-xs font-bold text-lg">
          <HeartPulse className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 leading-tight tracking-tight text-base">
            HomeCare
          </span>
          <span className="text-[10px] text-teal-600 font-semibold tracking-wider uppercase">
            Sistema Integrado
          </span>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navigation.map((group) => (
          <div key={group.title} className="space-y-1">
            <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {group.title}
            </h3>
            <div className="space-y-0.5 pt-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between group px-3 py-2 text-sm font-medium rounded-lg transition-all",
                      isActive
                        ? "bg-teal-50/80 text-teal-800 font-semibold shadow-xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          "h-4 w-4 transition-colors",
                          isActive
                            ? "text-teal-600"
                            : "text-slate-400 group-hover:text-slate-600"
                        )}
                      />
                      <span>{item.name}</span>
                    </div>
                    {isActive && (
                      <ChevronRight className="h-3.5 w-3.5 text-teal-600 animate-in fade-in" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Role / Profile Switcher Info */}
      <div className="p-3 border-t border-slate-100">
        <Link href="/perfil">
          <div className="rounded-xl bg-slate-50 hover:bg-slate-100 p-3 border border-slate-200/60 transition-colors cursor-pointer">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Perfil: {currentUser.role}
              </span>
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed truncate">
              {currentUser.name}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
