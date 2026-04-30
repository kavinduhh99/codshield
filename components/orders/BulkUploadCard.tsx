"use client";

import { useState, useRef } from "react";
import { UploadCloud, Download, CheckCircle, XCircle, ArrowRight, Loader2 } from "lucide-react";
import * as xlsx from "xlsx";
import { useRouter } from "next/navigation";

interface Mapping {
  [key: string]: string;
}

const REQUIRED_FIELDS = [
  { key: "customerName", label: "Customer Name" },
  { key: "phone", label: "Phone" },
  { key: "address", label: "Delivery Address" },
];

const OPTIONAL_FIELDS = [
  { key: "phone2", label: "Phone 2" },
  { key: "city", label: "City" },
  { key: "district", label: "District" },
  { key: "productName", label: "Product Name / Description" },
  { key: "sku", label: "SKU" },
  { key: "quantity", label: "Quantity" },
  { key: "sellingPrice", label: "Selling Price / Amount" },
  { key: "deliveryFee", label: "Delivery Charge" },
  { key: "codAmount", label: "COD Amount" },
  { key: "courierName", label: "Courier Name" },
  { key: "trackingNumber", label: "Tracking Number (Waybill)" },
  { key: "externalOrderId", label: "External Order ID" },
  { key: "orderDate", label: "Order Date" },
  { key: "status", label: "Status" },
  { key: "notes", label: "Notes / Remarks" },
];

const ALIASES: Record<string, string[]> = {
  customerName: ["customer name", "name", "buyer name", "client name", "customer", "recipient name", "customer_name"],
  phone: ["phone", "mobile", "phone number", "contact", "contact number", "mobile number", "tel", "phone_number"],
  phone2: ["phone 2", "second phone", "alternate phone", "alt phone", "phone2"],
  address: ["address", "delivery address", "shipping address", "customer address", "location"],
  district: ["district"],
  city: ["city", "town"],
  productName: ["product", "product name", "item", "item name", "description"],
  sku: ["sku", "product code", "code", "item code"],
  quantity: ["qty", "quantity", "count"],
  sellingPrice: ["price", "selling price", "amount", "total"],
  deliveryFee: ["delivery fee", "shipping fee", "courier fee", "delivery charge"],
  codAmount: ["cod amount", "cod"],
  courierName: ["courier", "courier name", "delivery partner", "shipping provider"],
  trackingNumber: ["tracking", "tracking number", "waybill number", "waybill id", "awb", "awb number"],
  externalOrderId: ["order id", "external order id", "reference id", "order reference"],
  orderDate: ["order date", "date"],
  status: ["status", "order status"],
  notes: ["notes", "remark", "remarks", "comment"],
};

interface BulkUploadCardProps {
  onUpload?: () => void;
}

