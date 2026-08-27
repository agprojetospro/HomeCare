import { supabase, isSupabaseConfigured } from "./client";
import { PatientProfessionalAssignment } from "@/domain/shift/shift.schema";

export class AssignmentsRepository {
  public async getAssignments(patientId?: string): Promise<PatientProfessionalAssignment[]> {
    if (!isSupabaseConfigured()) return [];

    let query = supabase.from("patient_professional_assignments").select("*");
    if (patientId) {
      query = query.eq("patient_id", patientId).eq("is_active", true);
    }

    const { data, error } = await query;
    if (error || !data) {
      console.error("Error fetching assignments from Supabase:", error);
      return [];
    }

    return data.map((a: any) => ({
      id: a.id,
      episodeId: a.episode_id,
      patientId: a.patient_id,
      professionalId: a.professional_id,
      role: a.role,
      startDate: new Date(a.start_date),
      endDate: a.end_date ? new Date(a.end_date) : undefined,
      isActive: a.is_active,
    }));
  }

  public async createAssignment(assignment: Omit<PatientProfessionalAssignment, "id">): Promise<{ success: boolean; data?: PatientProfessionalAssignment; error?: string }> {
    if (!isSupabaseConfigured()) {
      return { success: true, data: { ...assignment, id: `assign_${Date.now()}` } };
    }

    const { data, error } = await supabase
      .from("patient_professional_assignments")
      .insert({
        episode_id: assignment.episodeId,
        patient_id: assignment.patientId,
        professional_id: assignment.professionalId,
        role: assignment.role,
        start_date: assignment.startDate.toISOString(),
        end_date: assignment.endDate ? assignment.endDate.toISOString() : null,
        is_active: assignment.isActive ?? true,
      })
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Erro ao salvar vínculo assistencial no Supabase." };
    }

    return {
      success: true,
      data: {
        id: data.id,
        episodeId: data.episode_id,
        patientId: data.patient_id,
        professionalId: data.professional_id,
        role: data.role,
        startDate: new Date(data.start_date),
        endDate: data.end_date ? new Date(data.end_date) : undefined,
        isActive: data.is_active,
      },
    };
  }
}

export const assignmentsRepository = new AssignmentsRepository();
