import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
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
          isEmailVerified: user.isEmailVerified,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // ── Initial sign-in: stamp all custom claims onto the token exactly once ──
      if (user) {
        token.role = user.role;
        token.businessName = user.businessName;
        token.subEnd = user.subEnd;
        // Stamp the verified flag from the DB record at login time.
        // If the field doesn't exist yet (legacy user), this will be undefined.
        token.isEmailVerified = user.isEmailVerified;
      }

      // ── Session refresh or explicit update() call from frontend ──
      // We ALWAYS re-read isEmailVerified from the DB on every token refresh.
      // This is the critical safety net: if a user verifies their email in one tab,
      // their next request in any tab will get the updated token without needing
      // them to sign out. It also heals legacy tokens where the field was undefined.
      await connectDB();
      const dbUser = await User.findById(token.sub).select("isEmailVerified role subscription");
      if (dbUser) {
        token.isEmailVerified = dbUser.isEmailVerified ?? false;
        // On trigger=update, also refresh other mutable claims
        if (trigger === "update") {
          token.role = dbUser.role;
          token.subEnd = dbUser.subscription?.endDate;
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
        session.user.isEmailVerified = token.isEmailVerified as boolean;
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
