"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Loader2, ShieldAlert, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isSuspended = session?.user?.status === "suspended";
  const isExpiredTrial = 
    session?.user?.plan === "Free Trial" && 
    session?.user?.subEnd && 
    new Date(session.user.subEnd) < new Date();

  // Allow access to billing and settings (maybe) even if expired? 
  // User says "block seller dashboard. Redirect to billing/upgrade page".
  // So we allow /dashboard/billing.
  const isAllowedPath = pathname === "/dashboard/billing";

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if ((isSuspended || isExpiredTrial) && !isAllowedPath) {
    return (
      <div className="flex min-h-screen w-full bg-gray-950 items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="h-20 w-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="h-10 w-10 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase italic">Access Restricted</h2>
            <p className="mt-2 text-sm text-gray-400 font-medium">
              {isSuspended 
                ? "Your business account has been suspended by the platform administrator. Please contact support for more information." 
                : "Your 14-day free trial has expired. To continue managing your business on BizFlow, please upgrade your subscription."}
            </p>
          </div>
          <div className="pt-4">
            {isExpiredTrial && (
              <Link
                href="/dashboard/billing"
                className="inline-flex w-full justify-center items-center gap-2 py-4 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all active:scale-95"
              >
                Upgrade Plan <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <button
              onClick={() => window.location.href = "/login"}
              className={`mt-3 inline-flex w-full justify-center items-center gap-2 py-4 rounded-2xl border border-gray-800 text-gray-400 font-black uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95`}
            >
              Back to Security Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
