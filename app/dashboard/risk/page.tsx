"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ShieldAlert, Phone, Loader2, Info, CheckCircle2, XCircle } from "lucide-react";

export default function RiskCheckerPage() {
  const { data: session, status } = useSession();
  const [phone, setPhone] = useState("");
  const [riskData, setRiskData] = useState<{ score: number; failedOrders: number; successOrders: number } | null>(null);
  const [checkingRisk, setCheckingRisk] = useState(false);

  useEffect(() => {
    const checkRisk = async (phoneStr: string) => {
      if (phoneStr.length < 8) {
        setRiskData(null);
        return;
      }

      setCheckingRisk(true);
      try {
        const res = await fetch("/api/order/check-risk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneStr }),
        });
        
        if (res.ok) {
          const data = await res.json();
          setRiskData({
            score: data.riskScore ?? 0,
            failedOrders: data.failedOrders ?? 0,
            successOrders: data.successOrders ?? 0,
          });
        }
      } catch (err) {
        console.error("Risk check failed:", err);
      } finally {
        setCheckingRisk(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (phone) {
        checkRisk(phone);
      } else {
        setRiskData(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [phone]);

  const renderRiskDisplay = () => {
    if (checkingRisk) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500 dark:text-gray-400">
                <Loader2 className="h-10 w-10 animate-spin mb-4" />
                <p className="text-lg font-medium">Analyzing Risk Profile...</p>
            </div>
        );
    }

    if (!phone || phone.length < 8) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400 dark:text-gray-500">
                <ShieldAlert className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-lg">Enter a valid phone number to see the risk analysis</p>
            </div>
        );
    }

    if (riskData === null) return null;

    // Reusable stats row shown on all risk levels for balanced context
    const StatsRow = () => (
        <div className="flex gap-4 mt-6 w-full max-w-sm">
            <div className="flex-1 flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Delivered</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">{riskData.successOrders}</p>
                </div>
            </div>
            <div className="flex-1 flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Returned</p>
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">{riskData.failedOrders}</p>
                </div>
            </div>
        </div>
    );

    if (riskData.score >= 100) {
        return (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 w-full">
                <div className="p-4 bg-red-100 dark:bg-red-900/50 rounded-full mb-6">
                   <ShieldAlert className="h-16 w-16 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-3xl font-bold text-red-800 dark:text-red-300 mb-2">High Risk Detected</h2>
                <div className="flex items-center space-x-2 text-red-700 dark:text-red-400 font-medium">
                    <Info className="h-5 w-5" />
                    <p>Warning Level: {riskData.score}</p>
                </div>
                <StatsRow />
            </div>
        );
    }

    if (riskData.score >= 50) {
        return (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/50 w-full">
                <div className="p-4 bg-orange-100 dark:bg-orange-900/50 rounded-full mb-6">
                   <ShieldAlert className="h-16 w-16 text-orange-600 dark:text-orange-400" />
                </div>
                <h2 className="text-3xl font-bold text-orange-800 dark:text-orange-300 mb-2">Elevated Risk</h2>
                <div className="flex items-center space-x-2 text-orange-700 dark:text-orange-400 font-medium">
                    <Info className="h-5 w-5" />
                    <p>Warning Level: {riskData.score}</p>
                </div>
                <StatsRow />
            </div>
        );
    }

    if (riskData.score >= 25) {
        return (
            <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-900/50 w-full">
                <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-full mb-6">
                   <ShieldAlert className="h-16 w-16 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h2 className="text-3xl font-bold text-yellow-800 dark:text-yellow-300 mb-2">Moderate Risk</h2>
                <div className="flex items-center space-x-2 text-yellow-700 dark:text-yellow-400 font-medium">
                    <Info className="h-5 w-5" />
                    <p>Warning Level: {riskData.score}</p>
                </div>
                <StatsRow />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50 w-full">
            <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-full mb-6">
               <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-3xl font-bold text-green-800 dark:text-green-300 mb-2">Safe Intelligence Record</h2>
            <div className="flex items-center space-x-2 text-green-700 dark:text-green-400 font-medium">
                <Info className="h-5 w-5" />
                <p>Status: Clear (Score: {riskData.score})</p>
            </div>
            <StatsRow />
        </div>
    );
  };

  if (status === "loading") {
    return <div className="p-10 flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900"><Loader2 className="h-8 w-8 animate-spin text-blue-500"/></div>;
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-50 dark:bg-gray-900">
      <Sidebar
        businessName={(session?.user as any)?.businessName}
        userName={session?.user?.name}
        role={(session?.user as any)?.role}
      />

      <div className="flex flex-1 flex-col pt-14 md:pt-0 md:pl-64">
        <main className="flex-1 overflow-y-auto">
          <div className="py-6 min-h-screen space-y-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Risk Checker</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Instantly scan a phone number against CODShield's intelligence network to prevent losses.
              </p>
            </div>

            <div className="mx-auto max-w-3xl px-4 sm:px-6 md:px-8 space-y-8">
               <div className="bg-white dark:bg-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-black/20 sm:rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="p-6 sm:p-8 space-y-8">
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Customer Phone Number
                        </label>
                        <div className="relative rounded-xl shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <Phone className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </div>
                          <input
                            type="tel"
                            name="phone"
                            id="phone"
                            className="block w-full rounded-xl border-gray-300 dark:border-gray-600 pl-12 focus:border-blue-500 focus:ring-blue-500 sm:text-lg py-4 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-shadow"
                            placeholder="e.g. 077 123 4567"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="mt-8 transition-all duration-300 flex justify-center">
                          {renderRiskDisplay()}
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
