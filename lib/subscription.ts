import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function checkSubscription() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { authorized: false, response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }) };
  }

  const isSuspended = (session.user as any).status === "suspended";
  const isExpiredTrial = 
    (session.user as any).plan === "Free Trial" && 
    (session.user as any).subEnd && 
    new Date((session.user as any).subEnd) < new Date();

  if (isSuspended || isExpiredTrial) {
    return { 
      authorized: false, 
      response: NextResponse.json({ 
        message: "Access Restricted", 
        code: isSuspended ? "SUSPENDED" : "TRIAL_EXPIRED" 
      }, { status: 403 }) 
    };
  }

  return { authorized: true, session };
}

export function normalizePlan(plan?: string): "Free Trial" | "Pro" {
  if (!plan) return "Free Trial";
  
  const p = plan.toLowerCase().trim();
  
  // Mapping logic: 
  // Any variation of 'free' or 'trial' -> 'Free Trial'
  // Everything else (starter, pro, business, enterprise) -> 'Pro'
  if (p === "free" || p.includes("trial")) {
    return "Free Trial";
  }
  
  return "Pro";
}
