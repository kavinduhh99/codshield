import NextAuth, { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      businessName?: string;
      subEnd?: Date;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role?: string;
    businessName?: string;
    subEnd?: Date;
  }
}
