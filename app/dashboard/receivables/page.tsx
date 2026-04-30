"use client";

import { useEffect, useState, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Plus, X, Loader2, CheckCircle, Clock, AlertTriangle,
  XCircle, Banknote, Pencil, Trash2, ExternalLink, CalendarClock,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface Receivable {
  _id: string;
  title: string;
  sourceType: string;
  sourceName: string;
  amount: number;
  expectedDate: string;
  status: "pending" | "received" | "overdue" | "cancelled";
  relatedOrderId?: string;
  notes?: string;
  receivedDate?: string;
  createdAt: string;
}

const SOURCE_TYPES = ["Courier COD", "Bank Deposit", "Card Payment", "Koko Installment", "Other"];

const EMPTY_FORM = {
  title: "", sourceType: "Courier COD", sourceName: "", amount: "",
  expectedDate: "", relatedOrderId: "", notes: "",
};

// ── Helpers ────────────────────────────────────────────────────────────────
function isVisuallyOverdue(r: Receivable) {
  return r.status === "pending" && new Date(r.expectedDate) < new Date();
}

function StatusBadge({ r }: { r: Receivable }) {
  const overdue = isVisuallyOverdue(r);
  const label = overdue ? "Overdue" : r.status;
  const cls =
    r.status === "received"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : r.status === "cancelled"
      ? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
      : overdue
      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${cls}`}>
      {r.status === "received" ? <CheckCircle className="h-3 w-3" /> :
       overdue ? <AlertTriangle className="h-3 w-3" /> :
       r.status === "cancelled" ? <XCircle className="h-3 w-3" /> :
       <Clock className="h-3 w-3" />}
      {label}
    </span>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────
function ReceivableModal({
  initial, onClose, onSave,
}: {
  initial?: Receivable | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}) {
  const [form, setForm] = useState(
    initial
      ? {
          title: initial.title,
          sourceType: initial.sourceType,
          sourceName: initial.sourceName,
          amount: String(initial.amount),
          expectedDate: initial.expectedDate.slice(0, 10),
          relatedOrderId: initial.relatedOrderId || "",
          notes: initial.notes || "",
        }
      : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputCls =
    "mt-1 block w-full rounded-md border-0 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 sm:text-sm py-2 px-3";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) < 0) {
      setError("Valid amount required"); return;
    }
    if (!form.expectedDate) { setError("Expected date is required"); return; }

    setSaving(true);
    setError("");
    try {
      await onSave({ ...form, amount: Number(form.amount) });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl max-h-[90dvh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {initial ? "Edit Receivable" : "Add Receivable"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto">
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-300">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title *</label>
            <input type="text" className={inputCls} placeholder="e.g. Domex COD Week 18 settlement"
              value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Source Type *</label>
              <select className={inputCls} value={form.sourceType}
                onChange={e => setForm({ ...form, sourceType: e.target.value })}>
                {SOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Source Name</label>
              <input type="text" className={inputCls} placeholder="e.g. Domex, Trans Express"
                value={form.sourceName} onChange={e => setForm({ ...form, sourceName: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount (Rs) *</label>
              <input type="number" min="0" className={inputCls} placeholder="0"
                value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expected Date *</label>
              <input type="date" className={inputCls}
                value={form.expectedDate} onChange={e => setForm({ ...form, expectedDate: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Related Order ID (Optional)</label>
            <input type="text" className={inputCls} placeholder="Order ID if linked to specific order"
              value={form.relatedOrderId} onChange={e => setForm({ ...form, relatedOrderId: e.target.value })} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Optional)</label>
            <textarea rows={2} className={inputCls} placeholder="Any notes..."
              value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? "Saving..." : initial ? "Save Changes" : "Add Receivable"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function ReceivablesPage() {
  const { data: session, status } = useSession();
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Receivable | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/receivables");
      if (res.ok) setReceivables(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (status === "authenticated") load(); }, [status, load]);

  const handleAdd = async (data: any) => {
    const res = await fetch("/api/receivables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.message || "Failed to create");
    }
    await load();
  };

  const handleEdit = async (data: any) => {
    const res = await fetch(`/api/receivables/${editTarget!._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const d = await res.json();
      throw new Error(d.message || "Failed to update");
    }
    await load();
  };

  const markReceived = async (id: string) => {
    setActionLoading(id + "-receive");
    try {
      await fetch(`/api/receivables/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "received", receivedDate: new Date().toISOString() }),
      });
      await load();
    } finally { setActionLoading(null); }
  };

  const deleteReceivable = async (id: string) => {
    if (!confirm("Delete this receivable?")) return;
    setActionLoading(id + "-delete");
    try {
      await fetch(`/api/receivables/${id}`, { method: "DELETE" });
      setReceivables(prev => prev.filter(r => r._id !== id));
    } finally { setActionLoading(null); }
  };

  // ── Summary stats ──────────────────────────────────────────────────────
  const now = new Date();
  const weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const pending = receivables.filter(r => r.status === "pending");
  const totalPending = pending.reduce((s, r) => s + r.amount, 0);
  const dueThisWeek = pending.filter(r => new Date(r.expectedDate) <= weekEnd).reduce((s, r) => s + r.amount, 0);
  const overdue = pending.filter(r => new Date(r.expectedDate) < now);
  const receivedThisMonth = receivables
    .filter(r => r.status === "received" && r.receivedDate && new Date(r.receivedDate) >= monthStart && new Date(r.receivedDate) <= monthEnd)
    .reduce((s, r) => s + r.amount, 0);

  if (status === "loading" || loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-50 dark:bg-slate-950 overflow-x-hidden">
      <Sidebar
        businessName={(session?.user as any)?.businessName}
        userName={session?.user?.name}
        role={(session?.user as any)?.role}
      />

      <div className="flex flex-1 flex-col pt-14 md:pt-0 md:pl-64">
        <main className="flex-1">
          <div className="py-6 pb-16 space-y-8 mx-auto max-w-7xl px-4 sm:px-6 md:px-8">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Receivables</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track payments expected from couriers, banks, and payment partners.</p>
              </div>
              <button onClick={() => { setEditTarget(null); setShowModal(true); }}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm">
                <Plus className="h-4 w-4" /> Add Receivable
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Pending", value: `Rs ${totalPending.toLocaleString()}`, sub: `${pending.length} item${pending.length !== 1 ? "s" : ""}`, color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400" },
                { label: "Due This Week", value: `Rs ${dueThisWeek.toLocaleString()}`, sub: "Next 7 days", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" },
                { label: "Overdue", value: `Rs ${overdue.reduce((s, r) => s + r.amount, 0).toLocaleString()}`, sub: `${overdue.length} item${overdue.length !== 1 ? "s" : ""}`, color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" },
                { label: "Received This Month", value: `Rs ${receivedThisMonth.toLocaleString()}`, sub: "Settled", color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" },
              ].map(card => (
                <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                  <div className={`inline-flex p-2 rounded-lg mb-3 ${card.color}`}>
                    <Banknote className="h-4 w-4" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{card.value}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{card.sub}</p>
                </div>
              ))}
            </div>

            {/* Receivables Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-blue-500" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">All Receivables</h2>
              </div>

              {receivables.length === 0 ? (
                <div className="py-20 text-center">
                  <Banknote className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No receivables yet.</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add expected payments to track cash flow.</p>
                  <button onClick={() => { setEditTarget(null); setShowModal(true); }}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
                    <Plus className="h-3.5 w-3.5" /> Add Receivable
                  </button>
                </div>
              ) : (
                <>
                  {/* ── Mobile cards ── */}
                  <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
                    {receivables.map(r => (
                      <div key={r._id} className={`p-4 space-y-2 ${isVisuallyOverdue(r) ? "bg-red-50/40 dark:bg-red-900/10" : ""}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{r.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{r.sourceType}{r.sourceName ? ` · ${r.sourceName}` : ""}</p>
                          </div>
                          <StatusBadge r={r} />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-gray-900 dark:text-white">Rs {r.amount.toLocaleString()}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(r.expectedDate).toLocaleDateString()}</span>
                        </div>
                        {r.relatedOrderId && (
                          <Link href={`/dashboard/order/${r.relatedOrderId}`}
                            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 text-xs hover:underline">
                            Order #{r.relatedOrderId.slice(-8).toUpperCase()} <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          {r.status !== "received" && r.status !== "cancelled" && (
                            <button onClick={() => markReceived(r._id)} disabled={actionLoading === r._id + "-receive"}
                              className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium hover:bg-green-100 disabled:opacity-50">
                              {actionLoading === r._id + "-receive" ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />} Received
                            </button>
                          )}
                          <button onClick={() => { setEditTarget(r); setShowModal(true); }}
                            className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                            Edit
                          </button>
                          <button onClick={() => deleteReceivable(r._id)} disabled={actionLoading === r._id + "-delete"}
                            className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 disabled:opacity-50">
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Desktop table ── */}
                  <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        {["Title / Source", "Amount", "Expected Date", "Status", "Related Order", "Actions"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                      {receivables.map(r => (
                        <tr key={r._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${isVisuallyOverdue(r) ? "bg-red-50/30 dark:bg-red-900/10" : ""}`}>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{r.title}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{r.sourceType}{r.sourceName ? ` · ${r.sourceName}` : ""}</p>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                            Rs {r.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {new Date(r.expectedDate).toLocaleDateString()}
                            {r.status === "received" && r.receivedDate && (
                              <span className="block text-xs text-green-600 dark:text-green-400">
                                Received: {new Date(r.receivedDate).toLocaleDateString()}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3"><StatusBadge r={r} /></td>
                          <td className="px-4 py-3 text-sm">
                            {r.relatedOrderId ? (
                              <Link href={`/dashboard/order/${r.relatedOrderId}`}
                                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs">
                                {r.relatedOrderId.slice(-8).toUpperCase()} <ExternalLink className="h-3 w-3" />
                              </Link>
                            ) : (
                              <span className="text-gray-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {r.status !== "received" && r.status !== "cancelled" && (
                                <button
                                  onClick={() => markReceived(r._id)}
                                  disabled={actionLoading === r._id + "-receive"}
                                  title="Mark as Received"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium hover:bg-green-100 dark:hover:bg-green-900/40 disabled:opacity-50 transition-colors">
                                  {actionLoading === r._id + "-receive"
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <CheckCircle className="h-3 w-3" />}
                                  Received
                                </button>
                              )}
                              <button
                                onClick={() => { setEditTarget(r); setShowModal(true); }}
                                title="Edit"
                                className="p-1.5 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => deleteReceivable(r._id)}
                                disabled={actionLoading === r._id + "-delete"}
                                title="Delete"
                                className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors">
                                {actionLoading === r._id + "-delete"
                                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  : <Trash2 className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
              )}
            </div>

            {/* Accounting notice */}
            <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
              ⓘ Receivables are for cash-flow tracking only and are not counted in delivered revenue or profit.
            </p>

          </div>
        </main>
      </div>

      {showModal && (
        <ReceivableModal
          initial={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSave={editTarget ? handleEdit : handleAdd}
        />
      )}
    </div>
  );
}
