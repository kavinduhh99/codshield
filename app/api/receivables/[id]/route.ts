import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Receivable from "@/models/Receivable";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const existing = await Receivable.findOne({ _id: id, userId: session.user.id });
    if (!existing)
      return NextResponse.json({ message: "Receivable not found" }, { status: 404 });

    const body = await req.json();
    const {
      title, sourceType, sourceName, amount, expectedDate,
      status, relatedOrderId, notes, receivedDate,
    } = body;

    if (title !== undefined) existing.title = title.trim();
    if (sourceType !== undefined) existing.sourceType = sourceType;
    if (sourceName !== undefined) existing.sourceName = sourceName;
    if (amount !== undefined) existing.amount = amount;
    if (expectedDate !== undefined) existing.expectedDate = new Date(expectedDate);
    if (status !== undefined) existing.status = status;
    if (relatedOrderId !== undefined) existing.relatedOrderId = relatedOrderId;
    if (notes !== undefined) existing.notes = notes;
    if (receivedDate !== undefined) existing.receivedDate = receivedDate ? new Date(receivedDate) : undefined;

    // Auto-set receivedDate when marking received
    if (status === "received" && !existing.receivedDate) {
      existing.receivedDate = new Date();
    }

    await existing.save();
    return NextResponse.json(existing, { status: 200 });
  } catch (error) {
    console.error("[Receivables PUT]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectDB();

    const deleted = await Receivable.findOneAndDelete({ _id: id, userId: session.user.id });
    if (!deleted)
      return NextResponse.json({ message: "Receivable not found" }, { status: 404 });

    return NextResponse.json({ message: "Deleted" }, { status: 200 });
  } catch (error) {
    console.error("[Receivables DELETE]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
