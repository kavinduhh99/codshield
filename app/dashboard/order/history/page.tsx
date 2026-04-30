import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import { Sidebar } from "@/components/layout/Sidebar";
import Order from "@/models/Order";
import { Package, MapPin, Phone, ShieldAlert, CheckCircle, Clock, XCircle, SearchX } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { OrderActions } from "./OrderActions";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { OrderPagination } from "@/components/orders/OrderPagination";

// Utility to render the status icon
function getStatusIcon(status: string) {
  switch (status) {
    case "delivered":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "returned":
      return <XCircle className="h-5 w-5 text-red-500" />;
    case "cancelled":
      return <XCircle className="h-5 w-5 text-gray-500" />;
    case "shipped":
      return <Package className="h-5 w-5 text-purple-500" />;
    case "processing":
      return <Clock className="h-5 w-5 text-blue-500" />;
    default:
      return <Clock className="h-5 w-5 text-yellow-500" />;
  }
}

// Utility to render the risk badge
function RiskBadge({ score }: { score: number }) {
  if (score >= 100) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
        <ShieldAlert className="mr-1 h-3 w-3" /> High Risk ({score})
      </span>
    );
  } else if (score >= 50) {
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
        <ShieldAlert className="mr-1 h-3 w-3" /> Warning ({score})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
      <ShieldAlert className="mr-1 h-3 w-3" /> Safe ({score})
    </span>
  );
}

