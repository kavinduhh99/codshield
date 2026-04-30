"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useSession } from "next-auth/react";
import { Loader2, DollarSign, TrendingUp, Receipt, Plus, PackageX, Truck, Calendar, Download, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";

type DateRangeType = "thisMonth" | "lastMonth" | "thisYear" | "allTime" | "custom";

export default function FinancePage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [dateRange, setDateRange] = useState<DateRangeType>("thisMonth");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, dateRange]);

  const fetchData = async () => {
    if (dateRange === "custom" && (!customStart || !customEnd)) {
      return; // wait for both dates
    }

    try {
      setIsFetching(true);
      let query = `?range=${dateRange}`;
      if (dateRange === "custom") {
        query += `&startDate=${customStart}&endDate=${customEnd}`;
      }

      const [statsRes, expensesRes] = await Promise.all([
        fetch(`/api/finance${query}`),
        fetch(`/api/finance/expenses${query}`)
      ]);
      
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (expensesRes.ok) {
        setExpenses(await expensesRes.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  const handleCustomDateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      fetchData();
    }
  };

  const generateCSV = () => {
    if (!stats) return;

    const lines: string[] = [];
    
    // 1. Report Title & Date
    lines.push(`BizFlow Financial Report`);
    lines.push(`Date Range:,${dateRange === 'custom' ? `${customStart} to ${customEnd}` : dateRange}`);
    lines.push(``);

    // 2. Main Summary
    lines.push(`--- SUMMARY ---`);
    lines.push(`Metric,Value (LKR)`);
    lines.push(`Delivered Revenue,${stats.deliveredRevenue}`);
    lines.push(`Product Cost,${stats.productCost}`);
    lines.push(`Total Expenses,${stats.totalExpenses}`);
    lines.push(`Delivery Fees Payable,${stats.deliveryFees}`);
    lines.push(`Return Loss,${stats.returnLoss}`);
    lines.push(`Returned Product Value (Informational),${stats.returnedProductValue}`);
    lines.push(`Estimated Profit,${stats.estimatedProfit}`);
    lines.push(``);

    // 3. Monthly Breakdown
    if (stats.monthlySummary && stats.monthlySummary.length > 0) {
      lines.push(`--- MONTHLY BREAKDOWN ---`);
      lines.push(`Month,Delivered Revenue,Product Cost,Expenses,Delivery Fees,Return Loss,Profit`);
      stats.monthlySummary.forEach((m: any) => {
        lines.push(`${m.month},${m.deliveredRevenue},${m.productCost},${m.expenses},${m.deliveryFees},${m.returnLoss},${m.profit}`);
      });
      lines.push(``);
    }

    // 4. Expense Log
    if (expenses && expenses.length > 0) {
      lines.push(`--- EXPENSE LOG ---`);
      lines.push(`Date,Title,Category,Amount,Notes`);
      expenses.forEach((e: any) => {
        const dateStr = new Date(e.date || e.createdAt).toLocaleDateString();
        const title = `"${(e.title || "").replace(/"/g, '""')}"`;
        const notes = `"${(e.notes || "").replace(/"/g, '""')}"`;
        lines.push(`${dateStr},${title},${e.category},${e.amount},${notes}`);
      });
      lines.push(``);
    }

    // 5. Order Summary
    if (stats.orders && stats.orders.length > 0) {
      lines.push(`--- ORDER SUMMARY ---`);
      lines.push(`Order ID,Customer,Product,Quantity,Revenue,Cost,Delivery Fee,Profit,Status,Date`);
      stats.orders.forEach((o: any) => {
        const revenue = (o.sellingPrice || 0) * (o.quantity || 1);
        const cost = (o.costPrice || 0) * (o.quantity || 1);
        const profit = revenue - cost - (o.deliveryFee || 0); // Simplified order profit
        const dateStr = new Date(o.createdAt).toLocaleDateString();
        const customer = `"${(o.customerName || "").replace(/"/g, '""')}"`;
        const product = `"${((o.productId as any)?.name || o.productNameText || "Custom Item").replace(/"/g, '""')}"`;
        
        lines.push(`${o._id},${customer},${product},${o.quantity},${revenue},${cost},${o.deliveryFee},${profit},${o.status},${dateStr}`);
      });
    }

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const fileNameDate = dateRange === 'custom' ? `${customStart}-to-${customEnd}` : dateRange;
    link.setAttribute('download', `bizflow-finance-report-${fileNameDate}.csv`);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (status === "loading" || loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950"><Loader2 className="h-8 w-8 animate-spin text-blue-500"/></div>;
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
          <div className="py-6 pb-16 space-y-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Finance & Performance</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track your revenue, profit, and expenses.</p>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={generateCSV}
                  disabled={isFetching || !stats}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  <Download className="mr-2 h-4 w-4" /> Download Report
                </button>
                <Link
                  href="/dashboard/finance/expenses/new"
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Expense
                </Link>
              </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              
              {/* Filter Controls */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                  <Calendar className="h-5 w-5 mr-2 text-gray-400" />
                  Date Range:
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "thisMonth", label: "This Month" },
                    { id: "lastMonth", label: "Last Month" },
                    { id: "thisYear", label: "This Year" },
                    { id: "allTime", label: "All Time" },
                    { id: "custom", label: "Custom" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setDateRange(filter.id as DateRangeType)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        dateRange === filter.id 
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400 border border-transparent hover:bg-gray-200 dark:hover:bg-gray-800"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {dateRange === "custom" && (
                  <form onSubmit={handleCustomDateSubmit} className="flex flex-wrap items-center gap-2">
                    <input
                      type="date"
                      required
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm py-1.5 px-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                    />
                    <span className="text-gray-500 dark:text-gray-400">to</span>
                    <input
                      type="date"
                      required
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm py-1.5 px-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                    />
                    <button type="submit" className="px-3 py-1.5 bg-gray-800 text-white dark:bg-gray-700 rounded-md text-sm hover:bg-gray-700 transition-colors">
                      Apply
                    </button>
                  </form>
                )}
              </div>

              {isFetching && (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="ml-3 text-gray-500">Loading data...</span>
                </div>
              )}

              {!isFetching && stats && (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Delivered Revenue</p>
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      </div>
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                        Rs {stats.deliveredRevenue?.toLocaleString() || 0}
                      </p>
                      <p className="mt-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 inline-block px-2 py-0.5 rounded-full">Only delivered orders</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Return Loss</p>
                        <PackageX className="h-5 w-5 text-red-500" />
                      </div>
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                        Rs {stats.returnLoss?.toLocaleString() || 0}
                      </p>
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 inline-block px-2 py-0.5 rounded-full">Courier loss from returns</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</p>
                        <Receipt className="h-5 w-5 text-orange-500" />
                      </div>
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                        Rs {stats.totalExpenses?.toLocaleString() || 0}
                      </p>
                      <p className="mt-1 text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 inline-block px-2 py-0.5 rounded-full">Operating costs</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Delivery Fees</p>
                        <Truck className="h-5 w-5 text-purple-500" />
                      </div>
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                        Rs {stats.deliveryFees?.toLocaleString() || 0}
                      </p>
                      <p className="mt-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 inline-block px-2 py-0.5 rounded-full">Collected for couriers</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-16 h-16 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4"></div>
                      <div className="flex items-center justify-between relative z-10">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Profit</p>
                        <DollarSign className="h-5 w-5 text-blue-500" />
                      </div>
                      <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white relative z-10">
                        Rs {stats.estimatedProfit?.toLocaleString() || 0}
                      </p>
                      <p className="mt-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 inline-block px-2 py-0.5 rounded-full relative z-10">Rev - Cost - Exp - Ret. Loss</p>
                    </div>
                  </div>

                  {stats.monthlySummary && stats.monthlySummary.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 mb-8">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Monthly Financial Summary</h3>
                      </div>
                      <div className="overflow-x-auto touch-pan-x">
                        <table className="min-w-[800px] w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Month</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prod Cost</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expenses</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Delivery Fees</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Return Loss</th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Profit</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {stats.monthlySummary.map((m: any) => (
                              <tr key={m.month} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{m.month}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">Rs {m.deliveredRevenue.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">Rs {m.productCost.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">Rs {m.expenses.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">Rs {m.deliveryFees.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-500 dark:text-red-400">Rs {m.returnLoss.toLocaleString()}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${m.profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                                  Rs {m.profit.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Expenses List */}
                  <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Filtered Expenses</h3>
                    </div>

                    <div className="overflow-x-auto touch-pan-x">
                      <table className="min-w-[600px] w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {expenses.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                                <p>No expenses found in this period.</p>
                              </td>
                            </tr>
                          ) : (
                            expenses.map((e) => (
                              <tr key={e._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(e.date || e.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">{e.title}</div>
                                  {e.notes && <div className="text-xs text-gray-500 dark:text-gray-400">{e.notes}</div>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                    {e.category}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                                  Rs {e.amount.toLocaleString()}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
