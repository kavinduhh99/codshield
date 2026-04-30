import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Order, { IOrder } from "@/models/Order";
import Intelligence from "@/models/Intelligence";
import Product from "@/models/Product";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { status, returnReason } = await req.json();
    const { id } = await params;

    if (!status || !id) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    if (!["processing", "shipped", "delivered", "returned", "cancelled"].includes(status)) {
      return NextResponse.json({ message: "Invalid status value" }, { status: 400 });
    }

    await connectDB();

    // Shared phone normalizer — must match format used in check-risk/route.ts
    const normalizePhone = (p: string) => {
      let cleaned = p.replace(/[^0-9+]/g, "");
      if (cleaned.startsWith("0")) cleaned = "+94" + cleaned.slice(1);
      else if (cleaned.startsWith("94") && cleaned.length >= 11) cleaned = "+" + cleaned;
      return cleaned;
    };

    // Verify order exists and belongs to user
    const order = await Order.findOne({ _id: id, userId: session.user.id });

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // Capture previous status
    const previousStatus = order.status;

    // Update status and capture optional return reason
    order.status = status;
    if (status === "returned" && returnReason) {
      order.returnReason = returnReason as IOrder["returnReason"];
    }
    await order.save();

    // ── Multi-item Stock Restore ──
    if ((status === "returned" || status === "cancelled") && (previousStatus !== "returned" && previousStatus !== "cancelled")) {
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          if (item.productId && item.quantity > 0) {
            await Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } });
          }
        }
      } else if (order.productId && order.quantity > 0) {
        // Fallback for legacy orders
        await Product.findByIdAndUpdate(order.productId, { $inc: { stock: order.quantity } });
      }
    }

    // ── Total Orders Counter ──
    // Increment totalOrders the first time an order leaves 'pending'.
    // This keeps the Intelligence denominator accurate for the weighted risk formula.
    if (previousStatus === "pending") {
      const settlementPhones: string[] = [];
      if (order.phone) settlementPhones.push(order.phone);
      if (order.phone2) settlementPhones.push(order.phone2 as string);
      for (const phoneStr of settlementPhones) {
        const normalizedPhone = normalizePhone(phoneStr);
        await Intelligence.findOneAndUpdate(
          { phone: normalizedPhone },
          { $inc: { totalOrders: 1 }, $set: { lastOrderDate: new Date() } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }

    // ── Intelligence Feedback Loop ──
    // We ONLY increment failedOrders when an order transitions TO "returned" for the first time.
    // The `previousStatus !== "returned"` guard prevents double-counting if someone accidentally
    // re-saves a returned order as returned again.
    //
    // WHY "DELIVERED" DOESN'T UNDO A "RETURNED" PENALTY:
    // This is an intentional design decision rooted in fraud detection theory.
    //
    // 1. IRREVERSIBILITY OF RISK SIGNALS: A return event is evidence that already occurred.
    //    A seller cannot retroactively cancel the fact that a customer refused delivery.
    //    Allowing "delivered" to decrement failedOrders would make the intelligence engine
    //    gameable — a bad actor (or an honest mistake) could cycle returned → delivered to
    //    scrub a fraudulent customer's record.
    //
    // 2. ORDER OF OPERATIONS: In COD logistics, an order goes: pending → delivered OR returned.
    //    It is physically impossible for a returned order to later become delivered for the same
    //    shipment. If a new attempt is made, it's a brand new order entirely.
    //
    // 3. CONSERVATIVE SCORING: The risk engine is deliberately conservative. A false positive
    //    (blocking a real customer) is a recoverable UX issue. A false negative (allowing a
    //    fraudulent customer through) results in real financial loss for the merchant.
    //    Penalties are permanent by design, and can only be manually cleared by admins.
    if (status === "returned" && previousStatus !== "returned") {
      const phonesToUpdate: string[] = [];
      if (order.phone) phonesToUpdate.push(order.phone);
      if (order.phone2) phonesToUpdate.push(order.phone2 as string);

      for (const phoneStr of phonesToUpdate) {
        if (!phoneStr) continue;
        const normalizedPhone = normalizePhone(phoneStr);
        console.log(`[Status Update] Normalizing phone: "${phoneStr}" -> "${normalizedPhone}"`);
        
        const result = await Intelligence.findOneAndUpdate(
          { phone: normalizedPhone },
          { $inc: { failedOrders: 1 }, $set: { lastOrderDate: new Date() } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        console.log(`[Status Update] Intelligence record updated for ${normalizedPhone}:`, result);
      }
    }

    // ── Success Tracking ──
    // When an order is marked as delivered for the first time, we increment successOrders
    // for each associated phone. This gives sellers a balanced view: a customer with
    // 10 successful deliveries and 1 return is very different from one with 1 return and 0 successes.
    if (status === "delivered" && previousStatus !== "delivered") {
      const phonesToUpdate: string[] = [];
      if (order.phone) phonesToUpdate.push(order.phone);
      if (order.phone2) phonesToUpdate.push(order.phone2 as string);

      for (const phoneStr of phonesToUpdate) {
        if (!phoneStr) continue;
        const normalizedPhone = normalizePhone(phoneStr);
        console.log(`[Status Update] Tracking delivery for: "${phoneStr}" -> "${normalizedPhone}"`);

        const result = await Intelligence.findOneAndUpdate(
          { phone: normalizedPhone },
          { $inc: { successOrders: 1 }, $set: { lastOrderDate: new Date() } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        console.log(`[Status Update] Success record updated for ${normalizedPhone}:`, result);
      }
    }

    return NextResponse.json(
      { message: `Order marked as ${status}` },
      { status: 200 }
    );
  } catch (error) {
    console.error("[OrdersStatusAPI] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
