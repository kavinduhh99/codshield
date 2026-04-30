import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import { Sidebar } from "@/components/layout/Sidebar";
import User from "@/models/User";
import { redirect } from "next/navigation";
import { CreditCard, Zap, Crown, Rocket, Users, Calendar, ArrowRight, ShieldCheck, Clock } from "lucide-react";
import Link from "next/link";

import { normalizePlan } from "@/lib/subscription";

export default async function AdminSubscriptionsPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== "admin") {
    redirect("/login");
  }

  await connectDB();

  const [rawPlanStats, usersWithExpiring] = await Promise.all([
    User.aggregate([
      { $match: { role: "business" } },
      { $group: { _id: "$subscription.plan", count: { $sum: 1 } } }
    ]),
    User.find({ 
      role: "business", 
      "subscription.endDate": { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } 
    }).sort({ "subscription.endDate": 1 }).limit(10).lean(),
  ]);

  // Normalize stats to group legacy plans (free, starter, business) into new categories
  const planStats = rawPlanStats.reduce((acc: { _id: string, count: number }[], curr: any) => {
    const normalizedName = normalizePlan(curr._id);
    const existing = acc.find(s => s._id === normalizedName);
    if (existing) {
      existing.count += curr.count;
    } else {
      acc.push({ _id: normalizedName, count: curr.count });
    }
    return acc;
  }, []);

  const plans = [
    { name: "Free Trial", price: "0", icon: Clock, color: "text-gray-400", features: ["30 Days Access", "Full Feature Set", "Standard Support"] },
    { name: "Pro", price: "500", icon: Zap, color: "text-blue-500", features: ["Unlimited Orders", "Bulk Uploads", "Financial Tracking", "Stock Management"] },
  ];

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
                <CreditCard className="h-8 w-8 text-purple-500" />
                Subscription Matrix
              </h1>
              <p className="mt-2 text-sm text-gray-400 font-medium tracking-wide">Configure platform tiers and monitor active subscription health.</p>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 mt-10 space-y-12">
              {/* Plan Configuration Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl gap-6">
                {plans.map((plan) => {
                  const stat = planStats.find(s => s._id === plan.name);
                  return (
                    <div key={plan.name} className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-2xl relative overflow-hidden group">
                      <div className="flex justify-between items-start mb-6">
                        <div className={`p-3 rounded-xl bg-gray-950 border border-gray-800 ${plan.color}`}>
                          <plan.icon className="h-6 w-6" />
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Active Licenses</div>
                          <div className="text-2xl font-black text-white">{stat?.count || 0}</div>
                        </div>
                      </div>
                      <h3 className="text-xl font-black text-white mb-1 uppercase tracking-tight italic">{plan.name}</h3>
                      <div className="text-lg font-bold text-gray-400 mb-6">Rs {plan.price}<span className="text-[10px] lowercase font-medium ml-1">/month</span></div>
                      
                      <ul className="space-y-2 mb-2">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
                            <ShieldCheck className="h-3 w-3 text-gray-700" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      
                      <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-${plan.color.split('-')[1]}-500 to-transparent opacity-30`} />
                    </div>
                  );
                })}
              </div>

              {/* Expiring Subscriptions */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/30 flex items-center justify-between">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    Critical Expirations (Next 7 Days)
                  </h3>
                  <Link href="/admin/users" className="text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">View All Users</Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-gray-950">
                      <tr>
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Business</th>
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Plan</th>
                        <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Expiry Date</th>
                        <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-500 uppercase tracking-widest">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {usersWithExpiring.map((user: any) => (
                        <tr key={user._id.toString()} className="hover:bg-gray-800/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-white">{user.businessName}</div>
                            <div className="text-[10px] text-gray-500">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-400 uppercase">
                            {user.subscription?.plan || 'Free'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                             <span className={`text-xs font-bold ${
                               new Date(user.subscription.endDate) < new Date() ? 'text-red-500' : 'text-orange-500'
                             }`}>
                               {new Date(user.subscription.endDate).toLocaleDateString()}
                               {new Date(user.subscription.endDate) < new Date() && ' (EXPIRED)'}
                             </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <Link 
                              href={`/admin/users/${user._id}`}
                              className="inline-flex items-center gap-1.5 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors"
                            >
                              Manage <ArrowRight className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                      {usersWithExpiring.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-xs text-gray-600 italic">No critical expirations detected.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
