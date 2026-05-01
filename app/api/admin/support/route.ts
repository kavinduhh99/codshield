import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import SupportTicket from "@/models/SupportTicket";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");

    await connectDB();
    
    let query: any = {};
    if (status && status !== "all") query.status = status;
    if (priority && priority !== "all") query.priority = priority;
    if (category && category !== "all") query.category = category;

    const tickets = await SupportTicket.find(query).sort({ createdAt: -1 });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Admin Support API GET Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
