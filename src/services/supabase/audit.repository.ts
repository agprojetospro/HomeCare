import { supabase, isSupabaseConfigured } from "./client";
import { AuditLog, createAuditEntry } from "@/domain/audit/audit";

export class AuditRepository {
  public async getAuditLogs(): Promise<AuditLog[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data) return [];

    return data.map((l: any) => ({
      id: l.id,
      userId: l.user_id,
      userName: l.user_name,
      userRole: l.user_role,
      action: l.action,
      entityTable: l.entity_table,
      recordId: l.record_id,
      patientId: l.patient_id,
      newState: l.new_state,
      previousState: l.previous_state,
      ipAddress: l.ip_address || "127.0.0.1",
      createdAt: new Date(l.created_at),
    }));
  }

  public async logAction(entry: Omit<AuditLog, "id" | "createdAt" | "ipAddress">): Promise<void> {
    if (!isSupabaseConfigured()) return;

    await supabase.from("audit_logs").insert({
      user_id: entry.userId,
      user_name: entry.userName,
      user_role: entry.userRole,
      action: entry.action,
      entity_table: entry.entityTable,
      record_id: entry.recordId || null,
      patient_id: entry.patientId || null,
      new_state: entry.newState || null,
      previous_state: entry.previousState || null,
      ip_address: "127.0.0.1",
    });
  }
}

export const auditRepository = new AuditRepository();

