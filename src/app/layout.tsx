import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CuraHome CRM | Gestão Integrada de Atenção Domiciliar",
  description: "Plataforma completa de gestão clínica, escalas, comercial e faturamento de Home Care.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <DashboardLayout>{children}</DashboardLayout>
      </body>
    </html>
  );
}
