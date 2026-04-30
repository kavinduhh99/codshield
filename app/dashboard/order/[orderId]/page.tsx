import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import { Sidebar } from "@/components/layout/Sidebar";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { Package, MapPin, Phone, ShieldAlert, CheckCircle, Clock, XCircle, ArrowLeft, Calendar, Truck, DollarSign, Tag, User, FileText, Pencil } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { OrderActions } from "../history/OrderActions";
import mongoose from "mongoose";

// Utility to render the status icon
function getStatusIcon(status: string) {
  switch (status) {
    case "delivered":
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    case "returned":
      return <XCircle className="h-6 w-6 text-red-500" />;
    case "cancelled":
      return <XCircle className="h-6 w-6 text-gray-500" />;
    case "shipped":
      return <Package className="h-6 w-6 text-purple-500" />;
    case "processing":
      return <Clock className="h-6 w-6 text-blue-500" />;
    default:
      return <Clock className="h-6 w-6 text-yellow-500" />;
  }
}

// Utility to render the risk badge
function RiskBadge({ score }: { score: number }) {
  if (score >= 100) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
        <ShieldAlert className="mr-1 h-4 w-4" /> High Risk ({score})
      </span>
    );
  } else if (score >= 50) {
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
        <ShieldAlert className="mr-1 h-4 w-4" /> Warning ({score})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
      <ShieldAlert className="mr-1 h-4 w-4" /> Safe ({score})
    </span>
  );
}

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    redirect("/dashboard/order/history");
  }

  await connectDB();
  
  // Ensure Product model is loaded
  Product.init();

  const order = await Order.findOne({ 
    _id: orderId, 
    userId: session.user.id 
  }).populate("productId", "name sku").lean() as any;

  if (!order) {
    redirect("/dashboard/order/history");
  }

  const isReturned = order.status === "returned";
  const createdDate = new Date(order.createdAt).toLocaleString();
  const updatedDate = new Date(order.updatedAt).toLocaleString();

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
            <div className="mx-auto max-w-5xl px-4 sm:px-6 md:px-8 flex flex-col gap-6">
              
              {/* Top Navigation & Header */}
              <div className="flex flex-col gap-4">
                <Link
                  href="/dashboard/order/history"
                  className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors w-fit"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back to Orders
                </Link>
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 bg-gray-50 dark:bg-slate-800 p-3 rounded-full">
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                        Order #{order._id.toString().slice(-6).toUpperCase()}
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-300 capitalize">
                          {order.status}
                        </span>
                      </h1>
                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-slate-400">
                        <span className="flex items-center"><Calendar className="mr-1 h-4 w-4" /> {createdDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <RiskBadge score={order.riskScore} />
                    {isReturned && order.returnReason && (
                       <span className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md border border-red-100 dark:border-red-800/30">
                         Reason: {order.returnReason}
                       </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-wrap gap-2 items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">Quick Actions</span>
                <div className="flex flex-wrap items-center gap-2">
                  {(order.status === "pending" || order.status === "processing") && (
                    <Link
                      href={`/dashboard/orders/${order._id.toString()}/edit`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit Order
                    </Link>
                  )}
                  <OrderActions orderId={order._id.toString()} currentStatus={order.status} />
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Column (Customer & Product) */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Customer Information */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                      <User className="mr-2 h-5 w-5 text-gray-400" /> Customer Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-slate-400">Name</p>
                        <p className="font-medium text-gray-900 dark:text-white">{order.customerName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-slate-400">Phone Number(s)</p>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-gray-900 dark:text-white flex items-center">
                            <Phone className="mr-1 h-3 w-3 text-gray-400" /> {order.phone}
                          </span>
                          {order.phone2 && (
                            <span className="font-medium text-gray-900 dark:text-white flex items-center">
                              <Phone className="mr-1 h-3 w-3 text-gray-400" /> {order.phone2}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500 dark:text-slate-400">Delivery Address</p>
                        <p className="font-medium text-gray-900 dark:text-white flex items-start mt-1">
                          <MapPin className="mr-1 h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span>{order.address}<br/>{order.city}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                    <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                        <Tag className="mr-2 h-5 w-5 text-gray-400" /> Ordered Items
                      </h2>
                      
                      {/* ── Mobile Item Cards ── */}
                      <div className="sm:hidden space-y-4">
                        {order.items && order.items.length > 0 ? order.items.map((item: any, i: number) => (
                          <div key={i} className="bg-gray-50 dark:bg-slate-800/40 p-3 rounded-lg border border-gray-100 dark:border-slate-800/50">
                            <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{item.productName}</p>
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>{item.sku || "N/A"}</span>
                              <span>{item.quantity} x Rs. {item.unitSellingPrice?.toLocaleString()}</span>
                            </div>
                            <div className="mt-2 text-right text-sm font-bold text-gray-900 dark:text-white">
                              Rs. {item.lineTotal?.toLocaleString()}
                            </div>
                          </div>
                        )) : (
                          <div className="bg-gray-50 dark:bg-slate-800/40 p-3 rounded-lg border border-gray-100 dark:border-slate-800/50">
                            <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{order.productNameText || "Legacy Item"}</p>
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>N/A</span>
                              <span>{order.quantity} x Rs. {order.sellingPrice?.toLocaleString()}</span>
                            </div>
                            <div className="mt-2 text-right text-sm font-bold text-gray-900 dark:text-white">
                              Rs. {((order.sellingPrice || 0) * (order.quantity || 1)).toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ── Desktop Item Table ── */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-slate-800/50 dark:text-gray-400">
                            <tr>
                              <th className="px-4 py-3 rounded-l-lg">Product</th>
                              <th className="px-4 py-3">SKU</th>
                              <th className="px-4 py-3 text-center">Qty</th>
                              <th className="px-4 py-3 text-right">Unit Price</th>
                              <th className="px-4 py-3 text-right rounded-r-lg">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items && order.items.length > 0 ? order.items.map((item: any, i: number) => (
                              <tr key={i} className="border-b dark:border-slate-800 last:border-0">
                                <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">{item.productName}</td>
                                <td className="px-4 py-4 text-gray-500 dark:text-gray-400">{item.sku || "N/A"}</td>
                                <td className="px-4 py-4 text-center font-medium">{item.quantity}</td>
                                <td className="px-4 py-4 text-right">Rs. {(item.unitSellingPrice || 0).toLocaleString()}</td>
                                <td className="px-4 py-4 text-right font-semibold text-gray-900 dark:text-white">Rs. {(item.lineTotal || 0).toLocaleString()}</td>
                              </tr>
                            )) : (
                              <tr className="border-b dark:border-slate-800 last:border-0">
                                <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">{order.productNameText || "Legacy Item"}</td>
                                <td className="px-4 py-4 text-gray-500 dark:text-gray-400">N/A</td>
                                <td className="px-4 py-4 text-center font-medium">{order.quantity}</td>
                                <td className="px-4 py-4 text-right">Rs. {(order.sellingPrice || 0).toLocaleString()}</td>
                                <td className="px-4 py-4 text-right font-semibold text-gray-900 dark:text-white">Rs. {((order.sellingPrice || 0) * (order.quantity || 1)).toLocaleString()}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                </div>

                {/* Right Column (Financials & Shipping) */}
                <div className="space-y-6">
                  
                  {/* Financial Summary */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                      <DollarSign className="mr-2 h-5 w-5 text-gray-400" /> Financial Summary
                    </h2>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between text-gray-500 dark:text-slate-400">
                        <span>Items Subtotal</span>
                        <span>Rs. {(order.itemsSubtotal || (order.items && order.items.length > 0 ? order.items.reduce((sum: number, item: any) => sum + (item.lineTotal || 0), 0) : ((order.sellingPrice || 0) * (order.quantity || 1)))).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-500 dark:text-slate-400">
                        <span>Delivery Fee</span>
                        <span>Rs. {(order.deliveryFee || 0).toLocaleString()}</span>
                      </div>
                      {(order.discount || 0) > 0 && (
                        <div className="flex justify-between text-green-600 dark:text-green-400">
                          <span>Discount</span>
                          <span>- Rs. {(order.discount || 0).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="pt-3 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-gray-900 dark:text-white text-base">Total Amount</span>
                          <span className="block text-[10px] font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 mt-1 rounded w-fit border border-gray-200 dark:border-gray-700">
                            {order.paymentMethod || 'COD'} &middot; <span className="capitalize">{order.paymentStatus || 'unpaid'}</span>
                          </span>
                        </div>
                        <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                          Rs. {(order.totalAmount || order.codAmount || ((order.itemsSubtotal || (order.items && order.items.length > 0 ? order.items.reduce((sum: number, item: any) => sum + (item.lineTotal || 0), 0) : ((order.sellingPrice || 0) * (order.quantity || 1)))) + (order.deliveryFee || 0) - (order.discount || 0))).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Info */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center mb-4">
                      <Truck className="mr-2 h-5 w-5 text-gray-400" /> Shipping Info
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Courier Service</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {order.courierName || "Not assigned"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Tracking Number</p>
                        <p className="font-medium text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded w-fit mt-1">
                          {order.trackingNumber || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-slate-400">Last Updated</p>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {updatedDate}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Internal Notes */}
                  {order.notes && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/10 p-6 rounded-xl border border-yellow-200 dark:border-yellow-800/30">
                      <h2 className="text-sm font-semibold text-yellow-800 dark:text-yellow-500 flex items-center mb-2">
                        <FileText className="mr-2 h-4 w-4" /> Order Notes
                      </h2>
                      <p className="text-sm text-yellow-700 dark:text-yellow-600/80 whitespace-pre-wrap">
                        {order.notes}
                      </p>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
