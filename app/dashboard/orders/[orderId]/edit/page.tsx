"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { useSession } from "next-auth/react";
import {
  Phone, MapPin, User as UserIcon, Loader2, Building,
  PlusCircle, Search, Tag, X, Trash2, ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface OrderItem {
  id: string;
  productId?: string;
  productName: string;
  sku?: string;
  quantity: number;
  costPrice: number;
  unitSellingPrice: number;
  lineTotal: number;
  stock?: number;
  lowStockAlert?: number;
}

export default function EditOrderPage() {
  const router = useRouter();
  const { orderId } = useParams<{ orderId: string }>();
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderStatus, setOrderStatus] = useState<string>("");
  const [products, setProducts] = useState<any[]>([]);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    customerName: "", phone: "", phone2: "", address: "", city: "",
    discount: 0, deliveryFee: 0, paymentMethod: "COD", paymentStatus: "unpaid",
    courierName: "", trackingNumber: "", notes: "",
  });

  const [items, setItems] = useState<OrderItem[]>([]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch order + products
  useEffect(() => {
    if (status !== "authenticated" || !orderId) return;

    const loadData = async () => {
      try {
        const [orderRes, productsRes] = await Promise.all([
          fetch(`/api/order/${orderId}`),
          fetch("/api/products"),
        ]);

        if (!orderRes.ok) { router.push("/dashboard/order/history"); return; }

        const order = await orderRes.json();
        const productsData = productsRes.ok ? await productsRes.json() : [];
        setProducts(productsData);

        // Store status for the lock guard
        setOrderStatus(order.status || "");

        setFormData({
          customerName: order.customerName || "",
          phone: order.phone || "",
          phone2: order.phone2 || "",
          address: order.address || "",
          city: order.city || "",
          discount: order.discount || 0,
          deliveryFee: order.deliveryFee || 0,
          paymentMethod: order.paymentMethod || "COD",
          paymentStatus: order.paymentStatus || "unpaid",
          courierName: order.courierName || "",
          trackingNumber: order.trackingNumber || "",
          notes: order.notes || "",
        });

        // Build items from items array or legacy fallback
        if (order.items && order.items.length > 0) {
          setItems(order.items.map((item: any) => ({
            id: Math.random().toString(),
            productId: item.productId || undefined,
            productName: item.productName || "",
            sku: item.sku || "",
            quantity: item.quantity || 1,
            costPrice: item.costPrice || 0,
            unitSellingPrice: item.unitSellingPrice || 0,
            lineTotal: item.lineTotal || 0,
          })));
        } else {
          setItems([{
            id: Math.random().toString(),
            productId: order.productId || undefined,
            productName: order.productNameText || "",
            quantity: order.quantity || 1,
            costPrice: order.costPrice || 0,
            unitSellingPrice: order.sellingPrice || 0,
            lineTotal: (order.sellingPrice || 0) * (order.quantity || 1),
          }]);
        }
      } catch {
        setError("Failed to load order.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [status, orderId, router]);

  // Derived totals
  const itemsSubtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const totalAmount = itemsSubtotal + formData.deliveryFee - formData.discount;

  const handleAddItem = () => setItems([...items, {
    id: Math.random().toString(), productName: "", quantity: 1,
    costPrice: 0, unitSellingPrice: 0, lineTotal: 0,
  }]);

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter(i => i.id !== id));
  };

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setItems(items.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === "quantity" || field === "unitSellingPrice") {
        updated.lineTotal = updated.quantity * updated.unitSellingPrice;
      }
      return updated;
    }));
  };

  const handleSelectProduct = (id: string, product: any) => {
    if (product.stock <= 0) return;
    setItems(items.map(item => {
      if (item.id !== id) return item;
      return {
        ...item, productId: product._id, productName: product.name,
        sku: product.sku, costPrice: product.costPrice,
        unitSellingPrice: product.sellingPrice,
        lineTotal: item.quantity * product.sellingPrice,
        stock: product.stock, lowStockAlert: product.lowStockAlert,
      };
    }));
    setOpenDropdownId(null);
  };

  const handleClearProduct = (id: string) => {
    setItems(items.map(item => item.id !== id ? item : {
      id: item.id, productName: "", quantity: item.quantity,
      costPrice: 0, unitSellingPrice: 0, lineTotal: 0,
    }));
  };

  const getFiltered = (query: string) => products.filter(p => {
    if (!p.active) return false;
    const q = (query || "").toLowerCase();
    return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q));
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    for (const item of items) {
      if (!item.productName.trim()) { setError("All items must have a product name."); return; }
      if (item.quantity < 1) { setError(`Invalid quantity for ${item.productName}`); return; }
      if (item.unitSellingPrice < 0) { setError(`Invalid price for ${item.productName}`); return; }
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/order/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items: items.map(i => ({
            productId: i.productId, productName: i.productName, sku: i.sku,
            quantity: i.quantity, costPrice: i.costPrice,
            unitSellingPrice: i.unitSellingPrice, lineTotal: i.lineTotal,
          })),
          itemsSubtotal,
          totalAmount,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to update order");
        setSubmitting(false);
        return;
      }

      router.push(`/dashboard/order/${orderId}`);
      router.refresh();
    } catch {
      setError("Server error while updating order.");
      setSubmitting(false);
    }
  };

  const inputCls = "block w-full rounded-md border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3";
  const labelCls = "block text-sm font-medium text-gray-700 dark:text-gray-300";

  if (status === "loading" || loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-950"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  const EDITABLE_STATUSES = ["pending", "processing"];
  const isLocked = orderStatus && !EDITABLE_STATUSES.includes(orderStatus);

  return (
    <div className="flex min-h-screen w-full bg-gray-50 dark:bg-slate-950 overflow-x-hidden">
      <Sidebar
        businessName={(session?.user as any)?.businessName}
        userName={session?.user?.name}
        role={(session?.user as any)?.role}
      />

      <div className="flex flex-1 flex-col pt-14 md:pt-0 md:pl-64">
        <main className="flex-1">
          <div className="py-6 pb-16 space-y-6 mx-auto max-w-4xl px-4 sm:px-6 md:px-8">

            <div className="flex items-center gap-3">
              <Link href={`/dashboard/order/${orderId}`} className="inline-flex items-center text-sm text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors">
                <ArrowLeft className="mr-1 h-4 w-4" /> Back to Order
              </Link>
            </div>

            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Edit Order</h1>

            {isLocked ? (
              <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg border border-amber-200 dark:border-amber-700/50 p-8 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
                    <svg className="h-8 w-8 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m10-9a8 8 0 11-16 0 8 8 0 0116 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10h.01M15 10h.01" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Order Cannot Be Edited</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  This order cannot be edited because it is already{" "}
                  <span className="font-semibold capitalize text-gray-700 dark:text-gray-300">{orderStatus}</span>.
                  Only <strong>pending</strong> and <strong>processing</strong> orders can be modified.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <Link href={`/dashboard/order/${orderId}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <ArrowLeft className="h-4 w-4" /> Back to Order
                  </Link>
                  <Link href="/dashboard/order/history"
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                    View All Orders
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg border border-gray-100 dark:border-gray-700">
                <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Order Details</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                {error && (
                  <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-300">{error}</div>
                )}

                <form className="space-y-8" onSubmit={handleSubmit}>
                  {/* Customer Info */}
                  <div className="space-y-6">
                    <div>
                      <label className={labelCls}>Customer Name *</label>
                      <div className="relative mt-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><UserIcon className="h-5 w-5 text-gray-400" /></div>
                        <input type="text" required className={`${inputCls} pl-10`} value={formData.customerName}
                          onChange={e => setFormData({ ...formData, customerName: e.target.value })} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label className={labelCls}>Phone Number *</label>
                        <div className="relative mt-1">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Phone className="h-5 w-5 text-gray-400" /></div>
                          <input type="tel" required className={`${inputCls} pl-10`} value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Phone 2 (Optional)</label>
                        <div className="relative mt-1">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Phone className="h-5 w-5 text-gray-400" /></div>
                          <input type="tel" className={`${inputCls} pl-10`} value={formData.phone2}
                            onChange={e => setFormData({ ...formData, phone2: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label className={labelCls}>City *</label>
                        <div className="relative mt-1">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Building className="h-5 w-5 text-gray-400" /></div>
                          <input type="text" required className={`${inputCls} pl-10`} value={formData.city}
                            onChange={e => setFormData({ ...formData, city: e.target.value })} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className={labelCls}>Delivery Address *</label>
                      <div className="relative mt-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 pb-6"><MapPin className="h-5 w-5 text-gray-400" /></div>
                        <textarea rows={3} required className={`${inputCls} pl-10`} value={formData.address}
                          onChange={e => setFormData({ ...formData, address: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-8" ref={dropdownRef}>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-md font-medium text-gray-900 dark:text-white">Order Items</h4>
                      <button type="button" onClick={handleAddItem}
                        className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium">
                        <PlusCircle className="h-4 w-4 mr-1" /> Add Item
                      </button>
                    </div>

                    <div className="space-y-4">
                      {items.map((item) => (
                        <div key={item.id} className="relative p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                          {items.length > 1 && (
                            <button type="button" onClick={() => handleRemoveItem(item.id)}
                              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            {/* Product picker */}
                            <div className="md:col-span-5 relative">
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Product</label>
                              {!item.productId ? (
                                <div className="relative">
                                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Search className="h-4 w-4 text-gray-400" /></div>
                                  <input type="text"
                                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 pl-10 pr-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                    placeholder="Search or type product name..."
                                    value={searchQueries[item.id] !== undefined ? searchQueries[item.id] : item.productName}
                                    onChange={e => {
                                      setSearchQueries({ ...searchQueries, [item.id]: e.target.value });
                                      updateItem(item.id, "productName", e.target.value);
                                      setOpenDropdownId(item.id);
                                    }}
                                    onFocus={() => setOpenDropdownId(item.id)}
                                  />
                                  {openDropdownId === item.id && (
                                    <div className="absolute z-20 mt-1 w-full rounded-md bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black ring-opacity-5 max-h-60 overflow-auto">
                                      <ul className="py-1 text-sm">
                                        {getFiltered(searchQueries[item.id] || item.productName).length === 0 ? (
                                          <li className="py-2 pl-3 text-gray-500 dark:text-gray-400">No matching products. Keep typing to use as manual name.</li>
                                        ) : (
                                          getFiltered(searchQueries[item.id] || item.productName).map(p => (
                                            <li key={p._id}
                                              className={`cursor-pointer py-2 pl-3 pr-4 flex justify-between hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-50 dark:border-gray-700/50 ${p.stock <= 0 ? "opacity-50" : ""}`}
                                              onClick={() => handleSelectProduct(item.id, p)}>
                                              <div>
                                                <span className="block font-medium text-gray-900 dark:text-white">{p.name}</span>
                                                <span className="text-xs text-gray-500 flex items-center"><Tag className="h-3 w-3 mr-1" />{p.sku}</span>
                                              </div>
                                              <div className="text-right">
                                                <span className="font-semibold text-gray-900 dark:text-white">Rs {p.sellingPrice}</span>
                                                <span className="block text-xs text-gray-500">{p.stock <= 0 ? "Out of stock" : `Stock: ${p.stock}`}</span>
                                              </div>
                                            </li>
                                          ))
                                        )}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="relative rounded-md border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 p-2 flex justify-between items-start">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.productName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.sku}</p>
                                  </div>
                                  <button type="button" onClick={() => handleClearProduct(item.id)} className="text-gray-400 hover:text-gray-600">
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Qty</label>
                              <input type="number" min="1" required className={inputCls} value={item.quantity}
                                onChange={e => updateItem(item.id, "quantity", Number(e.target.value))} />
                            </div>
                            <div className="md:col-span-3">
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Unit Price (Rs)</label>
                              <input type="number" min="0" required className={inputCls} value={item.unitSellingPrice}
                                onChange={e => updateItem(item.id, "unitSellingPrice", Number(e.target.value))} />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Line Total</label>
                              <div className="py-2 font-medium text-gray-900 dark:text-white text-right">{item.lineTotal.toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment & Shipping */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Payment & Shipping</h4>
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                      <div>
                        <label className={labelCls}>Payment Method</label>
                        <select className={`mt-1 ${inputCls}`} value={formData.paymentMethod}
                          onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}>
                          <option value="COD">Cash on Delivery (COD)</option>
                          <option value="Card Payment">Card Payment</option>
                          <option value="Bank Deposit">Bank Deposit</option>
                          <option value="Koko Installment">Koko Installment</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Payment Status</label>
                        <select className={`mt-1 ${inputCls}`} value={formData.paymentStatus}
                          onChange={e => setFormData({ ...formData, paymentStatus: e.target.value })}>
                          <option value="unpaid">Unpaid</option>
                          <option value="paid">Paid</option>
                          <option value="partial">Partial</option>
                        </select>
                      </div>

                      <div>
                        <label className={labelCls}>Delivery Fee (Rs)</label>
                        <input type="number" min="0" className={`mt-1 ${inputCls}`} value={formData.deliveryFee}
                          onChange={e => setFormData({ ...formData, deliveryFee: Number(e.target.value) })} />
                      </div>
                      <div>
                        <label className={labelCls}>Discount (Rs)</label>
                        <input type="number" min="0" className={`mt-1 ${inputCls}`} value={formData.discount}
                          onChange={e => setFormData({ ...formData, discount: Number(e.target.value) })} />
                      </div>

                      <div className="sm:col-span-2 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div>
                          <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Amount</span>
                          {formData.paymentMethod === "COD" && (
                            <span className="block text-xs text-blue-600 dark:text-blue-400">COD Collection Amount</span>
                          )}
                        </div>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">Rs {totalAmount.toLocaleString()}</span>
                      </div>

                      <div>
                        <label className={labelCls}>Courier Name (Optional)</label>
                        <input type="text" className={`mt-1 ${inputCls}`} value={formData.courierName}
                          onChange={e => setFormData({ ...formData, courierName: e.target.value })} />
                      </div>
                      <div>
                        <label className={labelCls}>Tracking Number (Optional)</label>
                        <input type="text" className={`mt-1 ${inputCls}`} value={formData.trackingNumber}
                          onChange={e => setFormData({ ...formData, trackingNumber: e.target.value })} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Notes (Optional)</label>
                        <textarea rows={2} className={`mt-1 ${inputCls}`} value={formData.notes}
                          onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Link href={`/dashboard/order/${orderId}`}
                      className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                      Cancel
                    </Link>
                    <button type="submit" disabled={submitting}
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                      {submitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
