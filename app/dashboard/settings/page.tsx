"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Loader2, Save, Building, FileText, Truck, Box, ShieldAlert, User, LogOut, CheckCircle, XCircle, AlertCircle } from "lucide-react";

// Local type definitions to avoid importing mongoose in client component
type SettingsType = {
  businessProfile: {
    businessName: string;
    ownerName: string;
    businessPhone: string;
    businessEmail: string;
    businessAddress: string;
    logoUrl: string;
  };
  invoiceSettings: {
    invoicePrefix: string;
    invoiceStartNumber: number;
    invoiceNotes: string;
    showLogoOnInvoice: boolean;
    currency: string;
  };
  waybillSettings: {
    defaultCourier: string;
    senderName: string;
    senderPhone: string;
    pickupAddress: string;
    defaultDeliveryNotes: string;
  };
  orderSettings: {
    defaultDeliveryFee: number;
    defaultOrderStatus: string;
    autoReduceStock: boolean;
    restoreStockOnReturn: boolean;
  };
  shieldSettings: {
    warningRiskThreshold: number;
    highRiskThreshold: number;
    showHighRiskConfirmation: boolean;
  };
};

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("business");
  
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [originalSettings, setOriginalSettings] = useState<SettingsType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setOriginalSettings(JSON.parse(JSON.stringify(data.settings))); // Deep copy
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    try {
      setIsSaving(true);
      setSaveMessage(null);
      
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessProfile: settings.businessProfile,
          invoiceSettings: settings.invoiceSettings,
          waybillSettings: settings.waybillSettings,
          orderSettings: settings.orderSettings,
          shieldSettings: settings.shieldSettings,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
        setOriginalSettings(JSON.parse(JSON.stringify(data.settings)));
        setSaveMessage({ type: "success", text: "Settings saved successfully!" });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveMessage({ type: "error", text: "Error saving settings. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const hasUnsavedChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  const updateSection = (section: keyof SettingsType, field: string, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    });
  };

  const tabs = [
    { id: "business", label: "Business Profile", icon: Building },
    { id: "invoice", label: "Invoice Settings", icon: FileText },
    { id: "waybill", label: "Waybill Settings", icon: Truck },
    { id: "order", label: "Order Settings", icon: Box },
    { id: "shield", label: "Shield Settings", icon: ShieldAlert },
    { id: "account", label: "Account", icon: User },
  ];

  if (!session || !session.user) return null;

  return (
    <div className="flex min-h-screen w-full bg-gray-50 dark:bg-slate-950 font-sans overflow-x-hidden max-w-full">
      <Sidebar
        businessName={(session.user as any)?.businessName}
        userName={session.user?.name}
        role={session.user?.role}
      />

      <div className="flex flex-1 flex-col pt-14 md:pt-0 md:pl-64">
        {/* Sticky Header with Save Button */}
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 px-4 sm:px-6 md:px-8 py-4 transition-all">
          <div className="flex flex-row justify-between items-center gap-4">
             <div>
               <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-slate-100 leading-none">Settings</h1>
               {hasUnsavedChanges && (
                 <div className="hidden sm:flex items-center mt-1.5 text-xs text-yellow-600 dark:text-yellow-500 font-medium">
                   <AlertCircle className="h-3.5 w-3.5 mr-1" /> Unsaved changes
                 </div>
               )}
             </div>
             
             <div className="flex items-center gap-4">
               {saveMessage && (
                 <span className={`hidden md:flex text-xs items-center ${saveMessage.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                   {saveMessage.type === "success" ? <CheckCircle className="h-3.5 w-3.5 mr-1" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
                   {saveMessage.text}
                 </span>
               )}
               <button
                 onClick={handleSave}
                 disabled={!hasUnsavedChanges || isSaving || isLoading}
                 className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
               >
                 {isSaving ? <Loader2 className="animate-spin h-4 w-4"/> : <><Save className="-ml-1 mr-2 h-4 w-4"/> Save</>}
               </button>
             </div>
          </div>
          {hasUnsavedChanges && (
            <div className="flex sm:hidden items-center mt-2 text-[10px] text-yellow-600 dark:text-yellow-500 font-medium bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded w-fit">
              <AlertCircle className="h-3 w-3 mr-1" /> Unsaved changes
            </div>
          )}
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="py-6 min-h-screen">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 md:px-8">
              
              {isLoading ? (
                <div className="animate-pulse space-y-6">
                  <div className="flex gap-4">
                     <div className="h-10 w-32 bg-gray-200 dark:bg-slate-800 rounded-md"></div>
                     <div className="h-10 w-32 bg-gray-200 dark:bg-slate-800 rounded-md"></div>
                     <div className="h-10 w-32 bg-gray-200 dark:bg-slate-800 rounded-md"></div>
                  </div>
                  <div className="h-96 w-full bg-gray-200 dark:bg-slate-800 rounded-xl"></div>
                </div>
              ) : settings ? (
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Tabs Navigation */}
                  <div className="w-full md:w-64 flex-shrink-0">
                    <div className="w-full overflow-x-auto touch-pan-x no-scrollbar">
                      <nav className="flex flex-row md:flex-col min-w-max md:min-w-0 pb-2 md:pb-0 space-x-1 md:space-x-0 md:space-y-1">
                        {tabs.map((tab) => {
                          const Icon = tab.icon;
                          const isActive = activeTab === tab.id;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className={`flex items-center shrink-0 px-4 py-2.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                                isActive 
                                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" 
                                  : "text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-slate-800/50"
                              }`}
                            >
                              <Icon className={`flex-shrink-0 -ml-1 mr-3 h-5 w-5 ${isActive ? "text-blue-700 dark:text-blue-400" : "text-gray-400 dark:text-slate-500"}`} />
                              <span>{tab.label}</span>
                            </button>
                          );
                        })}
                      </nav>
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 bg-white dark:bg-slate-900 shadow-sm border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden min-w-0">
                    
                    {/* Business Profile */}
                    {activeTab === "business" && (
                      <div className="p-4 sm:p-8 space-y-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Business Profile</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Business Name</label>
                            <input type="text" value={settings.businessProfile.businessName} onChange={e => updateSection("businessProfile", "businessName", e.target.value)} className="mt-1 block w-full min-w-0 rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:text-white" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Owner Name</label>
                            <input type="text" value={settings.businessProfile.ownerName} onChange={e => updateSection("businessProfile", "ownerName", e.target.value)} className="mt-1 block w-full min-w-0 rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:text-white" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Business Phone</label>
                            <input type="text" value={settings.businessProfile.businessPhone} onChange={e => updateSection("businessProfile", "businessPhone", e.target.value)} className="mt-1 block w-full min-w-0 rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:text-white" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Business Email</label>
                            <input type="email" value={settings.businessProfile.businessEmail} onChange={e => updateSection("businessProfile", "businessEmail", e.target.value)} className="mt-1 block w-full min-w-0 rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:text-white" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Business Address</label>
                            <textarea rows={3} value={settings.businessProfile.businessAddress} onChange={e => updateSection("businessProfile", "businessAddress", e.target.value)} className="mt-1 block w-full min-w-0 rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:text-white" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Logo URL</label>
                            <input type="text" placeholder="https://example.com/logo.png" value={settings.businessProfile.logoUrl} onChange={e => updateSection("businessProfile", "logoUrl", e.target.value)} className="mt-1 block w-full min-w-0 rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:text-white" />
                            <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">Provide a direct URL to your business logo for invoices and waybills.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Invoice Settings */}
                    {activeTab === "invoice" && (
                      <div className="p-4 sm:p-8 space-y-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Invoice Settings</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Invoice Prefix</label>
                            <input type="text" value={settings.invoiceSettings.invoicePrefix} onChange={e => updateSection("invoiceSettings", "invoicePrefix", e.target.value)} className="mt-1 block w-full min-w-0 rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:text-white" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Starting Number</label>
                            <input type="number" value={settings.invoiceSettings.invoiceStartNumber} onChange={e => updateSection("invoiceSettings", "invoiceStartNumber", parseInt(e.target.value) || 0)} className="mt-1 block w-full min-w-0 rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:text-white" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Currency Code</label>
                            <input type="text" value={settings.invoiceSettings.currency} onChange={e => updateSection("invoiceSettings", "currency", e.target.value)} className="mt-1 block w-full min-w-0 rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:text-white" />
                          </div>
                          <div className="flex items-center md:mt-6">
                            <input id="showLogo" type="checkbox" checked={settings.invoiceSettings.showLogoOnInvoice} onChange={e => updateSection("invoiceSettings", "showLogoOnInvoice", e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800" />
                            <label htmlFor="showLogo" className="ml-2 block text-sm text-gray-900 dark:text-slate-300">Show Logo on Invoice</label>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Invoice Notes / Footer Text</label>
                            <textarea rows={3} value={settings.invoiceSettings.invoiceNotes} onChange={e => updateSection("invoiceSettings", "invoiceNotes", e.target.value)} className="mt-1 block w-full min-w-0 rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:text-white" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Waybill Settings */}
                    {activeTab === "waybill" && (
                      <div className="p-4 sm:p-8 space-y-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Waybill Settings</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Default Courier</label>
                            <input type="text" value={settings.waybillSettings.defaultCourier} onChange={e => updateSection("waybillSettings", "defaultCourier", e.target.value)} className="mt-1 block w-full min-w-0 rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:text-white" />
                          </div>
                          <div className="hidden md:block"></div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Sender Name</label>
                            <input type="text" value={settings.waybillSettings.senderName} onChange={e => updateSection("waybillSettings", "senderName", e.target.value)} className="mt-1 block w-full min-w-0 rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:text-white" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Sender Phone</label>
                            <input type="text" value={settings.waybillSettings.senderPhone} onChange={e => updateSection("waybillSettings", "senderPhone", e.target.value)} className="mt-1 block w-full min-w-0 rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:text-white" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Pickup Address</label>
                            <textarea rows={3} value={settings.waybillSettings.pickupAddress} onChange={e => updateSection("waybillSettings", "pickupAddress", e.target.value)} className="mt-1 block w-full min-w-0 rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:text-white" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Default Delivery Notes</label>
                            <input type="text" value={settings.waybillSettings.defaultDeliveryNotes} onChange={e => updateSection("waybillSettings", "defaultDeliveryNotes", e.target.value)} className="mt-1 block w-full min-w-0 rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:text-white" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Settings */}
                    {activeTab === "order" && (
                      <div className="p-4 sm:p-8 space-y-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Order Settings</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Default Delivery Fee</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm">Rs.</span>
                              </div>
                              <input type="number" value={settings.orderSettings.defaultDeliveryFee} onChange={e => updateSection("orderSettings", "defaultDeliveryFee", parseFloat(e.target.value) || 0)} className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Default Order Status</label>
                            <select value={settings.orderSettings.defaultOrderStatus} onChange={e => updateSection("orderSettings", "defaultOrderStatus", e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                            </select>
                          </div>
                          
                          <div className="md:col-span-2 space-y-4 mt-2">
                            <div className="flex items-start">
                              <div className="flex items-center h-5">
                                <input id="autoReduce" type="checkbox" checked={settings.orderSettings.autoReduceStock} onChange={e => updateSection("orderSettings", "autoReduceStock", e.target.checked)} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded dark:border-slate-700 dark:bg-slate-800" />
                              </div>
                              <div className="ml-3 text-sm">
                                <label htmlFor="autoReduce" className="font-medium text-gray-700 dark:text-slate-300">Auto-reduce stock</label>
                                <p className="text-gray-500 dark:text-slate-400">Automatically decrease product stock when a new order is created.</p>
                              </div>
                            </div>
                            <div className="flex items-start">
                              <div className="flex items-center h-5">
                                <input id="restoreStock" type="checkbox" checked={settings.orderSettings.restoreStockOnReturn} onChange={e => updateSection("orderSettings", "restoreStockOnReturn", e.target.checked)} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded dark:border-slate-700 dark:bg-slate-800" />
                              </div>
                              <div className="ml-3 text-sm">
                                <label htmlFor="restoreStock" className="font-medium text-gray-700 dark:text-slate-300">Restore stock on return</label>
                                <p className="text-gray-500 dark:text-slate-400">Automatically restore product stock when an order is marked as returned or cancelled.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Shield Settings */}
                    {activeTab === "shield" && (
                      <div className="p-4 sm:p-8 space-y-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Risk Intelligence Settings</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">Warning Risk Threshold</label>
                            <input type="number" value={settings.shieldSettings.warningRiskThreshold} onChange={e => updateSection("shieldSettings", "warningRiskThreshold", parseInt(e.target.value) || 0)} className="mt-1 block w-full min-w-0 rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:text-white" />
                            <p className="mt-1 text-xs text-gray-500">Orders above this score show a warning indicator.</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">High Risk Threshold</label>
                            <input type="number" value={settings.shieldSettings.highRiskThreshold} onChange={e => updateSection("shieldSettings", "highRiskThreshold", parseInt(e.target.value) || 0)} className="mt-1 block w-full min-w-0 rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:text-white" />
                            <p className="mt-1 text-xs text-gray-500">Orders above this score are flagged as high risk.</p>
                          </div>
                          
                          <div className="md:col-span-2 mt-2">
                            <div className="flex items-start">
                              <div className="flex items-center h-5">
                                <input id="highRiskConfirm" type="checkbox" checked={settings.shieldSettings.showHighRiskConfirmation} onChange={e => updateSection("shieldSettings", "showHighRiskConfirmation", e.target.checked)} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded dark:border-slate-700 dark:bg-slate-800" />
                              </div>
                              <div className="ml-3 text-sm">
                                <label htmlFor="highRiskConfirm" className="font-medium text-gray-700 dark:text-slate-300">Require confirmation for high risk orders</label>
                                <p className="text-gray-500 dark:text-slate-400">Show an extra warning prompt when attempting to process or ship a high risk order.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Account Settings */}
                    {activeTab === "account" && (
                      <div className="p-4 sm:p-8 space-y-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Account Security</h2>
                        
                        <div className="bg-gray-50 dark:bg-slate-800/50 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
                           <div className="flex items-center mb-4">
                             <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                               <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                             </div>
                             <div>
                               <p className="text-sm font-medium text-gray-900 dark:text-white">{session.user.name}</p>
                               <p className="text-sm text-gray-500 dark:text-slate-400">{session.user.email}</p>
                             </div>
                           </div>
                           <button 
                             type="button"
                             className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                             onClick={() => alert("Password change functionality will be implemented soon.")}
                           >
                             Change Password
                           </button>
                        </div>

                        <div className="pt-6 border-t border-gray-200 dark:border-slate-800">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Sign Out</h3>
                          <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
                            Sign out of your BizFlow account on this device.
                          </p>
                          <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 shadow-sm hover:bg-red-50 dark:hover:bg-slate-700/50"
                          >
                            <LogOut className="-ml-1 mr-2 h-4 w-4" /> Sign Out
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              ) : null}

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
