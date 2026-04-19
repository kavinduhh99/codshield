import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { sendAdminPaymentNotification } from "@/lib/mail";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { paymentStatus: "pending_verification" },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Trigger Admin Email Notification (non-blocking)
    sendAdminPaymentNotification(
      updatedUser.name,
      updatedUser.businessName,
      updatedUser.email
    ).catch(console.error);

    return NextResponse.json({ message: "Admin notified successfully." });
  } catch (error) {
    console.error("[BillingNotify] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
