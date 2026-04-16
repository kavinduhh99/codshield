import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Intelligence from "@/models/Intelligence";

export async function POST(req: Request) {
  try {
    const { phone, phone2 } = await req.json();

    if (!phone && !phone2) {
      return NextResponse.json({ riskScore: 0 });
    }

    const normalizePhone = (p: string) => {
      let cleaned = p.replace(/[^0-9+]/g, "");
      if (cleaned.startsWith("0")) cleaned = "+94" + cleaned.slice(1);
      else if (cleaned.startsWith("94") && cleaned.length >= 11) cleaned = "+" + cleaned;
      return cleaned;
    };

    await connectDB();

    const checkPhoneRisk = async (p?: string) => {
      if (!p) return { score: 0, failedOrders: 0, successOrders: 0 };
      const normalizedPhone = normalizePhone(p);
      const intelligenceInfo = await Intelligence.findOne({ phone: normalizedPhone });
      let score = 0;
      let failedOrders = 0;
      let successOrders = 0;
      if (intelligenceInfo) {
        failedOrders = intelligenceInfo.failedOrders || 0;
        successOrders = intelligenceInfo.successOrders || 0;
        if (failedOrders === 1) score = 25;
        else if (failedOrders === 2) score = 50;
        else if (failedOrders >= 3) score = 100;
        
        if ((intelligenceInfo as any).isBlacklisted) score = 100;
      }
      return { score: Math.min(score, 100), failedOrders, successOrders };
    };

    const risk1 = await checkPhoneRisk(phone);
    const risk2 = await checkPhoneRisk(phone2);
    
    // Take the maximum risk score of the referenced phones
    const riskScore = Math.max(risk1.score, risk2.score);
    const failedOrders = Math.max(risk1.failedOrders, risk2.failedOrders);
    // Sum success orders across both phones for the most complete picture
    const successOrders = risk1.successOrders + risk2.successOrders;

    return NextResponse.json({ 
      riskScore, 
      failedOrders,
      successOrders,
      originalPhone: phone, 
      normalizedPhone: phone ? normalizePhone(phone) : null,
      phone2: phone2 || null
    });
  } catch (error) {
    console.error("[CheckRisk] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
