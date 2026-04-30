import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import Intelligence from "@/models/Intelligence";
import Product from "@/models/Product";

function normalizeStatus(rawStatus?: string): string {
  if (!rawStatus) return "pending";
  const s = rawStatus.toLowerCase().trim();
  if (s.includes("delivered")) return "delivered";
  if (s.includes("return")) return "returned";
  if (s.includes("cancel")) return "cancelled";
  if (s.includes("ship") || s.includes("dispatch")) return "shipped";
  if (s.includes("process")) return "processing";
  return "pending";
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { orders } = await req.json();

    if (!Array.isArray(orders) || orders.length === 0) {
      return NextResponse.json({ message: "No orders provided or invalid format" }, { status: 400 });
    }

    await connectDB();

    console.log(`[BulkUpload] Processing ${orders.length} potential orders`);

    const normalizePhone = (p: any) => {
      if (p === undefined || p === null) return "";
      let str = String(p).trim();
      if (!str) return "";
      
      str = str.replace(/[^0-9+]/g, "");
      
      if (str.startsWith("0")) str = "+94" + str.slice(1);
      if (str.startsWith("7") && str.length === 9) str = "+94" + str;
      if (str.startsWith("94") && !str.startsWith("+")) str = "+" + str;
      
      return str;
    };
    
    // Batch risk check
    const uniquePhones = new Set<string>();
    const skusToFetch = new Set<string>();

    orders.forEach(o => {
      if (o.phone) uniquePhones.add(normalizePhone(o.phone));
      if (o.phone2) uniquePhones.add(normalizePhone(o.phone2));
      if (o.sku) skusToFetch.add(String(o.sku).trim());
    });

    const intelligences = await Intelligence.find({ phone: { $in: Array.from(uniquePhones) } });
    const intelligenceMap = new Map(intelligences.map(i => [i.phone, i]));

    const checkPhoneRiskMem = (p?: string): number => {
      if (!p) return 0;
      const normalizedPhone = normalizePhone(p);
      const info = intelligenceMap.get(normalizedPhone);
      let score = 0;
      if (info) {
        if (info.failedOrders > 2) score += 50;
        if ((info as any).isBlacklisted) score += 100;
      }
      return Math.min(score, 100);
    };

    // Fetch matching products
    const products = await Product.find({ 
      userId: session.user.id,
      sku: { $in: Array.from(skusToFetch) }
    });
    const productMap = new Map(products.map(p => [p.sku, p]));

    const filteringReasons: string[] = [];
    const productsToUpdate: any[] = [];
    
    const processedOrders = orders.map((order: any, index: number) => {
      const normalizedPhone = order.phone ? normalizePhone(order.phone) : "";
      const normalizedPhone2 = order.phone2 ? normalizePhone(order.phone2) : "";
      
      // Validation check
      if (!normalizedPhone) {
        filteringReasons.push(`Row ${index + 1}: Phone number missing or invalid`);
        return null;
      }
      if (!order.address) {
        filteringReasons.push(`Row ${index + 1}: Delivery address missing`);
        return null;
      }
      if (!order.customerName) {
        filteringReasons.push(`Row ${index + 1}: Customer name missing`);
        return null;
      }
      
      const score1 = checkPhoneRiskMem(order.phone);
      const score2 = checkPhoneRiskMem(order.phone2);
      const riskScore = Math.max(score1, score2);

      const qty = parseInt(order.quantity) || 1;
      let sp = parseFloat(order.sellingPrice);
      let cp = 0;
      const df = parseFloat(order.deliveryFee) || 0;
      let cod = parseFloat(order.codAmount);
      
      let matchedProductId = undefined;
      
      // Product linking
      if (order.sku) {
        const product = productMap.get(String(order.sku).trim());
        if (product) {
           matchedProductId = product._id;
           cp = product.costPrice;
           if (isNaN(sp)) sp = product.sellingPrice;
           
           // Queue stock reduction
           productsToUpdate.push({
             updateOne: {
               filter: { _id: product._id },
               update: { $inc: { stock: -qty } }
             }
           });
        }
      }

      if (isNaN(sp)) sp = 0;
      if (isNaN(cod)) cod = (sp * qty) + df;

      let orderDate = undefined;
      if (order.orderDate) {
        const d = new Date(order.orderDate);
        if (!isNaN(d.getTime())) {
          orderDate = d;
        }
      }

      let productNameText = matchedProductId ? undefined : (order.productName || order.description || "");
      let lineTotal = sp * qty;
      let itemsSubtotal = lineTotal;
      let totalAmount = cod;

      return {
        userId: session.user!.id,
        customerName: order.customerName,
        phone: normalizedPhone,
        phone2: normalizedPhone2 || undefined,
        address: order.address,
        city: order.city || "",
        district: order.district || "",
        riskScore,
        status: normalizeStatus(order.status),
        
        items: [{
          productId: matchedProductId,
          productName: productNameText || "Imported Item",
          sku: order.sku ? String(order.sku).trim() : undefined,
          quantity: qty,
          costPrice: cp,
          unitSellingPrice: sp,
          lineTotal: lineTotal
        }],
        itemsSubtotal: itemsSubtotal,
        discount: 0,
        totalAmount: totalAmount,
        paymentMethod: "COD",
        paymentStatus: "unpaid",

        productId: matchedProductId,
        productNameText: productNameText,
        quantity: qty,
        costPrice: cp,
        sellingPrice: sp,
        deliveryFee: df,
        codAmount: cod,
        courierName: order.courierName || "",
        trackingNumber: order.trackingNumber || "",
        externalOrderId: order.externalOrderId || "",
        notes: order.notes || "",
        orderDate: orderDate
      };
    });

    const finalOrders = processedOrders.filter(o => o !== null);
    
    console.log(`[BulkUpload] Success: ${finalOrders.length}, Filtered: ${filteringReasons.length}`);
    if (filteringReasons.length > 0) {
      console.log("[BulkUpload] Filtering Log:", filteringReasons.slice(0, 5).join(" | "));
    }

    if (finalOrders.length === 0) {
      return NextResponse.json({ 
        message: "No valid orders were found in the provided list.",
        details: filteringReasons.slice(0, 10),
        totalProvided: orders.length
      }, { status: 400 });
    }

    const insertedOrders = await Order.insertMany(finalOrders);

    // Apply stock reductions
    if (productsToUpdate.length > 0) {
       await Product.bulkWrite(productsToUpdate);
    }

    return NextResponse.json(
      { message: `Successfully inserted ${insertedOrders.length} orders`, count: insertedOrders.length },
      { status: 201 }
    );
  } catch (error) {
    console.error("[BulkOrdersAPI] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
