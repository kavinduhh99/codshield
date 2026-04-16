import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ message: "Verification token is missing." }, { status: 400 });
    }

    await connectDB();

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return NextResponse.json({ message: "Invalid or expired verification token." }, { status: 400 });
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined; // Clear the token securely
    await user.save();

    // Redirect user to the login page formatted securely so UI triggers a success component
    return NextResponse.redirect(new URL("/login?verified=1", req.url));
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}
