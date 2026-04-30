"use client";

import { useState } from "react";
import { Save, Bell, Shield, UserPlus, Globe, Loader2, CheckCircle, CreditCard } from "lucide-react";

export function AdminSettingsForm({ initialSettings }: { initialSettings: any }) {
  const [settings, setSettings] = useState(initialSettings);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-20">
      {/* SaaS Defaults */}
      <section className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-2xl">
        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-6">
          <Globe className="h-4 w-4 text-blue-500" />
          SaaS Engine Defaults
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Default Free Trial (Days)</label>
            <input
              type="number"
              className="block w-full bg-gray-950 border border-gray-800 text-gray-300 text-sm rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              value={settings.trialDays}
              onChange={(e) => setSettings({ ...settings, trialDays: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Platform Currency</label>
            <input
              type="text"
              className="block w-full bg-gray-950 border border-gray-800 text-gray-300 text-sm rounded-xl p-3 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* Risk Intelligence */}
      <section className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-2xl">
        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-6">
          <Shield className="h-4 w-4 text-orange-500" />
          Risk Intelligence Thresholds
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Warning Level (Failed Orders)</label>
            <input
              type="number"
              className="block w-full bg-gray-950 border border-gray-800 text-gray-300 text-sm rounded-xl p-3 focus:ring-2 focus:ring-orange-500 transition-all outline-none"
              value={settings.riskWarningThreshold}
              onChange={(e) => setSettings({ ...settings, riskWarningThreshold: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">High Risk Level (Failed Orders)</label>
            <input
              type="number"
              className="block w-full bg-gray-950 border border-gray-800 text-gray-300 text-sm rounded-xl p-3 focus:ring-2 focus:ring-red-500 transition-all outline-none"
              value={settings.highRiskThreshold}
              onChange={(e) => setSettings({ ...settings, highRiskThreshold: Number(e.target.value) })}
            />
          </div>
        </div>
      </section>

      {/* Access Control */}
      <section className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-2xl">
        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-6">
          <UserPlus className="h-4 w-4 text-purple-500" />
          Access Control
        </h3>
        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-950 border border-gray-800">
          <div>
            <div className="text-sm font-bold text-white">Public Registration</div>
            <div className="text-xs text-gray-500 mt-1">Allow new businesses to sign up without invitation.</div>
          </div>
          <button
            type="button"
            onClick={() => setSettings({ ...settings, allowPublicRegistration: !settings.allowPublicRegistration })}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              settings.allowPublicRegistration ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                settings.allowPublicRegistration ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Communications */}
      <section className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-2xl">
        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-6">
          <Bell className="h-4 w-4 text-emerald-500" />
          Platform Communications
        </h3>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Announcement Text (Global)</label>
          <textarea
            rows={4}
            className="block w-full bg-gray-950 border border-gray-800 text-gray-300 text-sm rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 transition-all outline-none"
            placeholder="Display a message to all active sellers..."
            value={settings.announcementText}
            onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })}
          />
        </div>
      </section>

      {/* Payment Instructions */}
      <section className="bg-gray-900 rounded-2xl border border-gray-800 p-6 shadow-2xl">
        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2 mb-6">
          <CreditCard className="h-4 w-4 text-indigo-500" />
          Payment Instructions (Seller Facing)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Bank Name</label>
            <input
              type="text"
              className="block w-full bg-gray-950 border border-gray-800 text-gray-300 text-sm rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              value={settings.paymentInstructions?.bankName || ""}
              onChange={(e) => setSettings({ 
                ...settings, 
                paymentInstructions: { ...settings.paymentInstructions, bankName: e.target.value } 
              })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Name</label>
            <input
              type="text"
              className="block w-full bg-gray-950 border border-gray-800 text-gray-300 text-sm rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              value={settings.paymentInstructions?.accountName || ""}
              onChange={(e) => setSettings({ 
                ...settings, 
                paymentInstructions: { ...settings.paymentInstructions, accountName: e.target.value } 
              })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Number</label>
            <input
              type="text"
              className="block w-full bg-gray-950 border border-gray-800 text-gray-300 text-sm rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              value={settings.paymentInstructions?.accountNumber || ""}
              onChange={(e) => setSettings({ 
                ...settings, 
                paymentInstructions: { ...settings.paymentInstructions, accountNumber: e.target.value } 
              })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Branch</label>
            <input
              type="text"
              className="block w-full bg-gray-950 border border-gray-800 text-gray-300 text-sm rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              value={settings.paymentInstructions?.branch || ""}
              onChange={(e) => setSettings({ 
                ...settings, 
                paymentInstructions: { ...settings.paymentInstructions, branch: e.target.value } 
              })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Support Phone / WhatsApp</label>
            <input
              type="text"
              className="block w-full bg-gray-950 border border-gray-800 text-gray-300 text-sm rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              value={settings.paymentInstructions?.paymentPhone || ""}
              onChange={(e) => setSettings({ 
                ...settings, 
                paymentInstructions: { ...settings.paymentInstructions, paymentPhone: e.target.value } 
              })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Internal Payment Note</label>
            <input
              type="text"
              className="block w-full bg-gray-950 border border-gray-800 text-gray-300 text-sm rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
              value={settings.paymentInstructions?.paymentNote || ""}
              onChange={(e) => setSettings({ 
                ...settings, 
                paymentInstructions: { ...settings.paymentInstructions, paymentNote: e.target.value } 
              })}
            />
          </div>
        </div>
      </section>

      {/* Sticky Footer for Save */}
      <div className="fixed bottom-8 right-8 z-30">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest shadow-2xl hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : success ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          {success ? 'Settings Stored' : 'Commit Changes'}
        </button>
      </div>
    </form>
  );
}
