export interface Client {
  id: string;
  name: string;
  bin_iin: string;
  address: string;
  contact_info: string;
  last_name: string;
  first_name: string;
  middle_name?: string | null;
  iin: string;
  id_number: string;
  passport_series?: string | null;
  passport_number?: string | null;
  phone: string;
  email: string;
  registration_address: string;
  actual_address: string;
  created_at: string;
  updated_at: string;
}

export type CreateClientRequest = Omit<Client, "id" | "created_at" | "updated_at">;

export type UpdateClientRequest = Partial<CreateClientRequest>;
