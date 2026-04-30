import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Order from "@/models/Order";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    // Fetch users with order counts
    const users = await User.find({ role: "business" }).sort({ createdAt: -1 });
    
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const orderCount = await Order.countDocuments({ userId: user._id });
        return {
          ...user.toObject(),
          orderCount,
        };
      })
    );

    return NextResponse.json(usersWithStats);
  } catch (error) {
    console.error("Admin Users API Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
