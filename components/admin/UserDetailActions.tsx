"use client";

import { useState } from "react";
import { 
  ShieldCheck, 
  ShieldAlert, 
  UserX, 
  UserCheck, 
  CreditCard, 
  Calendar, 
  Trash2,
  Loader2,
  ChevronDown
} from "lucide-react";
import { useRouter } from "next/navigation";

export function UserDetailActions({ user }: { user: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPlanMenu, setShowPlanMenu] = useState(false);

  const handleUpdate = async (payload: any) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("CRITICAL: Delete this business account permanently? This will remove all associated data and cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user._id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/users");
      }
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const extendSubscription = (days: number) => {
    const currentEnd = user.subscription?.endDate ? new Date(user.subscription.endDate) : new Date();
    const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);
    handleUpdate({ subscription: { endDate: newEnd } });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Verify Business */}
      <button
        onClick={() => handleUpdate({ isVerified: !user.isVerified })}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
          user.isVerified ? 'bg-blue-600/10 text-blue-400 border-blue-500/30' : 'bg-gray-800 text-gray-400 border-gray-700'
        }`}
      >
        {user.isVerified ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
        {user.isVerified ? 'Verified' : 'Verify Business'}
      </button>

      {/* Suspend / Activate */}
      <button
        onClick={() => handleUpdate({ status: user.status === 'active' ? 'suspended' : 'active' })}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
          user.status === 'active' ? 'bg-red-600/10 text-red-400 border-red-500/30' : 'bg-green-600/10 text-green-400 border-green-500/30'
        }`}
      >
        {user.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
        {user.status === 'active' ? 'Suspend' : 'Activate'}
      </button>

      {/* Plan Management */}
      <div className="relative">
        <button
          onClick={() => setShowPlanMenu(!showPlanMenu)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-800 text-gray-300 border border-gray-700 text-xs font-bold hover:bg-gray-700 transition-all"
        >
          <CreditCard className="h-4 w-4" />
          Change Plan
          <ChevronDown className="h-3 w-3 ml-1" />
        </button>
        {showPlanMenu && (
          <div className="absolute right-0 mt-2 w-48 rounded-xl bg-gray-900 border border-gray-800 shadow-2xl overflow-hidden z-20">
            {['Free Trial', 'Pro'].map(plan => (
              <button
                key={plan}
                onClick={() => {
                  handleUpdate({ subscription: { plan } });
                  setShowPlanMenu(false);
                }}
                className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
              >
                {plan}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Expiry Date Picker */}
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-300">
        <Calendar className="h-4 w-4 text-gray-500" />
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase text-gray-500 leading-none mb-0.5">Expiry Date</span>
          <input 
            type="date" 
            className="bg-transparent text-xs font-bold text-gray-300 outline-none [color-scheme:dark]"
            defaultValue={user.subscription?.endDate ? new Date(user.subscription.endDate).toISOString().split('T')[0] : ""}
            onChange={(e) => {
              if (e.target.value) {
                handleUpdate({ subscription: { endDate: new Date(e.target.value) } });
              }
            }}
          />
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-900/10 text-red-500 border border-red-900/20 text-xs font-bold hover:bg-red-900/20 transition-all"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        Delete Account
      </button>
    </div>
  );
}
