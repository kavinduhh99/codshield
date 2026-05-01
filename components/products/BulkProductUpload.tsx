"use client";

import { useState, useRef } from "react";
import { 
  Upload, FileText, Download, Loader2, CheckCircle2, 
  AlertCircle, X, ChevronDown, ChevronUp, Package, 
  Info, ShieldAlert
} from "lucide-react";
import * as XLSX from "xlsx";

interface BulkProductUploadProps {
  onSuccess: () => void;
}

export function BulkProductUpload({ onSuccess }: BulkProductUploadProps) {
  const [showModal, setShowModal] = useState(false);
  const [bulkData, setBulkData] = useState<any[]>([]);
  const [previewData, setPreviewData] = useState<{
    valid: any[];
    invalid: { row: any; reason: string }[];
  }>({ valid: [], invalid: [] });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadSampleCSV = () => {
    const headers = "productName,sku,category,costPrice,sellingPrice,currentStock,lowStockAlert,isActive";
    const rows = [
      'jedel wd139 mouse,43534534,Mouse,2239,3500,10,2,true',
      'Jedel K511 Keyboard,43723472384,Keyboard,2678,3990,5,2,true',
      'LB Link CPE600EU,34908320432,Router,6195,8500,3,1,true'
    ];
    const csvContent = headers + "\n" + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "bizflow-products-sample.csv");
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
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        processRawData(data);
      } catch (err) {
        setError("Failed to parse file. Please use a valid CSV or Excel file.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const processRawData = (data: any[]) => {
    const valid: any[] = [];
    const invalid: { row: any; reason: string }[] = [];

    data.forEach((row: any, index) => {
      const getVal = (aliases: string[]) => {
        for (const alias of aliases) {
          if (row[alias] !== undefined) return row[alias];
          const key = Object.keys(row).find(k => k.toLowerCase() === alias.toLowerCase());
          if (key) return row[key];
        }
        return undefined;
      };

      const mapped = {
        productName: getVal(["productName", "product name", "name", "item", "item name"]),
        sku: getVal(["sku", "product code", "code"]),
        category: getVal(["category", "type"]) || "General",
        costPrice: Number(getVal(["costPrice", "cost price", "cost", "buying price", "purchase price"])) || 0,
        sellingPrice: Number(getVal(["sellingPrice", "selling price", "price", "sale price"])),
        currentStock: Number(getVal(["currentStock", "stock", "current stock", "qty", "quantity"])),
        lowStockAlert: Number(getVal(["lowStockAlert", "low stock", "low stock alert", "alert qty", "reorder level"])) ?? 5,
        isActive: getVal(["isActive", "active", "status", "is active"]) !== undefined 
          ? (String(getVal(["isActive", "active", "status", "is active"])).toLowerCase() === 'true' || getVal(["isActive", "active", "status", "is active"]) === true)
          : true
      };

      let reason = "";
      if (!mapped.productName) reason = "Missing Product Name";
      else if (!mapped.sku) reason = "Missing SKU";
      else if (isNaN(mapped.sellingPrice)) reason = "Invalid Selling Price";
      else if (isNaN(mapped.currentStock)) reason = "Invalid Current Stock";

      if (reason) {
        invalid.push({ row, reason });
      } else {
        valid.push(mapped);
      }
    });

    setPreviewData({ valid, invalid });
  };

  const submitImport = async () => {
    if (previewData.valid.length === 0) return;
    
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: previewData.valid }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setResults(data);
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.message || "Bulk import failed");
      }
    } catch (err) {
      setError("Server error during import");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPreviewData({ valid: [], invalid: [] });
    setResults(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mb-8 overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Package className="h-32 w-32 text-blue-500 rotate-12" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-white flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-500" />
              Bulk Upload Products
            </h2>
            <p className="text-slate-400 text-sm mt-1">Update your inventory instantly via CSV or Excel sheets.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={downloadSampleCSV}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-750 transition-all font-bold text-xs uppercase tracking-widest active:scale-95"
            >
              <Download className="h-4 w-4 mr-2" /> Sample CSV
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95"
            >
              <Upload className="h-4 w-4 mr-2" /> Start Import
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <h3 className="text-lg font-black italic uppercase tracking-tight text-white">Product Import Wizard</h3>
              <button 
                onClick={() => {setShowModal(false); reset();}}
                className="p-2 rounded-full hover:bg-slate-800 transition-colors text-slate-500 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
              {!results ? (
                <>
                  {previewData.valid.length === 0 && previewData.invalid.length === 0 ? (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-800 rounded-3xl p-12 text-center hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group"
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".csv,.xlsx,.xls" 
                        onChange={handleFileUpload} 
                      />
                      <div className="bg-slate-800/50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-blue-500/10 transition-all">
                        <Upload className="h-8 w-8 text-slate-500 group-hover:text-blue-500" />
                      </div>
                      <p className="text-base font-bold text-slate-200">Select CSV or Excel file</p>
                      <p className="text-xs text-slate-500 mt-2">Maximum file size: 5MB</p>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                      {/* Preview Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
                          <div className="text-2xl font-black text-emerald-500">{previewData.valid.length}</div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70">Valid Products</div>
                        </div>
                        <div className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4">
                          <div className="text-2xl font-black text-rose-500">{previewData.invalid.length}</div>
                          <div className="text-[10px] font-black uppercase tracking-widest text-rose-500/70">Invalid Rows</div>
                        </div>
                      </div>

                      {/* Warnings if any */}
                      {previewData.invalid.length > 0 && (
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 space-y-3">
                          <h4 className="text-[10px] font-black uppercase text-amber-500 tracking-widest flex items-center gap-2">
                            <AlertCircle className="h-3 w-3" /> Errors Detected ({previewData.invalid.length})
                          </h4>
                          <div className="max-h-32 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {previewData.invalid.map((item, i) => (
                              <div key={i} className="text-[11px] text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-slate-800/50 flex justify-between">
                                <span className="font-medium">{item.row.productName || item.row.name || "Unknown Item"}</span>
                                <span className="text-rose-500 font-bold">{item.reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Valid Preview Table */}
                      {previewData.valid.length > 0 && (
                        <div className="space-y-3">
                           <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Preview (First 5 records)
                          </h4>
                          <div className="border border-slate-800 rounded-2xl overflow-x-auto bg-slate-950/50">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-900">
                                    <tr>
                                        <th className="px-4 py-2.5 text-slate-500 uppercase tracking-tighter">Product</th>
                                        <th className="px-4 py-2.5 text-slate-500 uppercase tracking-tighter">SKU</th>
                                        <th className="px-4 py-2.5 text-slate-500 uppercase tracking-tighter">Price</th>
                                        <th className="px-4 py-2.5 text-slate-500 uppercase tracking-tighter">Stock</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {previewData.valid.slice(0, 5).map((p, i) => (
                                        <tr key={i}>
                                            <td className="px-4 py-2.5 text-slate-300 truncate max-w-[150px]">{p.productName}</td>
                                            <td className="px-4 py-2.5 text-slate-400">{p.sku}</td>
                                            <td className="px-4 py-2.5 text-slate-200 font-bold">LKR {p.sellingPrice}</td>
                                            <td className="px-4 py-2.5 text-slate-200">{p.currentStock}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {error && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-xs font-bold flex items-center gap-3">
                            <ShieldAlert className="h-5 w-5 shrink-0" /> {error}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button
                          onClick={reset}
                          disabled={loading}
                          className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 transition-all font-bold text-xs uppercase tracking-widest disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={submitImport}
                          disabled={loading || previewData.valid.length === 0}
                          className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 transition-all font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center"
                        >
                          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `Import ${previewData.valid.length} Products`}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 space-y-6 animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-black italic uppercase text-white tracking-tight">Import Successful</h4>
                    <p className="text-slate-400 mt-2">Inventory has been synchronized with the network.</p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
                    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl">
                      <div className="text-xl font-black text-emerald-500">{results.created}</div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">New</div>
                    </div>
                    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl">
                      <div className="text-xl font-black text-blue-500">{results.updated}</div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Updated</div>
                    </div>
                    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl">
                      <div className="text-xl font-black text-rose-500">{results.skipped}</div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Skipped</div>
                    </div>
                  </div>

                  {results.errors?.length > 0 && (
                    <div className="max-h-32 overflow-y-auto text-left p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl custom-scrollbar">
                        <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest mb-2">Error Log:</p>
                        {results.errors.map((err: string, i: number) => (
                            <p key={i} className="text-[10px] text-slate-500 mb-1">&bull; {err}</p>
                        ))}
                    </div>
                  )}

                  <button
                    onClick={() => {setShowModal(false); reset();}}
                    className="w-full py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 transition-all font-bold text-xs uppercase tracking-widest"
                  >
                    Done & Return
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-slate-950/80 border-t border-slate-800">
               <div className="flex items-center gap-2 text-[10px] text-slate-500 px-2">
                 <Info className="h-3 w-3" />
                 <span>Duplicate SKUs will automatically update existing products.</span>
               </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
