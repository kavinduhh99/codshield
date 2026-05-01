import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import SupportTicket from "@/models/SupportTicket";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const tickets = await SupportTicket.find({ userId: session.user.id }).sort({ createdAt: -1 });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Support API GET Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { subject, message, category, priority, pageUrl, screenshotUrl } = body;

    if (!subject || !message) {
      return NextResponse.json({ message: "Subject and message are required" }, { status: 400 });
    }

    await connectDB();
    const ticket = await SupportTicket.create({
      userId: new mongoose.Types.ObjectId(session.user.id),
      businessName: (session.user as any).businessName || "Unknown",
      userEmail: session.user.email || "no-email@bizflow.com",
      subject,
      message,
      category: category || "general",
      priority: priority || "low",
      pageUrl,
      screenshotUrl,
      status: "open",
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Support API POST Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
