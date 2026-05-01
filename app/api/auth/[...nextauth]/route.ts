import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email }).select("+password");

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isPasswordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordMatch) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role ? user.role.toLowerCase() : "business",
          businessName: user.businessName,
          subEnd: user.subscription?.endDate,
          plan: user.subscription?.plan,
          status: user.status,
          isEmailVerified: user.isEmailVerified,
          createdAt: user.createdAt,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        await connectDB();
        const existingUser = await User.findOne({ email: user.email });

        if (existingUser) {
          // Link Google ID if not present
          if (!existingUser.googleId) {
            existingUser.googleId = user.id;
            // Google emails are verified
            existingUser.isEmailVerified = true;
            if (!existingUser.image && user.image) {
              existingUser.image = user.image;
            }
            await existingUser.save();
          }
          return true;
        }

        // Create new user for Google sign-in
        try {
          await User.create({
            name: user.name || "Google User",
            email: user.email || "",
            googleId: user.id || "",
            image: user.image || "",
            businessName: user.name ? `${user.name}'s Business` : "My Business",
            role: "business",
            status: "active",
            isEmailVerified: true,
            isVerified: false,
            subscription: {
              plan: "Free Trial",
              startDate: new Date(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
              isActive: true,
            },
          });
          return true;
        } catch (error) {
          console.error("Error creating Google user:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, account }) {
      // ── Initial sign-in: stamp all custom claims onto the token exactly once ──
      if (user) {
        // If it's a Google sign-in, we need to fetch the DB user to get BizFlow-specific fields
        if (account?.provider === "google") {
          await connectDB();
          const dbUser = await User.findOne({ email: user.email });
          if (dbUser) {
            token.sub = dbUser._id.toString(); // Ensure sub is MongoDB ObjectId
            token.role = dbUser.role;
            token.businessName = dbUser.businessName;
            token.subEnd = dbUser.subscription?.endDate;
            token.plan = dbUser.subscription?.plan;
            token.status = dbUser.status;
            token.isEmailVerified = dbUser.isEmailVerified;
            token.createdAt = dbUser.createdAt;
            token.googleId = account.providerAccountId;
          }
        } else {
          // Credentials user already has these fields from authorize()
          token.role = user.role;
          token.businessName = user.businessName;
          token.subEnd = user.subEnd;
          token.plan = user.plan;
          token.status = user.status;
          token.isEmailVerified = user.isEmailVerified;
          token.createdAt = user.createdAt;
        }
      }

      // ── Session refresh or explicit update() call from frontend ──
      if (!user && token.sub) {
        await connectDB();
        
        // Fallback migration: If token.sub is NOT a valid MongoDB ObjectId (e.g. legacy Google ID)
        // We attempt to find the user by their googleId and "heal" the token.
        const mongoose = require("mongoose");
        const isValidObjectId = mongoose.Types.ObjectId.isValid(token.sub);
        
        let dbUser;
        if (!isValidObjectId) {
          // Find user by googleId instead
          dbUser = await User.findOne({ googleId: token.sub }).select("isEmailVerified role subscription createdAt status");
          if (dbUser) {
            token.sub = dbUser._id.toString(); // Correct the sub to be the Mongo ID
          }
        } else {
          dbUser = await User.findById(token.sub).select("isEmailVerified role subscription createdAt status");
        }

        if (dbUser) {
          token.isEmailVerified = dbUser.isEmailVerified ?? false;
          token.createdAt = dbUser.createdAt;
          token.status = dbUser.status;
          if (trigger === "update") {
            token.role = dbUser.role;
            token.subEnd = dbUser.subscription?.endDate;
            token.plan = dbUser.subscription?.plan;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.businessName = token.businessName as string;
        session.user.subEnd = token.subEnd as Date | undefined;
        session.user.plan = token.plan as string;
        session.user.status = token.status as string;
        session.user.isEmailVerified = token.isEmailVerified as boolean;
        session.user.createdAt = token.createdAt as Date;
        session.user.googleId = token.googleId as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
