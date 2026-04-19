import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import { Sidebar } from "@/components/layout/Sidebar";
import Order from "@/models/Order";
import { Package, MapPin, Phone, ShieldAlert, CheckCircle, Clock, XCircle } from "lucide-react";
import { redirect } from "next/navigation";
import { OrderActions } from "./OrderActions";

// Utility to render the status icon
function getStatusIcon(status: string) {
  switch (status) {
    case "delivered":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "returned":
      return <XCircle className="h-5 w-5 text-red-500" />;
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

export default async function OrderHistoryPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  await connectDB();

  // Fetch orders directly in the server component for speed
  const ordersQuery = await Order.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean();
  
  // Serialize complex MongoDB objects so React Server Components can render them
  const orders = ordersQuery.map(order => ({
    ...order,
    _id: order._id.toString(),
    userId: order.userId.toString(),
    createdAt: order.createdAt?.toISOString(),
    updatedAt: order.updatedAt?.toISOString()
  }));

  return (
    <div className="flex min-h-screen w-full bg-gray-50 dark:bg-slate-950 font-sans">
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
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 mt-8">
              {/* Data Table */}
              <div className="overflow-x-auto bg-white dark:bg-slate-900 shadow sm:rounded-lg border border-transparent dark:border-slate-800">
                <ul role="list" className="divide-y divide-gray-200 dark:divide-slate-800 min-w-[600px] md:min-w-full">
                  {orders.length === 0 ? (
                    <li className="px-6 py-12 text-center text-gray-500 dark:text-slate-400">
                      <Package className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-600 mb-4" />
                      No orders found. Add your first order!
                    </li>
                  ) : (
                    orders.map((order: any) => (
                      <li key={order._id} className="p-6 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 max-w-md">
                            <div className="flex-shrink-0">
                              {getStatusIcon(order.status)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-slate-200 truncate">
                                {order.customerName}
                              </p>
                              <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500 dark:text-slate-400">
                                <span className="flex items-center">
                                  <Phone className="mr-1.5 h-3 w-3" />
                                  {order.phone}
                                </span>
                                <span className="flex items-center truncate max-w-[200px]">
                                  <MapPin className="mr-1.5 h-3 w-3" />
                                  {order.address}
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
                        
                        {order.status === "pending" && (
                          <div className="mt-4 flex flex-col sm:flex-row sm:justify-between items-center bg-gray-50/50 dark:bg-slate-800/30 -mx-6 -mb-6 px-6 py-3 border-t border-gray-100 dark:border-slate-800">
                             <span className="text-xs text-gray-500 dark:text-slate-400 mb-2 sm:mb-0">
                               Update status securely to feed the global risk engine.
                             </span>
                             <OrderActions orderId={order._id} currentStatus={order.status} />
                          </div>
                        )}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
