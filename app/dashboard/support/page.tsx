"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useSession } from "next-auth/react";
import { 
  LifeBuoy, Send, MessageSquare, Clock, CheckCircle2, 
  AlertCircle, ChevronRight, X, Loader2, Image as ImageIcon,
  History, HelpCircle
} from "lucide-react";

export default function SupportPage() {
  const { data: session, status } = useSession();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    subject: "",
    message: "",
    category: "general",
    priority: "low",
  });

  useEffect(() => {
    if (status === "authenticated") {
      fetchTickets();
    }
  }, [status]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/support");
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
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
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          pageUrl: typeof window !== "undefined" ? window.location.href : "",
        }),
      });

      if (res.ok) {
        setSuccess("Your support request has been submitted.");
        setFormData({ subject: "", message: "", category: "general", priority: "low" });
        setTimeout(() => {
          setSuccess("");
          setShowNewModal(false);
          fetchTickets();
        }, 2000);
      } else {
        const data = await res.json();
        setError(data.message || "Failed to submit ticket");
      }
    } catch (err) {
      setError("Server error");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (s: string) => {
    switch (s) {
      case "open": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "in_progress": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "resolved": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "closed": return "bg-slate-500/10 text-slate-500 border-slate-500/20";
      default: return "bg-slate-500/10 text-slate-500 border-slate-500/20";
    }
  };

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-950 text-white overflow-x-hidden">
      <Sidebar
        businessName={(session?.user as any)?.businessName}
        userName={session?.user?.name}
        role={(session?.user as any)?.role}
      />

      <div className="flex flex-1 flex-col pt-14 md:pt-0 md:pl-64">
        <main className="flex-1 p-4 md:p-8 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white flex items-center gap-3">
                <LifeBuoy className="h-8 w-8 text-blue-500" />
                Support Center
              </h1>
              <p className="text-slate-400 text-sm font-medium mt-1">Need help? We're here to support your business journey.</p>
            </div>
            <button
              onClick={() => setShowNewModal(true)}
              className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 transition-all font-bold text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95"
            >
              <Send className="h-4 w-4 mr-2" /> New Support Ticket
            </button>
          </div>

          {/* Ticket List */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <History className="h-4 w-4 text-slate-500" />
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Your Recent Tickets</h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center">
                <HelpCircle className="h-12 w-12 text-slate-700 mx-auto mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No support tickets found</p>
                <p className="text-slate-600 text-xs mt-1 italic">Click 'New Support Ticket' to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {tickets.map((ticket) => (
                  <div key={ticket._id} className="group bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all shadow-lg hover:shadow-blue-500/5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(ticket.status)}`}>
                            {ticket.status.replace("_", " ")}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                            Ref: #{ticket._id.slice(-6).toUpperCase()} &bull; {new Date(ticket.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-white italic truncate">{ticket.subject}</h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Category</p>
                          <p className="text-xs font-bold text-slate-300 capitalize">{ticket.category.replace("_", " ")}</p>
                        </div>
                        <div className="h-8 w-[1px] bg-slate-800" />
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Priority</p>
                          <p className={`text-xs font-black ${ticket.priority === 'high' ? 'text-red-500' : ticket.priority === 'medium' ? 'text-amber-500' : 'text-slate-400'} uppercase`}>
                            {ticket.priority}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-slate-800/50">
                      <p className="text-sm text-slate-400 line-clamp-2 italic">"{ticket.message}"</p>
                    </div>

                    {ticket.adminReply && (
                      <div className="mt-4 p-4 bg-blue-600/5 border border-blue-500/20 rounded-xl animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 mb-2">
                          <LifeBuoy className="h-3 w-3 text-blue-500" />
                          <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest">Support Team Reply</span>
                        </div>
                        <p className="text-sm text-slate-300 font-medium">"{ticket.adminReply}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* New Ticket Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <h2 className="text-xl font-black italic uppercase italic tracking-tight">Open Support Request</h2>
              <button onClick={() => setShowNewModal(false)} className="text-slate-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && <div className="p-4 bg-red-900/20 border border-red-800 rounded-xl text-red-400 text-xs font-bold">{error}</div>}
              {success && <div className="p-4 bg-emerald-900/20 border border-emerald-800 rounded-xl text-emerald-400 text-xs font-bold">{success}</div>}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Subject *</label>
                  <input
                    type="text"
                    required
                    placeholder="Briefly describe your issue"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Category</label>
                    <select
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                    >
                      <option value="general">General Help</option>
                      <option value="bug">Bug Report</option>
                      <option value="payment">Billing / Payment</option>
                      <option value="feature_request">Feature Request</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Priority</label>
                    <select
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Message *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us more about how we can help..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium resize-none italic"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                 <div className="flex items-center gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <AlertCircle className="h-4 w-4 text-slate-600" />
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Your technical environment (URL, browser) will be included to help us debug.</p>
                 </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="h-4 w-4" /> Submit Request</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