export default async function OrderHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    risk?: string;
  }>;
}) {
  const sp = await searchParams;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  await connectDB();

  const page = typeof sp.page === "string" ? parseInt(sp.page, 10) : 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const search = typeof sp.search === "string" ? sp.search : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const risk = typeof sp.risk === "string" ? sp.risk : "";

  // Build the Mongoose query
  const query: any = { userId: session.user.id };

  if (status) {
    query.status = status;
  }

  if (risk) {
    if (risk === "safe") query.riskScore = { $lt: 50 };
    else if (risk === "warning") query.riskScore = { $gte: 50, $lt: 100 };
    else if (risk === "high") query.riskScore = { $gte: 100 };
  }

  if (search) {
    query.$or = [
      { _id: search.length === 24 ? search : undefined }, // Only search ID if it's 24 chars (Mongoose ObjectId)
      { customerName: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { phone2: { $regex: search, $options: "i" } },
      { trackingNumber: { $regex: search, $options: "i" } },
    ].filter(Boolean); // Filter out undefined clauses
  }

  // Handle the case where _id search might be invalid ObjectId string length
  if (query.$or && query.$or.length === 0) {
      delete query.$or;
      if (search) { // if search is not an ObjectId but we still have search term
          query.$or = [
            { customerName: { $regex: search, $options: "i" } },
            { phone: { $regex: search, $options: "i" } },
            { phone2: { $regex: search, $options: "i" } },
            { trackingNumber: { $regex: search, $options: "i" } },
          ]
      }
  }

  // Fetch orders directly in the server component for speed
  const totalItems = await Order.countDocuments(query);
  const totalPages = Math.ceil(totalItems / limit);

  const ordersQuery = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  // Serialize complex MongoDB objects so React Server Components can render them
  const orders = ordersQuery.map(order => ({
    ...order,
    _id: order._id.toString(),
    userId: order.userId.toString(),
    createdAt: order.createdAt?.toISOString(),
    updatedAt: order.updatedAt?.toISOString()
  }));

  const hasFilters = search || status || risk;

  return (
    <div className="flex min-h-screen w-full bg-gray-50 dark:bg-slate-950 font-sans overflow-x-hidden">
      <Sidebar
        businessName={(session.user as any)?.businessName}
        userName={session.user?.name}
        role={session.user?.role}
      />

      <div className="flex flex-1 flex-col pt-14 md:pt-0 md:pl-64">
        <main className="flex-1 overflow-y-auto">
          <div className="py-6 min-h-screen">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">Order History</h1>
              <Link
                href="/dashboard/order/new"
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
              >
                + Add Order
              </Link>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 mt-8">
              
              <OrderFilters />

              {/* Data Table */}
              <div className="overflow-x-auto bg-white dark:bg-slate-900 shadow sm:rounded-lg border border-transparent dark:border-slate-800">
                <ul role="list" className="divide-y divide-gray-200 dark:divide-slate-800 w-full">
                  {orders.length === 0 ? (
                    <li className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                      {hasFilters ? (
                        <>
                           <SearchX className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-600 mb-4" />
                           <p className="mb-4">No orders match your current filters.</p>
                           <Link
                             href="/dashboard/order/history"
                             className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700"
                           >
                             Clear Filters
                           </Link>
                        </>
                      ) : (
                        <>
                           <Package className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-600 mb-4" />
                           <p className="mb-4">No orders yet. Start by adding your first order.</p>
                           <Link
                             href="/dashboard/order/new"
                             className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
                           >
                             + Add First Order
                           </Link>
                        </>
                      )}
                    </li>
                  ) : (
                    orders.map((order: any) => (
                      <li key={order._id} className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        {/* ── Mobile Layout (Card) ── */}
                        <div className="flex flex-col gap-4 sm:hidden">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(order.status)}
                              <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{order.customerName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{order.phone}</p>
                              </div>
                            </div>
                            <RiskBadge score={order.riskScore} />
                          </div>

                          <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-slate-800/40 p-3 rounded-lg border border-gray-100 dark:border-slate-700/50">
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Total Amount</p>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                Rs {order.totalAmount ? order.totalAmount.toLocaleString() : (order.codAmount || 0).toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Payment</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">{order.paymentMethod || 'COD'}</span>
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                                  {order.paymentStatus || 'unpaid'}
                                </span>
                              </div>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> Address
                              </p>
                              <p className="text-xs text-gray-600 dark:text-slate-400 truncate mt-0.5">{order.address}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                             <span className="text-[10px] text-gray-400 font-medium">
                               {new Date(order.createdAt).toLocaleDateString()} · {order.items?.length || 1} Items
                             </span>
                             <div className="flex items-center gap-2">
                               <OrderActions orderId={order._id} currentStatus={order.status} />
                             </div>
                          </div>
                        </div>

                        {/* ── Desktop Layout (Row) ── */}
                        <div className="hidden sm:flex items-center justify-between">
                          <div className="flex items-center space-x-4 max-w-md">
                            <div className="flex-shrink-0">
                              {getStatusIcon(order.status)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-slate-200 truncate">
                                {order.customerName} <span className="ml-2 text-xs font-normal text-gray-500 capitalize px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-700">{order.status}</span>
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-slate-400">
                                <span className="flex items-center">
                                  <Phone className="mr-1.5 h-3 w-3" />
                                  {order.phone}
                                </span>
                                <span className="flex items-center truncate max-w-[200px]">
                                  <MapPin className="mr-1.5 h-3 w-3" />
                                  {order.address}
                                </span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  Rs {order.totalAmount ? order.totalAmount.toLocaleString() : (order.codAmount || 0).toLocaleString()}
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                  {order.paymentMethod || 'COD'}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] capitalize border ${order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}>
                                  {order.paymentStatus || 'unpaid'}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {order.items?.length || 1} Item(s)
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-2">
                             <RiskBadge score={order.riskScore} />
                             <span className="text-xs text-gray-400 dark:text-slate-500">
                               {new Date(order.createdAt).toLocaleDateString()}
                             </span>
                          </div>
                        </div>
                        
                        <div className="hidden sm:flex mt-4 justify-between items-center bg-gray-50/50 dark:bg-slate-800/30 -mx-6 -mb-6 px-6 py-3 border-t border-gray-100 dark:border-slate-800">
                           <span className="text-xs text-gray-500 dark:text-slate-400">
                             Manage order status and print documents.
                           </span>
                           <div className="flex items-center gap-2">
                             <OrderActions orderId={order._id} currentStatus={order.status} />
                           </div>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {orders.length > 0 && (
                <OrderPagination currentPage={page} totalPages={totalPages} totalItems={totalItems} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

