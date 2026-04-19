import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        "subscription.isActive": true,
        "subscription.plan": "pro",
        "subscription.startDate": new Date(),
        "subscription.endDate": thirtyDaysFromNow,
        paymentStatus: "none",
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Payment verified and account upgraded." });
  } catch (error) {
    console.error("[AdminVerifyPayment] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