export function BulkUploadCard({ onUpload }: BulkUploadCardProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  
  const [validationResults, setValidationResults] = useState<{ valid: any[]; invalid: any[] }>({ valid: [], invalid: [] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isTransExpress, setIsTransExpress] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setError("");

    try {
      const data = await uploadedFile.arrayBuffer();
      const workbook = xlsx.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const json = xlsx.utils.sheet_to_json<any>(worksheet, { defval: "" });
      
      if (!json || json.length === 0) {
        throw new Error("File is empty or could not be parsed.");
      }

      const extractedHeaders = Object.keys(json[0]);
      setHeaders(extractedHeaders);
      setCsvData(json);

      // Auto map
      const initialMapping: Mapping = {};
      let transExpressScore = 0;

      extractedHeaders.forEach(header => {
        const lowerHeader = header.toLowerCase().trim();
        
        // Trans Express specific check
        if (lowerHeader === "waybill id") transExpressScore++;
        if (lowerHeader === "delivery charge") transExpressScore++;

        for (const [bizKey, aliases] of Object.entries(ALIASES)) {
          if (aliases.includes(lowerHeader)) {
            if (!initialMapping[bizKey]) { // Only map first match
              initialMapping[bizKey] = header;
            }
            break;
          }
        }
      });

      if (transExpressScore >= 2) {
        setIsTransExpress(true);
      }

      setMapping(initialMapping);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Error processing file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleMappingChange = (bizKey: string, csvHeader: string) => {
    setMapping(prev => {
      const newMapping = { ...prev };
      if (csvHeader) {
        newMapping[bizKey] = csvHeader;
      } else {
        delete newMapping[bizKey];
      }
      return newMapping;
    });
  };

  const proceedToValidation = () => {
    const valid: any[] = [];
    const invalid: any[] = [];

    csvData.forEach((row, index) => {
      // Map row to bizflow format
      const mappedRow: any = {};
      Object.entries(mapping).forEach(([bizKey, csvHeader]) => {
        mappedRow[bizKey] = row[csvHeader];
      });

      // Trans Express automatic courier setting
      if (isTransExpress && !mappedRow.courierName) {
        mappedRow.courierName = "Trans Express";
      }

      // Check required fields
      const missingRequired = REQUIRED_FIELDS.filter(f => !mappedRow[f.key] || String(mappedRow[f.key]).trim() === "");

      if (missingRequired.length > 0) {
        invalid.push({
          row: index + 2, // Excel rows are 1-indexed, plus header
          reason: `Missing required: ${missingRequired.map(f => f.label).join(", ")}`,
          data: mappedRow
        });
      } else {
        valid.push(mappedRow);
      }
    });

    setValidationResults({ valid, invalid });
    setStep(3);
  };

  const importData = async () => {
    if (validationResults.valid.length === 0) return;
    
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/order/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orders: validationResults.valid }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.message || "Failed to import orders.");
      }

      if (onUpload) onUpload();
      router.push("/dashboard/order/history");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Error importing file.");
      setSubmitting(false);
    }
  };

  const reset = () => {
    setStep(1);
    setFile(null);
    setCsvData([]);
    setHeaders([]);
    setMapping({});
    setValidationResults({ valid: [], invalid: [] });
    setIsTransExpress(false);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownloadSample = () => {
    const headers = [
      "customerName", "phone", "phone2", "address", "productName", "sku", 
      "quantity", "sellingPrice", "deliveryFee", "courierName", "trackingNumber", "notes"
    ];
    
    const rows = [
      ['Kamal Perera', '0771234567', '0719876543', '"No 25, Galle Road, Colombo"', 'T-Shirt Black', 'TSHIRT-BLK-M', '2', '2500', '350', 'Trans Express', 'WB123456', '"Call before delivery"'],
      ['Nimali Silva', '0762223344', '', '"No 10, Main Street, Kandy"', 'Handbag Brown', 'BAG-BRN-01', '1', '4500', '400', 'Domex', 'DX987654', '"Fragile item"'],
      ['Kasun Fernando', '0755556666', '', '"No 8, Negombo Road, Kurunegala"', 'Wireless Earbuds', 'EAR-001', '1', '6500', '350', 'Koombiyo', 'KB456789', '"COD order"']
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'bizflow-order-sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700">
      <div className="px-4 py-5 border-b border-gray-200 dark:border-gray-700 sm:px-6 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
          Bulk Upload {step > 1 && <span className="text-sm font-normal text-gray-500 ml-2">- Step {step} of 3</span>}
        </h3>
        {step === 1 && (
          <button 
            onClick={handleDownloadSample}
            className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 bg-transparent border-none cursor-pointer"
          >
            <Download className="h-4 w-4 mr-1"/> Download Sample
          </button>
        )}
        {step > 1 && (
           <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
             Start Over
           </button>
        )}
      </div>
      
      <div className="p-6">
        {error && (
          <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
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
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500">CSV or Excel up to 10MB</p>
            </div>
          </div>
        )}

        {/* STEP 2: MAPPING */}
        {step === 2 && (
          <div className="space-y-6">
            {isTransExpress && (
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-3 rounded-md text-sm flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" /> 
                Trans Express format detected! Auto-mapping applied.
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Required Fields</h4>
                <div className="space-y-3">
                  {REQUIRED_FIELDS.map(field => (
                    <div key={field.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{field.label} *</span>
                      <select 
                        className="w-full sm:w-64 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm py-1.5 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                        value={mapping[field.key] || ""}
                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                      >
                        <option value="">-- Select Column --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Optional Fields</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {OPTIONAL_FIELDS.map(field => (
                    <div key={field.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{field.label}</span>
                      <select 
                        className="w-full sm:w-64 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm py-1.5 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                        value={mapping[field.key] || ""}
                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                      >
                        <option value="">-- Ignored --</option>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={proceedToValidation}
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Continue <ArrowRight className="ml-2 h-4 w-4"/>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & IMPORT */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 p-4 rounded-lg flex flex-col items-center justify-center">
                 <span className="text-2xl font-bold text-green-700 dark:text-green-400">{validationResults.valid.length}</span>
                 <span className="text-sm text-green-600 dark:text-green-500">Ready to Import</span>
               </div>
               <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-4 rounded-lg flex flex-col items-center justify-center">
                 <span className="text-2xl font-bold text-red-700 dark:text-red-400">{validationResults.invalid.length}</span>
                 <span className="text-sm text-red-600 dark:text-red-500">Invalid Rows</span>
               </div>
            </div>

            {validationResults.invalid.length > 0 && (
              <div className="mt-4 border border-red-200 dark:border-red-800/30 rounded-lg overflow-hidden">
                <div className="bg-red-50 dark:bg-red-900/30 px-4 py-2 text-sm font-medium text-red-800 dark:text-red-300">
                  Errors found (these rows will be skipped):
                </div>
                <ul className="divide-y divide-gray-200 dark:divide-gray-800 max-h-48 overflow-y-auto p-4 bg-white dark:bg-gray-900 text-sm">
                  {validationResults.invalid.slice(0, 10).map((err, i) => (
                    <li key={i} className="py-2 text-red-600 dark:text-red-400">
                      Row {err.row}: {err.reason}
                    </li>
                  ))}
                  {validationResults.invalid.length > 10 && (
                    <li className="py-2 text-gray-500 italic">...and {validationResults.invalid.length - 10} more.</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700 gap-3">
              <button
                onClick={() => setStep(2)}
                disabled={submitting}
                className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
              >
                Back to Mapping
              </button>
              <button
                onClick={importData}
                disabled={submitting || validationResults.valid.length === 0}
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {submitting ? <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4"/> Importing...</> : `Import ${validationResults.valid.length} Orders`}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
