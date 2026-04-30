import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Order from "@/models/Order";
import Payment from "@/models/Payment";

import { normalizePlan } from "@/lib/subscription";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Migration-safe display: normalize plan for UI
    if (user.subscription) {
      user.subscription.plan = normalizePlan(user.subscription.plan);
    }

    // Get extra stats for user details page
    const [orderCount, paymentHistory] = await Promise.all([
      Order.countDocuments({ userId: user._id }),
      Payment.find({ userId: user._id }).sort({ createdAt: -1 }),
    ]);

    return NextResponse.json({
      ...user.toObject(),
      orderCount,
      paymentHistory,
    });
  } catch (error) {
    console.error("Admin User GET Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const payload = await req.json();
    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Migration-safe: Normalize existing plan to avoid validation errors on legacy values
    if (user.subscription && user.subscription.plan) {
      user.subscription.plan = normalizePlan(user.subscription.plan);
    }

    // Handle nested subscription updates if provided
    if (payload.subscription) {
      const targetPlan = payload.subscription.plan 
        ? normalizePlan(payload.subscription.plan) 
        : (user.subscription?.plan || "Free Trial");

      user.subscription = {
        ...(user.subscription || {}),
        ...payload.subscription,
        plan: targetPlan,
      };
      delete payload.subscription;
    }

    // Update other top-level fields safely
    const { name, email, role, status, isVerified, phone, businessName, password } = payload;
    
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;
    if (isVerified !== undefined) user.isVerified = isVerified;
    if (phone !== undefined) user.phone = phone;
    if (businessName !== undefined) user.businessName = businessName;
    if (password !== undefined && password !== "") user.password = password;

    await user.save();
    return NextResponse.json({ message: "User updated successfully", user });
  } catch (error) {
    console.error("Admin User PUT Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    
    // Safety check: Don't delete the last admin
    const userToDelete = await User.findById(id);
    if (userToDelete?.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return NextResponse.json({ message: "Cannot delete the last admin account" }, { status: 400 });
      }
    }

    await User.findByIdAndDelete(id);
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Admin User DELETE Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
