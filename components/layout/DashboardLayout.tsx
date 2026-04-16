"use client";

import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-50 dark:bg-gray-900">
      <Sidebar
        businessName={(session?.user as any)?.businessName}
        userName={session?.user?.name}
        role={(session?.user as any)?.role}
      />

      {/*
        On mobile: pt-14 to clear the fixed 56px mobile header.
        On desktop: pl-64 to clear the 256px fixed sidebar panel.
      */}
      <div className="flex flex-1 flex-col pt-14 md:pt-0 md:pl-64">
        {children}
      </div>
    </div>
  );
}
