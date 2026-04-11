export interface Client {
  id: string;
  client_type?: string | null;
  // Common fields
  name?: string | null;
  bin_iin?: string | null;
  address?: string | null;
  actual_address?: string | null;
  phone?: string | null;
  email?: string | null;
  photo_35x45?: string | null;
  contact_info?: string | null;
  owner_id?: number | null;
  display_name?: string | null;
  primary_phone?: string | null;
  primary_email?: string | null;
  created_at: string;
  updated_at: string;
  
  // Legal entity specific fields (in main table)
  contact_person_position?: string | null;
  bank_name?: string | null;
  iban?: string | null;
  bik?: string | null;
  kbe?: string | null;
  
  // Legal profile (from client_legal_profiles table)
  legal_profile?: {
    company_name?: string;
    bin?: string;
    legal_form?: string;
    director_full_name?: string;
    contact_person_name?: string;
    contact_person_position?: string;
    contact_person_phone?: string;
    contact_person_email?: string;
    legal_address?: string;
    actual_address?: string;
    bank_name?: string;
    iban?: string;
    bik?: string;
    kbe?: string;
    tax_regime?: string;
    website?: string;
    industry?: string;
    company_size?: string;
    additional_info?: string;
  };
  
  // Individual specific fields (from client_individual_profiles table)
  last_name?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  iin?: string | null;
  id_number?: string | null;
  passport_series?: string | null;
  passport_number?: string | null;
  registration_address?: string | null;
  country?: string | null;
  trip_purpose?: string | null;
  birth_date?: string | null;
  birth_place?: string | null;
  citizenship?: string | null;
  sex?: string | null;
  marital_status?: string | null;
  passport_issue_date?: string | null;
  passport_expire_date?: string | null;
  previous_last_name?: string | null;
  spouse_name?: string | null;
  spouse_contacts?: string | null;
  has_children?: boolean | null;
  children_list?: any | null;
  education?: string | null;
  job?: string | null;
  trips_last5_years?: string | null;
  relatives_in_destination?: string | null;
  trusted_person?: string | null;
  height?: number | null;
  weight?: number | null;
  driver_license_categories?: any | null;
  therapist_name?: string | null;
  clinic_name?: string | null;
  diseases_last3_years?: string | null;
  additional_info?: string | null;
}

export type CreateClientRequest = Omit<Client, "id" | "created_at" | "updated_at"> & {
  client_type?: string;
  legal_profile?: {
    company_name?: string;
    bin?: string;
    legal_form?: string;
    director_full_name?: string;
    contact_person_name?: string;
    contact_person_position?: string;
    contact_person_phone?: string;
    contact_person_email?: string;
    legal_address?: string;
    actual_address?: string;
    bank_name?: string;
    iban?: string;
    bik?: string;
    kbe?: string;
    tax_regime?: string;
    website?: string;
    industry?: string;
    company_size?: string;
    additional_info?: string;
  };
};

export type UpdateClientRequest = Partial<CreateClientRequest>;
