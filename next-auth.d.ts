import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role?: string;
    businessName?: string;
    subEnd?: Date;
    plan?: string;
    status?: string;
    isEmailVerified?: boolean;
    createdAt?: Date;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      businessName?: string;
      subEnd?: Date;
      plan?: string;
      status?: string;
      isEmailVerified?: boolean;
      createdAt?: Date;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    businessName?: string;
    subEnd?: Date;
    plan?: string;
    status?: string;
    isEmailVerified?: boolean;
    createdAt?: Date;
  }
}
