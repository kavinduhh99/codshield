"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useSession } from "next-auth/react";
import { 
  Loader2, Box, Plus, Search, Edit2, Trash2, AlertTriangle, 
  Download, FileText, Filter, BarChart3, CheckCircle, XCircle, Package
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { BulkProductUpload } from "@/components/products/BulkProductUpload";

// ── Components ─────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-start gap-3 shadow-sm transition-all hover:shadow-md">
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-xl font-black text-gray-900 dark:text-white mt-0.5 italic">{value}</p>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<any[]>([]);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCategories();
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      const timer = setTimeout(() => {
        fetchProducts();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [status, page, search, filter, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/product-categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilterChange = (val: string) => {
    setFilter(val);
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleCategoryChange = (val: string) => {
    setSelectedCategory(val);
    setPage(1);
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: "10",
        search: search,
        status: filter,
        category: selectedCategory
      });
      
      const res = await fetch(`/api/products?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setTotalPages(data.totalPages || 1);
        setTotalProductsCount(data.total || 0);
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts(products.filter(p => p._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ── Export Logic ──────────────────────────────────────────────────────────
  const exportToCSV = async (type: "all" | "low-stock") => {
    try {
      setLoading(true);
      // Fetch ALL matching products for export
      const queryParams = new URLSearchParams({
        search: search,
        status: filter,
        category: selectedCategory
      });
      
      const res = await fetch(`/api/products?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch products for export");
      
      const allMatchingProducts = await res.json();
      
      const dataToExport = type === "all" 
        ? allMatchingProducts 
        : allMatchingProducts.filter((p: any) => p.stock <= p.lowStockAlert);

      if (dataToExport.length === 0) {
        alert("No products found to export.");
        return;
      }

      const headers = [
        "Product Name", "SKU", "Category", "Cost Price", "Selling Price", 
        "Current Stock", "Low Stock Alert Qty", "Stock Status", 
        "Stock Value Cost", "Stock Value Selling", "Active Status"
      ];

      const rows = dataToExport.map((p: any) => {
        const stockStatus = p.stock <= 0 ? "Out of Stock" : (p.stock <= p.lowStockAlert ? "Low Stock" : "In Stock");
        const stockValueCost = (p.costPrice || 0) * (p.stock || 0);
        const stockValueSelling = (p.sellingPrice || 0) * (p.stock || 0);
        
        return [
          `"${p.name.replace(/"/g, '""')}"`,
          `"${p.sku.replace(/"/g, '""')}"`,
          `"${(p.category || 'General').replace(/"/g, '""')}"`,
          p.costPrice || 0,
          p.sellingPrice || 0,
          p.stock || 0,
          p.lowStockAlert || 0,
          `"${stockStatus}"`,
          stockValueCost,
          stockValueSelling,
          p.active ? "Active" : "Inactive"
        ];
      });

      const csvContent = [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      const date = new Date().toISOString().split("T")[0];
      const filename = type === "all" 
        ? `bizflow-stock-report-${date}.csv` 
        : `bizflow-low-stock-report-${date}.csv`;

      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Failed to export products.");
    } finally {
      setLoading(false);
    }
  };

  // ── Summary Calculations ──────────────────────────────────────────────────
  const totalProducts = stats?.totalProducts || 0;
  const totalStockUnits = stats?.totalStockUnits || 0;
  const lowStockCount = stats?.lowStockCount || 0;
  const outOfStockCount = stats?.outOfStockCount || 0;
  const totalStockCostValue = stats?.totalStockCostValue || 0;
  const totalStockSellingValue = stats?.totalStockSellingValue || 0;

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-50 dark:bg-slate-950 overflow-x-hidden">
      <Sidebar
        businessName={(session?.user as any)?.businessName}
        userName={session?.user?.name}
        role={(session?.user as any)?.role}
      />

      <div className="flex flex-1 flex-col pt-14 md:pt-0 md:pl-64">
        <main className="flex-1">
          <div className="py-6 pb-16 space-y-6 mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-gray-100 dark:border-gray-800 pb-6">
              <div className="min-w-0">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tight">Products & Stock</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide">Manage inventory levels, pricing, and active catalog.</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => exportToCSV("all")}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 shadow-sm border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95 uppercase tracking-widest"
                >
                  <FileText className="mr-2 h-4 w-4 text-gray-400" /> Stock Report
                </button>
                <button
                  onClick={() => exportToCSV("low-stock")}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-white dark:bg-gray-900 px-4 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 shadow-sm border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95 uppercase tracking-widest"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" /> Low Stock Report
                </button>
                <Link
                  href="/dashboard/products/new"
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-black text-white shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-105 transition-all active:scale-95 uppercase tracking-widest"
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Product
                </Link>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <StatCard label="Total Products" value={String(totalProducts)} icon={Box} color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" />
              <StatCard label="Stock Units" value={totalStockUnits.toLocaleString()} icon={Package} color="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" />
              <StatCard label="Low Stock" value={String(lowStockCount)} icon={AlertTriangle} color="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" />
              <StatCard label="Out of Stock" value={String(outOfStockCount)} icon={XCircle} color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" />
              <StatCard label="Cost Value" value={`Rs ${Math.round(totalStockCostValue).toLocaleString()}`} icon={BarChart3} color="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" />
              <StatCard label="Sale Value" value={`Rs ${Math.round(totalStockSellingValue).toLocaleString()}`} icon={BarChart3} color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" />
            </div>

            <BulkProductUpload onSuccess={() => {
              fetchProducts();
              fetchCategories();
            }} />

            {/* Controls */}
            <div className="bg-white dark:bg-gray-900 shadow-xl rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
                <div className="relative w-full lg:max-w-md">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full rounded-xl border border-gray-200 dark:border-gray-800 pl-10 pr-4 py-2.5 text-sm ring-offset-0 focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white font-medium"
                    placeholder="Search by name or SKU..."
                     value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                  <div className="hidden sm:flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mr-2">
                    <Filter className="h-3 w-3" /> Filter
                  </div>
                  <select
                    className="w-full sm:w-auto bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                    value={filter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                  >
                    <option value="all">All Products</option>
                    <option value="in-stock">In Stock</option>
                    <option value="low-stock">Low Stock Alert</option>
                    <option value="out-of-stock">Out of Stock</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                  </select>

                  <select
                    className="w-full sm:w-auto bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-sm rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                    value={selectedCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
              {/* ── Mobile card list ── */}
              <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-800">
                {products.length === 0 ? (
                  <div className="px-4 py-20 text-center text-gray-500 dark:text-gray-400">
                    <Box className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-700 mb-4" />
                    <p className="font-bold uppercase tracking-widest text-xs">No products found</p>
                  </div>
                ) : (
                  products.map((p) => (
                    <div key={p._id} className="p-5 flex flex-col gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-gray-900 dark:text-white truncate uppercase italic">{p.name}</p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5 truncate">
                            {p.category || 'General'} &bull; {p.sku}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {!p.active && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter bg-gray-100 dark:bg-gray-800 text-gray-400">Inactive</span>
                          )}
                          {p.stock <= 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                              Out of Stock
                            </span>
                          ) : p.stock <= p.lowStockAlert ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                              Low Stock: {p.stock}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              Stock: {p.stock}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 py-3 border-y border-gray-50 dark:border-gray-800/50">
                        <div>
                          <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Selling Price</p>
                          <p className="text-sm font-black text-gray-900 dark:text-white italic">Rs {p.sellingPrice.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Cost Price</p>
                          <p className="text-sm font-bold text-gray-400 italic">Rs {p.costPrice.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => router.push(`/dashboard/products/new?id=${p._id}`)}
                          className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                          <Edit2 className="h-3 w-3" /> Edit
                        </button>
                        <button onClick={() => deleteProduct(p._id)}
                          className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* ── Desktop table ── */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Product Info</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Pricing</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Stock Level</th>
                      <th className="px-6 py-4 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900/20 divide-y divide-gray-100 dark:divide-gray-800/50">
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-24 text-center text-gray-500 dark:text-gray-400">
                          <Box className="mx-auto h-16 w-16 text-gray-200 dark:text-gray-800 mb-4" />
                          <p className="font-bold uppercase tracking-widest text-xs italic">No matching products in your inventory</p>
                        </td>
                      </tr>
                    ) : (
                      products.map((p) => (
                        <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                                <Box className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                              </div>
                              <div>
                                <div className="text-sm font-black text-gray-900 dark:text-white uppercase italic tracking-tight">{p.name}</div>
                                <div className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mt-0.5">{p.category || 'General'} &bull; {p.sku}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-black text-gray-900 dark:text-white">Rs {p.sellingPrice.toLocaleString()}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cost: Rs {p.costPrice.toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {p.stock <= 0 ? (
                              <div className="flex flex-col">
                                <span className="inline-flex items-center text-[10px] font-black uppercase text-red-600 dark:text-red-400">
                                  <XCircle className="mr-1 h-3 w-3" /> Out of Stock
                                </span>
                              </div>
                            ) : p.stock <= p.lowStockAlert ? (
                              <div className="flex flex-col">
                                <span className="inline-flex items-center text-[10px] font-black uppercase text-orange-600 dark:text-orange-400">
                                  <AlertTriangle className="mr-1 h-3 w-3" /> Low Stock
                                </span>
                                <span className="text-xs font-black text-gray-900 dark:text-white mt-0.5">{p.stock} units</span>
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                <span className="inline-flex items-center text-[10px] font-black uppercase text-green-600 dark:text-green-400">
                                  <CheckCircle className="mr-1 h-3 w-3" /> Healthy
                                </span>
                                <span className="text-xs font-black text-gray-900 dark:text-white mt-0.5">{p.stock} units</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {p.active ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 tracking-tighter">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 tracking-tighter">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => router.push(`/dashboard/products/new?id=${p._id}`)} 
                                className="p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 transition-all border border-transparent hover:border-blue-100 dark:hover:border-blue-900/50"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => deleteProduct(p._id)} 
                                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-all border border-transparent hover:border-red-100 dark:hover:border-red-900/50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination Controls ── */}
              {totalPages > 1 && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <div className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 italic text-center sm:text-left">
                    Showing Page {page} of {totalPages} <span className="hidden sm:inline mx-2 text-gray-300 dark:text-gray-700">|</span> <span className="block sm:inline mt-1 sm:mt-0">Total {totalProductsCount} products</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      className="px-4 py-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-center"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 text-center"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
