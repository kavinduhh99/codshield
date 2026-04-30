"use client";

import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Loader2, ShieldAlert, ShieldCheck, CreditCard, RefreshCw, Bell, Clock } from "lucide-react";
import { useState } from "react";

export default function BillingPage() {
  const { data: session, status, update } = useSession();
  const [refreshing, setRefreshing] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [showModal, setShowModal] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const createdAt = session?.user?.createdAt;
  const subEnd = session?.user?.subEnd;
  const paymentStatus = session?.user?.paymentStatus;

  // Trial Logic: 30 days from createdAt
  const trialExpiry = createdAt ? new Date(createdAt).getTime() + (30 * 24 * 60 * 60 * 1000) : Date.now();
  const daysLeft = Math.max(0, Math.ceil((trialExpiry - Date.now()) / (1000 * 60 * 60 * 24)));
  const isTrialActive = daysLeft > 0;
  const isPaid = !!subEnd && new Date(subEnd) > new Date();

  let statusLabel = "Trial Expired";
  let statusColor = "text-red-500";
  let StatusIcon = ShieldAlert;

  if (isPaid) {
    statusLabel = "Active Subscription";
    statusColor = "text-green-500";
    StatusIcon = ShieldCheck;
  } else if (isTrialActive) {
    statusLabel = `Trial Active (${daysLeft} days left)`;
    statusColor = "text-blue-500";
    StatusIcon = ShieldCheck;
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await update();
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleNotify = async () => {
    setNotifying(true);
    try {
      const res = await fetch("/api/billing/notify", { method: "POST" });
      if (res.ok) {
        setShowModal(true);
        await update();
      } else {
        alert("Failed to notify admin. Please try again.");
      }
    } catch (err) {
      alert("An error occurred.");
    } finally {
      setNotifying(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-gray-50 dark:bg-slate-950 overflow-x-hidden">
      <Sidebar
        businessName={session?.user?.businessName}
        userName={session?.user?.name}
        role={session?.user?.role}
      />

      <div className="flex flex-1 flex-col pt-14 md:pt-0 md:pl-64">
        <main className="flex-1 overflow-y-auto">
          <div className="py-6 min-h-screen">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Billing & Subscription</h1>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-white dark:bg-gray-800 px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-all active:scale-95"
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
                    <StatusIcon className={`h-10 w-10 ${statusColor} mr-4`} />
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                        {statusLabel}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {isPaid
                          ? `Premium valid until: ${new Date(subEnd!).toLocaleDateString()}`
                          : isTrialActive
                            ? `Your free trial ends on: ${new Date(trialExpiry).toLocaleDateString()}`
                            : "Risk intelligence access is currently restricted."
                        }
                      </p>
                    </div>
                  </div>
                  {paymentStatus === "pending_verification" && (
                    <div className="mt-4 sm:mt-0">
                      <span className="inline-flex items-center rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-3 py-0.5 text-sm font-medium text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
                        Pending Verification
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Instructions */}
              {(!isPaid) && (
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-blue-500" />
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Upgrade to Pro (Rs. 400/month)</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                      Get unlimited access to advanced risk intelligence, automated blocking, and search trends.
                      Transfer **Rs. 400** to the bank account below.
                    </p>

                    <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 mb-6 border border-gray-200 dark:border-gray-700">
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Bank</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">Dialog Finance PLC</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Branch</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">Head office</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Name</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">BizFlow </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Number</dt>
                          <dd className="mt-1 text-sm font-semibold text-blue-600 dark:text-blue-400 font-mono tracking-wider">0010 2077 3471</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <span className="text-xs text-gray-500 dark:text-gray-400 max-w-[60%]">
                        {paymentStatus === "pending_verification"
                          ? "Verification is in progress. Our team will activate your account soon."
                          : "After transferring, click notify. Our team will verify and activate your account within 24 hours."
                        }
                      </span>
                      {paymentStatus === "none" ? (
                        <button
                          onClick={handleNotify}
                          disabled={notifying}
                          className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          {notifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bell className="mr-2 h-4 w-4" />}
                          Notify Admin
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                          <Clock className="h-4 w-4 text-amber-500 animate-spin" />
                          <span className="text-sm font-bold text-amber-500">Pending Approval</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in scale-in duration-300">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-green-500/10 rounded-full border border-green-500/20">
                <ShieldCheck className="h-10 w-10 text-green-500" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-white mb-2">Admin Notified!</h3>
            <p className="text-sm text-slate-400 text-center mb-8">
              We've received your payment notification. Our team will verify the transfer and activate your account within 24 hours.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20"
            >
              Great, thanks!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
