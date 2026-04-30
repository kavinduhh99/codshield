import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import AdminSettings from "@/models/AdminSettings";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const settings = await AdminSettings.findOne().select("paymentInstructions").lean();

    if (!settings) {
      // Return default instructions if none found
      return NextResponse.json({
        paymentInstructions: {
          bankName: "Dialog Finance PLC",
          accountName: "BizFlow",
          accountNumber: "0010 2077 3471",
          branch: "Head Office",
          paymentPhone: "",
          paymentNote: "Verification takes up to 24 hours.",
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[BillingSettingsAPI] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
