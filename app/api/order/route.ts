import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Order from "@/models/Order";

// Add a new order
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { customerName, phone, phone2, address, city, riskScore } = await req.json();

    if (!customerName || !phone || !address || !city) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    await connectDB();

    const normalizedPhone = phone.replace(/[^0-9+]/g, "").replace(/^0/, "+94");
    const normalizedPhone2 = phone2 && typeof phone2 === 'string' 
      ? phone2.replace(/[^0-9+]/g, "").replace(/^0/, "+94") 
      : undefined;

    const newOrder = await Order.create({
      userId: session.user.id,
      customerName,
      phone: normalizedPhone,
      ...(normalizedPhone2 && { phone2: normalizedPhone2 }),
      address,
      city,
      riskScore: riskScore || 0,
      status: "pending",
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("[OrdersAPI] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Get all orders for the current business
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const orders = await Order.find({ userId: session.user.id }).sort({ createdAt: -1 });

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error("[OrdersAPI GET] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
