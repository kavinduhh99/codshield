import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import { Sidebar } from "@/components/layout/Sidebar";
import User from "@/models/User";
import { redirect } from "next/navigation";
import { SubscriptionToggle } from "@/components/admin/SubscriptionToggle";
import { EmailVerifyToggle } from "@/components/admin/EmailVerifyToggle";
import { CheckCircle, XCircle } from "lucide-react";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== "admin") {
    redirect("/login");
  }

  await connectDB();

  const rawUsers = await User.find({ role: "business" }).sort({ createdAt: -1 }).lean();
  
  const users = rawUsers.map(user => ({
    ...user,
    _id: user._id.toString(),
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString()
  }));

  return (
    <div className="flex min-h-screen w-full bg-gray-950 text-gray-300 overflow-x-hidden">
      <Sidebar
        businessName={(session.user as any)?.businessName}
        userName={session.user?.name}
        role={(session.user as any)?.role}
      />

      <div className="flex flex-1 flex-col pt-14 md:pt-0 md:pl-64 h-full bg-gray-950 border-l border-gray-800">
        <main className="flex-1 overflow-y-auto w-full">
          <div className="py-8 min-h-screen">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-bold text-white tracking-tight">Access Directory</h1>
              <p className="mt-2 text-sm text-gray-400">Strictly manage client authorization instances globally.</p>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 mt-8">
              <div className="flex flex-col rounded-xl overflow-hidden shadow-2xl border border-gray-800 bg-gray-900">
                {/* ── Mobile card list ── */}
                <div className="md:hidden divide-y divide-gray-800">
                  {users.length === 0 ? (
                    <div className="py-12 text-center text-gray-500 text-sm italic">System index is empty.</div>
                  ) : (
                    users.map((item: any) => (
                      <div key={item._id} className="p-4 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-gray-200">{item.name}</div>
                            <div className="text-gray-500 text-xs mt-0.5">{item.email}</div>
                          </div>
                          <span className="inline-flex items-center rounded bg-gray-800/80 px-2 py-0.5 text-[10px] font-medium text-blue-400 ring-1 ring-inset ring-blue-400/20 uppercase tracking-widest">
                            {item.subscription?.plan || "CORE"}
                          </span>
                        </div>
                        
                        <div className="bg-gray-800/30 rounded-lg p-3">
                          <div className="text-white text-sm font-medium">{item.businessName}</div>
                          {item.phone && <div className="text-gray-500 text-xs mt-0.5">{item.phone}</div>}
                        </div>

                        <div className="flex flex-col gap-3 pt-2 border-t border-gray-800">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Subscription Status</span>
                            <SubscriptionToggle 
                                userId={item._id} 
                                initialStatus={item.subscription?.isActive || false}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Email Verification</span>
                            <EmailVerifyToggle 
                                 userId={item._id} 
                                 initialStatus={item.isEmailVerified || false}
                                 email={item.email}
                             />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* ── Desktop table ── */}
                <div className="hidden md:block overflow-x-auto min-w-full align-middle">
                  <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-gray-800/50">
                      <tr>
                        <th scope="col" className="py-4 pl-6 pr-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Proprietor Profile</th>
                        <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Registered Business</th>
                        <th scope="col" className="px-3 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Platform Layout</th>
                        <th scope="col" className="relative py-4 pl-3 pr-6 text-right sm:pr-8 text-xs font-semibold uppercase text-gray-300">Status Command</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 bg-gray-900/50">
                      {users.map((item: any) => (
                        <tr key={item._id} className="hover:bg-gray-800/60 transition-colors backdrop-blur-md">
                          <td className="whitespace-nowrap py-5 pl-6 pr-3 text-sm">
                            <div className="font-semibold text-gray-200">{item.name}</div>
                            <div className="text-gray-500 text-xs mt-0.5">{item.email}</div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-5 text-sm text-gray-400">
                            <div className="text-white font-medium">{item.businessName}</div>
                            {item.phone && <div className="text-gray-500 text-xs mt-0.5">{item.phone}</div>}
                          </td>
                          <td className="whitespace-nowrap px-3 py-5 text-sm text-gray-400">
                            <span className="inline-flex items-center rounded bg-gray-800/80 px-2 py-0.5 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-400/20 uppercase tracking-widest shadow-inner">
                              {item.subscription?.plan || "CORE"}
                            </span>
                          </td>
                          <td className="relative whitespace-nowrap py-5 pl-3 pr-6 text-right text-sm font-medium sm:pr-8">
                            <div className="flex flex-col items-end">
                               <SubscriptionToggle 
                                    userId={item._id} 
                                    initialStatus={item.subscription?.isActive || false}
                                />
                                <div className="mt-2">
                                  <EmailVerifyToggle 
                                       userId={item._id} 
                                       initialStatus={item.isEmailVerified || false}
                                       email={item.email}
                                   />
                                </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-16 text-center text-gray-500 text-sm italic">System index is empty.</td>
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
