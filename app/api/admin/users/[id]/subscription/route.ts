import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    // Strict Admin Verifier
    if (!session || !session.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admins only" }, { status: 403 });
    }

    const { isActive } = await req.json();

    if (typeof isActive !== "boolean") {
      return NextResponse.json({ message: "Invalid payload format" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    user.subscription.isActive = isActive;

    if (isActive) {
      // Automatically add 30 days if toggled to active
      const now = new Date();
      user.subscription.startDate = now;
      user.subscription.endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else {
      // Kill the pass immediately otherwise
      user.subscription.endDate = new Date();
    }

    await user.save();

    return NextResponse.json({ message: "Subscription updated successfully", subscription: user.subscription }, { status: 200 });

  } catch (error) {
    console.error("[AdminUserAPI] Error patching subscription:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
