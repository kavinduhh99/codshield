import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import CodRiskSeed from "@/models/CodRiskSeed";
import mongoose from "mongoose";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    await connectDB();

    let query: any = {};
    if (search) {
      query.$or = [
        { phone: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { source: { $regex: search, $options: "i" } },
      ];
    }

    const [data, total, stats] = await Promise.all([
      CodRiskSeed.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      CodRiskSeed.countDocuments(query),
      CodRiskSeed.aggregate([
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            totalDelivered: { $sum: "$deliveredCount" },
            totalReturned: { $sum: "$returnedCount" },
          }
        }
      ])
    ]);

    // Safer high risk count (returned >= delivered and at least one order)
    const finalHighRiskCount = await CodRiskSeed.countDocuments({
      $and: [
        { $expr: { $gt: [{ $add: ["$deliveredCount", "$returnedCount"] }, 0] } },
        { $expr: { $gte: ["$returnedCount", "$deliveredCount"] } }
      ]
    });

    return NextResponse.json({
      data,
      total,
      stats: {
        ...(stats[0] || { totalRecords: 0, totalDelivered: 0, totalReturned: 0 }),
        highRiskCount: finalHighRiskCount
      }
    });
  } catch (error) {
    console.error("Admin CodRiskSeed GET Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { 
      phone, customerName, address, deliveredCount, returnedCount, 
      source, notes, isGlobal, assignedBusinessId 
    } = body;

    if (!phone) {
      return NextResponse.json({ message: "Phone number is required" }, { status: 400 });
    }

    await connectDB();

    const targetIsGlobal = isGlobal !== undefined ? isGlobal : true;
    const targetBusinessId = assignedBusinessId ? new mongoose.Types.ObjectId(assignedBusinessId) : undefined;

    // Try to find existing record in the same scope
    const existingRecord = await CodRiskSeed.findOne({
      phone,
      isGlobal: targetIsGlobal,
      assignedBusinessId: targetBusinessId
    });

    if (existingRecord) {
      existingRecord.deliveredCount += (deliveredCount || 0);
      existingRecord.returnedCount += (returnedCount || 0);
      // Optionally update name/address if provided and missing
      if (!existingRecord.customerName && customerName) existingRecord.customerName = customerName;
      if (!existingRecord.address && address) existingRecord.address = address;
      if (notes) existingRecord.notes = (existingRecord.notes ? existingRecord.notes + " | " : "") + notes;
      
      await existingRecord.save();
      return NextResponse.json(existingRecord, { status: 200 });
    }

    const newRecord = await CodRiskSeed.create({
      phone,
      customerName,
      address,
      deliveredCount: deliveredCount || 0,
      returnedCount: returnedCount || 0,
      source: source || "Manual Entry",
      notes,
      isGlobal: targetIsGlobal,
      assignedBusinessId: targetBusinessId,
      createdByAdminId: new mongoose.Types.ObjectId(session.user.id),
    });

    return NextResponse.json(newRecord, { status: 201 });
  } catch (error) {
    console.error("Admin CodRiskSeed POST Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    await connectDB();
    await CodRiskSeed.findByIdAndDelete(id);

    return NextResponse.json({ message: "Record deleted" });
  } catch (error) {
    console.error("Admin CodRiskSeed DELETE Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
