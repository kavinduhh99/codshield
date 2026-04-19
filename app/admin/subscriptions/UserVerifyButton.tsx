"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function UserVerifyButton({ 
  userId, 
  isPaid, 
  paymentStatus 
}: { 
  userId: string; 
  isPaid: boolean;
  paymentStatus?: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleVerify = async () => {
    if (isPaid) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify-payment`, {
        method: "PATCH",
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to verify payment");
      }
    } catch (err) {
      alert("An error occurred while verifying payment.");
    } finally {
      setLoading(false);
    }
  };

  if (isPaid) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 rounded-xl">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Verified
      </div>
    );
  }

  const isPending = paymentStatus === "pending_verification";

  return (
    <button
      onClick={handleVerify}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white transition-all shadow-lg disabled:opacity-50 ${
        isPending 
          ? "bg-amber-600 hover:bg-amber-500 shadow-amber-500/20" 
          : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20"
      }`}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        isPending ? "Approve Payment" : "Upgrade to Paid"
      )}
    </button>
  );
}
