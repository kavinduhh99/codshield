"use client";

import React from "react";
import { Printer } from "lucide-react";

interface PrintButtonProps {
  className?: string;
  label?: string;
}

export function PrintButton({ className, label = "Print Now" }: PrintButtonProps) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <button
      onClick={handlePrint}
      className={className || "bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm"}
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
