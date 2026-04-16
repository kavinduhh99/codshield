import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const path = req.nextUrl.pathname;

    // ── Email Verification Guard ──
    // Exclude the verification routes themselves from the guard to prevent infinite loops.
    const isVerificationRoute = path.startsWith("/verify-email") || path.startsWith("/api/auth/verify");
    
    // IMPORTANT: We check !== true (not === false) because legacy users created before
    // this feature was added will have isEmailVerified = undefined in their JWT token.
    if (token && token.isEmailVerified !== true && !isVerificationRoute) {
      // Strictly protect dashboard, admin, and sensitive order APIs
      if (path.startsWith("/dashboard") || path.startsWith("/admin") || path.startsWith("/api/order") || path === "/") {
        return NextResponse.redirect(new URL("/verify-email", req.url));
      }
    }

    // Admins are exempt from lock
    if (token?.role === "admin") {
      return NextResponse.next();
    }

    // Subscription Check Lock
    if (token?.subEnd) {
      const expirationDate = new Date(token.subEnd as string);
      const isExpired = expirationDate < new Date();

      if (isExpired) {
        // Deny access to order creation and bulk ingestion when expired
        const restrictedPaths = ["/dashboard/order/new", "/api/order/bulk"];
        const isRestrictedApiMutation = path.startsWith("/api/order") && req.method !== "GET" && req.method !== "OPTIONS";
        
        const shouldRestrict = restrictedPaths.some(p => path.startsWith(p)) || isRestrictedApiMutation;

        if (shouldRestrict) {
          // If it's an API route strictly expecting JSON, redirect to billing, which fulfills the user requirement.
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
  matcher: ["/", "/admin/:path*", "/dashboard/:path*", "/order", "/customers", "/settings", "/api/order/:path*"],
};
