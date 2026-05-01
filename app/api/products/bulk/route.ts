import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Product from "@/models/Product";
import ProductCategory from "@/models/ProductCategory";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { records } = body;

    if (!records || !Array.isArray(records)) {
      return NextResponse.json({ message: "Invalid records format" }, { status: 400 });
    }

    await connectDB();

    const summary = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      try {
        // Validation
        if (!rec.productName || !rec.sku) {
          throw new Error(`Row ${i + 1}: Missing productName or sku`);
        }

        const sellingPrice = Number(rec.sellingPrice);
        const currentStock = Number(rec.currentStock);

        if (isNaN(sellingPrice)) throw new Error(`Row ${i + 1}: sellingPrice must be a number`);
        if (isNaN(currentStock)) throw new Error(`Row ${i + 1}: currentStock must be a number`);

        // Category Handling
        let categoryName = rec.category?.trim() || "General";
        // Normalize
        categoryName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase();

        // Ensure category exists for user
        await ProductCategory.findOneAndUpdate(
          { userId, name: categoryName },
          { userId, name: categoryName },
          { upsert: true, new: true }
        );

        // Check for existing SKU
        const existingProduct = await Product.findOne({ userId, sku: rec.sku });

        if (existingProduct) {
          // Update
          existingProduct.name = rec.productName;
          existingProduct.category = categoryName;
          existingProduct.costPrice = Number(rec.costPrice) || 0;
          existingProduct.sellingPrice = sellingPrice;
          existingProduct.stock = currentStock;
          existingProduct.lowStockAlert = Number(rec.lowStockAlert) ?? 5;
          existingProduct.active = rec.isActive !== undefined ? rec.isActive : true;
          
          await existingProduct.save();
          summary.updated++;
        } else {
          // Create
          await Product.create({
            userId,
            name: rec.productName,
            sku: rec.sku,
            category: categoryName,
            costPrice: Number(rec.costPrice) || 0,
            sellingPrice: sellingPrice,
            stock: currentStock,
            lowStockAlert: Number(rec.lowStockAlert) ?? 5,
            active: rec.isActive !== undefined ? rec.isActive : true,
          });
          summary.created++;
        }
      } catch (err: any) {
        summary.skipped++;
        summary.errors.push(err.message || `Row ${i + 1}: Unknown error`);
      }
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Bulk Product Upload API Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
