import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    // Strict Admin check directly intercepting unauthorized queries
    if (!session || !session.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ message: "Forbidden API Access" }, { status: 403 });
    }

    const payload = await req.json();
    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: "User instance undefined" }, { status: 404 });
    }

    // Handles exactly what was requested { "subscription.isActive": boolean } 
    // or standard fallback structures via mongoose assignment mapping natively
    if (payload["subscription.isActive"] !== undefined) {
      const activeState = payload["subscription.isActive"];
      user.subscription.isActive = activeState;

      if (activeState) {
        user.subscription.startDate = new Date();
        user.subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      } else {
        user.subscription.endDate = new Date();
      }
    }

    if (payload.role !== undefined) {
      user.role = payload.role;
    }

    await user.save();
    return NextResponse.json({ message: "Operation Executed Successfully" }, { status: 200 });
  } catch (error) {
    console.error("[Refactored API error]:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
