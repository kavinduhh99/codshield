import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    await connectDB();
    const order = await Order.findOne({ _id: id, userId: session.user.id }).lean();
    if (!order) return NextResponse.json({ message: "Order not found" }, { status: 404 });
    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error("[OrderGET] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();

    const existingOrder = await Order.findOne({ _id: id, userId: session.user.id });
    if (!existingOrder) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // ── Status lock guard ──────────────────────────────────────────────────
    const EDITABLE_STATUSES = ["pending", "processing"];
    if (!EDITABLE_STATUSES.includes(existingOrder.status)) {
      return NextResponse.json(
        { message: "Only pending or processing orders can be edited." },
        { status: 403 }
      );
    }


    const {
      customerName, phone, phone2, address, city,
      items, itemsSubtotal, discount, totalAmount,
      paymentMethod, paymentStatus,
      deliveryFee, courierName, trackingNumber, notes,
    } = await req.json();

    // --- Validate ---
    if (!customerName || !phone || !address || !city) {
      return NextResponse.json({ message: "Missing required customer fields" }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: "Order must contain at least one item" }, { status: 400 });
    }
    for (const item of items) {
      if (!item.productName?.trim()) {
        return NextResponse.json({ message: "All items must have a product name" }, { status: 400 });
      }
      if (!item.quantity || item.quantity < 1) {
        return NextResponse.json({ message: `Invalid quantity for ${item.productName}` }, { status: 400 });
      }
      if (item.unitSellingPrice === undefined || item.unitSellingPrice < 0) {
        return NextResponse.json({ message: `Invalid price for ${item.productName}` }, { status: 400 });
      }
    }

    // --- Delta stock management ---
    // Build a map of old items: productId -> qty
    const oldStockMap: Record<string, number> = {};
    const oldItems: any[] = existingOrder.items && existingOrder.items.length > 0
      ? existingOrder.items
      : (existingOrder.productId ? [{ productId: existingOrder.productId, quantity: existingOrder.quantity || 1 }] : []);

    for (const oldItem of oldItems) {
      if (oldItem.productId) {
        const pid = oldItem.productId.toString();
        oldStockMap[pid] = (oldStockMap[pid] || 0) + (oldItem.quantity || 1);
      }
    }

    // Build a map of new items: productId -> qty
    const newStockMap: Record<string, number> = {};
    for (const newItem of items) {
      if (newItem.productId) {
        const pid = newItem.productId.toString();
        newStockMap[pid] = (newStockMap[pid] || 0) + (newItem.quantity || 1);
      }
    }

    // Collect all product IDs involved
    const allPids = new Set([...Object.keys(oldStockMap), ...Object.keys(newStockMap)]);

    for (const pid of allPids) {
      const oldQty = oldStockMap[pid] || 0;
      const newQty = newStockMap[pid] || 0;
      const delta = newQty - oldQty; // positive = need to reduce stock, negative = restore stock

      if (delta === 0) continue;

      const product = await Product.findOne({ _id: pid, userId: session.user.id });
      if (!product) {
        return NextResponse.json({ message: `Product not found` }, { status: 404 });
      }

      if (delta > 0 && product.stock < delta) {
        return NextResponse.json(
          { message: `Insufficient stock for ${product.name}. Available: ${product.stock}` },
          { status: 400 }
        );
      }

      product.stock -= delta; // subtract positive delta, add back negative delta
      await product.save();
    }

    // Normalize phone
    const normalizedPhone = phone.replace(/[^0-9+]/g, "").replace(/^0/, "+94");
    const normalizedPhone2 = phone2 && typeof phone2 === "string"
      ? phone2.replace(/[^0-9+]/g, "").replace(/^0/, "+94")
      : undefined;

    // --- Apply update ---
    existingOrder.customerName = customerName;
    existingOrder.phone = normalizedPhone;
    if (normalizedPhone2) existingOrder.phone2 = normalizedPhone2;
    existingOrder.address = address;
    existingOrder.city = city;
    existingOrder.items = items.map((i: any) => ({
      productId: i.productId || undefined,
      productName: i.productName,
      sku: i.sku || undefined,
      quantity: i.quantity,
      costPrice: i.costPrice || 0,
      unitSellingPrice: i.unitSellingPrice,
      lineTotal: i.lineTotal,
    }));
    existingOrder.itemsSubtotal = itemsSubtotal || 0;
    existingOrder.discount = discount || 0;
    existingOrder.totalAmount = totalAmount || 0;
    existingOrder.paymentMethod = paymentMethod || "COD";
    existingOrder.paymentStatus = paymentStatus || "unpaid";
    existingOrder.deliveryFee = deliveryFee || 0;
    existingOrder.courierName = courierName || "";
    existingOrder.trackingNumber = trackingNumber || "";
    existingOrder.notes = notes || "";

    await existingOrder.save();

    return NextResponse.json(existingOrder, { status: 200 });
  } catch (error) {
    console.error("[OrderPUT] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
