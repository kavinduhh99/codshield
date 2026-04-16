"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function OrderActions({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  if (currentStatus !== "pending") return null;

  const handleUpdate = async (newStatus: "delivered" | "returned") => {
    if (newStatus === "returned") {
      const isConfirmed = window.confirm(
        "Are you sure? Marking as returned will penalize these phone numbers and affect the global risk tracking database."
      );
      if (!isConfirmed) return;
    }

    setLoading(newStatus);
    
    try {
      const res = await fetch(`/api/order/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
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
    <div className="flex space-x-2 mt-3 sm:mt-0 justify-end w-full sm:w-auto">
      <button
        onClick={() => handleUpdate("delivered")}
        disabled={loading !== null}
        className="inline-flex items-center rounded-md bg-green-50 dark:bg-green-900/30 px-2.5 py-1.5 text-xs font-semibold text-green-700 dark:text-green-400 shadow-sm hover:bg-green-100 transition-colors disabled:opacity-50"
      >
        {loading === "delivered" ? <Loader2 className="mr-1 h-3 w-3 animate-spin"/> : <CheckCircle className="mr-1 h-3 w-3"/>}
        Delivered
      </button>
      <button
        onClick={() => handleUpdate("returned")}
        disabled={loading !== null}
        className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-900/30 px-2.5 py-1.5 text-xs font-semibold text-red-700 dark:text-red-400 shadow-sm hover:bg-red-100 transition-colors disabled:opacity-50"
      >
        {loading === "returned" ? <Loader2 className="mr-1 h-3 w-3 animate-spin"/> : <XCircle className="mr-1 h-3 w-3"/>}
        Returned
      </button>
    </div>
  );
}
