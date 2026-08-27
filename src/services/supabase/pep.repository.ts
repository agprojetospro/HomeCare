import { supabase, isSupabaseConfigured } from "./client";
import {
  ClinicalEvolution,
  VitalSigns,
  Prescription,
  evaluateVitalSignAlerts,
} from "@/domain/pep/pep.schema";

export class PEPRepository {
  // Evoluções Clínicas (SOAP)
  public async getEvolutions(patientId: string): Promise<ClinicalEvolution[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from("clinical_evolutions")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((e: any) => ({
      id: e.id,
      episodeId: e.episode_id,
      patientId: e.patient_id,
      professionalId: e.professional_id,
      evolutionType: e.evolution_type as any,
      content: e.content,
      status: e.status as any,
      createdAt: new Date(e.created_at),
    }));
  }

  public async saveEvolution(evolution: Omit<ClinicalEvolution, "id" | "createdAt">): Promise<{ success: boolean; data?: ClinicalEvolution; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: true, data: { ...evolution, id: `evo_${Date.now()}`, createdAt: new Date() } };
    }

    const { data, error } = await supabase
      .from("clinical_evolutions")
      .insert({
        episode_id: evolution.episodeId,
        patient_id: evolution.patientId,
        professional_id: evolution.professionalId,
        evolution_type: evolution.evolutionType,
        content: evolution.content,
        status: evolution.status || "FINALIZADO",
      })
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Erro ao salvar evolução clínica no Supabase." };
    }

    return {
      success: true,
      data: {
        id: data.id,
        episodeId: data.episode_id,
        patientId: data.patient_id,
        professionalId: data.professional_id,
        evolutionType: data.evolution_type as any,
        content: data.content,
        status: data.status as any,
        createdAt: new Date(data.created_at),
      },
    };
  }

  // Sinais Vitais
  public async getVitals(patientId: string): Promise<VitalSigns[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from("vital_signs")
      .select("*")
      .eq("patient_id", patientId)
      .order("measured_at", { ascending: false });

    if (error || !data) return [];

    return data.map((v: any) => ({
      id: v.id,
      episodeId: v.episode_id,
      patientId: v.patient_id,
      professionalId: v.professional_id,
      measuredAt: new Date(v.measured_at),
      systolicBp: v.systolic_bp,
      diastolicBp: v.diastolic_bp,
      heartRate: v.heart_rate,
      respiratoryRate: v.respiratory_rate,
      oxygenSaturation: v.oxygen_saturation,
      temperature: v.temperature,
      bloodGlucose: v.blood_glucose ?? undefined,
      painScore: v.pain_score,
    }));
  }

  public async recordVitals(vitals: Omit<VitalSigns, "id">): Promise<{ success: boolean; data?: VitalSigns; alerts: any[]; error?: string }> {
    const alerts = evaluateVitalSignAlerts(vitals as VitalSigns);

    if (!isSupabaseConfigured()) {
      return { success: true, data: { ...vitals, id: `vit_${Date.now()}` }, alerts };
    }

    const { data, error } = await supabase
      .from("vital_signs")
      .insert({
        episode_id: vitals.episodeId,
        patient_id: vitals.patientId,
        professional_id: vitals.professionalId,
        measured_at: vitals.measuredAt ? vitals.measuredAt.toISOString() : new Date().toISOString(),
        systolic_bp: vitals.systolicBp,
        diastolic_bp: vitals.diastolicBp,
        heart_rate: vitals.heartRate,
        respiratory_rate: vitals.respiratoryRate,
        oxygen_saturation: vitals.oxygenSaturation,
        temperature: vitals.temperature,
        blood_glucose: vitals.bloodGlucose || null,
        pain_score: vitals.painScore ?? 0,
      })
      .select()
      .single();

    if (error || !data) {
      return { success: false, alerts, error: error?.message || "Erro ao registrar sinais vitais no Supabase." };
    }

    return {
      success: true,
      alerts,
      data: {
        id: data.id,
        episodeId: data.episode_id,
        patientId: data.patient_id,
        professionalId: data.professional_id,
        measuredAt: new Date(data.measured_at),
        systolicBp: data.systolic_bp,
        diastolicBp: data.diastolic_bp,
        heartRate: data.heart_rate,
        respiratoryRate: data.respiratory_rate,
        oxygenSaturation: data.oxygen_saturation,
        temperature: data.temperature,
        bloodGlucose: data.blood_glucose ?? undefined,
        painScore: data.pain_score,
      },
    };
  }

  // Prescrições Médicas
  public async getPrescriptions(patientId: string): Promise<Prescription[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("patient_id", patientId)
      .order("start_date", { ascending: false });

    if (error || !data) return [];

    return data.map((p: any) => ({
      id: p.id,
      episodeId: p.episode_id,
      patientId: p.patient_id,
      doctorId: p.doctor_id,
      startDate: new Date(p.start_date),
      endDate: p.end_date ? new Date(p.end_date) : undefined,
      status: p.status as any,
      items: (p.items as any) || [],
    }));
  }

  public async createPrescription(presc: Omit<Prescription, "id">): Promise<{ success: boolean; data?: Prescription; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: true, data: { ...presc, id: `presc_${Date.now()}` } };
    }

    const { data, error } = await supabase
      .from("prescriptions")
      .insert({
        episode_id: presc.episodeId,
        patient_id: presc.patientId,
        doctor_id: presc.doctorId,
        start_date: presc.startDate.toISOString(),
        end_date: presc.endDate ? presc.endDate.toISOString() : null,
        status: presc.status || "ATIVA",
        items: presc.items as any,
      })
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Erro ao salvar prescrição no Supabase." };
    }

    return {
      success: true,
      data: {
        id: data.id,
        episodeId: data.episode_id,
        patientId: data.patient_id,
        doctorId: data.doctor_id,
        startDate: new Date(data.start_date),
        endDate: data.end_date ? new Date(data.end_date) : undefined,
        status: data.status as any,
        items: (data.items as any) || [],
      },
    };
  }
}

export const pepRepository = new PEPRepository();

