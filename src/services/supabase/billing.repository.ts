import { supabase, isSupabaseConfigured } from "./client";

export interface Insurer {
  id: string;
  organizationId: string;
  name: string;
  tradeName?: string | null;
  cnpj?: string | null;
  ansCode?: string | null;
  status: string;
  activePatientsCount: number;
  monthlyBillingEstimated: number;
}

export class BillingRepository {
  private fallbackInsurers: Insurer[] = [
    {
      id: "conv_1",
      organizationId: "org_curahome",
      name: "Unimed Sul da Bahia",
      tradeName: "Unimed",
      cnpj: "01.234.567/0001-89",
      ansCode: "30554",
      status: "ATIVO",
      activePatientsCount: 4,
      monthlyBillingEstimated: 48600,
    },
    {
      id: "conv_2",
      organizationId: "org_curahome",
      name: "Bradesco Saúde Top Nacional",
      tradeName: "Bradesco Saúde",
      cnpj: "98.765.432/0001-10",
      ansCode: "10022",
      status: "ATIVO",
      activePatientsCount: 2,
      monthlyBillingEstimated: 31200,
    },
    {
      id: "conv_3",
      organizationId: "org_curahome",
      name: "SulAmérica Saúde Especial",
      tradeName: "SulAmérica",
      cnpj: "12.345.678/0001-90",
      ansCode: "20199",
      status: "ATIVO",
      activePatientsCount: 1,
      monthlyBillingEstimated: 14800,
    },
    {
      id: "conv_4",
      organizationId: "org_curahome",
      name: "Particular / Cuidado Direto",
      tradeName: "Particular",
      cnpj: null,
      ansCode: "00000",
      status: "ATIVO",
      activePatientsCount: 1,
      monthlyBillingEstimated: 18000,
    },
  ];

  public async getInsurers(orgId: string = "org_curahome"): Promise<Insurer[]> {
    if (!isSupabaseConfigured()) {
      return this.fallbackInsurers.filter((i) => i.organizationId === orgId);
    }

    const { data, error } = await supabase
      .from("insurers")
      .select("*")
      .eq("organization_id", orgId)
      .order("name");

    if (error || !data || data.length === 0) {
      return this.fallbackInsurers.filter((i) => i.organizationId === orgId);
    }

    return data.map((i: any) => ({
      id: i.id,
      organizationId: i.organization_id,
      name: i.name,
      tradeName: i.trade_name,
      cnpj: i.cnpj,
      ansCode: i.ans_code,
      status: i.status,
      activePatientsCount: i.active_patients_count || 0,
      monthlyBillingEstimated: i.monthly_billing_estimated || 0,
    }));
  }
}

export const billingRepository = new BillingRepository();

