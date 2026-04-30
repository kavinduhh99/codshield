import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import Intelligence from "@/models/Intelligence";
import Order from "@/models/Order";
import SearchLog from "@/models/SearchLog";
import User from "@/models/User";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Normalize a raw phone string to the canonical +94XXXXXXXXX format. */
const normalizePhone = (p: string): string => {
  let cleaned = p.replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("0")) cleaned = "+94" + cleaned.slice(1);
  else if (cleaned.startsWith("94") && cleaned.length >= 11) cleaned = "+" + cleaned;
  return cleaned;
};

/**
 * Returns all raw forms a phone might be stored in (Order docs store raw input,
 * while Intelligence stores the normalized form).
 */
const getPhoneVariants = (normalized: string): string[] => {
  const base = normalized.replace(/^\+94/, ""); // e.g. "771234567"
  return [normalized, `94${base}`, `0${base}`];
};

const getRiskLevel = (score: number): "low" | "medium" | "high" => {
  if (score <= 20) return "low";
  if (score <= 50) return "medium";
  return "high";
};

export async function POST(req: Request) {
  try {
    const { phone, phone2 } = await req.json();

    if (!phone && !phone2) {
      return NextResponse.json({ riskScore: 0, riskLevel: "low" });
    }

    // Session is optional — used only for search logging
    const session = await getServerSession(authOptions);
    const sellerId = session?.user?.id ?? "anonymous";

    await connectDB();

    // ── Step 0: Subscription & Trial Enforcement ──
    // Every user gets 30 days of free trial. After that, they must be marked 'isActive' to check risk.
    if (session?.user) {
      const dbUser = await User.findById(session.user.id);
      if (dbUser && dbUser.role === "business") {
        const trialExpiry = new Date(dbUser.createdAt).getTime() + THIRTY_DAYS_MS;
        const isTrialActive = Date.now() < trialExpiry;
        const isPaid = dbUser.subscription?.isActive === true;

        if (!isTrialActive && !isPaid) {
          return NextResponse.json(
            { message: "Your free trial has expired. Please subscribe for Rs. 400/month to continue checking risks." },
            { status: 403 }
          );
        }
      }
    }

    const checkPhoneRisk = async (p?: string) => {
      if (!p) return { score: 0, failedOrders: 0, successOrders: 0, totalOrders: 0, lastOrderDate: null };

      const normalizedPhone = normalizePhone(p);

      // ── Step 1: Aggregate counters from Intelligence ──
      const intel = await Intelligence.findOne({ phone: normalizedPhone });
      const totalOrders = intel?.totalOrders ?? 0;
      const failedOrders = intel?.failedOrders ?? 0;
      const successOrders = intel?.successOrders ?? 0;
      const isBlacklisted = (intel as any)?.isBlacklisted ?? false;

      if (isBlacklisted) return { score: 100, failedOrders, successOrders, totalOrders, lastOrderDate: intel?.lastOrderDate || null };
      if (totalOrders === 0) return { score: 0, failedOrders, successOrders, totalOrders, lastOrderDate: intel?.lastOrderDate || null };

      // ── Step 2: Fetch individual returned orders for weighted scoring ──
      // Order docs may store raw phone; search all normalized variants.
      const variants = getPhoneVariants(normalizedPhone);
      const returnedOrders = await Order.find({
        phone: { $in: variants },
        status: "returned",
      }).select("returnReason createdAt");

      const now = Date.now();
      let weightedReturns = 0;

      for (const order of returnedOrders) {
        const reason = order.returnReason as string | undefined;

        // 'Courier Issue' returns are excluded from risk scoring entirely
        if (reason === "Courier Issue") continue;

        // Time decay: returns within the last 30 days carry 20% extra weight
        const isRecent = now - new Date(order.createdAt).getTime() < THIRTY_DAYS_MS;
        const timeWeight = isRecent ? 1.2 : 1.0;

        // Reason multiplier: deliberate refusals are 1.5× more significant
        const reasonMultiplier = reason === "Customer Refused" ? 1.5 : 1.0;

        weightedReturns += timeWeight * reasonMultiplier;
      }

      const score = Math.min(100, Math.round((weightedReturns / totalOrders) * 100));
      return { score, failedOrders, successOrders, totalOrders, lastOrderDate: intel?.lastOrderDate || null };
    };

    const risk1 = await checkPhoneRisk(phone);
    const risk2 = await checkPhoneRisk(phone2);

    // Take the worst-case score across both phones
    const riskScore = Math.max(risk1.score, risk2.score);
    const failedOrders = Math.max(risk1.failedOrders, risk2.failedOrders);
    const successOrders = risk1.successOrders + risk2.successOrders;
    const totalOrders = Math.max(risk1.totalOrders, risk2.totalOrders);
    const lastOrderDate = risk1.lastOrderDate || risk2.lastOrderDate || null;
    const riskLevel = getRiskLevel(riskScore);

    // ── Step 3: Non-blocking search logging (fire-and-forget) ──
    const phonesToLog = ([phone, phone2] as (string | undefined)[]).filter(Boolean) as string[];
    for (const p of phonesToLog) {
      SearchLog.create({
        phone: normalizePhone(p),
        sellerId,
        timestamp: new Date(),
      }).catch((err) => console.error("[SearchLog] Failed to write:", err));
    }

    return NextResponse.json({
      riskScore,
      riskLevel,
      failedOrders,
      successOrders,
      totalOrders,
      lastOrderDate,
      originalPhone: phone,
      normalizedPhone: phone ? normalizePhone(phone) : null,
      phone2: phone2 || null,
    });
  } catch (error) {
    console.error("[CheckRisk] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
