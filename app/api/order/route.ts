import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";

// Add a new order
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { 
      customerName, phone, phone2, address, city, riskScore,
      items, itemsSubtotal, discount, totalAmount, paymentMethod, paymentStatus,
      deliveryFee, courierName, trackingNumber, notes 
    } = await req.json();

    if (!customerName || !phone || !address || !city) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: "Order must contain at least one item" }, { status: 400 });
    }

    for (const item of items) {
      if (!item.productName) {
        return NextResponse.json({ message: "All items must have a product name" }, { status: 400 });
      }
      if (item.quantity === undefined || item.quantity < 1) {
        return NextResponse.json({ message: `Invalid quantity for ${item.productName}` }, { status: 400 });
      }
      if (item.unitSellingPrice === undefined || item.unitSellingPrice < 0) {
        return NextResponse.json({ message: `Invalid price for ${item.productName}` }, { status: 400 });
      }
    }

    if (totalAmount === undefined || totalAmount < 0) {
      return NextResponse.json({ message: "Invalid total amount" }, { status: 400 });
    }

    await connectDB();

    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (item.productId && item.quantity > 0) {
          const product = await Product.findOne({ _id: item.productId, userId: session.user.id });
          if (!product) {
            return NextResponse.json({ message: `Product not found: ${item.productName}` }, { status: 404 });
          }
          if (product.stock < item.quantity) {
            return NextResponse.json({ message: `Insufficient stock for ${product.name}` }, { status: 400 });
          }
          product.stock -= item.quantity;
          await product.save();
        }
      }
    }

    const normalizedPhone = phone.replace(/[^0-9+]/g, "").replace(/^0/, "+94");
    const normalizedPhone2 = phone2 && typeof phone2 === 'string' 
      ? phone2.replace(/[^0-9+]/g, "").replace(/^0/, "+94") 
      : undefined;

    const newOrder = await Order.create({
      userId: session.user.id,
      customerName,
      phone: normalizedPhone,
      ...(normalizedPhone2 && { phone2: normalizedPhone2 }),
      address,
      city,
      riskScore: riskScore || 0,
      status: "pending",
      items: items || [],
      itemsSubtotal: itemsSubtotal || 0,
      discount: discount || 0,
      totalAmount: totalAmount || 0,
      paymentMethod: paymentMethod || "COD",
      paymentStatus: paymentStatus || "unpaid",
      deliveryFee: deliveryFee || 0,
      courierName: courierName || "",
      trackingNumber: trackingNumber || "",
      notes: notes || "",
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("[OrdersAPI] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// Get all orders for the current business
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const orders = await Order.find({ userId: session.user.id }).sort({ createdAt: -1 }).lean();

    const mappedOrders = orders.map((order: any) => {
      // Fallback for old orders without items
      if (!order.items || order.items.length === 0) {
        order.items = [{
          productId: order.productId,
          productName: order.productNameText || "Legacy Item",
          quantity: order.quantity || 1,
          costPrice: order.costPrice || 0,
          unitSellingPrice: order.sellingPrice || 0,
          lineTotal: (order.sellingPrice || 0) * (order.quantity || 1)
        }];
        if (order.totalAmount === undefined || order.totalAmount === 0) {
           order.totalAmount = order.codAmount || ((order.sellingPrice || 0) * (order.quantity || 1) + (order.deliveryFee || 0));
        }
        if (!order.paymentMethod) order.paymentMethod = "COD";
        if (!order.paymentStatus) order.paymentStatus = "unpaid";
      }
      return order;
    });

    return NextResponse.json(mappedOrders, { status: 200 });
  } catch (error) {
    console.error("[OrdersAPI GET] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
