import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const path = req.nextUrl.pathname;

    // ── Email Verification Guard ──
    const isVerificationRoute = path.startsWith("/verify-email") || path.startsWith("/api/auth/verify");
    const isPublicApi = path.startsWith("/api/auth") || path.startsWith("/api/register");
    
    if (token && token.isEmailVerified !== true && !isVerificationRoute) {
      // Strictly protect dashboard, admin, and all non-public APIs
      if (path.startsWith("/dashboard") || path.startsWith("/admin") || (path.startsWith("/api") && !isPublicApi) || path === "/") {
        return NextResponse.redirect(new URL("/verify-email", req.url));
      }
    }

    // Admins are exempt from status/subscription locks
    if (token?.role === "admin") {
      return NextResponse.next();
    }

    // Account Status Guard (Suspended)
    if (token?.status === "suspended") {
      const isBillingPage = path === "/dashboard/billing";
      const isApiMutation = path.startsWith("/api") && !isPublicApi && req.method !== "GET" && req.method !== "OPTIONS";
      
      if (((path.startsWith("/dashboard") || path === "/") && !isBillingPage) || isApiMutation) {
        if (path.startsWith("/api")) {
          return NextResponse.json({ message: "Account Suspended", code: "SUSPENDED" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/dashboard/billing", req.url));
      }
    }

    // Subscription Check Lock (Expired)
    if (token?.subEnd) {
      const expirationDate = new Date(token.subEnd as any);
      const isExpired = expirationDate < new Date();

      if (isExpired) {
        const isDashboardPath = path.startsWith("/dashboard");
        const isBillingPage = path === "/dashboard/billing";
        const isApiMutation = path.startsWith("/api") && !isPublicApi && req.method !== "GET" && req.method !== "OPTIONS";
        
        if ((isDashboardPath && !isBillingPage) || isApiMutation) {
          if (path.startsWith("/api")) {
            return NextResponse.json({ message: "Subscription Expired", code: "EXPIRED" }, { status: 403 });
          }
          return NextResponse.redirect(new URL("/dashboard/billing", req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const path = req.nextUrl.pathname;
        const isPublicApi = path.startsWith("/api/auth") || path.startsWith("/api/register");

        if (isPublicApi) return true;

        // Route protection: If path starts with /admin, ensure role is admin safely
        if (path.startsWith("/admin")) {
          return typeof token?.role === "string" && token.role.toLowerCase() === "admin";
        }

        // Default behavior for other matched routes: ensure user is authenticated
        return !!token;
      },
    },
  }
);

// Define regions the middleware applies to
export const config = {
  matcher: ["/", "/admin/:path*", "/dashboard/:path*", "/settings", "/api/:path*"],
};
