import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Settings, { defaultSettings } from "@/models/Settings";
import { redirect } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";

export default async function WaybillPage({ params }: { params: Promise<{ orderId: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  await connectDB();
  const { orderId } = await params;

  const [order, settingsDoc] = await Promise.all([
    Order.findOne({ _id: orderId, userId: session.user.id }).populate('productId').lean(),
    Settings.findOne({ userId: session.user.id }).lean(),
  ]);

  if (!order) {
    return <div className="p-10 text-center">Order not found</div>;
  }

  const settings = settingsDoc ?? defaultSettings;
  const biz = settings.businessProfile;
  const wb  = settings.waybillSettings;

  // Sender info: waybill-specific overrides → businessProfile → session fallback
  const senderName    = wb.senderName    || biz.businessName    || (session.user as any)?.businessName || "Your Business";
  const senderPhone   = wb.senderPhone   || biz.businessPhone   || "";
  const senderAddress = wb.pickupAddress || biz.businessAddress || "";

  return (
    <div className="bg-white text-black min-h-screen font-sans p-8 print:p-0">
      {/* Hide this print button when printing */}
      <div className="mb-8 print:hidden flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div>
          <h2 className="text-lg font-bold">Print Waybill</h2>
          <p className="text-sm text-gray-500">Attach this to the package for the courier.</p>
        </div>
        <PrintButton className="bg-purple-600 text-white px-4 py-2 rounded-md font-medium hover:bg-purple-700 flex items-center gap-2" />
      </div>

      <div className="max-w-2xl mx-auto border-2 border-black print:border-black p-6 print:p-2 bg-white">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-4">
          <div>
            <h1 className="text-3xl font-black tracking-widest">{order.courierName || "COURIER"}</h1>
          </div>
          <div className="text-right">
            <div className="inline-block border-4 border-black px-4 py-2">
              <p className="text-sm font-bold uppercase">{order.paymentMethod === 'COD' ? 'COD AMOUNT' : 'TOTAL (PREPAID)'}</p>
              <p className="text-2xl font-black">Rs {(order.totalAmount || order.codAmount || ((order.itemsSubtotal || (order.items && order.items.length > 0 ? order.items.reduce((sum: number, item: any) => sum + (item.lineTotal || 0), 0) : ((order.sellingPrice || 0) * (order.quantity || 1)))) + (order.deliveryFee || 0) - (order.discount || 0))).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Tracking & Date */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tracking Number</p>
            <p className="text-xl font-mono font-bold tracking-widest">{order.trackingNumber || "N/A"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Order ID</p>
            <p className="text-lg font-mono font-bold">#{order._id.toString().toUpperCase().slice(-8)}</p>
            <p className="text-sm font-mono mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Barcode Placeholder */}
        <div className="w-full flex justify-center mb-6">
          {/* Faking a barcode with a repeating pattern for visual effect, normally would use a barcode library */}
          <div className="flex items-center justify-center h-20 w-3/4 border-y-2 border-black bg-repeating-linear-gradient">
             <div className="w-full h-16 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMDAiPjxyZWN0IHdpZHRoPSIyIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwMCIvPjxyZWN0IHg9IjUiIHdpZHRoPSIxIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwMCIvPjxyZWN0IHg9IjciIHdpZHRoPSIzIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwMCIvPjwvc3ZnPg==')] bg-repeat-x"></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t-2 border-black pt-4">
          
          {/* Receiver */}
          <div className="border-r-2 border-black pr-4">
            <p className="text-sm font-bold uppercase bg-black text-white inline-block px-2 py-1 mb-2">Deliver To</p>
            <h2 className="text-xl font-black mt-2">{order.customerName}</h2>
            <p className="text-lg font-medium mt-1 leading-snug">{order.address}</p>
            <p className="text-lg font-bold mt-1 uppercase">{order.city}</p>
            
            <div className="mt-4 border-t-2 border-dotted border-gray-400 pt-2">
              <p className="text-sm text-gray-600 uppercase font-bold">Contact</p>
              <p className="text-xl font-bold font-mono">{order.phone}</p>
              {order.phone2 && <p className="text-lg font-bold font-mono">{order.phone2}</p>}
            </div>
          </div>

          {/* Sender & Notes */}
          <div className="pl-2 flex flex-col justify-between">
            <div>
              <p className="text-sm font-bold uppercase bg-gray-200 inline-block px-2 py-1 mb-2">Sender</p>
              <h3 className="text-lg font-bold">{senderName}</h3>
              {senderPhone   && <p className="text-sm font-mono font-medium text-gray-700">{senderPhone}</p>}
              {senderAddress && <p className="text-sm text-gray-600 mt-0.5">{senderAddress}</p>}
            </div>

            <div className="mt-4">
              <p className="text-xs font-bold text-gray-500 uppercase">Product Description</p>
              {order.items && order.items.length > 0 ? (
                <ul className="text-sm font-medium mt-1 list-disc list-inside">
                  {order.items.map((item: any, i: number) => (
                    <li key={i} className="truncate">{item.productName} <span className="text-gray-600">(Qty: {item.quantity})</span></li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm font-medium mt-1">{order.productNameText || "Legacy Item"} (Qty: {order.quantity})</p>
              )}
            </div>

            {order.notes && (
              <div className="mt-4 bg-gray-100 p-2 border border-gray-300">
                <p className="text-xs font-bold uppercase mb-1">Notes</p>
                <p className="text-sm font-bold">{order.notes}</p>
              </div>
            )}
          </div>

        </div>

        <div className="mt-4 border-t-2 border-black pt-2 text-center">
           <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Shipped with BizFlow</p>
        </div>
      </div>
    </div>
  );
}
