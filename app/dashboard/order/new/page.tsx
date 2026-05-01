"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { useSession } from "next-auth/react";
import { ShieldAlert, AlertTriangle, Phone, MapPin, User as UserIcon, Loader2, Building, Calendar, CheckCircle, PlusCircle, Search, Package, Tag, X, Trash2, Truck, Database, Info } from "lucide-react";
import { BulkUploadCard } from "@/components/orders/BulkUploadCard";

interface OrderItem {
  id: string; // temporary id for UI mapping
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

export default function AddOrderPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    phone2: "",
    address: "",
    city: "",
    discount: 0,
    deliveryFee: 0,
    paymentMethod: "COD",
    paymentStatus: "unpaid",
    courierName: "",
    trackingNumber: "",
    notes: ""
  });

  const [items, setItems] = useState<OrderItem[]>([{
    id: Math.random().toString(),
    productName: "",
    quantity: 1,
    costPrice: 0,
    unitSellingPrice: 0,
    lineTotal: 0
  }]);

  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Search State for each row
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Risk Engine State
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high" | null>(null);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [riskSuccessOrders, setRiskSuccessOrders] = useState<number>(0);
  const [riskFailedOrders, setRiskFailedOrders] = useState<number>(0);
  const [riskTotalOrders, setRiskTotalOrders] = useState<number>(0);
  const [riskLastOrderDate, setRiskLastOrderDate] = useState<string | null>(null);
  const [historicalDelivered, setHistoricalDelivered] = useState<number>(0);
  const [historicalReturned, setHistoricalReturned] = useState<number>(0);
  const [hasHistorical, setHasHistorical] = useState<boolean>(false);
  const [checkingRisk, setCheckingRisk] = useState(false);

  // Fetch products
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/products")
        .then(res => res.json())
        .then(data => setProducts(data))
        .catch(console.error);
    }
  }, [status]);

  // Debounce hook for phone risk check
  useEffect(() => {
    const checkRisk = async (phoneStr: string, phone2Str: string) => {
      if (phoneStr.length < 8 && phone2Str.length < 8) {
        setRiskScore(null);
        return;
      }
      setCheckingRisk(true);
      try {
        const res = await fetch("/api/order/check-risk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneStr, phone2: phone2Str }),
        });
        
        if (res.ok) {
          const data = await res.json();
          setRiskScore(data.riskScore);
          setRiskLevel(data.riskLevel ?? "low");
          setRiskSuccessOrders(data.successOrders ?? 0);
          setRiskFailedOrders(data.failedOrders ?? 0);
          setRiskTotalOrders(data.totalOrders ?? 0);
          setRiskLastOrderDate(data.lastOrderDate ?? null);
          setHistoricalDelivered(data.historicalDelivered ?? 0);
          setHistoricalReturned(data.historicalReturned ?? 0);
          setHasHistorical(data.hasHistorical ?? false);
        }
      } catch (err) {
        console.error("Risk check failed:", err);
      } finally {
        setCheckingRisk(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (formData.phone || formData.phone2) {
        checkRisk(formData.phone, formData.phone2);
      } else {
        setRiskScore(null);
        setRiskLevel(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.phone, formData.phone2]);

  // Derived Totals
  const itemsSubtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const totalAmount = itemsSubtotal + formData.deliveryFee - formData.discount;

  const handleAddItem = () => {
    setItems([...items, {
      id: Math.random().toString(),
      productName: "",
      quantity: 1,
      costPrice: 0,
      unitSellingPrice: 0,
      lineTotal: 0
    }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Recalculate line total if qty or price changed
        if (field === 'quantity' || field === 'unitSellingPrice') {
           updated.lineTotal = updated.quantity * updated.unitSellingPrice;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSelectProduct = (id: string, product: any) => {
    if (product.stock <= 0) return;
    setItems(items.map(item => {
      if (item.id === id) {
        return {
          ...item,
          productId: product._id,
          productName: product.name,
          sku: product.sku,
          costPrice: product.costPrice,
          unitSellingPrice: product.sellingPrice,
          lineTotal: item.quantity * product.sellingPrice,
          stock: product.stock,
          lowStockAlert: product.lowStockAlert
        };
      }
      return item;
    }));
    setOpenDropdownId(null);
  };

  const handleClearProduct = (id: string) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return {
          id: item.id,
          productName: "",
          quantity: item.quantity,
          costPrice: 0,
          unitSellingPrice: 0,
          lineTotal: 0
        };
      }
      return item;
    }));
  };

  const getFilteredProducts = (query: string) => {
    return products.filter(p => {
      if (!p.active) return false;
      const q = (query || "").toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    });
  };

  const saveOrder = async () => {
    // Validation
    if (items.length === 0) {
      setError("Please add at least one item.");
      return;
    }

    for (const item of items) {
       if (!item.productName.trim()) {
         setError("All items must have a product name.");
         return;
       }
       if (item.quantity < 1) {
         setError(`Invalid quantity for ${item.productName}`);
         return;
       }
       if (item.unitSellingPrice < 0) {
         setError(`Invalid price for ${item.productName}`);
         return;
       }
       if (item.productId && item.stock !== undefined && item.quantity > item.stock) {
         setError(`Insufficient stock for ${item.productName}. Only ${item.stock} available.`);
         return;
       }
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items: items.map(i => ({
             productId: i.productId,
             productName: i.productName,
             sku: i.sku,
             quantity: i.quantity,
             costPrice: i.costPrice,
             unitSellingPrice: i.unitSellingPrice,
             lineTotal: i.lineTotal
          })),
          itemsSubtotal,
          totalAmount,
          riskScore: riskScore ?? 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to add order");
        setSubmitting(false);
        return;
      }

      router.push("/dashboard/order/history");
      router.refresh();
    } catch (err) {
      setError("Server error while submitting order.");
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (riskScore !== null && riskScore > 70) {
      setShowRiskModal(true);
      return;
    }
    await saveOrder();
  };

  if (status === "loading") {
    return <div className="p-10 flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900"><Loader2 className="h-8 w-8 animate-spin text-blue-500"/></div>;
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
          <div className="py-6 pb-28 space-y-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Add New Order</h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Create a new order manually or upload orders in bulk
              </p>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Main Form Area */}
                <div className="lg:col-span-2 space-y-8">
                  {/* MANUAL UPLOAD CARD */}
                  <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-5 sm:p-6 space-y-8">
                      {error && (
                        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-300">
                          {error}
                        </div>
                      )}

                      <form className="space-y-8" onSubmit={handleSubmit}>
                        {/* Section 1: Customer Details */}
                        <div className="space-y-6">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-2 flex items-center gap-2">
                            <UserIcon className="h-5 w-5 text-blue-500" />
                            Customer Information
                          </h3>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Customer Name *
                            </label>
                            <div className="relative mt-1 rounded-md shadow-sm">
                              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <UserIcon className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                type="text"
                                required
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                value={formData.customerName}
                                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number *</label>
                              <div className="relative mt-1 rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                  <Phone className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  type="tel"
                                  required
                                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                  value={formData.phone}
                                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone 2 (Optional)</label>
                              <div className="relative mt-1 rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                  <Phone className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  type="tel"
                                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                  value={formData.phone2}
                                  onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">City *</label>
                              <div className="relative mt-1 rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                  <Building className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  type="text"
                                  required
                                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                  value={formData.city}
                                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                />
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Address *</label>
                            <div className="relative mt-1 rounded-md shadow-sm">
                              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 pb-6">
                                <MapPin className="h-5 w-5 text-gray-400" />
                              </div>
                              <textarea
                                rows={3}
                                required
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Order Items */}
                        <div className="pt-8" ref={dropdownRef}>
                          <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              <Package className="h-5 w-5 text-blue-500" />
                              Order Items
                            </h4>
                            <button
                              type="button"
                              onClick={handleAddItem}
                              className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium"
                            >
                              <PlusCircle className="h-4 w-4 mr-1" /> Add Item
                            </button>
                          </div>
                          
                          <div className="space-y-4">
                            {items.map((item, index) => (
                              <div key={item.id} className="relative p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                                {items.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item.id)}
                                    aria-label="Remove item"
                                    className="absolute top-3 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 pointer-events-auto shadow-sm"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pr-12 md:pr-0">
                                  {/* Product Selector */}
                                  <div className="md:col-span-5 relative">
                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Product</label>
                                    {!item.productId ? (
                                      <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                          <Search className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                          type="text"
                                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 pl-10 pr-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400"
                                          placeholder="Search product or type manual name..."
                                          value={searchQueries[item.id] !== undefined ? searchQueries[item.id] : item.productName}
                                          onChange={(e) => {
                                            setSearchQueries({...searchQueries, [item.id]: e.target.value});
                                            updateItem(item.id, 'productName', e.target.value);
                                            setOpenDropdownId(item.id);
                                          }}
                                          onFocus={() => setOpenDropdownId(item.id)}
                                        />
                                        
                                        {openDropdownId === item.id && (
                                          <div className="absolute z-20 mt-1 w-full rounded-md bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none max-h-60 overflow-auto">
                                            <ul className="py-1 text-base sm:text-sm">
                                              {getFilteredProducts(searchQueries[item.id] || item.productName).length === 0 ? (
                                                <li className="py-2 pl-3 pr-9 text-gray-500 dark:text-gray-400">
                                                  No matching products found. Keep typing to use as manual product.
                                                </li>
                                              ) : (
                                                getFilteredProducts(searchQueries[item.id] || item.productName).map(p => (
                                                  <li
                                                    key={p._id}
                                                    className={`cursor-pointer select-none relative py-2 pl-3 pr-4 flex flex-col hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-50 dark:border-gray-700/50 ${p.stock <= 0 ? 'opacity-50' : ''}`}
                                                    onClick={() => handleSelectProduct(item.id, p)}
                                                  >
                                                    <div className="flex justify-between items-start">
                                                      <div>
                                                        <span className="block font-medium text-gray-900 dark:text-white truncate">{p.name}</span>
                                                        <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                                                          <span className="flex items-center"><Tag className="h-3 w-3 mr-1" /> {p.sku}</span>
                                                        </div>
                                                      </div>
                                                      <div className="flex flex-col items-end">
                                                        <span className="font-semibold text-gray-900 dark:text-white">Rs {p.sellingPrice}</span>
                                                        <div className="mt-1">
                                                          {p.stock <= 0 ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Out of stock</span>
                                                          ) : p.stock <= (p.lowStockAlert || 5) ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">Low stock: {p.stock}</span>
                                                          ) : (
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">Stock: {p.stock}</span>
                                                          )}
                                                        </div>
                                                      </div>
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
                                        <div className="flex flex-col">
                                          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate pr-2">{item.productName}</h4>
                                          <div className="mt-1 flex items-center gap-2 text-xs">
                                            <span className="text-gray-500 dark:text-gray-400">{item.sku}</span>
                                            <span className={item.stock! <= (item.lowStockAlert || 5) ? "text-orange-600 dark:text-orange-400 font-medium" : "text-green-600 dark:text-green-400"}>
                                              Stock: {item.stock}
                                            </span>
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleClearProduct(item.id)}
                                          className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                        >
                                          <X className="h-4 w-4" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Qty & Price */}
                                  <div className="grid grid-cols-2 md:col-span-5 gap-4">
                                    <div>
                                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-1">Qty</label>
                                      <input
                                        type="number"
                                        min="1"
                                        required
                                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-1">Unit Price (Rs)</label>
                                      <input
                                        type="number"
                                        min="0"
                                        required
                                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3"
                                        value={item.unitSellingPrice}
                                        onChange={(e) => updateItem(item.id, 'unitSellingPrice', Number(e.target.value))}
                                      />
                                    </div>
                                  </div>
                                  <div className="md:col-span-2">
                                    <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-1">Line Total</label>
                                    <div className="block w-full text-sm font-bold text-gray-900 dark:text-white md:text-right pt-2">
                                      Rs {item.lineTotal.toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Section 3: Payment & Shipping */}
                        <div className="pt-8">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2 flex items-center gap-2">
                            <Truck className="h-5 w-5 text-blue-500" />
                            Financials & Shipping
                          </h4>
                          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
                              <select
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-600"
                                value={formData.paymentMethod}
                                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                              >
                                <option value="COD">Cash on Delivery (COD)</option>
                                <option value="Card Payment">Card Payment</option>
                                <option value="Bank Deposit">Bank Deposit</option>
                                <option value="Koko Installment">Koko Installment</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Status</label>
                              <select
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-600"
                                value={formData.paymentStatus}
                                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                              >
                                <option value="unpaid">Unpaid</option>
                                <option value="paid">Paid</option>
                                <option value="partial">Partial</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Delivery Fee (Rs)</label>
                              <input
                                type="number"
                                min="0"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3"
                                value={formData.deliveryFee}
                                onChange={(e) => setFormData({ ...formData, deliveryFee: Number(e.target.value) })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Discount (Rs)</label>
                              <input
                                type="number"
                                min="0"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3"
                                value={formData.discount}
                                onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
                              />
                            </div>
                            
                            <div className="sm:col-span-2 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                              <div>
                                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">Total Amount</span>
                                {formData.paymentMethod === 'COD' && (
                                  <span className="block text-xs text-blue-600 dark:text-blue-400">COD Collection Amount</span>
                                )}
                              </div>
                              <span className="text-2xl font-bold text-gray-900 dark:text-white">Rs {totalAmount.toLocaleString()}</span>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Courier Name (Optional)</label>
                              <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3"
                                value={formData.courierName}
                                onChange={(e) => setFormData({ ...formData, courierName: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tracking Number (Optional)</label>
                              <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3"
                                value={formData.trackingNumber}
                                onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes (Optional)</label>
                              <textarea
                                rows={2}
                                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                              <div className="flex justify-end pt-6">
                          <button
                            type="submit"
                            disabled={submitting || checkingRisk}
                            className="hidden md:inline-flex justify-center rounded-lg bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                          >
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                            Save Order
                          </button>
                          <button
                            type="submit"
                            disabled={submitting || checkingRisk}
                            className="md:hidden w-full inline-flex justify-center rounded-lg bg-blue-600 px-4 py-4 text-base font-bold text-white shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95 mb-4"
                          >
                            {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Save Order"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                </div>

                {/* Right Sidebar: Customer Summary + Bulk Upload */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Customer Summary Card */}
                  <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg border border-gray-100 dark:border-gray-700">
                    <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6 flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-blue-500" />
                      <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Customer Summary</h3>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                      {checkingRisk ? (
                        <div className="flex flex-col items-center justify-center py-6">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">Analyzing Network...</span>
                        </div>
                      ) : riskScore === null ? (
                        <div className="text-center py-6 text-sm text-gray-500 dark:text-gray-400">
                          <UserIcon className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                          Enter a phone number to fetch customer intelligence.
                        </div>
                      ) : riskTotalOrders === 0 ? (
                        <div className="text-center py-6 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800/50">
                          <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-80" />
                          <strong>New Customer</strong><br/>
                          No negative history found in BizFlow Network.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {hasHistorical && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[10px] font-black uppercase text-blue-500 tracking-widest mb-2">
                              <Database className="h-3 w-3" /> Historical Data Included
                            </div>
                          )}
                          <div className={`p-4 rounded-xl border ${riskScore > 70 ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : riskScore > 30 ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' : 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'}`}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Risk Level</span>
                              <span className={`text-sm font-bold ${riskScore > 70 ? 'text-red-700 dark:text-red-400' : riskScore > 30 ? 'text-orange-700 dark:text-orange-400' : 'text-green-700 dark:text-green-400'}`}>
                                {riskScore}% {riskScore > 70 ? '(High)' : riskScore > 30 ? '(Elevated)' : '(Safe)'}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                              <div className={`h-1.5 rounded-full ${riskScore > 70 ? 'bg-red-500' : riskScore > 30 ? 'bg-orange-500' : 'bg-green-500'}`} style={{ width: `${riskScore}%` }}></div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 text-center">
                              <span className="block text-2xl font-bold text-gray-900 dark:text-white">{riskTotalOrders}</span>
                              <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Orders</span>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800/50 text-center">
                              <span className="block text-2xl font-bold text-green-700 dark:text-green-400">{riskSuccessOrders}</span>
                              <span className="block text-xs text-green-600 dark:text-green-500 uppercase tracking-wider">Delivered</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                             <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800/50 text-center">
                              <span className="block text-2xl font-bold text-red-700 dark:text-red-400">{riskFailedOrders}</span>
                              <span className="block text-xs text-red-600 dark:text-red-500 uppercase tracking-wider">Returned</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center">
                              <Calendar className="h-5 w-5 text-gray-400 mb-1" />
                              <span className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                                {riskLastOrderDate ? new Date(riskLastOrderDate).toLocaleDateString() : 'N/A'}
                              </span>
                              <span className="block text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Order</span>
                            </div>
                          </div>

                          {hasHistorical && (
                            <div className="pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                <Info className="h-2.5 w-2.5" /> Historical Breakdown
                              </p>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30 p-1.5 rounded flex justify-between">
                                  <span>Delivered:</span>
                                  <span className="text-green-600 font-bold">{historicalDelivered}</span>
                                </div>
                                <div className="text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/30 p-1.5 rounded flex justify-between">
                                  <span>Returned:</span>
                                  <span className="text-red-600 font-bold">{historicalReturned}</span>
                                </div>
                              </div>
                              <p className="text-[8px] text-gray-400 italic mt-2">
                                Historical data is used only for COD risk calculation and does not affect finance.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bulk Upload Card */}
                  <BulkUploadCard onUpload={() => fetch("/api/products").then(res => res.json()).then(setProducts)} />
                </div>

              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── High-Risk Confirmation Modal ── */}
      {showRiskModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowRiskModal(false); }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-gray-900 border border-gray-700/80 shadow-2xl p-6 space-y-5"
            style={{ animation: "riskModalIn 0.2s ease-out" }}
          >
            <style>{`
              @keyframes riskModalIn {
                from { opacity: 0; transform: scale(0.95) translateY(-8px); }
                to   { opacity: 1; transform: scale(1)    translateY(0); }
              }
            `}</style>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-2.5 rounded-xl bg-red-900/40 border border-red-800/50">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white leading-snug">
                  High-Risk Customer Detected
                </h3>
                <p className="mt-1 text-sm text-gray-400 leading-relaxed">
                  This customer has a high likelihood of order refusal ({riskScore}% risk). Proceeding may result in financial loss. Are you sure you want to save this order?
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-red-950/40 border border-red-900/50 px-4 py-3">
              <ShieldAlert className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-300">
                Risk Score: <span className="font-bold text-white">{riskScore}%</span>
                <span className="mx-2 text-red-800/60">&middot;</span>
                {riskFailedOrders} returned
              </p>
            </div>

            <div className="border-t border-gray-700/60" />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRiskModal(false)}
                className="px-4 py-2 text-sm font-medium rounded-xl text-gray-300 bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => { setShowRiskModal(false); await saveOrder(); }}
                className="px-4 py-2 text-sm font-medium rounded-xl text-white bg-red-600 hover:bg-red-500 border border-red-500/80 transition-colors shadow-lg shadow-red-900/30"
              >
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Sticky Mobile Footer ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total Amount</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white leading-none">Rs {totalAmount.toLocaleString()}</span>
          </div>
          <button
            onClick={saveOrder}
            disabled={submitting}
            className="flex-1 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Order"}
          </button>
        </div>
      </div>
    </div>
  );
}
