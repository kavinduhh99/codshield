import { Sidebar } from "@/components/layout/Sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Order from "@/models/Order";
import Intelligence from "@/models/Intelligence";
import Payment from "@/models/Payment";
import { redirect } from "next/navigation";
import { Users, Package, AlertTriangle, CheckCircle, XCircle, Clock, CreditCard, Banknote, TrendingUp } from "lucide-react";

export default async function AdminDashboard() {
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
    expiredTrials
  ] = await Promise.all([
    User.countDocuments({ role: "business" }),
    User.countDocuments({ role: "business", status: "active" }),
    User.countDocuments({ role: "business", status: "suspended" }),
    User.countDocuments({ role: "business", "subscription.plan": { $in: ["Free Trial", "free", "trial"] } }),
    User.countDocuments({ role: "business", "subscription.plan": { $nin: ["Free Trial", "free", "trial", null] } }),
    Order.countDocuments(),
    Payment.find({ status: "paid" }),
    User.countDocuments({
      role: "business",
      "subscription.plan": { $in: ["Free Trial", "free", "trial"] },
      "subscription.endDate": { $lt: new Date() }
    })
  ]);

  const totalRevenue = allPayments.reduce((acc, p) => acc + p.amount, 0);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyRevenue = allPayments
    .filter(p => new Date(p.paymentDate || p.createdAt) >= startOfMonth)
    .reduce((acc, p) => acc + p.amount, 0);

  const stats = [
    { name: "Total Users", value: totalUsers, icon: Users, color: "text-blue-500", border: "hover:border-blue-500/50" },
    { name: "Active Users", value: activeUsers, icon: CheckCircle, color: "text-green-500", border: "hover:border-green-500/50" },
    { name: "Suspended", value: suspendedUsers, icon: XCircle, color: "text-red-500", border: "hover:border-red-500/50" },
    { name: "Trial Users", value: trialUsers, icon: Clock, color: "text-orange-500", border: "hover:border-orange-500/50" },
    { name: "Paid Users", value: paidUsers, icon: CreditCard, color: "text-purple-500", border: "hover:border-purple-500/50" },
    { name: "Total Orders", value: totalOrders, icon: Package, color: "text-indigo-500", border: "hover:border-indigo-500/50" },
    { name: "Total Revenue", value: `Rs ${totalRevenue.toLocaleString()}`, icon: Banknote, color: "text-emerald-500", border: "hover:border-emerald-500/50" },
    { name: "Monthly Revenue", value: `Rs ${monthlyRevenue.toLocaleString()}`, icon: TrendingUp, color: "text-cyan-500", border: "hover:border-cyan-500/50" },
    { name: "Expired Trials", value: expiredTrials, icon: AlertTriangle, color: "text-pink-500", border: "hover:border-pink-500/50" },
  ];

  return (
    <div className="flex min-h-screen w-full bg-gray-950">
      <Sidebar
        businessName={(session.user as any)?.businessName}
        userName={session.user?.name}
        role={(session.user as any)?.role}
      />

      <div className="flex flex-1 flex-col pt-14 md:pt-0 md:pl-64 border-l border-gray-800">
        <main className="flex-1 overflow-y-auto">
          <div className="py-8 min-h-screen font-sans">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              <h1 className="text-3xl font-black tracking-tight text-white uppercase italic">SaaS Control Center</h1>
              <p className="mt-2 text-sm text-gray-400 font-medium tracking-wide">Real-time analytical telemetry for BizFlow Platform operations.</p>
            </div>
            
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 mt-10">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.name} className={`relative overflow-hidden rounded-2xl bg-gray-900 border border-gray-800 shadow-2xl transition hover:bg-gray-800/80 group ${stat.border}`}>
                    <div className="px-6 py-8">
                      <div className="flex items-center justify-between">
                        <dt className="truncate text-xs uppercase tracking-widest font-bold text-gray-500">{stat.name}</dt>
                        <stat.icon className={`h-6 w-6 ${stat.color} opacity-80 group-hover:opacity-100 transition`} />
                      </div>
                      <dd className="mt-4 text-4xl font-black tracking-tight text-white">{stat.value}</dd>
                    </div>
                    <div className={`absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-${stat.color.split('-')[1]}-500/10 to-transparent pointer-events-none`} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
