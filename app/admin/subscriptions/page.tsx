import { Sidebar } from "@/components/layout/Sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { CreditCard, Clock, CheckCircle2, XCircle, User as UserIcon } from "lucide-react";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { UserVerifyButton } from "./UserVerifyButton";

export default async function AdminSubscriptions() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== "admin") {
    redirect("/login");
  }

  await connectDB();
  const users = await User.find({ role: "business" }).sort({ paymentStatus: -1, createdAt: -1 });

  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

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
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Subscription Management</h1>
                <p className="mt-2 text-sm text-slate-400">Monitor and manage user license tiers and expiry status across the network.</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                 <CreditCard className="h-4 w-4 text-indigo-400" />
                 <span className="text-xs font-semibold text-indigo-400 tracking-wider uppercase">License Control</span>
              </div>
            </div>
            
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 mt-10">
              <div className="overflow-hidden bg-slate-900/50 border border-slate-800 shadow-2xl rounded-2xl backdrop-blur-sm">
                <table className="min-w-full divide-y divide-slate-800">
                  <thead className="bg-slate-900">
                    <tr>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Business Name</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Trial Start</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                      <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Subscription</th>
                      <th scope="col" className="relative px-6 py-4 text-right"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                          No business users found in the registry.
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => {
                        const trialExpiry = new Date(user.createdAt).getTime() + THIRTY_DAYS_MS;
                        const isTrialActive = Date.now() < trialExpiry;
                        const isPaid = user.subscription?.isActive === true;
                        
                        let statusLabel = "Trial";
                        let statusColor = "text-blue-400 bg-blue-500/10 border-blue-500/20";
                        
                        if (isPaid) {
                          statusLabel = "Active";
                          statusColor = "text-green-400 bg-green-500/10 border-green-500/20";
                        } else if (user.paymentStatus === "pending_verification") {
                          statusLabel = "PAID - VERIFY NOW";
                          statusColor = "text-white bg-amber-500 border-amber-400 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.5)]";
                        } else if (!isTrialActive) {
                          statusLabel = "Expired";
                          statusColor = "text-red-400 bg-red-500/10 border-red-500/20";
                        }

                        return (
                          <tr key={user._id.toString()} className={`transition-all duration-500 group relative ${
                            user.paymentStatus === 'pending_verification' 
                              ? 'bg-amber-500/[0.07] hover:bg-amber-500/[0.12] ring-1 ring-inset ring-amber-500/20' 
                              : 'hover:bg-slate-800/30'
                          }`}>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl transition-all duration-300 ${user.paymentStatus === 'pending_verification' ? 'bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-slate-800'}`}>
                                  <UserIcon className={`h-4.5 w-4.5 ${user.paymentStatus === 'pending_verification' ? 'text-amber-400' : 'text-slate-400'}`} />
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-white tracking-tight">{user.businessName}</div>
                                  <div className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex items-center gap-2 text-sm text-slate-400 font-mono">
                                <Clock className="h-3.5 w-3.5 text-slate-600" />
                                {new Date(user.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-black tracking-widest uppercase border ${statusColor}`}>
                                {statusLabel}
                              </span>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {isPaid ? (
                                  <>
                                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                    <span className="text-sm font-bold text-green-400">Rs. 400 Paid</span>
                                  </>
                                ) : user.paymentStatus === 'pending_verification' ? (
                                  <>
                                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                                    <span className="text-sm font-bold text-amber-500 uppercase tracking-tighter">Needs Approval</span>
                                  </>
                                ) : (
                                  <>
                                    <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                                    <span className="text-sm font-medium text-slate-500 italic">Unpaid</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                              <UserVerifyButton 
                                userId={user._id.toString()} 
                                isPaid={isPaid} 
                                paymentStatus={user.paymentStatus}
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              
              <p className="mt-6 text-xs text-center text-slate-500 italic tracking-wide">
                Showing {users.length} registered business licenses in the cluster.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
