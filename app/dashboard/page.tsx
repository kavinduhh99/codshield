"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  TrendingUp, ShoppingCart, PackageX, Clock, CheckCircle,
  XCircle, Package, AlertTriangle, ShieldAlert, Loader2,
  ArrowRight, Truck, RotateCcw, Box, Banknote,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface DashboardData {
  today: { revenue: number; orderCount: number; returnLoss: number };
  pipeline: { pending: number; processing: number; shipped: number; delivered: number; returned: number; cancelled: number };
  alerts: {
    lowStock: any[];
    highRiskOrders: any[];
    recentReturns: any[];
  };
  recentOrders: any[];
}

// ── Helpers ────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    shipped:    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    delivered:  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    returned:   "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    cancelled:  "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || map.cancelled}`}>
      {status}
    </span>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub?: string; icon: any; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-start gap-4 shadow-sm">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function PipelineCard({ label, count, icon: Icon, color, href }: { label: string; count: number; icon: any; color: string; href: string }) {
  return (
    <Link href={href}
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-2 shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-colors group">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${color}`}><Icon className="h-4 w-4" /></div>
        <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors" />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </Link>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [receivables, setReceivables] = useState<any[]>([]);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([
      fetch("/api/dashboard/summary").then(r => r.json()),
      fetch("/api/receivables").then(r => r.ok ? r.json() : []),
    ])
      .then(([summary, recv]) => { setData(summary); setReceivables(recv); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // ── Access Guard ──────────────────────────────────────────────────────────
  const isSuspended = session?.user?.status === "suspended";
  const isExpiredTrial = 
    session?.user?.plan === "Free Trial" && 
    session?.user?.subEnd && 
    new Date(session.user.subEnd) < new Date();

  if (isSuspended || isExpiredTrial) {
    return (
      <div className="flex min-h-screen w-full bg-gray-950 items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="h-20 w-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="h-10 w-10 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase italic">Access Restricted</h2>
            <p className="mt-2 text-sm text-gray-400 font-medium">
              {isSuspended 
                ? "Your business account has been suspended by the platform administrator. Please contact support for more information." 
                : "Your 30-day free trial has expired. To continue managing your business on BizFlow, please upgrade your subscription."}
            </p>
          </div>
          <div className="pt-4">
            {isExpiredTrial && (
              <Link
                href="/dashboard/billing"
                className="inline-flex w-full justify-center items-center gap-2 py-4 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-all active:scale-95"
              >
                Upgrade Plan <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <button
              onClick={() => window.location.href = "/login"}
              className={`mt-3 inline-flex w-full justify-center items-center gap-2 py-4 rounded-2xl border border-gray-800 text-gray-400 font-black uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95`}
            >
              Back to Security Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const today = data?.today;
  const pipeline = data?.pipeline;
  const alerts = data?.alerts;
  const recentOrders = data?.recentOrders ?? [];

  const totalAlerts = (alerts?.lowStock.length ?? 0) + (alerts?.highRiskOrders.length ?? 0) + (alerts?.recentReturns.length ?? 0);

  // Receivables quick stats
  const now = new Date();
  const weekEnd = new Date(now); weekEnd.setDate(now.getDate() + 7);
  const pendingRecv = receivables.filter(r => r.status === "pending");
  const totalPendingRecv = pendingRecv.reduce((s: number, r: any) => s + r.amount, 0);
  const overdueRecv = pendingRecv.filter((r: any) => new Date(r.expectedDate) < now);
  const dueThisWeekRecv = pendingRecv.filter((r: any) => new Date(r.expectedDate) <= weekEnd).reduce((s: number, r: any) => s + r.amount, 0);

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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Welcome back, {session?.user?.name?.split(" ")[0] ?? "there"} 👋
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/dashboard/order/new"
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm">
                  <ShoppingCart className="h-4 w-4" /> New Order
                </Link>
              </div>
            </div>

            {/* ── Section 1: Today Summary ── */}
            <section>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Today's Summary</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard
                  label="Today Revenue"
                  value={`Rs ${(today?.revenue ?? 0).toLocaleString()}`}
                  sub="From delivered orders"
                  icon={TrendingUp}
                  color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                />
                <StatCard
                  label="Orders Today"
                  value={String(today?.orderCount ?? 0)}
                  sub="All statuses"
                  icon={ShoppingCart}
                  color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                />
                <StatCard
                  label="Return Loss Today"
                  value={`Rs ${(today?.returnLoss ?? 0).toLocaleString()}`}
                  sub="Courier loss from returns"
                  icon={PackageX}
                  color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                />
              </div>
            </section>

            {/* ── Section 2: Order Pipeline ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order Pipeline</h2>
                <Link href="/dashboard/order/history" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <PipelineCard label="Pending" count={pipeline?.pending ?? 0} icon={Clock}
                  color="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                  href="/dashboard/order/history?status=pending" />
                <PipelineCard label="Processing" count={pipeline?.processing ?? 0} icon={Package}
                  color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  href="/dashboard/order/history?status=processing" />
                <PipelineCard label="Shipped" count={pipeline?.shipped ?? 0} icon={Truck}
                  color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                  href="/dashboard/order/history?status=shipped" />
                <PipelineCard label="Delivered" count={pipeline?.delivered ?? 0} icon={CheckCircle}
                  color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  href="/dashboard/order/history?status=delivered" />
                <PipelineCard label="Returned" count={pipeline?.returned ?? 0} icon={RotateCcw}
                  color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                  href="/dashboard/order/history?status=returned" />
                <PipelineCard label="Cancelled" count={pipeline?.cancelled ?? 0} icon={XCircle}
                  color="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                  href="/dashboard/order/history?status=cancelled" />
              </div>
            </section>

            {/* ── Section 3: Alerts ── */}
            {totalAlerts > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Alerts <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{totalAlerts}</span>
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                  {/* Low Stock */}
                  {(alerts?.lowStock.length ?? 0) > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-orange-200 dark:border-orange-800/50 p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                          <Box className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Low Stock</span>
                        <span className="ml-auto text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full">
                          {alerts?.lowStock.length}
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {alerts?.lowStock.map((p: any) => (
                          <li key={p._id} className="flex items-center justify-between text-sm">
                            <div className="truncate pr-2">
                              <span className="font-medium text-gray-900 dark:text-white truncate block">{p.name}</span>
                              <span className="text-xs text-gray-400">{p.sku}</span>
                            </div>
                            <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${p.stock <= 0 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"}`}>
                              {p.stock <= 0 ? "Out" : `${p.stock} left`}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <Link href="/dashboard/products" className="mt-3 block text-xs text-blue-600 dark:text-blue-400 hover:underline">
                        Manage Products →
                      </Link>
                    </div>
                  )}

                  {/* High Risk Orders */}
                  {(alerts?.highRiskOrders.length ?? 0) > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800/50 p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                          <ShieldAlert className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">High Risk Pending</span>
                        <span className="ml-auto text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full">
                          {alerts?.highRiskOrders.length}
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {alerts?.highRiskOrders.map((o: any) => (
                          <li key={o._id} className="flex items-center justify-between text-sm">
                            <div className="truncate pr-2">
                              <Link href={`/dashboard/order/${o._id}`} className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate block">
                                {o.customerName}
                              </Link>
                              <span className="text-xs text-gray-400">{o.phone}</span>
                            </div>
                            <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              {o.riskScore}%
                            </span>
                          </li>
                        ))}
                      </ul>
                      <Link href="/dashboard/risk" className="mt-3 block text-xs text-blue-600 dark:text-blue-400 hover:underline">
                        COD Risk Checker →
                      </Link>
                    </div>
                  )}

                  {/* Recent Returns */}
                  {(alerts?.recentReturns.length ?? 0) > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          <RotateCcw className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Recent Returns</span>
                        <span className="ml-auto text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                          {alerts?.recentReturns.length}
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {alerts?.recentReturns.map((o: any) => (
                          <li key={o._id} className="flex items-center justify-between text-sm">
                            <div className="truncate pr-2">
                              <Link href={`/dashboard/order/${o._id}`} className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate block">
                                {o.customerName}
                              </Link>
                              <span className="text-xs text-gray-400">{o.returnReason || "No reason given"}</span>
                            </div>
                            <span className="flex-shrink-0 text-xs text-red-600 dark:text-red-400 font-medium">
                              -Rs {(o.deliveryFee || 0).toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <Link href="/dashboard/order/history?status=returned" className="mt-3 block text-xs text-blue-600 dark:text-blue-400 hover:underline">
                        View returned orders →
                      </Link>
                    </div>
                  )}

                </div>
              </section>
            )}

            {/* ── Section 4: Receivables Snapshot ── */}
            {(receivables.length > 0 || true) && (
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Banknote className="h-4 w-4" /> Payments to Receive
                  </h2>
                  <Link href="/dashboard/receivables" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                    Manage <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {receivables.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center text-sm text-gray-400 dark:text-gray-500 shadow-sm">
                    No receivables recorded.{" "}
                    <Link href="/dashboard/receivables" className="text-blue-600 dark:text-blue-400 hover:underline">Add expected payments →</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-yellow-200 dark:border-yellow-800/50 p-4 shadow-sm flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"><Banknote className="h-4 w-4" /></div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total Pending</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">Rs {totalPendingRecv.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{pendingRecv.length} item{pendingRecv.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-red-200 dark:border-red-800/50 p-4 shadow-sm flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"><AlertTriangle className="h-4 w-4" /></div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Overdue</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">Rs {overdueRecv.reduce((s: number, r: any) => s + r.amount, 0).toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{overdueRecv.length} item{overdueRecv.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800/50 p-4 shadow-sm flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"><Clock className="h-4 w-4" /></div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Due This Week</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">Rs {dueThisWeekRecv.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">Next 7 days</p>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ── Section 5: Recent Orders Table ── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recent Orders</h2>
                <Link href="/dashboard/order/history" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                {recentOrders.length === 0 ? (
                  <div className="py-16 text-center text-gray-400 dark:text-gray-500">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No orders yet.</p>
                    <Link href="/dashboard/order/new" className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                      Add your first order <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                          {["Customer", "City", "Items", "Total", "Payment", "Status", "Date"].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        {recentOrders.map(o => (
                          <tr key={o._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <td className="px-4 py-3">
                              <Link href={`/dashboard/order/${o._id}`} className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-sm">
                                {o.customerName}
                              </Link>
                              <p className="text-xs text-gray-400">{o.phone}</p>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{o.city || "—"}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{o.itemCount}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                              Rs {(o.totalAmount || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-gray-600 dark:text-gray-400">{o.paymentMethod}</span>
                              <span className={`ml-1 text-xs font-medium capitalize ${o.paymentStatus === "paid" ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}>
                                · {o.paymentStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                            <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                              {new Date(o.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}
