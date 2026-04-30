import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Settings, { defaultSettings } from "@/models/Settings";
import { redirect } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";
import Image from "next/image";

export default async function InvoicePage({ params }: { params: Promise<{ orderId: string }> }) {
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
  const invSettings = settings.invoiceSettings;

  const bizName    = biz.businessName    || (session.user as any)?.businessName || "Your Business";
  const bizPhone   = biz.businessPhone   || "";
  const bizAddress = biz.businessAddress || "";
  const logoUrl    = biz.logoUrl         || "";
  const showLogo   = invSettings.showLogoOnInvoice && !!logoUrl;
  const invNotes   = invSettings.invoiceNotes || "Thank you for your business!";

  return (
    <div className="bg-white text-black min-h-screen font-sans p-8 print:p-0">
      {/* Hide this print button when printing */}
      <div className="mb-8 print:hidden flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div>
          <h2 className="text-lg font-bold">Print Invoice</h2>
          <p className="text-sm text-gray-500">Ensure your printer is set to A4 portrait.</p>
        </div>
        <PrintButton className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 flex items-center gap-2" />
      </div>

      <div className="max-w-4xl mx-auto border border-gray-200 print:border-none p-10 print:p-0">
        <div className="flex justify-between items-start mb-12">
          <div className="flex items-start gap-4">
            {showLogo && (
              <Image src={logoUrl} alt="Business Logo" width={72} height={72}
                className="object-contain rounded-md border border-gray-100" />
            )}
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-1">INVOICE</h1>
              <p className="text-gray-500 font-medium">#{order._id.toString().toUpperCase().slice(-8)}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-900">{bizName}</h2>
            {bizPhone   && <p className="text-gray-600">{bizPhone}</p>}
            {bizAddress && <p className="text-gray-600 text-sm max-w-xs ml-auto">{bizAddress}</p>}
            <p className="text-gray-400 text-sm mt-1">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="mb-12 border-l-4 border-blue-600 pl-4 bg-gray-50 p-4">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Bill To:</p>
          <h3 className="text-lg font-bold text-gray-900">{order.customerName}</h3>
          <p className="text-gray-700">{order.address}</p>
          <p className="text-gray-700">{order.city}</p>
          <p className="text-gray-700">{order.phone} {order.phone2 ? `/ ${order.phone2}` : ""}</p>
        </div>

        <table className="w-full mb-12 border-collapse">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="py-3 text-left font-bold text-gray-700">Item Description</th>
              <th className="py-3 text-center font-bold text-gray-700 w-24">Qty</th>
              <th className="py-3 text-right font-bold text-gray-700 w-32">Unit Price</th>
              <th className="py-3 text-right font-bold text-gray-700 w-32">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items && order.items.length > 0 ? order.items.map((item: any, i: number) => (
              <tr key={i} className="border-b border-gray-200">
                <td className="py-4">
                  <p className="font-semibold text-gray-900">{item.productName}</p>
                  {item.sku && <p className="text-sm text-gray-500">SKU: {item.sku}</p>}
                </td>
                <td className="py-4 text-center text-gray-700">{item.quantity}</td>
                <td className="py-4 text-right text-gray-700">Rs {(item.unitSellingPrice || 0).toLocaleString()}</td>
                <td className="py-4 text-right font-medium text-gray-900">Rs {(item.lineTotal || 0).toLocaleString()}</td>
              </tr>
            )) : (
              <tr className="border-b border-gray-200">
                <td className="py-4">
                  <p className="font-semibold text-gray-900">{order.productNameText || "Legacy Item"}</p>
                </td>
                <td className="py-4 text-center text-gray-700">{order.quantity}</td>
                <td className="py-4 text-right text-gray-700">Rs {(order.sellingPrice || 0).toLocaleString()}</td>
                <td className="py-4 text-right font-medium text-gray-900">Rs {((order.sellingPrice || 0) * (order.quantity || 1)).toLocaleString()}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-end mb-12">
          <div className="w-1/2">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">Rs {(order.itemsSubtotal || (order.items && order.items.length > 0 ? order.items.reduce((sum: number, item: any) => sum + (item.lineTotal || 0), 0) : ((order.sellingPrice || 0) * (order.quantity || 1)))).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-gray-600">Delivery Fee:</span>
              <span className="font-medium">Rs {(order.deliveryFee || 0).toLocaleString()}</span>
            </div>
            {(order.discount || 0) > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-200 text-green-600">
                <span>Discount:</span>
                <span className="font-medium">- Rs {(order.discount || 0).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between py-4 mt-2 bg-gray-50 px-4 rounded border border-gray-200">
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">Total Amount:</span>
                <span className="text-sm text-gray-500 mt-1 uppercase font-semibold">{order.paymentMethod || 'COD'} / {order.paymentStatus || 'unpaid'}</span>
              </div>
              <span className="text-xl font-bold text-blue-600 mt-1">Rs {(order.totalAmount || order.codAmount || ((order.itemsSubtotal || (order.items && order.items.length > 0 ? order.items.reduce((sum: number, item: any) => sum + (item.lineTotal || 0), 0) : ((order.sellingPrice || 0) * (order.quantity || 1)))) + (order.deliveryFee || 0) - (order.discount || 0))).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="mb-8">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Notes:</p>
            <p className="text-gray-700 italic bg-gray-50 p-4 rounded border border-gray-200">{order.notes}</p>
          </div>
        )}

        <div className="mt-16 text-center text-gray-500 text-sm">
          <p className="font-medium">{invNotes}</p>
          <p className="mt-1 text-gray-400 text-xs">Generated by BizFlow · {bizName}</p>
        </div>
      </div>
    </div>
  );
}
