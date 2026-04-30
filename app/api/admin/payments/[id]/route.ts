import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Payment from "@/models/Payment";
import User from "@/models/User";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const payload = await req.json();
    await connectDB();

    const payment = await Payment.findById(id);
    if (!payment) {
      return NextResponse.json({ message: "Payment not found" }, { status: 404 });
    }

    const wasPaid = payment.status === "paid";
    const { status, amount, paymentMethod, paymentDate, subscriptionMonths, notes } = payload;
    
    if (status !== undefined) payment.status = status;
    if (amount !== undefined) payment.amount = amount;
    if (paymentMethod !== undefined) payment.paymentMethod = paymentMethod;
    if (paymentDate !== undefined) payment.paymentDate = new Date(paymentDate);
    if (subscriptionMonths !== undefined) payment.subscriptionMonths = subscriptionMonths;
    if (notes !== undefined) payment.notes = notes;
    await payment.save();

    // If payment status changed to paid, update user subscription
    if (!wasPaid && payment.status === "paid") {
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

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Admin Payment PUT Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    await Payment.findByIdAndDelete(id);
    return NextResponse.json({ message: "Payment deleted" });
  } catch (error) {
    console.error("Admin Payment DELETE Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
