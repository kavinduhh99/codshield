import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import mongoose from "mongoose";
import { checkSubscription } from "@/lib/subscription";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const products = await Product.find({ userId: session.user.id }).sort({ createdAt: -1 });

    return NextResponse.json(products, { status: 200 });
  } catch (error: any) {
    console.error("GET Products Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { authorized, response, session } = await checkSubscription();
    if (!authorized) return response;

    await dbConnect();
    const body = await req.json();
    const { name, sku, category, costPrice, sellingPrice, stock, lowStockAlert, active } = body;

    const newProduct = await Product.create({
      name,
      sku,
      category: category || "General",
      costPrice: costPrice || 0,
      sellingPrice: sellingPrice || 0,
      stock: stock || 0,
      lowStockAlert: lowStockAlert || 5,
      active: active !== undefined ? active : true,
      userId: new mongoose.Types.ObjectId((session as any).user.id),
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error: any) {
    console.error("POST Product Error:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}
