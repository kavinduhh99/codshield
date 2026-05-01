"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useSession } from "next-auth/react";
import { 
  LifeBuoy, MessageSquare, Clock, CheckCircle2, 
  AlertCircle, X, Loader2, Filter, ChevronRight,
  ShieldAlert, User, Briefcase, Mail, Send
} from "lucide-react";

export default function AdminSupportPage() {
  const { data: session, status } = useSession();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const [filters, setFilters] = useState({
    status: "open",
    priority: "all",
    category: "all"
  });

  useEffect(() => {
    if (status === "authenticated" && (session?.user as any).role === "admin") {
      fetchTickets();
    }
  }, [status, filters]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams(filters);
      const res = await fetch(`/api/admin/support?${query.toString()}`);
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

  const handleUpdate = async (id: string, update: any) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/support/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(update),
      });
      if (res.ok) {
        setReply("");
        setSelectedTicket(null);
        fetchTickets();
      }
    } catch (err) {
      console.error(err);
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

  if (status === "loading" || (status === "authenticated" && (session?.user as any).role !== "admin")) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-950 text-white overflow-x-hidden">
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
                <LifeBuoy className="h-8 w-8 text-blue-500" />
                Support Management
              </h1>
              <p className="text-slate-400 text-sm font-medium mt-1">Review and resolve user support requests and bug reports.</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-wrap items-center gap-4 shadow-xl">
             <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 tracking-widest mr-2">
                <Filter className="h-3 w-3" /> Quick Filter
             </div>
             <div className="flex flex-wrap gap-2">
                {['all', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
                  <button
                    key={s}
                    onClick={() => setFilters({...filters, status: s})}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filters.status === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'}`}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
             </div>
          </div>

          {/* Ticket Table/Cards */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-950/50 border-b border-slate-800">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Ticket & User</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Classification</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {loading ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto" /></td></tr>
                  ) : tickets.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-bold uppercase text-[10px] tracking-widest">No matching tickets</td></tr>
                  ) : (
                    tickets.map((t) => (
                      <tr key={t._id} className="group hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-black text-white text-sm uppercase italic">{t.subject}</div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 tracking-tighter">
                               <Briefcase className="h-2 w-2" /> {t.businessName}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 tracking-tighter">
                               <Mail className="h-2 w-2" /> {t.userEmail}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col gap-1">
                              <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">{t.category.replace("_", " ")}</span>
                              <span className={`text-[9px] font-black uppercase tracking-tighter ${t.priority === 'high' ? 'text-red-500' : t.priority === 'medium' ? 'text-amber-500' : 'text-slate-500'}`}>
                                {t.priority} Priority
                              </span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${getStatusStyle(t.status)}`}>
                            {t.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedTicket(t)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Detail/Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
               <div>
                  <h2 className="text-xl font-black italic uppercase tracking-tight">Support Ticket Detail</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 italic">#{selectedTicket._id}</p>
               </div>
               <button onClick={() => setSelectedTicket(null)} className="text-slate-500 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
               {/* Context Header */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                     <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">User Context</p>
                     <p className="text-sm font-bold text-white italic">{selectedTicket.businessName}</p>
                     <p className="text-xs text-slate-400 mt-0.5">{selectedTicket.userEmail}</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl">
                     <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Created At</p>
                     <p className="text-sm font-bold text-white italic">{new Date(selectedTicket.createdAt).toLocaleString()}</p>
                     {selectedTicket.pageUrl && <p className="text-[9px] text-blue-400 mt-1 truncate">{selectedTicket.pageUrl}</p>}
                  </div>
               </div>

               {/* Message Body */}
               <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">User Message</p>
                  <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl relative">
                     <div className="absolute top-0 right-0 p-4 opacity-5">
                        <MessageSquare className="h-12 w-12" />
                     </div>
                     <p className="text-base text-slate-300 font-medium italic">"{selectedTicket.message}"</p>
                  </div>
               </div>

               {/* Reply Section */}
               <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Admin Reply</label>
                    <textarea
                      rows={4}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium resize-none"
                      placeholder="Type your response to the user..."
                      value={reply || selectedTicket.adminReply || ""}
                      onChange={(e) => setReply(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                     <div className="flex-1 min-w-[200px]">
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Update Status</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['open', 'in_progress', 'resolved', 'closed'].map(s => (
                              <button
                                key={s}
                                onClick={() => handleUpdate(selectedTicket._id, { status: s })}
                                className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedTicket.status === s ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-500 border border-slate-800 hover:border-slate-700'}`}
                              >
                                {s.replace("_", " ")}
                              </button>
                            ))}
                        </div>
                     </div>
                     <div className="flex items-end">
                        <button
                          onClick={() => handleUpdate(selectedTicket._id, { adminReply: reply })}
                          disabled={!reply || submitting}
                          className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
                        >
                          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Send Reply</>}
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
