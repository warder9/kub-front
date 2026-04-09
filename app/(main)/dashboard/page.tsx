"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    
    // Redirect based on role
    if (user?.role === 'system_admin') {
      router.push("/users");
    } else {
      router.push("/leads");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Перенаправление...</p>
      </div>
    </div>
  );
}
