import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import User from "@/models/User";

/**
 * PATCH /api/admin/users/[id]/verify
 *
 * Admin-only endpoint to manually toggle a user's isEmailVerified status.
 * Useful for testing the verification guard without needing a real email flow,
 * or for manually recovering a user whose verification email was lost.
 *
 * Body: { isEmailVerified: boolean }
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    // Strictly admin-only — this endpoint can bypass the entire email verification system
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    // Validate the payload
    if (typeof body.isEmailVerified !== "boolean") {
      return NextResponse.json(
        { message: "Body must contain isEmailVerified (boolean)" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findByIdAndUpdate(
      id,
      {
        isEmailVerified: body.isEmailVerified,
        // Clear the token if we're verifying, so it can't be reused
        ...(body.isEmailVerified ? { verificationToken: undefined } : {}),
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    console.log(
      `[Admin] isEmailVerified for ${user.email} manually set to ${body.isEmailVerified}`
    );

    return NextResponse.json({
      message: `User ${user.email} verification status set to ${body.isEmailVerified}`,
      isEmailVerified: user.isEmailVerified,
    });
  } catch (error) {
    console.error("[AdminVerifyToggle] Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
