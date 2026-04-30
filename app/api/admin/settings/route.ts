import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import AdminSettings from "@/models/AdminSettings";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = await AdminSettings.create({});
    }
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Admin Settings GET Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const payload = await req.json();
    await connectDB();
    
    let settings = await AdminSettings.findOne();
    if (!settings) {
      settings = new AdminSettings(payload);
    } else {
      Object.assign(settings, payload);
    }
    
    await settings.save();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Admin Settings PUT Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
