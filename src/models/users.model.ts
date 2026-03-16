export interface User {
  id: string;
  company_name: string;
  bin_iin: string;
  email: string;
  phone: string;
  role_id: number;
  is_verified: boolean;
  notify_tasks_telegram: boolean;
  telegram_chat_id: number;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  company_name: string;
  bin_iin: string;
  email: string;
  password?: string;
  phone: string;
  role_id: number;
  is_verified?: boolean;
}

export interface UpdateUserRequest {
  company_name?: string;
  bin_iin?: string;
  email?: string;
  phone?: string;
  role_id?: number;
  is_verified?: boolean;
  notify_tasks_telegram?: boolean;
  telegram_chat_id?: number;
}

export interface UserCount {
  count: number;
}