"use client";

import { useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface EmailVerifyToggleProps {
  userId: string;
  initialStatus: boolean;
  email: string;
}

export function EmailVerifyToggle({ userId, initialStatus, email }: EmailVerifyToggleProps) {
  const [isVerified, setIsVerified] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/verify`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isEmailVerified: !isVerified }),
      });

      if (res.ok) {
        setIsVerified(!isVerified);
        router.refresh(); // Refresh server data
      } else {
        const error = await res.json();
        alert(`Error: ${error.message}`);
      }
    } catch (err) {
      console.error("Toggle failed:", err);
      alert("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      title={isVerified ? "Mark as Unverified" : "Mark as Verified"}
      className={`flex items-center space-x-2 px-3 py-1 rounded-md text-xs font-medium transition-colors border ${
        isVerified
          ? "bg-green-900/20 text-green-400 border-green-800 hover:bg-green-900/40"
          : "bg-red-900/20 text-red-400 border-red-800 hover:bg-red-900/40"
      } disabled:opacity-50`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isVerified ? (
        <CheckCircle className="h-4 w-4" />
      ) : (
        <XCircle className="h-4 w-4" />
      )}
      <span>{isVerified ? "Verified" : "Unverified"}</span>
    </button>
  );
}
