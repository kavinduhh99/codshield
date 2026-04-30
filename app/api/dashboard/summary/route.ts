import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const userId = session.user.id;

    // Date boundaries
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // ── Fetch in parallel ──
    const [allOrders, lowStockProducts] = await Promise.all([
      Order.find({ userId }).sort({ createdAt: -1 }).lean(),
      Product.find({ userId, active: true }).lean(),
    ]);

    // ── Today's orders ──
    const todayOrders = allOrders.filter(o => {
      const d = new Date(o.createdAt);
      return d >= todayStart && d <= todayEnd;
    });

    // Today Revenue — delivered today, paid or COD
    let todayRevenue = 0;
    let todayReturnLoss = 0;
    let todayOrderCount = todayOrders.length;

    for (const o of todayOrders) {
      const isPaidOrCOD = o.paymentMethod === "COD" || o.paymentStatus === "paid";
      if (o.status === "delivered" && isPaidOrCOD) {
        if (o.items && o.items.length > 0) {
          for (const item of o.items as any[]) {
            todayRevenue += (item.unitSellingPrice || 0) * (item.quantity || 1);
          }
        } else {
          todayRevenue += (o.sellingPrice || 0) * (o.quantity || 1);
        }
        todayRevenue -= o.discount || 0;
      }
      if (o.status === "returned") {
        todayReturnLoss += o.deliveryFee || 0;
      }
    }

    // ── Pipeline counts (all time) ──
    const pipeline = {
      pending:    allOrders.filter(o => o.status === "pending").length,
      processing: allOrders.filter(o => o.status === "processing").length,
      shipped:    allOrders.filter(o => o.status === "shipped").length,
      delivered:  allOrders.filter(o => o.status === "delivered").length,
      returned:   allOrders.filter(o => o.status === "returned").length,
      cancelled:  allOrders.filter(o => o.status === "cancelled").length,
    };

    // ── Alerts ──
    const lowStock = lowStockProducts
      .filter(p => p.stock <= (p.lowStockAlert ?? 5))
      .map(p => ({ _id: p._id.toString(), name: p.name, sku: p.sku, stock: p.stock, lowStockAlert: p.lowStockAlert }))
      .slice(0, 10);

    const highRiskOrders = allOrders
      .filter(o => (o.riskScore || 0) >= 100 && o.status === "pending")
      .slice(0, 5)
      .map(o => ({
        _id: o._id.toString(),
        customerName: o.customerName,
        phone: o.phone,
        riskScore: o.riskScore,
        createdAt: o.createdAt,
      }));

    const recentReturns = allOrders
      .filter(o => o.status === "returned")
      .slice(0, 5)
      .map(o => ({
        _id: o._id.toString(),
        customerName: o.customerName,
        phone: o.phone,
        returnReason: o.returnReason,
        deliveryFee: o.deliveryFee,
        createdAt: o.createdAt,
      }));

    // ── Recent Orders ──
    const recentOrders = allOrders.slice(0, 10).map(o => {
      const total = o.totalAmount || o.codAmount ||
        ((o.itemsSubtotal || (o.sellingPrice || 0) * (o.quantity || 1)) + (o.deliveryFee || 0) - (o.discount || 0));
      return {
        _id: o._id.toString(),
        customerName: o.customerName,
        phone: o.phone,
        city: o.city,
        status: o.status,
        totalAmount: total,
        paymentMethod: o.paymentMethod || "COD",
        paymentStatus: o.paymentStatus || "unpaid",
        itemCount: o.items?.length || 1,
        createdAt: o.createdAt,
      };
    });

    return NextResponse.json({
      today: { revenue: todayRevenue, orderCount: todayOrderCount, returnLoss: todayReturnLoss },
      pipeline,
      alerts: { lowStock, highRiskOrders, recentReturns },
      recentOrders,
    });
  } catch (error) {
    console.error("[DashboardSummary] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
