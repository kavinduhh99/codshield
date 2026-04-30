import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import { Sidebar } from "@/components/layout/Sidebar";
import User from "@/models/User";
import Order from "@/models/Order";
import Payment from "@/models/Payment";
import { redirect } from "next/navigation";
import { 
  Activity, 
  Users, 
  TrendingUp, 
  CreditCard, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Package,
  Building
} from "lucide-react";

import { normalizePlan } from "@/lib/subscription";

export default async function AdminAnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== "admin") {
    redirect("/login");
  }

  await connectDB();

  const [
    totalUsers,
    activeUsers,
    suspendedUsers,
    trialUsers,
    paidUsers,
    totalOrders,
    allPayments,
    recentSignups,
    allOrders
  ] = await Promise.all([
    User.countDocuments({ role: "business" }),
    User.countDocuments({ role: "business", status: "active" }),
    User.countDocuments({ role: "business", status: "suspended" }),
    User.countDocuments({ role: "business", "subscription.plan": { $in: ["Free Trial", "free", "trial"] } }),
    User.countDocuments({ role: "business", "subscription.plan": { $nin: ["Free Trial", "free", "trial", null] } }),
    Order.countDocuments(),
    Payment.find({ status: "paid" }).lean(),
    User.find({ role: "business" }).sort({ createdAt: -1 }).limit(5).lean(),
    Order.find().select("userId status").lean(),
  ]);

  // Revenue calc
  const totalRevenue = allPayments.reduce((acc: number, p: any) => acc + p.amount, 0);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyRevenue = allPayments
    .filter((p: any) => new Date(p.paymentDate || p.createdAt) >= startOfMonth)
    .reduce((acc: number, p: any) => acc + p.amount, 0);

  // Business return rates
  const userOrderStats: Record<string, { total: number; returned: number }> = {};
  allOrders.forEach((o: any) => {
    const uid = o.userId.toString();
    if (!userOrderStats[uid]) userOrderStats[uid] = { total: 0, returned: 0 };
    userOrderStats[uid].total++;
    if (o.status === 'returned') userOrderStats[uid].returned++;
  });

  const highReturnBusinesses = Object.entries(userOrderStats)
    .map(([uid, stats]) => ({
      userId: uid,
      returnRate: stats.total > 0 ? (stats.returned / stats.total) * 100 : 0,
      totalOrders: stats.total,
      returnedOrders: stats.returned,
    }))
    .filter(b => b.totalOrders >= 5 && b.returnRate > 20)
    .sort((a, b) => b.returnRate - a.returnRate)
    .slice(0, 5);
  
  // Resolve business names for high return list
  const highReturnDetails = await Promise.all(
    highReturnBusinesses.map(async (b) => {
      const user = await User.findById(b.userId).select("businessName").lean();
      return { ...b, businessName: user?.businessName || "Unknown" };
    })
  );

  return (
    <div className="flex min-h-screen w-full bg-gray-950 text-gray-300">
      <Sidebar
        businessName={(session.user as any)?.businessName}
        userName={session.user?.name}
        role={(session.user as any)?.role}
      />

      <div className="flex flex-1 flex-col pt-14 md:pt-0 md:pl-64 h-full border-l border-gray-800">
        <main className="flex-1 overflow-y-auto">
          <div className="py-8 min-h-screen font-sans">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              <h1 className="text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-3">
                <Activity className="h-8 w-8 text-blue-500" />
                Platform Intelligence
              </h1>
              <p className="mt-2 text-sm text-gray-400 font-medium tracking-wide">Deep analytical insights into BizFlow ecosystem health.</p>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 mt-10 space-y-10">
              {/* Primary Metrics Grid */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard title="Total Platform Orders" value={totalOrders} icon={Package} color="text-indigo-500" />
                <MetricCard title="Gross Platform Revenue" value={`Rs ${totalRevenue.toLocaleString()}`} icon={TrendingUp} color="text-emerald-500" />
                <MetricCard title="Monthly Subscription Revenue" value={`Rs ${monthlyRevenue.toLocaleString()}`} icon={CreditCard} color="text-cyan-500" />
                <MetricCard title="Trial to Paid Conversion" value={`${totalUsers > 0 ? ((paidUsers / totalUsers) * 100).toFixed(1) : 0}%`} icon={ArrowUpRight} color="text-purple-500" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* High Return Rate Businesses */}
                 <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
                   <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/30 flex items-center justify-between">
                     <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                       <AlertTriangle className="h-4 w-4 text-orange-500" />
                       High Return-Rate Businesses
                     </h3>
                     <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Min 5 Orders</span>
                   </div>
                   <div className="p-4">
                     {highReturnDetails.length === 0 ? (
                       <div className="py-12 text-center text-gray-600 text-xs italic">All businesses within healthy return thresholds.</div>
                     ) : (
                       <div className="space-y-4">
                         {highReturnDetails.map((b: any) => (
                           <div key={b.userId} className="flex items-center justify-between p-3 rounded-xl bg-gray-950 border border-gray-800 hover:border-orange-500/30 transition-all group">
                             <div className="flex items-center gap-3">
                               <div className="h-8 w-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                 <Building className="h-4 w-4 text-orange-500" />
                               </div>
                               <div>
                                 <div className="text-sm font-bold text-white group-hover:text-orange-400 transition-colors">{b.businessName}</div>
                                 <div className="text-[10px] text-gray-500">{b.totalOrders} total orders</div>
                               </div>
                             </div>
                             <div className="text-right">
                               <div className="text-sm font-black text-orange-500">{b.returnRate.toFixed(1)}%</div>
                               <div className="text-[9px] text-gray-500 uppercase font-bold">{b.returnedOrders} returns</div>
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 </div>

                 {/* Recent Platform Signups */}
                 <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
                   <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/30 flex items-center justify-between">
                     <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                       <Users className="h-4 w-4 text-blue-500" />
                       Recent Platform Signups
                     </h3>
                   </div>
                   <div className="p-4">
                     <div className="space-y-4">
                        {recentSignups.map((user: any) => (
                          <div key={user._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-950 border border-gray-800">
                             <div className="flex items-center gap-3">
                               <div className="h-8 w-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                 <span className="text-[10px] font-black text-blue-500">{(user.name || 'U')[0].toUpperCase()}</span>
                               </div>
                               <div>
                                 <div className="text-sm font-bold text-white">{user.businessName}</div>
                                 <div className="text-[10px] text-gray-500 italic">{user.email}</div>
                               </div>
                             </div>
                             <div className="text-right">
                               <div className="text-[10px] text-gray-400 font-bold">{new Date(user.createdAt).toLocaleDateString()}</div>
                               <span className="inline-flex items-center rounded bg-gray-800 px-1.5 py-0.5 text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                 {normalizePlan(user.subscription?.plan)}
                               </span>
                             </div>
                          </div>
                        ))}
                     </div>
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

function MetricCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gray-900 border border-gray-800 shadow-xl p-6 group hover:border-gray-700 transition-all">
      <div className="flex items-center justify-between mb-4">
        <dt className="truncate text-[10px] uppercase tracking-widest font-black text-gray-500">{title}</dt>
        <Icon className={`h-5 w-5 ${color} opacity-80 group-hover:opacity-100 transition`} />
      </div>
      <dd className="text-3xl font-black tracking-tight text-white">{value}</dd>
      <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-${color.split('-')[1]}-500/50 to-transparent opacity-30 group-hover:opacity-100 transition-all`} />
    </div>
  );
}
