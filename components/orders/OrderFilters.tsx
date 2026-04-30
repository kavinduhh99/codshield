"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

export function OrderFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentStatus = searchParams.get("status") || "";
  const currentRisk = searchParams.get("risk") || "";

  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const debouncedSearch = useDebounce(searchTerm, 500);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      // Reset page to 1 on filter change
      params.set("page", "1");
      return params.toString();
    },
    [searchParams]
  );

  useEffect(() => {
    if (debouncedSearch !== currentSearch) {
      router.push(`${pathname}?${createQueryString("search", debouncedSearch)}`);
    }
  }, [debouncedSearch, currentSearch, pathname, router, createQueryString]);

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-slate-800">
      {/* Search Input */}
      <div className="flex-1 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by order ID, customer name, phone..."
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-slate-700 rounded-md leading-5 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex gap-4">
        {/* Status Filter */}
        <select
          value={currentStatus}
          onChange={(e) => {
            router.push(`${pathname}?${createQueryString("status", e.target.value)}`);
          }}
          className="block w-full md:w-40 py-2 pl-3 pr-10 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-slate-100 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="returned">Returned</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Risk Filter */}
        <select
          value={currentRisk}
          onChange={(e) => {
            router.push(`${pathname}?${createQueryString("risk", e.target.value)}`);
          }}
          className="block w-full md:w-40 py-2 pl-3 pr-10 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-slate-100 cursor-pointer"
        >
          <option value="">All Risks</option>
          <option value="safe">Safe</option>
          <option value="warning">Warning</option>
          <option value="high">High Risk</option>
        </select>
      </div>
    </div>
  );
}
