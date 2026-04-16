"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { useSession } from "next-auth/react";
import { ShieldAlert, Phone, MapPin, User as UserIcon, Loader2, UploadCloud, Download, Building } from "lucide-react";
import * as xlsx from "xlsx";

export default function AddOrderPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    phone2: "",
    address: "",
    city: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Bulk Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkError, setBulkError] = useState("");
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Risk Engine State
  const [riskScore, setRiskScore] = useState<number | null>(null);
  const [riskSuccessOrders, setRiskSuccessOrders] = useState<number>(0);
  const [riskFailedOrders, setRiskFailedOrders] = useState<number>(0);
  const [checkingRisk, setCheckingRisk] = useState(false);

  // Debounce hook for phone risk check
  useEffect(() => {
    const checkRisk = async (phoneStr: string, phone2Str: string) => {
      // Basic check to ensure it at least looks like a phone string before calling api
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
          setRiskSuccessOrders(data.successOrders ?? 0);
          setRiskFailedOrders(data.failedOrders ?? 0);
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
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.phone, formData.phone2]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          riskScore: riskScore ?? 0,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to add order");
        setSubmitting(false);
        return;
      }

      // Success, route back to history
      router.push("/dashboard/order/history");
      router.refresh();
    } catch (err) {
      setError("Server error while submitting order.");
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkError("");
    setBulkSubmitting(true);
    setUploadProgress(10); // Start progress

    try {
      const data = await file.arrayBuffer();
      const workbook = xlsx.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = xlsx.utils.sheet_to_json<any>(worksheet);

      setUploadProgress(40); // Parsing done

      if (!json || json.length === 0) {
        throw new Error("File is empty or could not be parsed.");
      }

      // Map headers nicely for the API
      // Accepting headers: customerName, phone, phone2, address, city
      const ordersPayload = json.map(row => ({
        customerName: row["customerName"] || row["Customer Name"] || row["Name"],
        phone: row["phone"] || row["Phone"] || row["Phone 1"] || row["phone1"]?.toString(),
        phone2: row["phone2"] || row["Phone 2"] || row["Phone2"]?.toString(),
        address: row["address"] || row["Address"],
        city: row["city"] || row["City"]
      }));

      setUploadProgress(60); // Payload ready

      const res = await fetch("/api/order/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders: ordersPayload }),
      });

      setUploadProgress(90);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to bulk upload orders.");
      }

      setUploadProgress(100);
      
      // Minor delay to show 100% completed text
      setTimeout(() => {
         router.push("/dashboard/order/history");
         router.refresh();
      }, 500);

    } catch (err: any) {
      console.error(err);
      setBulkError(err.message || "Error processing file.");
      setBulkSubmitting(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const renderRiskBadge = () => {
    if (checkingRisk) {
      return (
        <span className="inline-flex items-center text-sm text-gray-500 dark:text-gray-400">
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Checking Risk...
        </span>
      );
    }

    if (riskScore === null) return null;

    const statsRow = (
      <span className="ml-3 inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
          <ShieldAlert className="h-3 w-3" />{riskSuccessOrders} delivered
        </span>
        <span className="inline-flex items-center gap-1 text-red-500 font-medium">
          <ShieldAlert className="h-3 w-3" />{riskFailedOrders} returned
        </span>
      </span>
    );

    if (riskScore >= 100) {
      return (
        <span className="inline-flex items-center flex-wrap gap-y-1 rounded-full bg-red-100 dark:bg-red-900/30 px-3 py-1 text-xs font-medium text-red-800 dark:text-red-300">
          <ShieldAlert className="mr-1.5 h-4 w-4" /> High Risk ({riskScore})
          {statsRow}
        </span>
      );
    }

    if (riskScore >= 50) {
      return (
        <span className="inline-flex items-center flex-wrap gap-y-1 rounded-full bg-orange-100 dark:bg-orange-900/30 px-3 py-1 text-xs font-medium text-orange-800 dark:text-orange-300">
          <ShieldAlert className="mr-1.5 h-4 w-4" /> Elevated Risk ({riskScore})
          {statsRow}
        </span>
      );
    }

    if (riskScore >= 25) {
      return (
        <span className="inline-flex items-center flex-wrap gap-y-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1 text-xs font-medium text-yellow-800 dark:text-yellow-300">
          <ShieldAlert className="mr-1.5 h-4 w-4" /> Moderate Risk ({riskScore})
          {statsRow}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center flex-wrap gap-y-1 rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-800 dark:text-green-300">
        <ShieldAlert className="mr-1.5 h-4 w-4" /> Safe Record ({riskScore})
        {statsRow}
      </span>
    );
  };

  // If loading session, don't flash UI poorly
  if (status === "loading") {
    return <div className="p-10 flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900"><Loader2 className="h-8 w-8 animate-spin text-blue-500"/></div>;
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-50 dark:bg-gray-900">
      <Sidebar
        businessName={(session?.user as any)?.businessName}
        userName={session?.user?.name}
        role={(session?.user as any)?.role}
      />

      <div className="flex flex-1 flex-col pt-14 md:pt-0 md:pl-64">
        <main className="flex-1">
          <div className="py-6 pb-16 space-y-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Add New Order</h1>
            </div>

            <div className="mx-auto max-w-3xl px-4 sm:px-6 md:px-8 space-y-8">
              
              {/* BULK UPLOAD CARD */}
              <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
                <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Bulk Upload</h3>
                  <a 
                    href="/sample-orders.csv" 
                    download
                    className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500"
                  >
                    <Download className="h-4 w-4 mr-1"/> Download Sample
                  </a>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  {bulkError && (
                    <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-300">
                      {bulkError}
                    </div>
                  )}
                  
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                    <div className="space-y-1 text-center">
                      <UploadCloud className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                      <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white dark:bg-transparent rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload a file</span>
                          <input 
                            id="file-upload" 
                            name="file-upload" 
                            type="file" 
                            className="sr-only" 
                            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            disabled={bulkSubmitting}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500">CSV or Excel up to 10MB</p>
                    </div>
                  </div>

                  {bulkSubmitting && (
                    <div className="mt-4">
                       <div className="flex justify-between items-center mb-1">
                         <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Processing Upload...</span>
                         <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{uploadProgress}%</span>
                       </div>
                       <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                         <div 
                           className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300" 
                           style={{ width: `${uploadProgress}%` }}
                         ></div>
                       </div>
                    </div>
                  )}

                </div>
              </div>


              {/* MANUAL UPLOAD CARD */}
              <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg border border-gray-100 dark:border-gray-700">
                <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Manual Input</h3>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  {error && (
                    <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-300">
                      {error}
                    </div>
                  )}

                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                      <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Customer Name
                      </label>
                      <div className="relative mt-1 rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <UserIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="text"
                          name="customerName"
                          id="customerName"
                          required
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          placeholder="Jane Smith"
                          value={formData.customerName}
                          onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                       <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Phone Number *
                        </label>
                        <div className="relative mt-1 rounded-md shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Phone className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </div>
                          <input
                            type="tel"
                            name="phone"
                            id="phone"
                            required
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            placeholder="077 123 4567"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                       </div>

                       <div>
                        <label htmlFor="phone2" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Phone 2 (Optional)
                        </label>
                        <div className="relative mt-1 rounded-md shadow-sm">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Phone className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </div>
                          <input
                            type="tel"
                            name="phone2"
                            id="phone2"
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                            placeholder="071 987 6543"
                            value={formData.phone2}
                            onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                          />
                        </div>
                       </div>
                    </div>
                    
                    <div>
                       <div className="flex-shrink-0 min-w-[150px]">
                           {renderRiskBadge()}
                       </div>
                       <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                         Our system will intelligently analyze risk when entering numbers.
                       </p>
                    </div>

                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        City *
                      </label>
                      <div className="relative mt-1 rounded-md shadow-sm">
                         <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Building className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          required
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          placeholder="Colombo"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Delivery Address *
                      </label>
                      <div className="relative mt-1 rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 pb-6">
                          <MapPin className="h-5 w-5 text-gray-400" aria-hidden="true" />
                        </div>
                        <textarea
                          id="address"
                          name="address"
                          rows={3}
                          required
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          placeholder="No 10, Main St..."
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        type="submit"
                        disabled={submitting || checkingRisk || (riskScore !== null && riskScore >= 100)}
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? "Saving..." : "Save Order"}
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
