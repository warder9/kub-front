import api, { setAuthToken, setRefreshToken } from './index'
import { setCurrentUser, setCurrentCompany } from '@/lib/auth'
import type * as Models from '../models/Auth.model'

// Функция для преобразования данных пользователя с сервера в формат приложения
function transformUserFromServer(serverUser: any): any {
  return {
    id: serverUser.id,
    firstName: serverUser.company_name || serverUser.email.split('@')[0],
    lastName: '',
    email: serverUser.email,
    phone: serverUser.phone,
    role: getRoleFromId(serverUser.role_id), // Преобразуем role_id в строковую роль
    company_name: serverUser.company_name,
    bin_iin: serverUser.bin_iin,
    role_id: serverUser.role_id,
    is_verified: serverUser.is_verified,
    verified_at: serverUser.verified_at,
    telegram_chat_id: serverUser.telegram_chat_id,
    notify_tasks_telegram: serverUser.notify_tasks_telegram,
    status: 'active'
  }
}

// Функция для преобразования role_id в строковую роль
function getRoleFromId(roleId: number): string {
  const roleMapping: Record<number, string> = {
    40: 'management',
    30: 'admin',
    20: 'control',
    10: 'operations',
    5: 'sales'
    // Добавьте другие role_id по мере необходимости
  }
  return roleMapping[roleId] || 'user'
}

export async function login(payload: Models.Auth_Login_Request, params?: Record<string, any>): Promise<Models.Auth_Login_Response> {
  const res = await api.post(`/auth/login`, payload)
  const data = res.data
  
  try {
    if (data?.tokens?.access_token) {
      setAuthToken(data.tokens.access_token)
    }
    if (data?.tokens?.refresh_token) {
      setRefreshToken(data.tokens.refresh_token)
    }
    if (data?.user) {
      // Преобразуем пользователя с сервера в формат приложения
      const transformedUser = transformUserFromServer(data.user)
      setCurrentUser(transformedUser)
      
      // Также создаем компанию на основе данных пользователя
      const company = {
        id: String(data.user.id),
        name: data.user.company_name,
        bin_iin: data.user.bin_iin,
        email: data.user.email,
        phone: data.user.phone,
        status: 'active'
      }
      setCurrentCompany(company)
    }
  } catch (e) {
    console.error('Ошибка при сохранении данных авторизации:', e)
  }
  
  return data
}

export async function refresh_token(payload: Models.Auth_Refresh_token_Request, params?: Record<string, any>): Promise<any> {
  const res = await api.post(`/auth/refresh`, payload)
  return res.data
}

export async function forgot_password(payload: Models.Auth_Forgot_password_Request, params?: Record<string, any>): Promise<any> {
  const res = await api.post(`/auth/forgot-password`, payload)
  return res.data
}

export async function reset_password(payload: Models.Auth_Reset_password_Request, params?: Record<string, any>): Promise<any> {
  const res = await api.post(`/auth/reset-password`, payload)
  return res.data
}

export async function register(payload: Models.Auth_Register_Request, params?: Record<string, any>): Promise<Models.Auth_Register_Response> {
  const res = await api.post(`/register`, payload)
  return res.data
}

export async function confirm_registration(payload: Models.Auth_Confirm_registration_Request, params?: Record<string, any>): Promise<any> {
  const res = await api.post(`/register/confirm`, payload)
  return res.data
}

export async function resend_confirmation(payload: Models.Auth_Resend_confirmation_Request, params?: Record<string, any>): Promise<any> {
  const res = await api.post(`/register/resend`, payload)
  return res.data
}

export async function getMe(): Promise<Models.Auth_Login_Response['user']> {
  const res = await api.get('/users/me');
  return res.data;
}