"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/lib/auth";
import { getMe } from "@/src/api/auth.api";
import * as RolesAPI from "@/src/api/roles.api";
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
    permissions: ["users:read"],
  },
  {
    title: "Лиды",
    href: "/leads",
    icon: Target,
    permissions: ["leads:read"],
  },
  {
    title: "Сделки",
    href: "/deals",
    icon: Handshake,
    permissions: ["deals:read"],
  },
  {
    title: "Клиенты",
    href: "/clients",
    icon: Users,
    permissions: ["leads:read"],
  },
  {
    title: "Задачи",
    href: "/tasks",
    icon: Calendar,
    permissions: ["tasks:read"],
  },
  {
    title: "Документы",
    href: "/documents",
    icon: FileText,
    permissions: ["documents:read"],
  },
  {
    title: "Чат",
    href: "/chat",
    icon: MessageSquare,
    permissions: [],
  },

  {
    title: "Роли",
    href: "/roles",
    icon: Shield,
    permissions: [],
  },
  {
    title: "Telegram Бот",
    href: "/telegram",
    icon: Send,
    permissions: [],
  },

];

function getRoleFromId(roleId: number): string {
  const roleMapping: Record<number, string> = {
    40: 'management',
    30: 'admin',
    20: 'operations',  // Changed from 'control' to 'operations'
    10: 'control',    // Changed from 'operations' to 'control'
    5: 'sales'
  }
  return roleMapping[roleId] || 'user'
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
          console.log('User role_id:', userData.role_id);
          console.log('Available roles:', roles);
          console.log('Role IDs in available roles:', roles.map(r => ({ id: r.id, name: r.name })));
          
          const role = roles.find(r => r.id === userData.role_id);
          console.log('Found role:', role);
          
          if (role) {
            setUserRole(role.name);
            console.log('Set user role to:', role.name);
          } else {
            // Fallback to hardcoded mapping if role not found in API
            const fallbackRole = getRoleFromId(userData.role_id);
            setUserRole(fallbackRole);
            console.log('Role not found in API. Fallback role set to:', fallbackRole);
            console.log('Looking for role_id:', userData.role_id, 'in available role IDs:', roles.map(r => r.id));
          }
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
                {userRole}
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
