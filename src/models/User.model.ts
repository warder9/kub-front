export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role?: string
  status?: string
  lastLogin?: string
  createdAt?: string
  company_name?: string
  bin_iin?: string
  role_id?: number
  is_verified?: boolean
  verified_at?: string
  telegram_chat_id?: number
  notify_tasks_telegram?: boolean
}

export interface CreateUserRequest {
  firstName: string
  lastName: string
  email: string
  phone?: string
  role?: string
}