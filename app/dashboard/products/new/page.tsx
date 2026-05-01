"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { useSession } from "next-auth/react";
import { Loader2, ChevronDown, Check, Plus } from "lucide-react";

function ProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { data: session, status } = useSession();

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "General",
    costPrice: 0,
    sellingPrice: 0,
    stock: 0,
    lowStockAlert: 5,
  });

  const [loading, setLoading] = useState(!!id);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Categories State
  const [categories, setCategories] = useState<any[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      fetchCategories();
      if (id) fetchProduct();
    }
  }, [id, status]);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/product-categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchProduct = async () => {
    try {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        const prod = data.find((p: any) => p._id === id);
        if (prod) {
          setFormData({
            name: prod.name,
            sku: prod.sku,
            category: prod.category,
            costPrice: prod.costPrice,
            sellingPrice: prod.sellingPrice,
            stock: prod.stock,
            lowStockAlert: prod.lowStockAlert,
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const url = id ? `/api/products/${id}` : "/api/products";
      const method = id ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to save product");
      }

      router.push("/dashboard/products");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950"><Loader2 className="h-8 w-8 animate-spin text-blue-500"/></div>;
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
          <div className="py-6 pb-16 space-y-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{id ? "Edit Product" : "Add New Product"}</h1>
            </div>

            <div className="mx-auto max-w-3xl px-4 sm:px-6 md:px-8">
              <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="px-4 py-5 sm:p-6">
                  {error && (
                    <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-300">
                      {error}
                    </div>
                  )}

                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Name *</label>
                        <input
                          type="text"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">SKU *</label>
                        <input
                          type="text"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3"
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        />
                      </div>

                       <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                        <div className="relative mt-1">
                          <input
                            type="text"
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3"
                            placeholder="Select or type a category..."
                            value={formData.category}
                            onFocus={() => setShowCategoryDropdown(true)}
                            onChange={(e) => {
                              setFormData({ ...formData, category: e.target.value });
                              setCategorySearch(e.target.value);
                              setShowCategoryDropdown(true);
                            }}
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-2"
                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                          >
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          </button>
                        </div>

                        {showCategoryDropdown && (
                          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm border border-gray-200 dark:border-gray-700">
                            {categories
                              .filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()))
                              .map((cat) => (
                                <button
                                  key={cat._id}
                                  type="button"
                                  className="relative w-full cursor-default select-none py-2 pl-3 pr-9 text-left text-gray-900 dark:text-white hover:bg-blue-600 hover:text-white"
                                  onClick={() => {
                                    setFormData({ ...formData, category: cat.name });
                                    setCategorySearch("");
                                    setShowCategoryDropdown(false);
                                  }}
                                >
                                  <span className="block truncate">{cat.name}</span>
                                  {formData.category === cat.name && (
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                                      <Check className="h-4 w-4" aria-hidden="true" />
                                    </span>
                                  )}
                                </button>
                              ))}
                            
                            {formData.category && !categories.some(c => c.name.toLowerCase() === formData.category.toLowerCase()) && (
                              <button
                                type="button"
                                className="relative w-full cursor-default select-none py-2 pl-3 pr-9 text-left text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white"
                                onClick={() => setShowCategoryDropdown(false)}
                              >
                                <div className="flex items-center gap-2">
                                  <Plus className="h-4 w-4" />
                                  <span className="block truncate font-bold uppercase tracking-widest text-[10px]">Create category: {formData.category}</span>
                                </div>
                              </button>
                            )}

                            {categories.length === 0 && !formData.category && (
                              <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 italic">
                                No categories yet. Type one to create it.
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Backdrop to close dropdown */}
                        {showCategoryDropdown && (
                          <div 
                            className="fixed inset-0 z-0" 
                            onClick={() => setShowCategoryDropdown(false)}
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cost Price (Rs)</label>
                        <input
                          type="number"
                          min="0"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3"
                          value={formData.costPrice}
                          onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Selling Price (Rs) *</label>
                        <input
                          type="number"
                          min="0"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3"
                          value={formData.sellingPrice}
                          onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Stock *</label>
                        <input
                          type="number"
                          min="0"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3"
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Low Stock Alert Quantity</label>
                        <input
                          type="number"
                          min="0"
                          className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3"
                          value={formData.lowStockAlert}
                          onChange={(e) => setFormData({ ...formData, lowStockAlert: Number(e.target.value) })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => router.back()}
                        className="mr-3 inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                      >
                        {submitting ? "Saving..." : "Save Product"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AddProductPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950"><Loader2 className="h-8 w-8 animate-spin text-blue-500"/></div>}>
      <ProductForm />
    </Suspense>
  );
}
