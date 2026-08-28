import { SupabaseClient } from "@supabase/supabase-js";
import {
  SupplyItem,
  InventoryLedgerEntry,
  PatientOxygenTherapy,
  WoundEvaluation,
} from "@/domain/supplies/supplies.schema";

export class SuppliesRepository {
  constructor(private supabase: SupabaseClient) {}

  // --- CATÁLOGO & ESTOQUE ---
  async getCatalog(organizationId: string, unitId?: string): Promise<SupplyItem[]> {
    let query = this.supabase
      .from("supplies_catalog")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("active", true)
      .order("name", { ascending: true });

    if (unitId) {
      query = query.eq("unit_id", unitId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(this.mapSupplyItemFromDb);
  }

  async recordInventoryMovement(movement: Omit<InventoryLedgerEntry, "id" | "createdAt">): Promise<InventoryLedgerEntry> {
    const { data, error } = await this.supabase
      .from("inventory_ledger")
      .insert({
        organization_id: movement.organizationId,
        unit_id: movement.unitId,
        supply_item_id: movement.supplyItemId,
        movement_type: movement.movementType,
        quantity: movement.quantity,
        balance_after: movement.balanceAfter,
        batch_number: movement.batchNumber,
        expiration_date: movement.expirationDate ? new Date(movement.expirationDate).toISOString().split("T")[0] : null,
        patient_id: movement.patientId,
        professional_id: movement.professionalId,
        visit_id: movement.visitId,
        reason: movement.reason,
      })
      .select()
      .single();

    if (error) throw error;

    // Atualizar estoque atual no catálogo
    await this.supabase
      .from("supplies_catalog")
      .update({ current_stock: movement.balanceAfter, updated_at: new Date().toISOString() })
      .eq("id", movement.supplyItemId);

    return this.mapLedgerEntryFromDb(data);
  }

  // --- OXIGENOTERAPIA ---
  async getPatientOxygenTherapy(patientId: string): Promise<PatientOxygenTherapy | null> {
    const { data, error } = await this.supabase
      .from("patient_oxygen_therapy")
      .select("*")
      .eq("patient_id", patientId)
      .eq("active", true)
      .maybeSingle();

    if (error) throw error;
    return data ? this.mapOxygenTherapyFromDb(data) : null;
  }

  async saveOxygenTherapy(therapy: Omit<PatientOxygenTherapy, "id">): Promise<PatientOxygenTherapy> {
    const { data, error } = await this.supabase
      .from("patient_oxygen_therapy")
      .upsert({
        patient_id: therapy.patientId,
        care_episode_id: therapy.episodeId,
        source_type: therapy.sourceType,
        delivery_interface: therapy.deliveryInterface,
        flow_rate_lpm: therapy.flowRateLpm,
        usage_hours_per_day: therapy.usageHoursPerDay,
        cylinder_type: therapy.cylinderType,
        cylinder_factor_k: therapy.cylinderFactorK,
        current_pressure_bar: therapy.currentPressureBar,
        nominal_pressure_bar: therapy.nominalPressureBar,
        last_pressure_check_at: therapy.lastPressureCheckAt ? new Date(therapy.lastPressureCheckAt).toISOString() : new Date().toISOString(),
        concentrator_fio2_percent: therapy.concentratorFio2Percent,
        concentrator_hour_meter: therapy.concentratorHourMeter,
        backup_cylinder_available: therapy.backupCylinderAvailable,
        active: therapy.active,
        notes: therapy.notes,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapOxygenTherapyFromDb(data);
  }

  // --- PROTOCOLO DE CURATIVOS & LESÕES ---
  async getWoundEvaluations(patientId: string): Promise<WoundEvaluation[]> {
    const { data, error } = await this.supabase
      .from("wound_evaluations")
      .select("*")
      .eq("patient_id", patientId)
      .order("evaluated_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(this.mapWoundEvaluationFromDb);
  }

  async recordWoundEvaluation(evalData: Omit<WoundEvaluation, "id" | "createdAt">): Promise<WoundEvaluation> {
    const { data, error } = await this.supabase
      .from("wound_evaluations")
      .insert({
        patient_id: evalData.patientId,
        care_episode_id: evalData.episodeId,
        professional_id: evalData.professionalId,
        visit_id: evalData.visitId,
        wound_identifier: evalData.woundIdentifier,
        location: evalData.location,
        stage: evalData.stage,
        length_cm: evalData.lengthCm,
        width_cm: evalData.widthCm,
        depth_cm: evalData.depthCm,
        granulation_percent: evalData.granulationPercent,
        slough_percent: evalData.sloughPercent,
        necrosis_percent: evalData.necrosisPercent,
        epithelialization_percent: evalData.epithelializationPercent,
        exudate_amount: evalData.exudateAmount,
        exudate_type: evalData.exudateType,
        odor_present: evalData.odorPresent,
        pain_score: evalData.painScoreVisualScale,
        edges_condition: evalData.edgesCondition,
        prescribed_covering: evalData.prescribedCovering,
        secondary_covering: evalData.secondaryCovering,
        cleaning_solution: evalData.cleaningSolution,
        dressing_change_frequency_hours: evalData.dressingChangeFrequencyHours,
        healing_evolution_status: evalData.healingEvolutionStatus,
        photo_storage_url: evalData.photoStorageUrl,
        clinical_notes: evalData.clinicalNotes,
        evaluated_at: new Date(evalData.evaluatedAt).toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return this.mapWoundEvaluationFromDb(data);
  }

  // --- MAPPERS ---
  private mapSupplyItemFromDb(row: any): SupplyItem {
    return {
      id: row.id,
      organizationId: row.organization_id,
      unitId: row.unit_id,
      code: row.code,
      name: row.name,
      category: row.category,
      unitOfMeasure: row.unit_of_measure,
      currentStock: row.current_stock,
      minimumStock: row.minimum_stock,
      reorderPoint: row.reorder_point,
      costPrice: row.cost_price ? Number(row.cost_price) : null,
      anvisaRegistration: row.anvisa_registration,
      active: row.active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapLedgerEntryFromDb(row: any): InventoryLedgerEntry {
    return {
      id: row.id,
      organizationId: row.organization_id,
      unitId: row.unit_id,
      supplyItemId: row.supply_item_id,
      movementType: row.movement_type,
      quantity: row.quantity,
      balanceAfter: row.balance_after,
      batchNumber: row.batch_number,
      expirationDate: row.expiration_date ? new Date(row.expiration_date) : null,
      patientId: row.patient_id,
      professionalId: row.professional_id,
      visitId: row.visit_id,
      reason: row.reason,
      createdAt: new Date(row.created_at),
    };
  }

  private mapOxygenTherapyFromDb(row: any): PatientOxygenTherapy {
    return {
      id: row.id,
      patientId: row.patient_id,
      episodeId: row.care_episode_id,
      sourceType: row.source_type,
      deliveryInterface: row.delivery_interface,
      flowRateLpm: Number(row.flow_rate_lpm),
      usageHoursPerDay: Number(row.usage_hours_per_day),
      cylinderType: row.cylinder_type,
      cylinderFactorK: row.cylinder_factor_k ? Number(row.cylinder_factor_k) : 1.0,
      currentPressureBar: row.current_pressure_bar != null ? Number(row.current_pressure_bar) : null,
      nominalPressureBar: row.nominal_pressure_bar ? Number(row.nominal_pressure_bar) : 150,
      lastPressureCheckAt: row.last_pressure_check_at ? new Date(row.last_pressure_check_at) : null,
      concentratorFio2Percent: row.concentrator_fio2_percent != null ? Number(row.concentrator_fio2_percent) : null,
      concentratorHourMeter: row.concentrator_hour_meter != null ? Number(row.concentrator_hour_meter) : null,
      backupCylinderAvailable: row.backup_cylinder_available,
      active: row.active,
      notes: row.notes,
      updatedAt: new Date(row.updated_at),
    };
  }

  private mapWoundEvaluationFromDb(row: any): WoundEvaluation {
    return {
      id: row.id,
      patientId: row.patient_id,
      episodeId: row.care_episode_id,
      professionalId: row.professional_id,
      visitId: row.visit_id,
      woundIdentifier: row.wound_identifier,
      location: row.location,
      stage: row.stage,
      lengthCm: Number(row.length_cm),
      widthCm: Number(row.width_cm),
      depthCm: Number(row.depth_cm || 0),
      areaCm2: Number(row.area_cm2 || row.length_cm * row.width_cm),
      granulationPercent: Number(row.granulation_percent || 0),
      sloughPercent: Number(row.slough_percent || 0),
      necrosisPercent: Number(row.necrosis_percent || 0),
      epithelializationPercent: Number(row.epithelialization_percent || 0),
      exudateAmount: row.exudate_amount,
      exudateType: row.exudate_type,
      odorPresent: Boolean(row.odor_present),
      painScoreVisualScale: Number(row.pain_score || 0),
      edgesCondition: row.edges_condition,
      prescribedCovering: row.prescribed_covering,
      secondaryCovering: row.secondary_covering,
      cleaningSolution: row.cleaning_solution,
      dressingChangeFrequencyHours: Number(row.dressing_change_frequency_hours || 24),
      healingEvolutionStatus: row.healing_evolution_status,
      photoStorageUrl: row.photo_storage_url,
      clinicalNotes: row.clinical_notes,
      evaluatedAt: new Date(row.evaluated_at),
      createdAt: new Date(row.created_at),
    };
  }
}
