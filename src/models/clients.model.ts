export interface Client {
  id: string;
  client_type?: string | null;
  // Organization info
  name?: string | null;
  bin_iin?: string | null;
  address?: string | null;
  contact_info?: string | null;
  
  // Required fields (RED)
  country: string;
  trip_purpose: string;
  last_name: string;
  first_name: string;
  birth_date: string;
  phone: string;
  
  // Additional required fields
  middle_name?: string | null;
  birth_place?: string | null;
  citizenship?: string | null;
  gender?: string | null;
  marital_status?: string | null;
  iin?: string | null;
  id_number?: string | null;
  passport_series?: string | null;
  passport_number?: string | null;
  passport_issue_date?: string | null;
  passport_expiry_date?: string | null;
  registration_address?: string | null;
  actual_address?: string | null;
  email?: string | null;
  photo_35x45?: string | null;
  
  // Optional fields
  former_maiden_name?: string | null;
  spouse_info?: string | null;
  children_info?: string | null;
  education?: string | null;
  work_place_position?: string | null;
  trips_visas_5years?: string | null;
  family_members_abroad?: string | null;
  authorized_person?: string | null;
  height_weight?: string | null;
  driving_license_categories?: string | null;
  therapist_clinic?: string | null;
  illnesses_injuries_3years?: string | null;
  additional_info?: string | null;
  
  created_at: string;
  updated_at: string;
}

export type CreateClientRequest = Omit<Client, "id" | "created_at" | "updated_at"> & {
  client_type?: string;
  legal_profile?: {
    company_name?: string;
    bin?: string;
    legal_address?: string;
    contact_person_name?: string;
    contact_person_phone?: string;
  };
};

export type UpdateClientRequest = Partial<CreateClientRequest>;
