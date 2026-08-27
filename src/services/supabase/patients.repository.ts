import { supabase, isSupabaseConfigured } from "./client";
import { Patient, PatientSchema } from "@/domain/patient/patient.schema";

export class PatientsRepository {
  public async getPatients(orgId: string): Promise<Patient[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("organization_id", orgId)
      .order("full_name");

    if (error || !data) {
      console.error("Error fetching patients from Supabase:", error);
      return [];
    }

    return data.map((p: any) => ({
      id: p.id,
      organizationId: p.organization_id,
      unitId: p.unit_id,
      fullName: p.full_name,
      socialName: p.social_name,
      fatherName: p.father_name,
      motherName: p.mother_name,
      cpf: p.cpf,
      rg: p.rg,
      birthDate: new Date(p.birth_date),
      nationality: p.nationality || "Brasileira",
      raceColor: p.race_color || "NAO_INFORMADO",
      naturalness: p.naturalness,
      maritalStatus: p.marital_status || "SOLTEIRO",
      gender: p.gender || "OUTRO",
      addressStreet: p.address_street,
      addressNumber: p.address_number,
      addressComplement: p.address_complement,
      addressNeighborhood: p.address_neighborhood,
      addressCity: p.address_city,
      addressState: p.address_state,
      addressZip: p.address_zip,
      latitude: p.latitude,
      longitude: p.longitude,
      allergies: p.allergies || [],
      addresses: p.addresses || [],
      status: p.status || "ATIVO",
      createdAt: new Date(p.created_at),
      updatedAt: new Date(p.updated_at),
    }));
  }

  public async getPatientById(id: string): Promise<Patient | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      organizationId: data.organization_id,
      unitId: data.unit_id,
      fullName: data.full_name,
      socialName: data.social_name,
      fatherName: data.father_name,
      motherName: data.mother_name,
      cpf: data.cpf,
      rg: data.rg,
      birthDate: new Date(data.birth_date),
      nationality: data.nationality || "Brasileira",
      raceColor: data.race_color || "NAO_INFORMADO",
      naturalness: data.naturalness,
      maritalStatus: data.marital_status || "SOLTEIRO",
      gender: data.gender || "OUTRO",
      addressStreet: data.address_street,
      addressNumber: data.address_number,
      addressComplement: data.address_complement,
      addressNeighborhood: data.address_neighborhood,
      addressCity: data.address_city,
      addressState: data.address_state,
      addressZip: data.address_zip,
      latitude: data.latitude,
      longitude: data.longitude,
      allergies: data.allergies || [],
      addresses: data.addresses || [],
      status: data.status || "ATIVO",
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  public async createPatient(patient: Omit<Patient, "id">): Promise<{ success: boolean; data?: Patient; error?: string }> {
    const parse = PatientSchema.safeParse(patient);
    if (!parse.success) {
      return { success: false, error: parse.error.errors[0].message };
    }

    if (!isSupabaseConfigured()) {
      return { success: true, data: { ...patient, id: `pat_${Date.now()}` } as Patient };
    }

    const { data, error } = await supabase
      .from("patients")
      .insert({
        organization_id: patient.organizationId,
        unit_id: patient.unitId,
        full_name: patient.fullName,
        social_name: patient.socialName || null,
        father_name: patient.fatherName || null,
        mother_name: patient.motherName,
        cpf: patient.cpf || null,
        rg: patient.rg || null,
        birth_date: patient.birthDate instanceof Date ? patient.birthDate.toISOString().split("T")[0] : patient.birthDate,
        nationality: patient.nationality || "Brasileira",
        race_color: patient.raceColor || "NAO_INFORMADO",
        naturalness: patient.naturalness || null,
        marital_status: patient.maritalStatus || "SOLTEIRO",
        gender: patient.gender,
        address_street: patient.addressStreet,
        address_number: patient.addressNumber,
        address_complement: patient.addressComplement || null,
        address_neighborhood: patient.addressNeighborhood,
        address_city: patient.addressCity,
        address_state: patient.addressState,
        address_zip: patient.addressZip,
        latitude: patient.latitude || null,
        longitude: patient.longitude || null,
        allergies: patient.allergies || [],
        status: patient.status || "ATIVO",
      })
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Erro ao salvar paciente no Supabase." };
    }

    return {
      success: true,
      data: {
        ...patient,
        id: data.id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      },
    };
  }
}

export const patientsRepository = new PatientsRepository();

