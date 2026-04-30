"use client";

import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Loader2, ShieldAlert, ShieldCheck, CreditCard, RefreshCw, Bell, Clock, Info, Calendar, Hash, MessageSquare, ChevronRight, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function BillingPage() {
  const { data: session, status, update } = useSession();
  const [refreshing, setRefreshing] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [adminSettings, setAdminSettings] = useState<any>(null);
  const [formData, setFormData] = useState({
    amount: 500,
    paymentMethod: "Bank Transfer",
    paidDate: new Date().toISOString().split('T')[0],
    referenceNumber: "",
    notes: "",
    subscriptionMonths: 1
  });

  useEffect(() => {
    fetch("/api/billing/settings")
      .then(res => res.json())
      .then(data => setAdminSettings(data.paymentInstructions))
      .catch(console.error);
  }, []);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const subEnd = session?.user?.subEnd;
  const currentPlan = session?.user?.plan || "Free Trial";
  const accountStatus = session?.user?.status || "active";

  const expiryDate = subEnd ? new Date(subEnd) : null;
  const isExpired = expiryDate ? expiryDate < new Date() : false;
  const daysLeft = expiryDate ? Math.max(0, Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
  
  const isPaid = currentPlan === "Pro" && !isExpired;
  const isTrialActive = currentPlan === "Free Trial" && !isExpired;

  let statusLabel = "Subscription Expired";
  let statusColor = "text-red-500";
  let StatusIcon = ShieldAlert;

  if (accountStatus === "suspended") {
    statusLabel = "Account Suspended";
    statusColor = "text-red-600";
    StatusIcon = ShieldAlert;
  } else if (isPaid) {
    statusLabel = `Pro Plan Active`;
    statusColor = "text-green-500";
    StatusIcon = ShieldCheck;
  } else if (isTrialActive) {
    statusLabel = `Free Trial (${daysLeft} days left)`;
    statusColor = "text-blue-500";
    StatusIcon = ShieldCheck;
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await update();
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotifying(true);
    try {
      const res = await fetch("/api/payments/notify", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(true);
        await update();
      } else {
        const errorData = await res.json();
        alert(errorData.message || "Failed to notify admin. Please try again.");
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
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
              <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tight">Billing & License</h1>
                <p className="text-sm text-gray-500 font-medium">Manage your BizFlow subscription and platform access.</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-white dark:bg-gray-900 px-6 py-3 text-sm font-black text-gray-700 dark:text-gray-200 shadow-xl border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-all active:scale-95 uppercase tracking-widest"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Sync Status
              </button>
            </div>

            <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8 mt-10 space-y-12">

              {/* Account Status Card */}
              <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-800">
                <div className="px-8 py-8 flex items-start sm:items-center flex-col sm:flex-row justify-between gap-6">
                  <div className="flex items-center">
                    <div className={`p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 mr-6`}>
                      <StatusIcon className={`h-10 w-10 ${statusColor}`} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tight">
                        {statusLabel}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-md">
                        {accountStatus === "suspended"
                          ? "Your BizFlow account is suspended. Please follow the instructions below to reactivate your access."
                          : expiryDate 
                            ? `${currentPlan} license is ${isExpired ? 'expired' : 'active'} until ${expiryDate.toLocaleDateString()}.`
                            : "No active platform license found."
                        }
                      </p>
                    </div>
                  </div>
                  {(isExpired || accountStatus === "suspended") && (
                    <div className="px-6 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-black text-red-500 uppercase tracking-widest">Restricted Access</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Plans & Payment Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Pro Plan Details */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <ShieldCheck className="w-24 h-24" />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] mb-4 opacity-80">Premium Access</h4>
                    <div className="mb-8">
                      <div className="text-5xl font-black italic">Rs 500</div>
                      <div className="text-sm font-bold opacity-80 mt-1">per user / month</div>
                    </div>
                    <ul className="space-y-4 mb-8">
                      {[
                        "Unlimited Orders",
                        "COD Risk Intelligence",
                        "Stock & Inventory",
                        "Finance Analytics",
                        "Receivables Tracking",
                        "Invoices & Waybills"
                      ].map((f) => (
                        <li key={f} className="flex items-center text-sm font-bold">
                          <CheckCircle className="w-4 h-4 mr-3 text-indigo-300" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Payment Instructions Card */}
                  <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 border border-gray-200 dark:border-gray-800 shadow-xl">
                    <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Payment Instructions
                    </h4>
                    
                    {adminSettings ? (
                      <div className="space-y-6">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bank / Provider</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{adminSettings.bankName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Account Holder</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{adminSettings.accountName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Account Number</p>
                          <p className="text-lg font-black text-indigo-500 font-mono tracking-tighter">{adminSettings.accountNumber}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Branch</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{adminSettings.branch}</p>
                        </div>
                        {adminSettings.paymentPhone && (
                          <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Support Contact</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{adminSettings.paymentPhone}</p>
                          </div>
                        )}
                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 italic text-[11px] text-gray-500">
                          {adminSettings.paymentNote}
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-sm text-gray-500 italic">
                        Contact admin for payment details.
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Notification Form */}
                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
                      <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase italic tracking-tight">Submit Payment Notification</h3>
                    </div>
                    <form onSubmit={handleNotify} className="p-8 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Amount Paid (Rs)</label>
                          <div className="relative">
                            <CreditCard className="absolute left-4 top-3 h-4 w-4 text-gray-400" />
                            <input
                              type="number"
                              required
                              className="block w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-sm rounded-xl p-3 pl-11 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                              value={formData.amount}
                              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Payment Method</label>
                          <select
                            className="block w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-sm rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            value={formData.paymentMethod}
                            onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                          >
                            <option>Bank Transfer</option>
                            <option>Cash Deposit</option>
                            <option>Card</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Paid Date</label>
                          <div className="relative">
                            <Calendar className="absolute left-4 top-3 h-4 w-4 text-gray-400" />
                            <input
                              type="date"
                              required
                              className="block w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-sm rounded-xl p-3 pl-11 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                              value={formData.paidDate}
                              onChange={(e) => setFormData({ ...formData, paidDate: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Reference Number</label>
                          <div className="relative">
                            <Hash className="absolute left-4 top-3 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              required
                              placeholder="TXN ID / Slip No"
                              className="block w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-sm rounded-xl p-3 pl-11 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                              value={formData.referenceNumber}
                              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Subscription Months</label>
                        <div className="grid grid-cols-3 gap-4">
                          {[1, 3, 6].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setFormData({ ...formData, subscriptionMonths: m, amount: m * 500 })}
                              className={`py-3 rounded-xl text-sm font-bold border transition-all ${
                                formData.subscriptionMonths === m 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                                : 'bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {m} {m === 1 ? 'Month' : 'Months'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Additional Notes</label>
                        <div className="relative">
                          <MessageSquare className="absolute left-4 top-3 h-4 w-4 text-gray-400" />
                          <textarea
                            rows={3}
                            className="block w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-sm rounded-xl p-3 pl-11 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="Optional message for admin..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                        <div className="hidden md:flex items-center gap-3 text-gray-500">
                          <div className="p-2 bg-blue-500/10 rounded-full">
                            <Bell className="w-4 h-4 text-blue-500" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-tight">Admin will be notified instantly</span>
                        </div>
                        <button
                          type="submit"
                          disabled={notifying}
                          className="w-full md:w-auto inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-10 py-4 text-sm font-black text-white shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-widest"
                        >
                          {notifying ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              Submit Notification
                              <ChevronRight className="ml-2 h-5 w-5" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </main>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gray-900 border border-gray-800 rounded-[2rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in duration-300 text-center">
            <div className="flex justify-center mb-8">
              <div className="p-5 bg-green-500/10 rounded-full border border-green-500/20">
                <ShieldCheck className="h-12 w-12 text-green-500" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tight">Notification Sent!</h3>
            <p className="text-sm text-gray-400 mb-10 leading-relaxed font-medium">
              We've received your payment notification. Our team will verify the reference **{formData.referenceNumber}** and activate your Pro license within 24 hours.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl shadow-indigo-500/20 active:scale-95"
            >
              Acknowledged
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

