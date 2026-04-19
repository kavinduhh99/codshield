"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

type ReturnReason = "Customer Refused" | "Courier Issue" | "Other";

export function OrderActions({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState<ReturnReason>("Customer Refused");

  if (currentStatus !== "pending") return null;

  const handleDelivered = async () => {
    setLoading("delivered");
    try {
      const res = await fetch(`/api/order/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "delivered" }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleReturnConfirm = async () => {
    setShowReturnModal(false);
    setLoading("returned");
    try {
      const res = await fetch(`/api/order/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "returned", returnReason }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      {/* Action Buttons */}
      <div className="flex space-x-2 mt-3 sm:mt-0 justify-end w-full sm:w-auto">
        <button
          onClick={handleDelivered}
          disabled={loading !== null}
          className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-900/30 px-2.5 py-1.5 text-xs font-semibold text-green-700 dark:text-green-400 shadow-sm hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors disabled:opacity-50"
        >
          {loading === "delivered" ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <CheckCircle className="mr-1 h-3 w-3" />
          )}
          Delivered
        </button>
        <button
          onClick={() => setShowReturnModal(true)}
          disabled={loading !== null}
          className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-900/30 px-2.5 py-1.5 text-xs font-semibold text-red-700 dark:text-red-400 shadow-sm hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
        >
          {loading === "returned" ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <XCircle className="mr-1 h-3 w-3" />
          )}
          Returned
        </button>
      </div>

      {/* Return Reason Modal */}
      {showReturnModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowReturnModal(false); }}
        >
          <div className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-700/80 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-2.5 rounded-xl bg-red-900/40 border border-red-800/50">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white leading-snug">
                  Mark Order as Returned
                </h3>
                <p className="mt-1 text-sm text-gray-400 leading-relaxed">
                  This action updates CODShield's risk intelligence database. The reason you select directly affects how the customer's risk score is calculated.
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-700/60" />

            {/* Reason Dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Return Reason <span className="text-red-400">*</span>
              </label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value as ReturnReason)}
                className="w-full rounded-xl bg-gray-800 border border-gray-600 text-white text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500/70 focus:border-red-500 transition-all cursor-pointer"
              >
                <option value="Customer Refused">Customer Refused</option>
                <option value="Courier Issue">Courier Issue</option>
                <option value="Other">Other</option>
              </select>

              {/* Contextual hint */}
              <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 bg-gray-800/60 border border-gray-700/50">
                {returnReason === "Customer Refused" && (
                  <>
                    <span className="text-red-400 text-base leading-none mt-0.5">⚠</span>
                    <p className="text-xs text-gray-400">
                      <span className="text-red-400 font-medium">High impact.</span> Deliberate refusals carry a{" "}
                      <span className="text-white font-medium">1.5× penalty</span> on the risk score.
                    </p>
                  </>
                )}
                {returnReason === "Courier Issue" && (
                  <>
                    <span className="text-green-400 text-base leading-none mt-0.5">✓</span>
                    <p className="text-xs text-gray-400">
                      <span className="text-green-400 font-medium">Safe.</span> Courier-related returns are{" "}
                      <span className="text-white font-medium">excluded entirely</span> from the customer's risk score.
                    </p>
                  </>
                )}
                {returnReason === "Other" && (
                  <>
                    <span className="text-yellow-400 text-base leading-none mt-0.5">·</span>
                    <p className="text-xs text-gray-400">
                      Standard weight applied to the customer's risk profile.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-1">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl text-gray-300 bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnConfirm}
                className="px-4 py-2 text-sm font-medium rounded-xl text-white bg-red-600 hover:bg-red-500 border border-red-500/80 transition-colors shadow-lg shadow-red-900/30"
              >
                Confirm Return
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
