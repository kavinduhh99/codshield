"use client";

import { useState, useEffect, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useSession } from "next-auth/react";
import { 
  ShieldAlert, Plus, Search, Trash2, Upload, FileText, 
  Loader2, CheckCircle, AlertCircle, Phone, User as UserIcon, 
  MapPin, Database, Activity, BarChart3, X, ChevronLeft, ChevronRight
} from "lucide-react";
import * as XLSX from "xlsx";

export default function AdminCodRiskDataPage() {
  const { data: session, status } = useSession();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    phone: "",
    customerName: "",
    address: "",
    deliveredCount: 0,
    returnedCount: 0,
    source: "Admin Import",
    notes: "",
    isGlobal: true,
    assignedBusinessId: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [bulkData, setBulkData] = useState<any[]>([]);
  const [bulkResults, setBulkResults] = useState<any>(null);

  useEffect(() => {
    if (status === "authenticated" && (session?.user as any).role === "admin") {
      fetchRecords();
    }
  }, [status, page, search]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/cod-risk-seed?search=${search}&page=${page}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.data);
        setTotal(data.total);
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this historical record?")) return;
    try {
      const res = await fetch(`/api/admin/cod-risk-seed?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchRecords();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/cod-risk-seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSuccess("Record added successfully");
        setFormData({
          phone: "", customerName: "", address: "", 
          deliveredCount: 0, returnedCount: 0, 
          source: "Admin Import", notes: "", 
          isGlobal: true, assignedBusinessId: ""
        });
        setTimeout(() => {
          setSuccess("");
          setShowAddModal(false);
          fetchRecords();
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to add record");
      }
    } catch (err) {
      setError("Server error");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadSampleCSV = () => {
    const headers = "phone,customerName,address,deliveredCount,returnedCount,source,notes";
    const rows = [
      '0771234567,Kamal Perera,"No 25, Galle Road, Colombo",5,1,Admin Import,"Old COD history"',
      '0762223344,Nimali Silva,"Kandy Road, Kurunegala",2,3,Seller Historical Upload,"High return history"',
      '0755556666,Kasun Fernando,"Negombo",10,0,Manual Entry,"Trusted customer"'
    ];
    const csvContent = headers + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "bizflow-cod-risk-seed-sample.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      // Alias mapping
      const mapped = data.map((row: any) => {
        const getVal = (aliases: string[]) => {
          for (const alias of aliases) {
            if (row[alias] !== undefined) return row[alias];
            // case-insensitive check
            const key = Object.keys(row).find(k => k.toLowerCase() === alias.toLowerCase());
            if (key) return row[key];
          }
          return undefined;
        };

        return {
          phone: getVal(["phone", "phone number", "mobile", "contact"]),
          customerName: getVal(["customerName", "name", "customer name", "client"]),
          address: getVal(["address", "location", "customer address"]),
          deliveredCount: Number(getVal(["deliveredCount", "delivered", "delivered orders", "success"])) || 0,
          returnedCount: Number(getVal(["returnedCount", "returned", "returned orders", "failed", "refused"])) || 0,
          source: getVal(["source"]) || "Bulk Upload",
          notes: getVal(["notes", "remark", "comment"]),
          isGlobal: true
        };
      }).filter(r => r.phone);

      setBulkData(mapped);
    };
    reader.readAsBinaryString(file);
  };

  const submitBulk = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/cod-risk-seed/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: bulkData }),
      });
      if (res.ok) {
        const data = await res.json();
        setBulkResults(data);
        fetchRecords();
      } else {
        setError("Bulk upload failed");
      }
    } catch (err) {
      setError("Server error");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || (status === "authenticated" && (session?.user as any).role !== "admin")) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-950"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-950 text-white overflow-x-hidden">
      <Sidebar
        businessName="Admin Control"
        userName={session?.user?.name}
        role={(session?.user as any)?.role}
      />

      <div className="flex flex-1 flex-col pt-14 md:pt-0 md:pl-64">
        <main className="flex-1 p-4 md:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white flex items-center gap-3">
                <Database className="h-8 w-8 text-blue-500" />
                Historical COD Risk Data
              </h1>
              <p className="text-gray-400 text-sm font-medium mt-1">Manage external intelligence data to improve COD risk prediction.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBulkModal(true)}
                className="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-all font-bold text-sm uppercase tracking-widest active:scale-95"
              >
                <Upload className="h-4 w-4 mr-2" /> Bulk Import
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 transition-all font-bold text-sm uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Record
              </button>
            </div>
          </div>

          {/* Stats Analytics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Database className="h-4 w-4" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Records</span>
              </div>
              <div className="text-2xl font-black italic">{stats?.totalRecords || 0}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><CheckCircle className="h-4 w-4" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Delivered</span>
              </div>
              <div className="text-2xl font-black italic">{stats?.totalDelivered || 0}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-500/10 rounded-lg text-red-500"><X className="h-4 w-4" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Total Returned</span>
              </div>
              <div className="text-2xl font-black italic">{stats?.totalReturned || 0}</div>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500"><ShieldAlert className="h-4 w-4" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">High Risk Phones</span>
              </div>
              <div className="text-2xl font-black italic">{stats?.highRiskCount || 0}</div>
            </div>
          </div>

          {/* Table Area */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-800 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search phone, name, or source..."
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 italic">
                Showing {records.length} of {total} records
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-950/50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Phone & Name</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">History</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Source</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500 italic font-medium">No records found.</td>
                    </tr>
                  ) : (
                    records.map((r) => {
                      const totalOrders = r.deliveredCount + r.returnedCount;
                      const riskScore = totalOrders === 0 ? 0 : Math.round((r.returnedCount / totalOrders) * 100);
                      return (
                        <tr key={r._id} className="hover:bg-gray-800/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="font-bold text-white text-sm">{r.phone}</div>
                            <div className="text-xs text-gray-400">{r.customerName || "N/A"}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              <div>
                                <span className="text-xs font-black text-green-500 uppercase">Del: {r.deliveredCount}</span>
                              </div>
                              <div>
                                <span className="text-xs font-black text-red-500 uppercase">Ret: {r.returnedCount}</span>
                              </div>
                              <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${riskScore >= 50 ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
                                {riskScore}% Risk
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs font-medium text-gray-400">{r.source}</div>
                            {r.isGlobal ? (
                              <div className="text-[9px] font-black uppercase text-blue-400 tracking-tighter">Global Pool</div>
                            ) : (
                              <div className="text-[9px] font-black uppercase text-purple-400 tracking-tighter">Private Business</div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleDelete(r._id)}
                              className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-gray-800 flex items-center justify-between">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-xl border border-gray-800 hover:bg-gray-800 disabled:opacity-50 transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-gray-400">Page {page} of {Math.ceil(total / 20) || 1}</span>
              <button
                disabled={page >= Math.ceil(total / 20)}
                onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-xl border border-gray-800 hover:bg-gray-800 disabled:opacity-50 transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Manual Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950/50">
              <h2 className="text-xl font-black italic uppercase italic tracking-tight">Add Historical Data</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleManualAdd} className="p-6 space-y-4">
              {error && <div className="p-3 bg-red-900/30 border border-red-800 rounded-xl text-red-400 text-xs font-bold">{error}</div>}
              {success && <div className="p-3 bg-green-900/30 border border-green-800 rounded-xl text-green-400 text-xs font-bold">{success}</div>}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Delivered Count</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.deliveredCount}
                    onChange={(e) => setFormData({...formData, deliveredCount: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Returned Count</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.returnedCount}
                    onChange={(e) => setFormData({...formData, returnedCount: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Customer Name (Optional)</label>
                  <input
                    type="text"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  />
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-3 bg-gray-950 border border-gray-800 p-3 rounded-xl mt-2">
                    <input
                      type="checkbox"
                      id="isGlobal"
                      className="h-4 w-4 rounded bg-gray-900 border-gray-700 text-blue-600 focus:ring-blue-500"
                      checked={formData.isGlobal}
                      onChange={(e) => setFormData({...formData, isGlobal: e.target.checked})}
                    />
                    <label htmlFor="isGlobal" className="text-xs font-bold text-gray-400">Mark as Global (Visible to all sellers)</label>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-950/50">
              <h2 className="text-xl font-black italic uppercase tracking-tight">Bulk Historical Upload</h2>
              <button onClick={() => {setShowBulkModal(false); setBulkData([]); setBulkResults(null);}} className="text-gray-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              {!bulkResults ? (
                <>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-800 rounded-2xl p-8 text-center hover:border-blue-500 hover:bg-blue-500/5 transition-all cursor-pointer"
                  >
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
                    <Upload className="h-10 w-10 text-gray-600 mx-auto mb-4" />
                    <p className="text-sm font-bold text-gray-300">Click to upload CSV or Excel</p>
                    <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest font-black">Supported formats: .csv, .xlsx</p>
                  </div>

                  <div className="bg-gray-950/50 border border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Need a template?</p>
                      <p className="text-xs text-gray-400">Download our sample CSV to ensure correct formatting.</p>
                    </div>
                    <button
                      onClick={downloadSampleCSV}
                      className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95"
                    >
                      <FileText className="h-4 w-4 mr-2 text-blue-500" /> Download Sample CSV
                    </button>
                  </div>

                  <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                    <h4 className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-2 flex items-center gap-2">
                      <ShieldAlert className="h-3 w-3" /> Import Instructions
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Required Columns</p>
                        <p className="text-xs text-gray-300">phone</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Optional Columns</p>
                        <p className="text-[10px] text-gray-400 leading-tight">customerName, address, deliveredCount, returnedCount, source, notes</p>
                      </div>
                    </div>
                    <p className="text-[9px] text-gray-500 italic mt-3">&bull; Historical counts will be merged with existing records automatically.</p>
                  </div>

                  {bulkData.length > 0 && (
                    <div className="space-y-4">
                      <div className="text-xs font-bold text-blue-400 uppercase tracking-widest">{bulkData.length} valid records parsed</div>
                      <div className="max-h-48 overflow-auto border border-gray-800 rounded-xl bg-gray-950">
                        <table className="w-full text-[10px] text-left">
                          <thead className="bg-gray-900 sticky top-0">
                            <tr>
                              <th className="px-3 py-2 text-gray-500 uppercase">Phone</th>
                              <th className="px-3 py-2 text-gray-500 uppercase">Delivered</th>
                              <th className="px-3 py-2 text-gray-500 uppercase">Returned</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-800">
                            {bulkData.slice(0, 50).map((r, i) => (
                              <tr key={i}>
                                <td className="px-3 py-2 text-gray-300">{r.phone}</td>
                                <td className="px-3 py-2 text-green-500">{r.deliveredCount}</td>
                                <td className="px-3 py-2 text-red-500">{r.returnedCount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <button
                        onClick={submitBulk}
                        disabled={submitting}
                        className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-700 font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50"
                      >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : `Import ${bulkData.length} Records`}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-6 text-center">
                  <div className="flex justify-center">
                    <div className="p-4 bg-green-500/20 rounded-full">
                      <CheckCircle className="h-12 w-12 text-green-500" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Import Complete</h3>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                        <div className="text-2xl font-black text-green-500">{bulkResults.success}</div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Success</div>
                      </div>
                      <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
                        <div className="text-2xl font-black text-red-500">{bulkResults.failed}</div>
                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Failed</div>
                      </div>
                    </div>
                  </div>
                  {bulkResults.errors.length > 0 && (
                    <div className="max-h-32 overflow-auto text-left p-3 bg-red-900/20 border border-red-900/50 rounded-xl">
                      <div className="text-[10px] font-bold text-red-400 uppercase mb-2">Error Log:</div>
                      {bulkResults.errors.map((err: string, i: number) => (
                        <div key={i} className="text-[9px] text-red-300 mb-1">&bull; {err}</div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => {setShowBulkModal(false); setBulkData([]); setBulkResults(null); fetchRecords();}}
                    className="w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-700 font-bold text-sm uppercase tracking-widest transition-all"
                  >
                    Close & Return
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
