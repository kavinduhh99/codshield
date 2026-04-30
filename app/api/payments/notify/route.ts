import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Payment from "@/models/Payment";
import User from "@/models/User";
import { sendAdminPaymentNotification } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { amount, paymentMethod, paidDate, referenceNumber, notes, subscriptionMonths } = await req.json();

    if (!paymentMethod) {
      return NextResponse.json({ message: "Payment method is required" }, { status: 400 });
    }

    await connectDB();

    const payment = await Payment.create({
      userId: session.user.id,
      amount: amount || 500,
      plan: "Pro",
      paymentMethod,
      status: "pending",
      paymentDate: paidDate ? new Date(paidDate) : new Date(),
      subscriptionMonths: subscriptionMonths || 1,
      notes: `Ref: ${referenceNumber || "N/A"}\nUser Notes: ${notes || "None"}`,
    });

    // Also update user's internal paymentStatus for dashboard indicators
    await User.findByIdAndUpdate(session.user.id, {
      paymentStatus: "pending_verification"
    });

    // Trigger Admin Email Notification
    const user = await User.findById(session.user.id);
    if (user) {
      sendAdminPaymentNotification(
        user.name,
        user.businessName,
        user.email
      ).catch(console.error);
    }

    return NextResponse.json({ 
      message: "Payment notification sent. Admin will verify and activate your Pro plan.", 
      payment 
    });
  } catch (error) {
    console.error("[PaymentNotify] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
