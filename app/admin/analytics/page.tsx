import { Sidebar } from "@/components/layout/Sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Order from "@/models/Order";
import Intelligence from "@/models/Intelligence";
import { redirect } from "next/navigation";
import { Users, Package, ShieldAlert, DollarSign, TrendingUp, Search, ArrowUpRight } from "lucide-react";

export default async function AdminAnalytics() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== "admin") {
    redirect("/login");
  }

  await connectDB();

  // Fetch real metrics from DB
  const [totalUsers, totalOrders, highRiskDetected] = await Promise.all([
    User.countDocuments({ role: "business" }),
    Order.countDocuments(),
    Intelligence.countDocuments({
      $or: [{ failedOrders: { $gt: 2 } }, { isBlacklisted: true }],
    }),
  ]);

  // Dummy data for revenue and recent searchers
  const totalRevenue = 12450.00;
  const recentSearchers = [
    { id: "1", name: "TechFlow Solutions", searches: 145, city: "Colombo", riskHandled: "High" },
    { id: "2", name: "GreenGrocers Inc", searches: 89, city: "Kandy", riskHandled: "Medium" },
    { id: "3", name: "Urban Styles", searches: 67, city: "Galle", riskHandled: "Low" },
    { id: "4", name: "Swift Delivery Co", searches: 52, city: "Negombo", riskHandled: "Low" },
    { id: "5", name: "Aero Logistics", searches: 41, city: "Jaffna", riskHandled: "High" },
  ];

  return (
    <div className="flex min-h-screen w-full bg-slate-950">
      <Sidebar
        businessName={(session.user as any)?.businessName}
        userName={session.user?.name}
        role={(session.user as any)?.role}
      />

      <div className="flex flex-1 flex-col pt-14 md:pt-0 md:pl-64 border-l border-slate-800">
        <main className="flex-1 overflow-y-auto">
          <div className="py-8 min-h-screen font-sans">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black tracking-tighter text-white uppercase">System Analytics</h1>
                  <p className="mt-1 text-sm text-slate-400 tracking-wide">Global intelligence throughput and financial performance monitoring.</p>
                </div>
                <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Live Engine</span>
                   </div>
                </div>
              </div>
            </div>
            
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 mt-10">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl transition hover:border-indigo-500/50 group">
                  <div className="flex items-center justify-between relative z-10">
                    <dt className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Users</dt>
                    <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                      <Users className="h-4 w-4 text-indigo-400" />
                    </div>
                  </div>
                  <dd className="mt-4 text-4xl font-black text-white relative z-10">{totalUsers}</dd>
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-green-400 uppercase tracking-widest relative z-10">
                    <TrendingUp className="h-3 w-3" /> +12% this month
                  </div>
                  <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-indigo-500/5 to-transparent" />
                </div>

                <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl transition hover:border-blue-500/50 group">
                  <div className="flex items-center justify-between relative z-10">
                    <dt className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Orders Checked</dt>
                    <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20">
                      <Package className="h-4 w-4 text-blue-400" />
                    </div>
                  </div>
                  <dd className="mt-4 text-4xl font-black text-white relative z-10">{totalOrders}</dd>
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-blue-400 uppercase tracking-widest relative z-10">
                    <Search className="h-3 w-3" /> Real-time active
                  </div>
                  <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-blue-500/5 to-transparent" />
                </div>

                <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl transition hover:border-red-500/50 group">
                  <div className="flex items-center justify-between relative z-10">
                    <dt className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">High Risk detected</dt>
                    <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20">
                      <ShieldAlert className="h-4 w-4 text-red-400" />
                    </div>
                  </div>
                  <dd className="mt-4 text-4xl font-black text-red-500 drop-shadow-lg relative z-10">{highRiskDetected}</dd>
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-red-400 uppercase tracking-widest relative z-10">
                    Prevention Active
                  </div>
                  <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-red-500/5 to-transparent" />
                </div>

                <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl transition hover:border-emerald-500/50 group">
                  <div className="flex items-center justify-between relative z-10">
                    <dt className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Revenue</dt>
                    <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                      <DollarSign className="h-4 w-4 text-emerald-400" />
                    </div>
                  </div>
                  <dd className="mt-4 text-4xl font-black text-white relative z-10">${totalRevenue.toLocaleString()}</dd>
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-widest relative z-10">
                    <ArrowUpRight className="h-3 w-3" /> Sustained Growth
                  </div>
                  <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-emerald-500/5 to-transparent" />
                </div>

              </div>

              {/* Charts & Tables Section */}
              <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
                
                {/* Growth Chart Placeholder */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Engine Growth Matrix</h3>
                    <select className="bg-slate-800 border-none text-[10px] font-bold text-slate-400 rounded-lg px-2 py-1 focus:ring-0">
                      <option>Last 30 Days</option>
                      <option>Last 90 Days</option>
                    </select>
                  </div>
                  <div className="h-64 w-full bg-slate-800/20 rounded-2xl border border-slate-700/50 border-dashed flex flex-col items-center justify-center relative group-hover:bg-slate-800/30 transition-all">
                    <div className="flex gap-2 items-end h-32 mb-4">
                      <div className="w-4 bg-indigo-500/20 h-1/4 rounded-t-sm" />
                      <div className="w-4 bg-indigo-500/30 h-1/2 rounded-t-sm" />
                      <div className="w-4 bg-indigo-500/40 h-1/3 rounded-t-sm" />
                      <div className="w-4 bg-indigo-500/60 h-3/4 rounded-t-sm animate-pulse" />
                      <div className="w-4 bg-indigo-500/40 h-2/3 rounded-t-sm" />
                      <div className="w-4 bg-indigo-500/80 h-[90%] rounded-t-sm" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Neural Growth Visualization Placeholder</span>
                  </div>
                </div>

                {/* Top Searchers Table */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-sm relative overflow-hidden group">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-8">Cluster Top Searchers</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="pb-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Business</th>
                          <th className="pb-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ops Count</th>
                          <th className="pb-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-widest">Threat lvl</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {recentSearchers.map((searcher) => (
                          <tr key={searcher.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="py-4">
                              <div className="text-xs font-bold text-white">{searcher.name}</div>
                              <div className="text-[10px] text-slate-500">{searcher.city}</div>
                            </td>
                            <td className="py-4 text-center font-mono text-xs text-blue-400">{searcher.searches}</td>
                            <td className="py-4 text-right">
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                searcher.riskHandled === 'High' ? 'text-red-500 bg-red-500/10' :
                                searcher.riskHandled === 'Medium' ? 'text-orange-500 bg-orange-500/10' :
                                'text-emerald-500 bg-emerald-500/10'
                              }`}>
                                {searcher.riskHandled}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
