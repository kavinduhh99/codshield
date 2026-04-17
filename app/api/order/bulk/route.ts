import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Order from "@/models/Order";
import Intelligence from "@/models/Intelligence";

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

    const normalize = (p: any) => {
      if (p === undefined || p === null) return "";
      // Convert to string and trim
      let str = String(p).trim();
      if (!str) return "";
      
      // Basic cleaning: remove common spreadsheet formatting like spaces, dashes, parentheses
      str = str.replace(/[^0-9+]/g, "");
      
      // Flexible normalization for Sri Lankan numbers
      if (str.startsWith("0")) str = "+94" + str.slice(1);
      if (str.startsWith("7") && str.length === 9) str = "+94" + str;
      if (str.startsWith("94") && !str.startsWith("+")) str = "+" + str;
      
      return str;
    };
    
    // Batch risk check optimization
    const uniquePhones = new Set<string>();
    orders.forEach(o => {
      if (o.phone) uniquePhones.add(normalize(o.phone));
      if (o.phone2) uniquePhones.add(normalize(o.phone2));
    });

    const intelligences = await Intelligence.find({ phone: { $in: Array.from(uniquePhones) } });
    const intelligenceMap = new Map(intelligences.map(i => [i.phone, i]));

    const checkPhoneRiskMem = (p?: string): number => {
      if (!p) return 0;
      const normalizedPhone = normalize(p);
      const info = intelligenceMap.get(normalizedPhone);
      let score = 0;
      if (info) {
        if (info.failedOrders > 2) score += 50;
        if ((info as any).isBlacklisted) score += 100;
      }
      return Math.min(score, 100);
    };

    const filteringReasons: string[] = [];
    const processedOrders = orders.map((order: any, index: number) => {
      const normalizedPhone = order.phone ? normalize(order.phone) : "";
      const normalizedPhone2 = order.phone2 ? normalize(order.phone2) : "";
      
      // Validation check
      if (!normalizedPhone) {
        filteringReasons.push(`Row ${index + 1}: Phone number missing or invalid after normalization`);
        return null;
      }
      if (!order.address) {
        filteringReasons.push(`Row ${index + 1}: Delivery address missing`);
        return null;
      }
      if (!order.city) {
        filteringReasons.push(`Row ${index + 1}: City mission`);
        return null;
      }
      
      const score1 = checkPhoneRiskMem(order.phone);
      const score2 = checkPhoneRiskMem(order.phone2);
      const riskScore = Math.max(score1, score2);

      return {
        userId: session.user!.id,
        customerName: order.customerName || "Unknown",
        phone: normalizedPhone,
        phone2: normalizedPhone2 || undefined,
        address: order.address,
        city: order.city,
        riskScore,
        status: "pending",
      };
    });

    const finalOrders = processedOrders.filter(o => o !== null);
    
    console.log(`[BulkUpload] Success: ${finalOrders.length}, Filtered: ${filteringReasons.length}`);
    if (filteringReasons.length > 0) {
      console.log("[BulkUpload] Filtering Log:", filteringReasons.slice(0, 5).join(" | "), filteringReasons.length > 5 ? "..." : "");
    }

    if (finalOrders.length === 0) {
      return NextResponse.json({ 
        message: "No valid orders were found in the provided list.",
        details: filteringReasons.slice(0, 10), // Return the first 10 errors to help the user
        totalProvided: orders.length
      }, { status: 400 });
    }

    const insertedOrders = await Order.insertMany(finalOrders);

    return NextResponse.json(
      { message: `Successfully inserted ${insertedOrders.length} orders`, count: insertedOrders.length },
      { status: 201 }
    );
  } catch (error) {
    console.error("[BulkOrdersAPI] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
