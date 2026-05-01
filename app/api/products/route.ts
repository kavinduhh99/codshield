import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import Product from "@/models/Product";
import ProductCategory from "@/models/ProductCategory";
import mongoose from "mongoose";
import { checkSubscription } from "@/lib/subscription";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page");
    const limit = searchParams.get("limit") || "10";
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const categoryFilter = searchParams.get("category");

    await dbConnect();

    // Base query
    let query: any = { userId: session.user.id };

    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } }
      ];
    }

    // Status filter
    if (status !== "all") {
      if (status === "in-stock") query.$expr = { $gt: ["$stock", "$lowStockAlert"] };
      else if (status === "low-stock") query.$expr = { $and: [{ $lte: ["$stock", "$lowStockAlert"] }, { $gt: ["$stock", 0] }] };
      else if (status === "out-of-stock") query.stock = { $lte: 0 };
      else if (status === "active") query.active = true;
      else if (status === "inactive") query.active = false;
    }

    // Category filter
    if (categoryFilter && categoryFilter !== "all") {
      query.category = categoryFilter;
    }

    // If page is provided, implement pagination
    if (page) {
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const skip = (pageNum - 1) * limitNum;

      const [products, total, stats] = await Promise.all([
        Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
        Product.countDocuments(query),
        Product.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(session.user.id) } },
          {
            $group: {
              _id: null,
              totalProducts: { $sum: 1 },
              totalStockUnits: { $sum: "$stock" },
              lowStockCount: {
                $sum: {
                  $cond: [{ $and: [{ $lte: ["$stock", "$lowStockAlert"] }, { $gt: ["$stock", 0] }] }, 1, 0]
                }
              },
              outOfStockCount: {
                $sum: { $cond: [{ $lte: ["$stock", 0] }, 1, 0] }
              },
              totalStockCostValue: { $sum: { $multiply: ["$costPrice", "$stock"] } },
              totalStockSellingValue: { $sum: { $multiply: ["$sellingPrice", "$stock"] } }
            }
          }
        ])
      ]);

      return NextResponse.json({
        products,
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        stats: stats[0] || {
          totalProducts: 0,
          totalStockUnits: 0,
          lowStockCount: 0,
          outOfStockCount: 0,
          totalStockCostValue: 0,
          totalStockSellingValue: 0
        }
      }, { status: 200 });
    }

    // Default: return all products (backward compatibility and exports)
    const products = await Product.find(query).sort({ createdAt: -1 });
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
