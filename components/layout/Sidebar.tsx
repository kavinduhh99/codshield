"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShieldAlert,
  LogOut,
  Users,
  Activity,
  CreditCard,
  PlusCircle,
  Package,
  FileText,
  Menu,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";

interface SidebarProps {
  businessName?: string;
  userName?: string | null;
  role?: string;
}

const businessLinks = [
  { href: "/dashboard/order/new", label: "Add Order", icon: PlusCircle },
  { href: "/dashboard/order/history", label: "Order History", icon: Package },
  { href: "/dashboard/risk", label: "Risk Checker", icon: ShieldAlert },
  { href: "/dashboard/billing", label: "Billing", icon: FileText },
];

const adminLinks = [
  { href: "/admin/users", label: "Users List", icon: Users },
  { href: "/admin/subscriptions", label: "Subscription Management", icon: CreditCard },
  { href: "/admin/analytics", label: "System Analytics", icon: Activity },
];

function SidebarContent({
  businessName,
  userName,
  role,
  onClose,
}: SidebarProps & { onClose?: () => void }) {
  const pathname = usePathname();
  const isAdmin = role === "admin";
  const links = isAdmin ? adminLinks : businessLinks;

  return (
    <div className="flex h-full w-full flex-col bg-gray-900 text-white">
      {/* Logo Header */}
      <div className="flex h-16 items-center flex-shrink-0 px-4 bg-gray-950 justify-between">
        <div className="flex items-center">
          <ShieldAlert className="h-8 w-8 text-blue-500 mr-2" />
          <span className="text-xl font-bold tracking-tight">CODShield</span>
        </div>
        {/* Close button - only visible on mobile */}
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav Links */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`group flex items-center rounded-md px-2 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <Icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                    isActive ? "text-blue-400" : "text-gray-400 group-hover:text-gray-300"
                  }`}
                  aria-hidden="true"
                />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="flex flex-col flex-shrink-0 bg-gray-800 p-4">
        <div className="flex w-full items-center mb-4">
          <div className="h-8 w-8 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-blue-400">
              {(userName || "U")[0].toUpperCase()}
            </span>
          </div>
          <div className="ml-3 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {businessName || "Your Business"}
            </p>
            <p className="text-xs font-medium text-gray-400 truncate">
              {userName || "Administrator"} {isAdmin && "(Admin)"}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="group flex w-full items-center rounded-md px-2 py-2 text-sm font-medium text-gray-300 hover:bg-red-600 hover:text-white transition-colors"
        >
          <LogOut
            className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400 group-hover:text-white"
            aria-hidden="true"
          />
          Logout
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ businessName, userName, role }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar on route change (pathname changes)
  const pathname = usePathname();
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      // Always clean up on unmount — critical to prevent permanent scroll lock
      document.body.style.overflow = "unset";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* ── MOBILE HEADER ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-between bg-gray-950 border-b border-gray-800 px-4 shadow-lg">
        <div className="flex items-center">
          <ShieldAlert className="h-6 w-6 text-blue-500 mr-2" />
          <span className="text-lg font-bold tracking-tight text-white">CODShield</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* ── DESKTOP SIDEBAR (always visible) ── */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-20">
        <SidebarContent
          businessName={businessName}
          userName={userName}
          role={role}
        />
      </div>

      {/* ── MOBILE DRAWER OVERLAY ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── MOBILE DRAWER PANEL ── */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          businessName={businessName}
          userName={userName}
          role={role}
          onClose={() => setMobileOpen(false)}
        />
      </div>
    </>
  );
}
