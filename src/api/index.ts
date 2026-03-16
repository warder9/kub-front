import axios from "axios"

// Используем прокси маршрут для обхода CORS
const isBrowser = typeof window !== 'undefined'

/** Force https:// protocol on any URL */
function enforceHttpsUrl(url: string): string {
  return url.replace(/^http:\/\//i, 'https://')
}

let baseURL: string

if (isBrowser) {
  // В браузере используем относительный путь через прокси
  baseURL = '/api-proxy'
} else {
  // На сервере используем прямой URL (всегда HTTPS)
  baseURL = enforceHttpsUrl(process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.kubcrm.kz")
}

console.log('API Base URL:', baseURL)

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // Увеличиваем таймаут
})

// Остальной код остается без изменений...
// Simple cookie helpers (client-side only)
function setCookie(name: string, value: string, days = 7) {
  try {
    if (typeof window === 'undefined') return
    const expires = new Date(Date.now() + days * 864e5).toUTCString()
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; samesite=lax`
  } catch (e) {
    console.error('Error setting cookie:', e)
  }
}

function getCookie(name: string) {
  try {
    if (typeof window === 'undefined') return null
    const match = document.cookie.split('; ').find((row) => row.startsWith(name + '='))
    return match ? decodeURIComponent(match.split('=')[1]) : null
  } catch (e) {
    console.error('Error getting cookie:', e)
    return null
  }
}

function deleteCookie(name: string) {
  try {
    if (typeof window === 'undefined') return
    document.cookie = `${name}=; Max-Age=0; path=/; samesite=lax`
  } catch (e) {
    console.error('Error deleting cookie:', e)
  }
}

// Attach token to axios and store in cookie (client side)
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`
    try {
      setCookie("auth_token", token, 7)
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', token)
      }
    } catch (e) {
      console.error('Error setting auth token:', e)
    }
  } else {
    delete api.defaults.headers.common["Authorization"]
    try {
      deleteCookie("auth_token")
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
      }
    } catch (e) {
      console.error('Error removing auth token:', e)
    }
  }
}

export function setRefreshToken(token: string | null) {
  try {
    if (token) {
      setCookie('refresh_token', token, 30)
      if (typeof window !== 'undefined') {
        localStorage.setItem('refresh_token', token)
      }
    } else {
      deleteCookie('refresh_token')
      if (typeof window !== 'undefined') {
        localStorage.removeItem('refresh_token')
      }
    }
  } catch (e) {
    console.error('Error setting refresh token:', e)
  }
}

// Получение токена из разных источников
function getAuthToken(): string | null {
  try {
    // Сначала проверяем куки
    if (typeof window !== 'undefined') {
      const cookieToken = getCookie("auth_token")
      if (cookieToken) return cookieToken

      // Затем localStorage
      const localStorageToken = localStorage.getItem('auth_token')
      if (localStorageToken) return localStorageToken
    }

    return null
  } catch (e) {
    console.error('Error getting auth token:', e)
    return null
  }
}

// Request interceptor to ensure token present (reads from multiple sources)
api.interceptors.request.use((config) => {
  // Добавляем логирование для отладки
  console.log('Making request to:', config.url)

  if (typeof window !== "undefined") {
    const token = getAuthToken()
    if (token) {
      // Use .set() method to properly set headers
      if (config.headers) {
        config.headers.set('Authorization', `Bearer ${token}`)
      }
      console.log('Added auth token to request')
    }
  }
  return config
}, (error) => {
  console.error('Request error:', error)
  return Promise.reject(error)
})

import { clearAuthData } from "@/lib/auth";

// Response interceptor: attempt refresh on 401, otherwise normalize error
api.interceptors.response.use(
  (res) => {
    console.log('Response received:', res.status, res.config.url)
    return res
  },
  async (error) => {
    console.error('API Error:', error);
    console.error('API Error Details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      code: error.code
    })

    const status = error?.response?.status;
    const originalRequest = error?.config;

    // Handle 401 Unauthorized errors
    if (status === 401 && originalRequest && !originalRequest._retry) {
      // Prevent recursive refresh if the refresh call itself fails
      if (originalRequest.url === '/auth/refresh') {
        if (typeof window !== 'undefined') {
          console.log("Logging out due to failed refresh token...");
          clearAuthData();
          deleteCookie('auth_token');
          deleteCookie('refresh_token');
          window.location.href = '/auth/login';
          return new Promise(() => { }); // Prevent further actions
        }
        return Promise.reject(error);
      }

      console.log('Attempting token refresh...');
      originalRequest._retry = true;
      try {
        const refreshToken = getCookie('refresh_token') || (typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null);
        if (refreshToken) {
          const resp = await api.post('/auth/refresh', { refresh_token: refreshToken });
          const newAccess = resp?.data?.access_token || resp?.data?.tokens?.access_token;
          const newRefresh = resp?.data?.refresh_token || resp?.data?.tokens?.refresh_token;

          if (newAccess) setAuthToken(newAccess);
          if (newRefresh) setRefreshToken(newRefresh);

          originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
          console.log('Token refreshed, retrying original request');
          return api(originalRequest);
        }
      } catch (e) {
        console.error('Ошибка при обновлении токена:', e);
        // If refresh fails, proceed to logout
      }

      // If refresh token is invalid or missing, or if refresh fails, logout user
      if (typeof window !== 'undefined') {
        console.log("Logging out due to invalid token...");
        clearAuthData();
        deleteCookie('auth_token');
        deleteCookie('refresh_token');
        window.location.href = '/auth/login';
        // Return a promise that never resolves to prevent further actions
        return new Promise(() => { });
      }
    }

    // Handle other errors
    const message = error?.response?.data?.message ||
      error?.response?.data?.error ||
      error.message ||
      `Server error: ${status || 'Unknown'}`;

    console.error('Error message:', message);
    return Promise.reject(new Error(message));
  }
)

export default api