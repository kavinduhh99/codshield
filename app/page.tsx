import { Sidebar } from "@/components/layout/Sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import { MapPin, AlertTriangle } from "lucide-react";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  await connectDB();

  // GLOBAL DATA SHARING CONCEPT:
  // By analyzing returning orders across all tenant businesses natively in this single aggregation,
  // we crowd-source area intelligence. If Seller A experiences massive returns in "Colombo", 
  // Seller B immediately benefits from spotting the hotspot globally.
  const topReturnCities = await Order.aggregate([
    { $match: { status: "returned", city: { $exists: true, $ne: null } } },
    { $group: { _id: "$city", returnCount: { $sum: 1 } } },
    { $sort: { returnCount: -1 } },
    { $limit: 5 }
  ]);

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      <Sidebar
        businessName={(session.user as any)?.businessName}
        userName={session.user?.name}
        role={session.user?.role}
      />

      <div className="flex flex-1 flex-col pt-14 md:pt-0 md:pl-64">
        <main className="flex-1 overflow-y-auto">
          <div className="py-6 min-h-screen">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900">
                Welcome back, {(session.user as any)?.businessName || session.user?.name}
              </h1>
            </div>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 mt-8">
              {/* Replace with your content */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                  <dt className="truncate text-sm font-medium text-gray-500">Total COD Orders</dt>
                  <dd className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">0</dd>
                </div>
                <div className="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                  <dt className="truncate text-sm font-medium text-gray-500">RTO Risk Identified</dt>
                  <dd className="mt-2 text-3xl font-semibold tracking-tight text-red-600">0</dd>
                </div>
                <div className="overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5">
                  <dt className="truncate text-sm font-medium text-gray-500">Successful Deliveries</dt>
                  <dd className="mt-2 text-3xl font-semibold tracking-tight text-green-600">0</dd>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <div className="rounded-xl bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 overflow-hidden flex flex-col h-full">
                  <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
                      Recent High-Risk Orders
                    </h3>
                  </div>
                  <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400 flex-1 flex items-center justify-center">
                    Detailed risk pipeline data table will be populated here.
                  </div>
                </div>

                <div className="rounded-xl bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 overflow-hidden flex flex-col h-full">
                  <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-red-500" />
                      Global Return Hotspots
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                       Crowdsourced intelligence of cities with the highest RTO density globally.
                    </p>
                  </div>
                  <div className="p-0 flex-1">
                    {topReturnCities.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-500">
                         No returns reported globally yet.
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {topReturnCities.map((cityObj, idx) => (
                           <li key={cityObj._id} className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <span className="flex items-center text-sm font-medium text-gray-900 dark:text-white">
                                 <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs mr-3 font-bold">
                                   {idx + 1}
                                 </span>
                                 {cityObj._id}
                              </span>
                              <span className="inline-flex items-center rounded-full bg-red-50 dark:bg-red-900/20 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:text-red-400">
                                {cityObj.returnCount} returns
                              </span>
                           </li>
                        ))}
                      </ul>
                    )}
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
