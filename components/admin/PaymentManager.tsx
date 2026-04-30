"use client";

import { useState } from "react";
import { 
  Search, 
  Plus, 
  Filter, 
  CreditCard, 
  Banknote, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Trash2,
  Calendar,
  User as UserIcon,
  Building
} from "lucide-react";

interface PaymentManagerProps {
  initialPayments: any[];
  users: any[];
}

export function PaymentManager({ initialPayments, users }: PaymentManagerProps) {
  const [payments, setPayments] = useState(initialPayments);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [newPayment, setNewPayment] = useState({
    userId: "",
    amount: 0,
    plan: "Pro",
    paymentMethod: "Bank Transfer",
    status: "paid",
    subscriptionMonths: 1,
    notes: "",
  });

  const filteredPayments = payments.filter((p: any) => {
    const businessName = p.userId?.businessName || "";
    const userName = p.userId?.name || "";
    const matchesSearch = 
      businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddPayment = async () => {
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPayment,
          paymentDate: new Date(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        // Re-fetch or update local state
        window.location.reload(); // Simplest way to get the populated data
      }
    } catch (error) {
      console.error("Add payment failed:", error);
    }
  };

  const handleStatusUpdate = async (paymentId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Status update failed:", error);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}`, { method: "DELETE" });
      if (res.ok) {
        setPayments(payments.filter(p => p._id !== paymentId));
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-lg">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search business or owner..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-800 rounded-lg bg-gray-950 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <select
            className="bg-gray-950 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-all"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-blue-700 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Payment
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-2xl">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Business</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Amount / Plan</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Method</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Notes</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 bg-gray-900/50">
            {filteredPayments.map((p) => (
              <tr key={p._id} className="hover:bg-gray-800/60 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center">
                      <Building className="h-4 w-4 text-gray-400" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-bold text-white">{p.userId?.businessName || 'N/A'}</div>
                      <div className="text-[10px] text-gray-500">{p.userId?.name || 'Unknown'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">Rs {p.amount.toLocaleString()}</span>
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">{p.plan} &bull; {p.subscriptionMonths}m</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-xs text-gray-400 font-medium">
                    {p.paymentMethod === 'Bank Transfer' ? <Banknote className="h-3.5 w-3.5 mr-1.5 text-emerald-500" /> : <CreditCard className="h-3.5 w-3.5 mr-1.5 text-blue-500" />}
                    {p.paymentMethod}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-[10px] text-gray-400 max-w-[120px] truncate leading-tight font-medium" title={p.notes}>
                    {p.notes || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    className={`text-[10px] font-black uppercase tracking-widest rounded-full px-3 py-1 bg-gray-950 focus:outline-none transition-all border ${
                      p.status === 'paid' ? 'text-green-500 border-green-500/30' : 
                      p.status === 'pending' ? 'text-orange-500 border-orange-500/30' : 
                      'text-red-500 border-red-500/30'
                    }`}
                    value={p.status}
                    onChange={(e) => handleStatusUpdate(p._id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-medium">
                  {new Date(p.paymentDate || p.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleDeletePayment(p._id)}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-900/20 rounded-lg transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredPayments.length === 0 && (
          <div className="py-20 text-center">
            <CreditCard className="h-12 w-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 italic">No payments found.</p>
          </div>
        )}
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {filteredPayments.map((p) => (
          <div key={p._id} className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4 shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm font-bold text-white">{p.userId?.businessName || 'N/A'}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">{p.plan} Plan</div>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                p.status === 'paid' ? 'text-green-500 border-green-500/30 bg-green-500/5' : 'text-orange-500 border-orange-500/30 bg-orange-500/5'
              }`}>
                {p.status}
              </span>
            </div>
            <div className="flex justify-between items-end border-t border-gray-800 pt-3">
               <div className="text-lg font-black text-white">Rs {p.amount.toLocaleString()}</div>
               <div className="text-[10px] text-gray-500 flex items-center font-bold">
                 <Calendar className="h-3 w-3 mr-1" />
                 {new Date(p.paymentDate || p.createdAt).toLocaleDateString()}
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Record Payment</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white">
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Business / User</label>
                <select
                  className="block w-full bg-gray-950 border border-gray-800 text-gray-300 text-sm rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500"
                  value={newPayment.userId}
                  onChange={(e) => setNewPayment({ ...newPayment, userId: e.target.value })}
                >
                  <option value="">Select User</option>
                  {users.map(u => (
                    <option key={u._id} value={u._id}>{u.businessName} ({u.name})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Amount (Rs)</label>
                  <input
                    type="number"
                    className="block w-full bg-gray-950 border border-gray-800 text-gray-300 text-sm rounded-lg p-2.5 focus:ring-blue-500"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Months</label>
                  <input
                    type="number"
                    min="1"
                    className="block w-full bg-gray-950 border border-gray-800 text-gray-300 text-sm rounded-lg p-2.5 focus:ring-blue-500"
                    value={newPayment.subscriptionMonths}
                    onChange={(e) => setNewPayment({ ...newPayment, subscriptionMonths: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Plan</label>
                  <select
                    className="block w-full bg-gray-950 border border-gray-800 text-gray-300 text-sm rounded-lg p-2.5 focus:ring-blue-500"
                    value={newPayment.plan}
                    onChange={(e) => setNewPayment({ ...newPayment, plan: e.target.value })}
                  >
                    <option value="Pro">Pro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Method</label>
                  <select
                    className="block w-full bg-gray-950 border border-gray-800 text-gray-300 text-sm rounded-lg p-2.5 focus:ring-blue-500"
                    value={newPayment.paymentMethod}
                    onChange={(e) => setNewPayment({ ...newPayment, paymentMethod: e.target.value as any })}
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Notes (Optional)</label>
                <textarea
                  className="block w-full bg-gray-950 border border-gray-800 text-gray-300 text-sm rounded-lg p-2.5 focus:ring-blue-500"
                  rows={2}
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                />
              </div>

              <button
                onClick={handleAddPayment}
                disabled={!newPayment.userId || newPayment.amount <= 0}
                className="w-full py-3 mt-4 rounded-xl bg-blue-600 text-white font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
