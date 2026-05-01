import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import CodRiskSeed from "@/models/CodRiskSeed";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { records } = body; // Array of objects

    if (!records || !Array.isArray(records)) {
      return NextResponse.json({ message: "Invalid records format" }, { status: 400 });
    }

    await connectDB();

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    const adminId = new mongoose.Types.ObjectId(session.user.id);

    // Process in batches or individually to handle errors per row
    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      try {
        if (!rec.phone) {
          throw new Error(`Row ${i + 1}: Phone number is missing`);
        }
        const targetIsGlobal = rec.isGlobal !== undefined ? rec.isGlobal : true;
        const targetBusinessId = rec.assignedBusinessId ? new mongoose.Types.ObjectId(rec.assignedBusinessId) : undefined;

        const existingRecord = await CodRiskSeed.findOne({
          phone: String(rec.phone),
          isGlobal: targetIsGlobal,
          assignedBusinessId: targetBusinessId
        });

        if (existingRecord) {
          existingRecord.deliveredCount += (Number(rec.deliveredCount) || 0);
          existingRecord.returnedCount += (Number(rec.returnedCount) || 0);
          if (!existingRecord.customerName && rec.customerName) existingRecord.customerName = rec.customerName;
          if (!existingRecord.address && rec.address) existingRecord.address = rec.address;
          await existingRecord.save();
        } else {
          await CodRiskSeed.create({
            phone: String(rec.phone),
            customerName: rec.customerName,
            address: rec.address,
            deliveredCount: Number(rec.deliveredCount) || 0,
            returnedCount: Number(rec.returnedCount) || 0,
            source: rec.source || "Bulk Import",
            notes: rec.notes,
            isGlobal: targetIsGlobal,
            assignedBusinessId: targetBusinessId,
            createdByAdminId: adminId,
          });
        }
        results.success++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(err.message || `Row ${i + 1}: Unknown error`);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Admin CodRiskSeed Bulk POST Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
