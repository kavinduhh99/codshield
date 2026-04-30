import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Payment from "@/models/Payment";
import User from "@/models/User";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const payments = await Payment.find().populate("userId", "name email businessName").sort({ createdAt: -1 });
    return NextResponse.json(payments);
  } catch (error) {
    console.error("Admin Payments GET Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const payload = await req.json();
    const { userId, amount, plan, status, paymentMethod, paymentDate, subscriptionMonths, notes } = payload;
    await connectDB();
 
    const payment = await Payment.create({
      userId,
      amount: amount || 500,
      plan: plan || "Pro",
      status: status || "pending",
      paymentMethod: paymentMethod || "Bank Transfer",
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      subscriptionMonths: subscriptionMonths || 1,
      notes: notes || "",
    });

    // If payment is already marked as paid, update user subscription
    if (payment.status === "paid") {
      const user = await User.findById(payment.userId);
      if (user) {
        const months = payment.subscriptionMonths || 1;
        const currentEndDate = (user.subscription as any)?.endDate ? new Date((user.subscription as any).endDate) : new Date();
        
        // If current subscription is still valid, extend from that date. Otherwise, start from now.
        const startFrom = currentEndDate > new Date() ? currentEndDate : new Date();
        const newEndDate = new Date(startFrom.getTime() + months * 30 * 24 * 60 * 60 * 1000);

        user.subscription = {
          plan: "Pro",
          startDate: (user.subscription as any)?.startDate || new Date(),
          endDate: newEndDate,
          isActive: true,
        };
        
        // Reactivate account and reset payment status
        user.status = "active";
        user.paymentStatus = "paid";
        
        await user.save();
      }
    }

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Admin Payments POST Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
