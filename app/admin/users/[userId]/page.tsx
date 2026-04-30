import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import { Sidebar } from "@/components/layout/Sidebar";
import User from "@/models/User";
import Order from "@/models/Order";
import Payment from "@/models/Payment";
import { redirect } from "next/navigation";
import { 
  Building, 
  User as UserIcon, 
  Mail, 
  Phone as PhoneIcon, 
  Calendar, 
  ShieldCheck, 
  ShieldAlert, 
  CreditCard, 
  ShoppingCart, 
  ArrowLeft,
  Clock,
  Activity,
  DollarSign
} from "lucide-react";
import Link from "next/link";
import { UserDetailActions } from "@/components/admin/UserDetailActions";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== "admin") {
    redirect("/login");
  }

  await connectDB();

  const user = await User.findById(userId).lean();
  if (!user) {
    redirect("/admin/users");
  }

  const [orders, payments, orderStats] = await Promise.all([
    Order.find({ userId: user._id }).sort({ createdAt: -1 }).limit(10).lean(),
    Payment.find({ userId: user._id }).sort({ createdAt: -1 }).lean(),
    Order.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: null, total: { $sum: 1 }, revenue: { $sum: "$totalAmount" } } }
    ]),
  ]);

  const stats = orderStats[0] || { total: 0, revenue: 0 };

  return (
    <div className="flex min-h-screen w-full bg-gray-950 text-gray-300">
      <Sidebar
        businessName={(session.user as any)?.businessName}
        userName={session.user?.name}
        role={(session.user as any)?.role}
      />

      <div className="flex flex-1 flex-col pt-14 md:pt-0 md:pl-64 h-full border-l border-gray-800">
        <main className="flex-1 overflow-y-auto">
          <div className="py-8 min-h-screen">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              <Link href="/admin/users" className="flex items-center text-xs font-bold text-gray-500 hover:text-blue-400 transition-colors uppercase tracking-widest mb-6">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Directory
              </Link>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                    <Building className="h-8 w-8 text-blue-500" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">{user.businessName}</h1>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                      <span className="flex items-center gap-1.5"><UserIcon className="h-3.5 w-3.5" /> {user.name}</span>
                      <span className="text-gray-700">&bull;</span>
                      <span className="flex items-center gap-1.5 font-mono text-xs">{user.email}</span>
                    </div>
                  </div>
                </div>
                <UserDetailActions user={JSON.parse(JSON.stringify(user))} />
              </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 mt-10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* User Stats Overview */}
                <div className="lg:col-span-1 space-y-6">
                   <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-2xl">
                     <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-6">Account Vitality</h3>
                     <div className="space-y-4">
                       <div className="flex justify-between items-center p-3 rounded-xl bg-gray-950 border border-gray-800">
                         <span className="text-xs font-bold text-gray-400">Subscription Plan</span>
                         <span className="text-sm font-black text-blue-400 uppercase italic">{(user.subscription as any)?.plan || 'Free'}</span>
                       </div>
                       <div className="flex justify-between items-center p-3 rounded-xl bg-gray-950 border border-gray-800">
                         <span className="text-xs font-bold text-gray-400">Account Status</span>
                         <span className={`text-xs font-black uppercase italic ${user.status === 'active' ? 'text-green-500' : 'text-red-500'}`}>{user.status}</span>
                       </div>
                       <div className="flex justify-between items-center p-3 rounded-xl bg-gray-950 border border-gray-800">
                         <span className="text-xs font-bold text-gray-400">Business Verified</span>
                         {user.isVerified ? <ShieldCheck className="h-5 w-5 text-blue-500" /> : <ShieldAlert className="h-5 w-5 text-gray-600" />}
                       </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-800">
                        <div className="text-center">
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-tighter mb-1">Total Orders</div>
                          <div className="text-2xl font-black text-white">{stats.total}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-bold text-gray-500 uppercase tracking-tighter mb-1">Total Revenue</div>
                          <div className="text-xl font-black text-white">Rs {(stats.revenue || 0).toLocaleString()}</div>
                        </div>
                     </div>
                   </div>

                   <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-2xl">
                     <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Contact Info</h3>
                     <div className="space-y-3">
                       <div className="flex items-center gap-3 text-sm">
                         <Mail className="h-4 w-4 text-gray-500" />
                         <span className="text-gray-300 font-medium">{user.email}</span>
                       </div>
                       <div className="flex items-center gap-3 text-sm">
                         <PhoneIcon className="h-4 w-4 text-gray-500" />
                         <span className="text-gray-300 font-medium">{user.phone || 'Not provided'}</span>
                       </div>
                       <div className="flex items-center gap-3 text-sm">
                         <Calendar className="h-4 w-4 text-gray-500" />
                         <span className="text-gray-300 font-medium">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                       </div>
                     </div>
                   </div>
                </div>

                {/* Main Content: Orders & Payments */}
                <div className="lg:col-span-2 space-y-8">
                   {/* Payment History */}
                   <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/30 flex items-center justify-between">
                       <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                         <CreditCard className="h-4 w-4 text-blue-500" />
                         Subscription History
                       </h3>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-800">
                          <thead className="bg-gray-950">
                            <tr>
                              <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date</th>
                              <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Plan</th>
                              <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Amount</th>
                              <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800">
                            {payments.map((p: any) => (
                              <tr key={p._id.toString()} className="hover:bg-gray-800/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-gray-400">
                                  {new Date(p.paymentDate || p.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-white uppercase">
                                  {p.plan}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-300">
                                  Rs {p.amount.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                    p.status === 'paid' ? 'text-green-500 border-green-500/30' : 'text-orange-500 border-orange-500/30'
                                  }`}>
                                    {p.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {payments.length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-xs text-gray-600 italic">No payment history found.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                     </div>
                   </div>

                   {/* Recent Activity */}
                   <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
                     <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/30 flex items-center justify-between">
                       <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                         <Activity className="h-4 w-4 text-emerald-500" />
                         Recent Business Activity
                       </h3>
                       <span className="text-[10px] text-gray-500 font-bold uppercase">Last 10 Orders</span>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-800">
                          <thead className="bg-gray-950">
                            <tr>
                              <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Order ID</th>
                              <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Amount</th>
                              <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                              <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-widest">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800">
                            {orders.map((o: any) => (
                              <tr key={o._id.toString()} className="hover:bg-gray-800/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-gray-500">
                                  #{o.orderId || o._id.toString().slice(-6).toUpperCase()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-white">
                                  Rs {o.totalAmount.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                    o.status === 'delivered' ? 'bg-green-500/10 text-green-500' :
                                    o.status === 'returned' ? 'bg-red-500/10 text-red-500' :
                                    'bg-gray-800 text-gray-400'
                                  }`}>
                                    {o.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                  {new Date(o.createdAt).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                            {orders.length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-xs text-gray-600 italic">No business activity recorded yet.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
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
