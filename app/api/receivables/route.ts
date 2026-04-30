import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Receivable from "@/models/Receivable";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    await connectDB();
    const receivables = await Receivable.find({ userId: session.user.id })
      .sort({ expectedDate: 1 })
      .lean();

    return NextResponse.json(receivables, { status: 200 });
  } catch (error) {
    console.error("[Receivables GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, sourceType, sourceName, amount, expectedDate, relatedOrderId, notes } = body;

    if (!title?.trim())
      return NextResponse.json({ message: "Title is required" }, { status: 400 });
    if (!sourceType)
      return NextResponse.json({ message: "Source type is required" }, { status: 400 });
    if (amount === undefined || amount < 0)
      return NextResponse.json({ message: "Valid amount is required" }, { status: 400 });
    if (!expectedDate)
      return NextResponse.json({ message: "Expected date is required" }, { status: 400 });

    await connectDB();
    const receivable = await Receivable.create({
      userId: session.user.id,
      title: title.trim(),
      sourceType,
      sourceName: sourceName || "",
      amount,
      expectedDate: new Date(expectedDate),
      status: "pending",
      relatedOrderId: relatedOrderId || "",
      notes: notes || "",
    });

    return NextResponse.json(receivable, { status: 201 });
  } catch (error) {
    console.error("[Receivables POST]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
