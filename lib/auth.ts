import { User } from '@/src/models/User.model'
import { Client } from '@/src/models/Client.model'

// Функции для работы с пользователем
export function setCurrentUser(user: User): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('current_user', JSON.stringify(user))
    }
  } catch (e) {
    console.error('Ошибка при сохранении пользователя:', e)
  }
}

export function getCurrentUser(): User | null {
  try {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('current_user')
      return data ? JSON.parse(data) : null
    }
  } catch (e) {
    console.error('Ошибка при получении пользователя:', e)
  }
  return null
}

// Функции для работы с компанией
export function setCurrentCompany(company: Client): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('current_company', JSON.stringify(company))
    }
  } catch (e) {
    console.error('Ошибка при сохранении компании:', e)
  }
}

export function getCurrentCompany(): Client | null {
  try {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('current_company')
      return data ? JSON.parse(data) : null
    }
  } catch (e) {
    console.error('Ошибка при получении компании:', e)
  }
  return null
}

// Очистка всех данных авторизации
export function clearAuthData(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('current_user')
      localStorage.removeItem('current_company')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
    }
  } catch (e) {
    console.error('Ошибка при очистке данных авторизации:', e)
  }
}

// Функция для проверки прав доступа
export function hasPermission(userRole: string | undefined, requiredPermissions: string[]): boolean {
  // Если пользователь не авторизован или нет роли
  if (!userRole) {
    return false;
  }

  // Если нет требуемых разрешений, разрешаем доступ
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true;
  }

  // Маппинг ролей к разрешениям
  const rolePermissions: Record<string, string[]> = {
    admin: [
      'users:read',
      'users:write',
      'leads:read',
      'leads:write',
      'deals:read',
      'deals:write',
      'clients:read',
      'clients:write',
      'tasks:read',
      'tasks:write',
      'documents:read',
      'documents:write',
      'analytics:read',
      'analytics:write',
      'settings:read',
      'settings:write',
    ],
    management: [
      'users:read',
      'leads:read',
      'leads:write',
      'deals:read',
      'deals:write',
      'clients:read',
      'clients:write',
      'tasks:read',
      'tasks:write',
      'documents:read',
      'documents:write',
      'analytics:read',
      'analytics:write',
    ],
    control: [
      'leads:read',
      'deals:read',
      'clients:read',
      'tasks:read',
      'documents:read',
      'analytics:read',
    ],
    operations: [
      'leads:read',
      'deals:read',
      'clients:read',
      'clients:write',
      'tasks:read',
      'tasks:write',
      'documents:read',
      'documents:write',
    ],
    sales: [
      'leads:read',
      'leads:write',
      'deals:read',
      'deals:write',
      'clients:read',
      'clients:write',
      'tasks:read',
      'tasks:write',
    ],
  };

  // Получаем разрешения для роли пользователя
  const userPermissions = rolePermissions[userRole] || [];

  // Проверяем, есть ли у пользователя все требуемые разрешения
  return requiredPermissions.every(permission => 
    userPermissions.includes(permission)
  );
}

// Функция для проверки роли
export function hasRole(userRole: string | undefined, requiredRoles: string[]): boolean {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
}

// Функция для получения роли пользователя в текстовом формате
export function getUserRoleText(role: string | undefined): string {
  const roleMap: Record<string, string> = {
    admin: 'Администратор',
    management: 'Руководство',
    control: 'Контроль',
    operations: 'Операционный отдел',
    sales: 'Отдел продаж',
  };
  
  return roleMap[role || ''] || role || 'Пользователь';
}

// Функция для проверки авторизации пользователя
export function isAuthenticated(): boolean {
  try {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      const user = getCurrentUser();
      return !!(token && user);
    }
    return false;
  } catch (e) {
    console.error('Ошибка при проверке авторизации:', e);
    return false;
  }
}

// Functions for testing roles (dev only)
export function switchTestRole(role: User['role']): void {
  const currentUser = getCurrentUser();
  if (currentUser && typeof window !== 'undefined') {
    // Store original role if not already stored
    if (!localStorage.getItem('original_user_role')) {
      localStorage.setItem('original_user_role', currentUser.role);
    }
    
    const updatedUser = { ...currentUser, role };
    setCurrentUser(updatedUser);
    window.location.reload();
  }
}

export function resetTestRole(): void {
  if (typeof window !== 'undefined') {
    const originalRole = localStorage.getItem('original_user_role');
    const currentUser = getCurrentUser();
    
    if (currentUser && originalRole) {
      const updatedUser = { ...currentUser, role: originalRole as User['role'] };
      setCurrentUser(updatedUser);
      localStorage.removeItem('original_user_role');
      window.location.reload();
    } else if (currentUser) {
      // Fallback if original role not found, reset to admin or a default
      const updatedUser = { ...currentUser, role: 'admin' as User['role'] };
      setCurrentUser(updatedUser);
      window.location.reload();
    }
  }
}
