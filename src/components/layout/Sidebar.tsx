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
      { name: "Profissionais de Saúde", href: "/profissionais", icon: UserCheck },
    ],
  },
  {
    title: "Operação & Assistência",
    items: [
      { name: "Escalas & Plantões", href: "/escalas", icon: CalendarCheck },
      { name: "PEP (Meus Pacientes)", href: "/pep", icon: Stethoscope },
    ],
  },
  {
    title: "Governança & Segurança",
    items: [
      { name: "Unidades & Regiões", href: "/unidades", icon: ShieldCheck },
      { name: "Trilha de Auditoria", href: "/auditoria", icon: History },
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
      <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
          <HeartPulse className="h-5 w-5" />
        </div>
        <div>
          <div className="font-bold text-slate-900 leading-tight tracking-tight flex items-center gap-1.5">
            CuraHome <span className="text-[10px] uppercase font-extrabold bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded border border-teal-200">PEP</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Atenção Domiciliar</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        {navigation.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h4 className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {section.title}
            </h4>
            <div className="mt-1 space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
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
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Perfil Ativo: {currentUser.role}
            </span>
            <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed truncate">
            {currentUser.name}
          </p>
        </div>
      </div>
    </aside>
  );
}
