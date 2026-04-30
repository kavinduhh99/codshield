import { Sidebar } from "@/components/layout/Sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import Expense from "@/models/Expense";
import { MapPin, AlertTriangle, TrendingUp, DollarSign, Package, PackageX, Receipt, Clock } from "lucide-react";
import Link from "next/link";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  await connectDB();
  const userId = session.user.id;

  // Global intelligence
  const topReturnCities = await Order.aggregate([
    { $match: { status: "returned", city: { $exists: true, $ne: null } } },
    { $group: { _id: "$city", returnCount: { $sum: 1 } } },
    { $sort: { returnCount: -1 } },
    { $limit: 5 }
  ]);

  // Business Performance Metrics
  const deliveredOrdersList = await Order.find({ userId, status: "delivered" }).lean();
  const expensesList = await Expense.find({ userId }).lean();
  
  let deliveredRevenue = 0;
  let productCost = 0;
  deliveredOrdersList.forEach((o: any) => {
    deliveredRevenue += o.codAmount || 0;
    productCost += (o.costPrice || 0) * (o.quantity || 1);
  });

  let totalExpenses = 0;
  expensesList.forEach((e: any) => {
    totalExpenses += e.amount || 0;
  });

  const estimatedProfit = deliveredRevenue - productCost - totalExpenses;

  // Order stats
  const totalOrders = await Order.countDocuments({ userId });
  const returnedOrders = await Order.countDocuments({ userId, status: "returned" });
  const pendingOrders = await Order.countDocuments({ userId, status: "pending" });
  const successfulDeliveries = deliveredOrdersList.length;

  // Recent High Risk Orders
  const recentHighRiskOrders = await Order.find({ userId, riskScore: { $gt: 70 } })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return (
    <div className="flex min-h-screen w-full bg-gray-50 dark:bg-slate-950">
      <Sidebar
        businessName={(session.user as any)?.businessName}
        userName={session.user?.name}
        role={(session.user as any)?.role}
      />

      <div className="flex flex-1 flex-col pt-14 md:pt-0 md:pl-64">
        <main className="flex-1 overflow-y-auto">
          <div className="py-6 pb-16 space-y-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Business Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Welcome back, {(session.user as any)?.businessName || session.user?.name}
              </p>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              {/* Top Business Metrics */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-16 h-16 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4"></div>
                  <div className="flex items-center justify-between relative z-10">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Estimated Profit</p>
                    <DollarSign className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white relative z-10">
                    Rs {estimatedProfit.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Delivered Revenue</p>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                    Rs {deliveredRevenue.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Expenses</p>
                    <Receipt className="h-5 w-5 text-orange-500" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                    Rs {totalExpenses.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Orders</p>
                    <Package className="h-5 w-5 text-indigo-500" />
                  </div>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                    {totalOrders}
                  </p>
                </div>
              </div>

              {/* Order Status Breakdown */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
                 <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800/50 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-400">Delivered</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-300">{successfulDeliveries}</p>
                    </div>
                    <div className="bg-green-100 dark:bg-green-800/50 p-3 rounded-full">
                      <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                 </div>
                 
                 <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-100 dark:border-yellow-800/50 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Pending & Processing</p>
                      <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">{pendingOrders}</p>
                    </div>
                    <div className="bg-yellow-100 dark:bg-yellow-800/50 p-3 rounded-full">
                      <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                 </div>

                 <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800/50 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-400">Returned</p>
                      <p className="text-2xl font-bold text-red-900 dark:text-red-300">{returnedOrders}</p>
                    </div>
                    <div className="bg-red-100 dark:bg-red-800/50 p-3 rounded-full">
                      <PackageX className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                 </div>
              </div>

              {/* Lower Grids: High Risk Orders & Hotspots */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* High Risk Pipeline */}
                <div className="rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full">
                  <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                      Recent High-Risk Orders
                    </h3>
                  </div>
                  <div className="p-0 flex-1">
                    {recentHighRiskOrders.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400 flex flex-col items-center">
                         <AlertTriangle className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                         No high-risk orders found.
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {recentHighRiskOrders.map((order: any) => (
                           <li key={order._id.toString()} className="flex justify-between items-center px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">{order.customerName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{order.phone} • {order.city}</p>
                              </div>
                              <div className="text-right">
                                <span className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:text-red-300">
                                  Risk: {order.riskScore}%
                                </span>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 capitalize">{order.status}</p>
                              </div>
                           </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {recentHighRiskOrders.length > 0 && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-center">
                      <Link href="/dashboard/order/history" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500">
                        View All Orders &rarr;
                      </Link>
                    </div>
                  )}
                </div>

                {/* Return Hotspots */}
                <div className="rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full">
                  <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-red-500" />
                      Global Return Hotspots
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                       Crowdsourced intelligence of cities with highest return density.
                    </p>
                  </div>
                  <div className="p-0 flex-1">
                    {topReturnCities.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
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
