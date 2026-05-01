import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import SupportTicket from "@/models/SupportTicket";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, adminReply } = body;

    await connectDB();
    
    const update: any = {};
    if (status) update.status = status;
    if (adminReply) update.adminReply = adminReply;

    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    );

    if (!ticket) {
      return NextResponse.json({ message: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Admin Support API PUT Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
