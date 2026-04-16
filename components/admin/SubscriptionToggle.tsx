"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface SubscriptionToggleProps {
  userId: string;
  initialStatus: boolean;
}

export function SubscriptionToggle({ userId, initialStatus }: SubscriptionToggleProps) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  const toggleSubscription = async () => {
    const newStatus = !isActive;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // Exact format requirement hit
        body: JSON.stringify({ "subscription.isActive": newStatus }),
      });

      if (!res.ok) {
        throw new Error("Update failed in API.");
      }

      setIsActive(newStatus);
      router.refresh(); 
    } catch (error) {
      console.error(error);
      alert("Failed toggling target user status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-1">
      {/* Icon Display mapped natively above the button */}
      <div className="flex items-center space-x-1.5 min-h-[24px]">
        {isActive ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        <span className={`text-xs font-semibold ${isActive ? "text-green-500" : "text-gray-400"}`}>
          {isActive ? "ACTIVE" : "INACTIVE"}
        </span>
      </div>

      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      ) : (
        <button
          onClick={toggleSubscription}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
            isActive ? "bg-green-500" : "bg-gray-700"
          }`}
          role="switch"
          aria-checked={isActive}
        >
          <span className="sr-only">Toggle user status</span>
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isActive ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </button>
      )}
    </div>
  );
}
