"use client";

import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Loader2, ShieldAlert, ShieldCheck, CreditCard, RefreshCw, Bell } from "lucide-react";
import { useState } from "react";

export default function BillingPage() {
  const { data: session, status, update } = useSession();
  const [refreshing, setRefreshing] = useState(false);
  const [notifying, setNotifying] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const subEnd = (session?.user as any)?.subEnd;
  const isExpired = subEnd ? new Date(subEnd) < new Date() : true;

  const handleRefresh = async () => {
    setRefreshing(true);
    await update(); // trigger JWT DB refresh mechanism built into nextauth/route.ts
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleNotify = () => {
    setNotifying(true);
    // Simulate API call to notify admin via native DOM alert
    setTimeout(() => {
      alert("Admin has been notified. Please Refresh Status in 5 minutes to verify activation.");
      setNotifying(false);
    }, 1000);
  };

  return (
    <div className="flex min-h-screen w-full bg-gray-50 dark:bg-gray-900">
      <Sidebar
        businessName={(session?.user as any)?.businessName}
        userName={session?.user?.name}
        role={(session?.user as any)?.role}
      />

      <div className="flex flex-1 flex-col pt-14 md:pt-0 md:pl-64">
        <main className="flex-1 overflow-y-auto">
          <div className="py-6 min-h-screen">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Billing Details</h1>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh Status
              </button>
            </div>

            <div className="mx-auto max-w-3xl px-4 sm:px-6 md:px-8 mt-8 space-y-6">

              {/* Account Status Card */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <div className="px-4 py-5 sm:p-6 flex items-start sm:items-center flex-col sm:flex-row justify-between">
                  <div className="flex items-center">
                    {isExpired ? (
                      <ShieldAlert className="h-10 w-10 text-red-500 mr-4" />
                    ) : (
                      <ShieldCheck className="h-10 w-10 text-green-500 mr-4" />
                    )}
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                        Subscription Status: {isExpired ? "Expired" : "Active"}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {subEnd ? `Valid until: ${new Date(subEnd).toLocaleDateString()}` : "No active subscription bounds found."}
                      </p>
                    </div>
                  </div>
                  {isExpired && (
                    <div className="mt-4 sm:mt-0">
                      <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-0.5 text-sm font-medium text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                        Payment Required
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-blue-500" />
                  <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Manual Payment Instructions</h3>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                    Your business operations are restricted when subscriptions dry up.
                    Please perform a manual bank transfer to the details below to resume your COD Analytics access.
                  </p>

                  <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 mb-6 border border-gray-200 dark:border-gray-700">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Bank</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">Commercial Bank</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Branch</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">Colombo 03</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Name</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">CODShield Private Limited</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Number</dt>
                        <dd className="mt-1 text-sm font-semibold text-blue-600 dark:text-blue-400 font-mono tracking-wider">1234 5678 9101</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400 max-w-[60%]">
                      Transfer completed? Ping our administrative team to activate your module.
                    </span>
                    <button
                      onClick={handleNotify}
                      disabled={notifying}
                      className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {notifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
                      Notify Admin
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
