import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SearchLog from "@/models/SearchLog";

export async function GET() {
  try {
    await connectDB();

    // Start of today in UTC
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    // Fetch all search logs created today
    const todayLogs = await SearchLog.find({
      timestamp: { $gte: startOfDay },
    })
      .select("phone")
      .lean();

    const totalSearchesToday = todayLogs.length;

    // Extract 3-digit prefix from normalized +94XXXXXXXXX phones.
    // +94771234567 → base "771234567" → prefix "077"
    const prefixCounts: Record<string, number> = {};
    for (const log of todayLogs) {
      const base = (log.phone as string).replace(/^\+94/, "");
      if (base.length < 2) continue;
      const prefix = `0${base.slice(0, 2)}`;
      prefixCounts[prefix] = (prefixCounts[prefix] ?? 0) + 1;
    }

    const topPrefixes = Object.entries(prefixCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([prefix, count]) => ({ prefix, count }));

    return NextResponse.json({ totalSearchesToday, topPrefixes });
  } catch (error) {
    console.error("[Trends] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
