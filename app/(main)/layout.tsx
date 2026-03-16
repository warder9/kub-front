"use client";

import { RoleBasedSidebar } from "@/components/role-based-sidebar";
import { MobileHeader } from "@/components/mobile-header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full">
      <RoleBasedSidebar />
      <div className="flex flex-col flex-1">
        {/* <MobileHeader title="Dashboard" /> */}
        <main className="flex-1 overflow-y-auto bg-gray-100">
          <div className="">{children}</div>
        </main>
      </div>
    </div>
  );
}
