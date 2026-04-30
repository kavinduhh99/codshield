import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Settings, { defaultSettings } from "@/models/Settings";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const settings = await Settings.findOne({ userId: session.user.id }).lean();

    if (!settings) {
      return NextResponse.json({ settings: defaultSettings }, { status: 200 });
    }

    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    console.error("[SettingsAPI_GET] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    await connectDB();

    // Prevent modification of userId or other protected fields
    delete body._id;
    delete body.userId;
    delete body.createdAt;
    delete body.updatedAt;

    // Use $set for partial update and upsert to create if it doesn't exist
    const updatedSettings = await Settings.findOneAndUpdate(
      { userId: session.user.id },
      { $set: body },
      { new: true, upsert: true, runValidators: true, lean: true }
    );

    return NextResponse.json({ message: "Settings updated successfully", settings: updatedSettings }, { status: 200 });
  } catch (error) {
    console.error("[SettingsAPI_PUT] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
