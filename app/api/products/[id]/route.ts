import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import ProductCategory from "@/models/ProductCategory";
import { checkSubscription } from "@/lib/subscription";
import mongoose from "mongoose";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { authorized, response, session } = await checkSubscription();
    if (!authorized) return response;

    await dbConnect();
    const body = await req.json();

    const { id } = await params;
    const { name, sku, category, costPrice, sellingPrice, stock, lowStockAlert, active } = body;

    // Handle Category Creation
    if (category && category !== "General") {
      const normalizedCat = category.trim();
      const existingCat = await ProductCategory.findOne({ 
        userId: (session as any).user.id, 
        name: { $regex: new RegExp(`^${normalizedCat}$`, "i") } 
      });
      if (!existingCat) {
        await ProductCategory.create({
          userId: new mongoose.Types.ObjectId((session as any).user.id),
          name: normalizedCat
        });
      }
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: id, userId: (session as any).user.id },
      { 
        $set: {
          ...(name && { name }),
          ...(sku && { sku }),
          ...(category && { category }),
          ...(costPrice !== undefined && { costPrice }),
          ...(sellingPrice !== undefined && { sellingPrice }),
          ...(stock !== undefined && { stock }),
          ...(lowStockAlert !== undefined && { lowStockAlert }),
          ...(active !== undefined && { active }),
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error: any) {
    console.error("PUT Product Error:", error);
    return NextResponse.json({ message: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { authorized, response, session } = await checkSubscription();
    if (!authorized) return response;

    await dbConnect();

    const { id } = await params;
    const deletedProduct = await Product.findOneAndDelete({
      _id: id,
      userId: (session as any).user.id,
    });

    if (!deletedProduct) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Product deleted" }, { status: 200 });
  } catch (error: any) {
    console.error("DELETE Product Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
