import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Order from "@/models/Order";
import Payment from "@/models/Payment";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      trialUsers,
      paidUsers,
      totalOrders,
      allPayments,
    ] = await Promise.all([
      User.countDocuments({ role: "business" }),
      User.countDocuments({ role: "business", status: "active" }),
      User.countDocuments({ role: "business", status: "suspended" }),
      User.countDocuments({ role: "business", "subscription.plan": { $in: ["Free Trial", "free", "trial"] } }),
      User.countDocuments({ role: "business", "subscription.plan": { $nin: ["Free Trial", "free", "trial", null] } }),
      Order.countDocuments(),
      Payment.find({ status: "paid" }),
    ]);

    // Calculate revenue
    const totalRevenue = allPayments.reduce((acc, p) => acc + p.amount, 0);
    
    // Monthly revenue (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenue = allPayments
      .filter(p => new Date(p.paymentDate || p.createdAt) >= startOfMonth)
      .reduce((acc, p) => acc + p.amount, 0);

    // Trial expired users
    const expiredTrials = await User.countDocuments({
      role: "business",
      "subscription.plan": { $in: ["Free Trial", "free", "trial"] },
      "subscription.endDate": { $lt: new Date() }
    });

    return NextResponse.json({
      totalUsers,
      activeUsers,
      suspendedUsers,
      trialUsers,
      paidUsers,
      totalOrders,
      totalRevenue,
      monthlyRevenue,
      expiredTrials,
    });
  } catch (error) {
    console.error("Admin Analytics API Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
