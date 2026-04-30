import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import Expense from "@/models/Expense";
import mongoose from "mongoose";
import { checkSubscription } from "@/lib/subscription";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "thisMonth";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let startDate: Date | null = null;
    let endDate: Date | null = null;
    const now = new Date();
    
    if (range === "thisMonth") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (range === "lastMonth") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (range === "thisYear") {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (range === "custom" && startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    }

    const query: any = { userId: session.user.id };
    if (startDate && endDate) {
      query.$or = [
        { date: { $gte: startDate, $lte: endDate } },
        { createdAt: { $gte: startDate, $lte: endDate } }
      ];
    }

    await dbConnect();
    const expenses = await Expense.find(query).sort({ date: -1, createdAt: -1 });

    return NextResponse.json(expenses, { status: 200 });
  } catch (error: any) {
    console.error("GET Expenses Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { authorized, response, session } = await checkSubscription();
    if (!authorized) return response;

    await dbConnect();
    const body = await req.json();
    const { title, amount, category, date, notes } = body;

    if (!title || !amount) {
      return NextResponse.json({ message: "Title and amount are required" }, { status: 400 });
    }

    const newExpense = await Expense.create({
      title,
      amount,
      category: category || "General",
      date: date ? new Date(date) : new Date(),
      notes: notes || "",
      userId: new mongoose.Types.ObjectId((session as any).user.id),
    });

    return NextResponse.json(newExpense, { status: 201 });
  } catch (error: any) {
    console.error("POST Expense Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
