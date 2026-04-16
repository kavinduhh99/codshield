import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { BrevoClient } from "@getbrevo/brevo";
import connectDB from "@/lib/db";
import User from "@/models/User";

const brevo = new BrevoClient({ 
    apiKey: process.env.BREVO_API_KEY as string 
});

export async function POST(req: Request) {
  try {
    const { name, email, password, businessName, phone } = await req.json();

    if (!name || !email || !password || !businessName) {
      return NextResponse.json(
        { message: "Please provide all required fields." },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { message: "A user with this email already exists." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      businessName,
      phone,
      isEmailVerified: false,
      verificationToken,
    });

    // Generate dynamic verification link using NEXTAUTH_URL or fallback to localhost for development
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verifyLink = `${baseUrl.replace(/\/$/, "")}/api/auth/verify?token=${verificationToken}`;
    console.log(`[AUTH] Verification Link for ${email}: ${verifyLink}`);

    /*
     * Brevo API Dispatch:
     * We use the modern BrevoClient (v4+) which is more reliable than legacy SMTP.
     * Ensure BREVO_API_KEY and BREVO_SENDER_EMAIL are set in .env.local.
     */
    try {
      const emailRes = await brevo.transactionalEmails.sendTransacEmail({
        subject: 'Verify your CODShield Account',
        sender: { 
            name: 'CODShield', 
            email: process.env.BREVO_SENDER_EMAIL as string 
        },
        to: [{ email, name }],
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #111827; padding: 40px; border-radius: 12px; color: #fff; text-align: center;">
            <h1 style="color: #60A5FA; margin-bottom: 20px;">Protect Your Business</h1>
            <p style="color: #D1D5DB; font-size: 16px; margin-bottom: 30px;">
              Welcome to CODShield. To activate your eCommerce risk intelligence dashboard, please verify your email address.
            </p>
            <a href="${verifyLink}" style="display: inline-block; background-color: #2563EB; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              Verify Email Account
            </a>
            <p style="color: #6B7280; font-size: 12px; margin-top: 40px;">
              If you didn't create an account with us, you can safely ignore this email.
            </p>
          </div>
        `
      });
      console.log("[BREVO] Dispatch Successful:", emailRes);
    } catch (brevoError: any) {
      console.error("[BREVO] Dispatch Failed! Error details:", {
        message: brevoError.message,
        body: brevoError.response?.body || "No body response",
        status: brevoError.response?.status
      });
      // We still return 201 because the user was created. 
      // They might need a manual verify or to resend later if the API was down.
    }

    return NextResponse.json(
      { message: "Registration successful. Please check your email to verify." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error." },
      { status: 500 }
    );
  }
}
