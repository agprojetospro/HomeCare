export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "GESTOR_UNIDADE"
  | "GESTOR_ESCALA"
  | "MEDICO"
  | "ENFERMEIRO_SUPERVISOR"
  | "ENFERMEIRO"
  | "TECNICO_ENFERMAGEM"
  | "FISIOTERAPEUTA"
  | "NUTRICIONISTA"
  | "FONOAUDIOLOGO"
  | "PSICOLOGO"
  | "TERAPEUTA_OCUPACIONAL"
  | "CUIDADOR"
  | "ATENDIMENTO"
  | "FATURAMENTO"
  | "AUDITOR_CLINICO"
  | "FAMILIAR";

export type CareType =
  | "INTERNO"
  | "HOME_CARE_24H"
  | "HOME_CARE_12H"
  | "VISITAS_PONTUAIS"
  | "PROCEDIMENTOS";

export type RecordStatus = "RASCUNHO" | "FINALIZADO";

export type ShiftType =
  | "HORAS_24"
  | "DIURNO_12H"
  | "NOTURNO_12H"
  | "FERIADO"
  | "FINAL_DE_SEMANA"
  | "OUTRO";

export type ShiftStatus =
  | "PLANEJADO"
  | "CONFIRMADO"
  | "EM_ANDAMENTO"
  | "CONCLUIDO"
  | "CANCELADO";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          trade_name: string | null;
          cnpj: string;
          status: string;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          trade_name?: string | null;
          cnpj: string;
          status?: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
      };
      units: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          code: string;
          type: string;
          status: string;
          phone: string | null;
          email: string | null;
          address_street: string;
          address_number: string;
          address_complement: string | null;
          address_neighborhood: string;
          city: string;
          state: string;
          postal_code: string;
          latitude: number | null;
          longitude: number | null;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          code: string;
          type?: string;
          status?: string;
          phone?: string | null;
          email?: string | null;
          address_street: string;
          address_number: string;
          address_complement?: string | null;
          address_neighborhood: string;
          city: string;
          state: string;
          postal_code: string;
          latitude?: number | null;
          longitude?: number | null;
          timezone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["units"]["Insert"]>;
      };
      service_regions: {
        Row: {
          id: string;
          organization_id: string;
          unit_id: string;
          name: string;
          code: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          unit_id: string;
          name: string;
          code: string;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["service_regions"]["Insert"]>;
      };
      service_areas: {
        Row: {
          id: string;
          service_region_id: string;
          name: string;
          city: string;
          state: string;
          postal_code_start: string;
          postal_code_end: string;
          center_latitude: number | null;
          center_longitude: number | null;
          radius_km: number | null;
          neighborhoods: string[];
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          service_region_id: string;
          name: string;
          city: string;
          state: string;
          postal_code_start: string;
          postal_code_end: string;
          center_latitude?: number | null;
          center_longitude?: number | null;
          radius_km?: number | null;
          neighborhoods?: string[];
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["service_areas"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          full_name: string;
          role: UserRole;
          status: string;
          avatar_url: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id?: string;
          email: string;
          full_name: string;
          role?: UserRole;
          status?: string;
          avatar_url?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      professionals: {
        Row: {
          id: string;
          organization_id: string;
          profile_id: string | null;
          full_name: string;
          cpf: string;
          profession: UserRole;
          council_type: string;
          council_number: string;
          council_uf: string;
          specialties: string[];
          phone: string;
          email: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string;
          profile_id?: string | null;
          full_name: string;
          cpf: string;
          profession: UserRole;
          council_type: string;
          council_number: string;
          council_uf: string;
          specialties?: string[];
          phone: string;
          email?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["professionals"]["Insert"]>;
      };
      patients: {
        Row: {
          id: string;
          organization_id: string;
          unit_id: string;
          full_name: string;
          social_name: string | null;
          father_name: string | null;
          mother_name: string;
          cpf: string | null;
          rg: string | null;
          birth_date: string;
          nationality: string;
          race_color: string;
          naturalness: string | null;
          marital_status: string;
          gender: string;
          address_street: string;
          address_number: string;
          address_complement: string | null;
          address_neighborhood: string;
          address_city: string;
          address_state: string;
          address_zip: string;
          latitude: number | null;
          longitude: number | null;
          allergies: string[];
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string;
          unit_id?: string;
          full_name: string;
          social_name?: string | null;
          father_name?: string | null;
          mother_name: string;
          cpf?: string | null;
          rg?: string | null;
          birth_date: string;
          nationality?: string;
          race_color?: string;
          naturalness?: string | null;
          marital_status?: string;
          gender: string;
          address_street: string;
          address_number: string;
          address_complement?: string | null;
          address_neighborhood: string;
          address_city: string;
          address_state: string;
          address_zip: string;
          latitude?: number | null;
          longitude?: number | null;
          allergies?: string[];
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["patients"]["Insert"]>;
      };
      care_episodes: {
        Row: {
          id: string;
          organization_id: string;
          unit_id: string;
          patient_id: string;
          care_location_id: string | null;
          care_type: CareType;
          admission_date: string;
          discharge_date: string | null;
          doctor_in_charge_id: string | null;
          nurse_in_charge_id: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string;
          unit_id?: string;
          patient_id: string;
          care_location_id?: string | null;
          care_type?: CareType;
          admission_date?: string;
          discharge_date?: string | null;
          doctor_in_charge_id?: string | null;
          nurse_in_charge_id?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["care_episodes"]["Insert"]>;
      };
      patient_professional_assignments: {
        Row: {
          id: string;
          episode_id: string;
          patient_id: string;
          professional_id: string;
          role: string;
          start_date: string;
          end_date: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          episode_id: string;
          patient_id: string;
          professional_id: string;
          role: string;
          start_date?: string;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["patient_professional_assignments"]["Insert"]>;
      };
      triages: {
        Row: {
          id: string;
          episode_id: string | null;
          patient_id: string;
          evaluator_id: string;
          evaluation_date: string;
          location: string;
          modality: string;
          main_diagnosis: string;
          cid10: string | null;
          secondary_diagnoses: string[];
          request_reason: string;
          general_state: string;
          consciousness_level: string;
          systolic_bp: number;
          diastolic_bp: number;
          heart_rate: number;
          respiratory_rate: number;
          oxygen_saturation: number;
          temperature: number;
          blood_glucose: number | null;
          pain_score: number;
          mobility: string;
          feeding_route: string;
          elimination: string;
          skin_integrity: string;
          pressure_ulcers: Json;
          invasive_devices: string[];
          abemid_score: number;
          abemid_category: string;
          nead_score: number;
          nead_complexity: string;
          eligibility: string;
          care_modality_indicated: string;
          required_specialties: string[];
          estimated_frequency: string;
          complexity_level: string;
          conclusion: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          episode_id?: string | null;
          patient_id: string;
          evaluator_id: string;
          evaluation_date?: string;
          location?: string;
          modality?: string;
          main_diagnosis: string;
          cid10?: string | null;
          secondary_diagnoses?: string[];
          request_reason: string;
          general_state?: string;
          consciousness_level?: string;
          systolic_bp: number;
          diastolic_bp: number;
          heart_rate: number;
          respiratory_rate: number;
          oxygen_saturation: number;
          temperature: number;
          blood_glucose?: number | null;
          pain_score?: number;
          mobility: string;
          feeding_route: string;
          elimination: string;
          skin_integrity?: string;
          pressure_ulcers?: Json;
          invasive_devices?: string[];
          abemid_score?: number;
          abemid_category?: string;
          nead_score?: number;
          nead_complexity?: string;
          eligibility?: string;
          care_modality_indicated?: string;
          required_specialties?: string[];
          estimated_frequency?: string;
          complexity_level?: string;
          conclusion?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["triages"]["Insert"]>;
      };
      pads: {
        Row: {
          id: string;
          organization_id: string;
          unit_id: string;
          episode_id: string;
          patient_id: string;
          version: number;
          care_regime: string;
          start_date: string;
          end_date: string | null;
          review_interval_days: number;
          status: string;
          created_by_id: string;
          clinical_goals: string;
          visits: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string;
          unit_id?: string;
          episode_id: string;
          patient_id: string;
          version?: number;
          care_regime?: string;
          start_date?: string;
          end_date?: string | null;
          review_interval_days?: number;
          status?: string;
          created_by_id: string;
          clinical_goals?: string;
          visits?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pads"]["Insert"]>;
      };
      shifts: {
        Row: {
          id: string;
          unit_id: string;
          start_time: string;
          end_time: string;
          shift_type: ShiftType;
          status: ShiftStatus;
          doctor_in_charge_id: string;
          nurse_in_charge_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          unit_id?: string;
          start_time: string;
          end_time: string;
          shift_type?: ShiftType;
          status?: ShiftStatus;
          doctor_in_charge_id: string;
          nurse_in_charge_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["shifts"]["Insert"]>;
      };
      clinical_evolutions: {
        Row: {
          id: string;
          episode_id: string;
          patient_id: string;
          professional_id: string;
          evolution_type: string;
          content: string;
          status: RecordStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          episode_id: string;
          patient_id: string;
          professional_id: string;
          evolution_type: string;
          content: string;
          status?: RecordStatus;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clinical_evolutions"]["Insert"]>;
      };
      vital_signs: {
        Row: {
          id: string;
          episode_id: string;
          patient_id: string;
          professional_id: string;
          measured_at: string;
          systolic_bp: number;
          diastolic_bp: number;
          heart_rate: number;
          respiratory_rate: number;
          oxygen_saturation: number;
          temperature: number;
          blood_glucose: number | null;
          pain_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          episode_id: string;
          patient_id: string;
          professional_id: string;
          measured_at?: string;
          systolic_bp: number;
          diastolic_bp: number;
          heart_rate: number;
          respiratory_rate: number;
          oxygen_saturation: number;
          temperature: number;
          blood_glucose?: number | null;
          pain_score?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vital_signs"]["Insert"]>;
      };
      prescriptions: {
        Row: {
          id: string;
          episode_id: string;
          patient_id: string;
          doctor_id: string;
          start_date: string;
          end_date: string | null;
          status: string;
          items: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          episode_id: string;
          patient_id: string;
          doctor_id: string;
          start_date?: string;
          end_date?: string | null;
          status?: string;
          items?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["prescriptions"]["Insert"]>;
      };
      procedures: {
        Row: {
          id: string;
          episode_id: string;
          patient_id: string;
          professional_id: string;
          procedure_name: string;
          executed_at: string;
          quantity: number;
          notes: string | null;
          materials_used: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          episode_id: string;
          patient_id: string;
          professional_id: string;
          procedure_name: string;
          executed_at?: string;
          quantity?: number;
          notes?: string | null;
          materials_used?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["procedures"]["Insert"]>;
      };
      exams: {
        Row: {
          id: string;
          episode_id: string;
          patient_id: string;
          requester_id: string;
          exam_name: string;
          requested_at: string;
          result_date: string | null;
          result_summary: string | null;
          result_url: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          episode_id: string;
          patient_id: string;
          requester_id: string;
          exam_name: string;
          requested_at?: string;
          result_date?: string | null;
          result_summary?: string | null;
          result_url?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["exams"]["Insert"]>;
      };
      clinical_events: {
        Row: {
          id: string;
          episode_id: string;
          patient_id: string;
          event_type: string;
          event_title: string;
          event_timestamp: string;
          author_name: string;
          author_role: string;
          summary: string;
          severity: string;
          reference_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          episode_id: string;
          patient_id: string;
          event_type: string;
          event_title: string;
          event_timestamp?: string;
          author_name: string;
          author_role: string;
          summary: string;
          severity?: string;
          reference_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clinical_events"]["Insert"]>;
      };
      insurers: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          trade_name: string | null;
          cnpj: string | null;
          ans_code: string | null;
          status: string;
          active_patients_count: number;
          monthly_billing_estimated: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string;
          name: string;
          trade_name?: string | null;
          cnpj?: string | null;
          ans_code?: string | null;
          status?: string;
          active_patients_count?: number;
          monthly_billing_estimated?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["insurers"]["Insert"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          user_name: string;
          user_role: string;
          action: string;
          entity_table: string;
          record_id: string | null;
          patient_id: string | null;
          new_state: Json;
          previous_state: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          user_name: string;
          user_role: string;
          action: string;
          entity_table: string;
          record_id?: string | null;
          patient_id?: string | null;
          new_state?: Json;
          previous_state?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
      };
    };
  };
}
