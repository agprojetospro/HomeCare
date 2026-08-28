import { SupabaseClient } from "@supabase/supabase-js";
import {
  FamilyAccessGrant,
  FamilyFeedback,
} from "@/domain/family/family.schema";

export class FamilyRepository {
  constructor(private supabase: SupabaseClient) {}

  async getAccessGrants(patientId: string): Promise<FamilyAccessGrant[]> {
    const { data, error } = await this.supabase
      .from("family_access_grants")
      .select("*")
      .eq("patient_id", patientId)
      .eq("active", true);

    if (error) throw error;
    return (data || []).map(this.mapGrantFromDb);
  }

  async createAccessGrant(grant: Omit<FamilyAccessGrant, "id" | "createdAt">): Promise<FamilyAccessGrant> {
    const { data, error } = await this.supabase
      .from("family_access_grants")
      .insert({
        patient_id: grant.patientId,
        family_user_id: grant.familyUserId,
        family_user_name: grant.familyUserName,
        family_email: grant.familyEmail,
        family_phone: grant.familyPhone,
        relationship: grant.relationship,
        access_level: grant.accessLevel,
        consent_signed_at: new Date(grant.consentSignedAt).toISOString(),
        expires_at: grant.expiresAt ? new Date(grant.expiresAt).toISOString() : null,
        active: grant.active,
        notes: grant.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapGrantFromDb(data);
  }

  async submitFeedback(feedback: Omit<FamilyFeedback, "id" | "createdAt">): Promise<FamilyFeedback> {
    const { data, error } = await this.supabase
      .from("family_feedbacks")
      .insert({
        patient_id: feedback.patientId,
        family_user_id: feedback.familyUserId,
        family_user_name: feedback.familyUserName,
        rating: feedback.rating,
        category: feedback.category,
        comment: feedback.comment,
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapFeedbackFromDb(data);
  }

  private mapGrantFromDb(row: any): FamilyAccessGrant {
    return {
      id: row.id,
      patientId: row.patient_id,
      familyUserId: row.family_user_id,
      familyUserName: row.family_user_name,
      familyEmail: row.family_email,
      familyPhone: row.family_phone,
      relationship: row.relationship,
      accessLevel: row.access_level,
      consentSignedAt: new Date(row.consent_signed_at),
      expiresAt: row.expires_at ? new Date(row.expires_at) : null,
      active: row.active,
      notes: row.notes,
      createdAt: new Date(row.created_at),
    };
  }

  private mapFeedbackFromDb(row: any): FamilyFeedback {
    return {
      id: row.id,
      patientId: row.patient_id,
      familyUserId: row.family_user_id,
      familyUserName: row.family_user_name,
      rating: Number(row.rating),
      category: row.category,
      comment: row.comment,
      createdAt: new Date(row.created_at),
    };
  }
}
