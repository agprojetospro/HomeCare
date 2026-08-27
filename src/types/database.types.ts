export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: string;
          avatar_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role: string;
          avatar_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      patients: {
        Row: {
          id: string;
          full_name: string;
          social_name: string | null;
          cpf: string | null;
          rg: string | null;
          birth_date: string;
          mother_name: string;
          father_name: string | null;
          gender: string;
          address_street: string;
          address_number: string;
          address_neighborhood: string;
          address_city: string;
          address_state: string;
          address_zip: string;
          allergies: string[];
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          social_name?: string | null;
          cpf?: string | null;
          rg?: string | null;
          birth_date: string;
          mother_name: string;
          father_name?: string | null;
          gender: string;
          address_street: string;
          address_number: string;
          address_neighborhood: string;
          address_city: string;
          address_state: string;
          address_zip: string;
          allergies?: string[];
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["patients"]["Insert"]>;
      };
      professionals: {
        Row: {
          id: string;
          profile_id: string | null;
          full_name: string;
          cpf: string;
          profession: string;
          council_type: string;
          council_number: string;
          council_uf: string;
          specialties: string[];
          phone: string;
          email: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          full_name: string;
          cpf: string;
          profession: string;
          council_type: string;
          council_number: string;
          council_uf: string;
          specialties?: string[];
          phone: string;
          email?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["professionals"]["Insert"]>;
      };
    };
  };
}

