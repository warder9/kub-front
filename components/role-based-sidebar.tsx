"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/lib/auth";
import { getMe } from "@/src/api/auth.api";
import * as RolesAPI from "@/src/api/roles.api";
import * as UserAPI from "@/src/api/users.api";
import {
  LayoutDashboard,
  Users,
  Target,
  Handshake,
  Calendar,
  FileText,
  PenTool,
  MessageSquare,
  BarChart3,
  Bell,

  ChevronLeft,
  ChevronRight,
  Building2,
  UserCheck,
  Database,
  Shield,
  LogOut,
  Send,
  MessageCircle,
  User,
} from "lucide-react";
import type { Auth_Login_Response } from "@/src/models/Auth.model";

interface SidebarItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions: string[];
  badge?: string;
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Пользователи",
    href: "/users",
    icon: UserCheck,
    permissions: ["users:read"], // Only Management and Admin
  },
  {
    title: "Лиды",
    href: "/leads",
    icon: Target,
    permissions: ["leads:read"], // Sales, Operations, Control, Management, Admin
  },
  {
    title: "Сделки",
    href: "/deals",
    icon: Handshake,
    permissions: ["deals:read"], // Sales, Operations, Control, Management, Admin
  },
  {
    title: "Клиенты",
    href: "/clients",
    icon: Users,
    permissions: ["clients:read"], // Sales, Operations, Control, Management, Admin
  },
  {
    title: "Задачи",
    href: "/tasks",
    icon: Calendar,
    permissions: ["tasks:read"], // All roles (Sales, Operations, Control, Management, Admin)
  },
  {
    title: "Документы",
    href: "/documents",
    icon: FileText,
    permissions: ["documents:read"], // Operations, Control, Management, Admin (Sales only for preparation)
  },
  {
    title: "Чат",
    href: "/chat",
    icon: MessageSquare,
    permissions: [], // All roles (messenger access)
  },
  {
    title: "WhatsApp",
    href: "/whatsapp",
    icon: MessageCircle,
    permissions: [], // All roles (messenger access)
  },
  {
    title: "Аналитика",
    href: "/analytics",
    icon: BarChart3,
    permissions: ["analytics:read"], // Control, Management, Admin
  },
  {
    title: "Роли",
    href: "/roles",
    icon: Shield,
    permissions: ["users:write"], // Only Admin and Management
  },
  {
    title: "Telegram Бот",
    href: "/telegram",
    icon: Send,
    permissions: ["settings:write"], // Only Admin
  },
];

function getRoleFromId(roleId: number): string {
  const roleMapping: Record<number, string> = {
    40: 'management',
    30: 'admin',
    20: 'control',
    10: 'sales',     // Fixed: role_id 10 should be 'sales' to match admin panel
    5: 'user'         // Changed: role_id 5 is now 'user' since 10 is sales
  }
  return roleMapping[roleId] || 'user'
}

function getRoleDisplayName(roleKey: string): string {
  const roleDisplayNames: Record<string, string> = {
    'admin': 'Администратор',
    'management': 'Руководство',
    'operations': 'Операционный отдел',
    'control': 'Отдел контроля',
    'sales': 'Отдел продаж',
    'user': 'Пользователь'
  }
  return roleDisplayNames[roleKey] || roleKey
}

export function RoleBasedSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const [user, setUser] = useState<Auth_Login_Response['user'] | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [availableRoles, setAvailableRoles] = useState<{ id: number, name: string }[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Force fresh data by clearing any cached user data
        localStorage.removeItem('current_user');
        
        const [userData, rolesData] = await Promise.all([
          getMe(),
          RolesAPI.listRoles({ limit: 100 }).catch((err) => {
            console.error('Roles API error:', err);
            console.log('Roles API response:', err.response);
            return { data: [] };
          })
        ]);
        
        console.log('User data from API:', userData);
        console.log('Roles data from API:', rolesData);
        
        setUser(userData);
        
        // Use the exact same logic as users page
        const roles = Array.isArray(rolesData) ? rolesData : rolesData.data || [];
        console.log('Processed roles:', roles);
        setAvailableRoles(roles);
        
        if (userData) {
          console.log('=== ROLE DEBUG ===');
          console.log('Raw userData:', userData);
          console.log('User role_id (type):', userData.role_id, typeof userData.role_id);
          console.log('Available roles from API:', roles);
          console.log('Role IDs in available roles:', roles.map(r => ({ id: r.id, name: r.name })));
          
          const role = roles.find(r => r.id === userData.role_id);
          console.log('Found role in API roles:', role);
          
          // Show what admin panel would display
          const adminPanelRoleName = role ? role.name : "Неизвестная роль";
          console.log('Admin panel would show:', adminPanelRoleName);
          
          // Use API role name to match admin panel, fallback to hardcoded mapping
          const roleKey = role ? role.name.toLowerCase().replace(' ', '_') : getRoleFromId(userData.role_id);
          setUserRole(roleKey);
          console.log('Using role key:', roleKey);
          console.log('Display name will be:', adminPanelRoleName || getRoleDisplayName(roleKey));
          
          // Test all possible mappings
          console.log('Testing all role mappings:');
          console.log('5 ->', getRoleFromId(5), '->', getRoleDisplayName(getRoleFromId(5)));
          console.log('10 ->', getRoleFromId(10), '->', getRoleDisplayName(getRoleFromId(10)));
          console.log('20 ->', getRoleFromId(20), '->', getRoleDisplayName(getRoleFromId(20)));
          console.log('30 ->', getRoleFromId(30), '->', getRoleDisplayName(getRoleFromId(30)));
          console.log('40 ->', getRoleFromId(40), '->', getRoleDisplayName(getRoleFromId(40)));
          console.log('=== END ROLE DEBUG ===');
        }
      } catch (error) {
        console.error("Failed to fetch user data", error);
      }
    };

    fetchUserData();
  }, []);

  if (!user) return null;

  // Get role key for permissions (fallback to hardcoded mapping for permissions)
  const userRoleKey = getRoleFromId(user.role_id);
  
  // Get display name from API to match admin panel, fallback to hardcoded mapping
  const apiRoleName = availableRoles.find(r => r.id === user.role_id)?.name;
  const displayRole = apiRoleName || getRoleDisplayName(userRoleKey);
  
  console.log('Final role display:', {
    roleId: user.role_id,
    apiRoleName,
    fallbackName: getRoleDisplayName(userRoleKey),
    finalDisplay: displayRole
  });
  const filteredItems = sidebarItems.filter(
    (item) =>
      item.permissions.length === 0 ||
      hasPermission(userRoleKey, item.permissions)
  );

  const handleLogout = () => {
    try {
      window.localStorage.removeItem("auth_token");
      window.localStorage.removeItem("refresh_token");
      window.localStorage.removeItem("current_user");
      window.localStorage.removeItem("current_company");
    } catch (e) { }
    window.location.href = "/auth/login";
  };

  return (
    <div
      className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col h-screen sticky top-0 z-30",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">CRM</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-xl hover:bg-gray-100"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user.company_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-gray-900 truncate">
                {user?.company_name}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {user?.email}
              </p>
              <p className="text-sm font-bold text-primary truncate">
                {displayRole}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1 space-x-3 px-3  py-3 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-300", isCollapsed && "justify-center"
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive ? "text-white" : "text-gray-500"
                )}
              />
              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.title}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "text-xs rounded-full px-2 py-0.5",
                        isActive
                          ? "bg-white text-gray-600"
                          : "bg-gray-500 text-white"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed ? (
          <div className="space-y-2">
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Выйти</span>
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
            title="Выйти"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
