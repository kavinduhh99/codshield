import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import ProductCategory from "@/models/ProductCategory";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const categories = await ProductCategory.find({ userId: session.user.id }).sort({ name: 1 });

    return NextResponse.json(categories, { status: 200 });
  } catch (error: any) {
    console.error("GET Product Categories Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const body = await req.json();
    let { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ message: "Invalid category name" }, { status: 400 });
    }

    // Normalize name
    name = name.trim();
    if (!name) {
      return NextResponse.json({ message: "Category name cannot be empty" }, { status: 400 });
    }

    // Check if exists (case-insensitive search is better but requirement says normalize)
    // We'll use a case-insensitive find to be safe, but unique index will handle exact matches.
    const existing = await ProductCategory.findOne({ 
      userId: session.user.id, 
      name: { $regex: new RegExp(`^${name}$`, "i") } 
    });

    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    const newCategory = await ProductCategory.create({
      userId: new mongoose.Types.ObjectId(session.user.id),
      name,
    });

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    console.error("POST Product Category Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
