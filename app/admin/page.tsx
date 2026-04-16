import { Sidebar } from "@/components/layout/Sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Order from "@/models/Order";
import Intelligence from "@/models/Intelligence";
import { redirect } from "next/navigation";
import { Users, Package, AlertOctagon } from "lucide-react";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== "admin") {
    redirect("/login");
  }

  await connectDB();

  const [totalUsers, totalOrders, highRiskProfiles] = await Promise.all([
    User.countDocuments({ role: "business" }),
    Order.countDocuments(),
    Intelligence.countDocuments({
      $or: [{ failedOrders: { $gt: 2 } }, { isBlacklisted: true }],
    }),
  ]);

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
              <h1 className="text-2xl font-bold tracking-tight text-white">Metrics Origin</h1>
              <p className="mt-2 text-sm text-gray-400">Total analytical readout generated locally over cluster grids.</p>
            </div>
            
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 mt-10">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                
                <div className="relative overflow-hidden rounded-2xl bg-gray-900 border border-gray-800 shadow-xl transition hover:border-blue-500/50 hover:bg-gray-800/80 group">
                  <div className="px-6 py-8">
                    <div className="flex items-center justify-between">
                      <dt className="truncate text-xs uppercase tracking-widest font-semibold text-gray-500">Active Licenses</dt>
                      <Users className="h-6 w-6 text-blue-500 opacity-80 group-hover:opacity-100 transition" />
                    </div>
                    <dd className="mt-4 text-5xl font-black tracking-tight text-white shadow-sm">{totalUsers}</dd>
                  </div>
                  <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-blue-500/10 to-transparent pointer-events-none" />
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-gray-900 border border-gray-800 shadow-xl transition hover:border-green-500/50 hover:bg-gray-800/80 group">
                  <div className="px-6 py-8">
                    <div className="flex items-center justify-between">
                      <dt className="truncate text-xs uppercase tracking-widest font-semibold text-gray-500">Transacted Assets</dt>
                      <Package className="h-6 w-6 text-green-500 opacity-80 group-hover:opacity-100 transition" />
                    </div>
                    <dd className="mt-4 text-5xl font-black tracking-tight text-white shadow-sm">{totalOrders}</dd>
                  </div>
                  <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-green-500/10 to-transparent pointer-events-none" />
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-gray-900 border border-gray-800 shadow-xl transition hover:border-red-500/50 hover:bg-gray-800/80 group">
                  <div className="px-6 py-8">
                    <div className="flex items-center justify-between">
                      <dt className="truncate text-xs uppercase tracking-widest font-semibold text-gray-500">Threat Alerts</dt>
                      <AlertOctagon className="h-6 w-6 text-red-500 opacity-80 group-hover:opacity-100 transition" />
                    </div>
                    <dd className="mt-4 text-5xl font-black tracking-tight text-red-500 drop-shadow-md">{highRiskProfiles}</dd>
                  </div>
                  <div className="absolute top-0 right-0 h-full w-32 bg-gradient-to-l from-red-500/10 to-transparent pointer-events-none" />
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
