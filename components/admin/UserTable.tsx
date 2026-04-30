"use client";

import { useState } from "react";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  User as UserIcon, 
  ShieldCheck, 
  ShieldAlert, 
  Trash2, 
  ExternalLink, 
  Clock, 
  CreditCard,
  CheckCircle,
  XCircle,
  Mail,
  Phone as PhoneIcon,
  Building
} from "lucide-react";
import Link from "next/link";

interface UserTableProps {
  initialUsers: any[];
}

export function UserTable({ initialUsers }: UserTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");

  const filteredUsers = users.filter((user: any) => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.businessName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    const matchesPlan = planFilter === "all" || 
      (planFilter === "Pro" ? user.subscription?.plan !== "Free Trial" : user.subscription?.plan === planFilter);

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const handleStatusUpdate = async (userId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setUsers(users.map(u => u._id === userId ? { ...u, status: newStatus } : u));
      }
    } catch (error) {
      console.error("Status update failed:", error);
    }
  };

  const handleVerifyUpdate = async (userId: string, isVerified: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified }),
      });
      if (res.ok) {
        setUsers(users.map(u => u._id === userId ? { ...u, isVerified } : u));
      }
    } catch (error) {
      console.error("Verification update failed:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(users.filter(u => u._id !== userId));
      }
    } catch (error) {
      console.error("Delete user failed:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-900 p-4 rounded-xl border border-gray-800 shadow-lg">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Search name, email, or business..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-800 rounded-lg bg-gray-950 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <select
            className="bg-gray-950 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-all"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
            className="bg-gray-950 border border-gray-800 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 transition-all"
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
          >
            <option value="all">All Plans</option>
            <option value="Free Trial">Free Trial</option>
            <option value="Pro">Pro Plan</option>
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-2xl">
        <table className="min-w-full divide-y divide-gray-800">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Business / Owner</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Plan / Subscription</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Verification</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 bg-gray-900/50">
            {filteredUsers.map((user) => (
              <tr key={user._id} className="hover:bg-gray-800/60 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                      <Building className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-bold text-white">{user.businessName}</div>
                      <div className="text-xs text-gray-400">{user.name} &bull; {user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ring-1 ring-inset ${
                      user.subscription?.plan === 'Free Trial' ? 'bg-gray-800 text-gray-400 ring-gray-700' : 'bg-blue-900/20 text-blue-400 ring-blue-500/30'
                    }`}>
                      {user.subscription?.plan === 'Free Trial' ? 'Free Trial' : 'Pro'}
                    </span>
                    <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                      {user.subscription?.endDate ? `Expires: ${new Date(user.subscription.endDate).toLocaleDateString()}` : 'No expiry'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Email</span>
                      {user.isEmailVerified ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Business</span>
                      <button 
                        onClick={() => handleVerifyUpdate(user._id, !user.isVerified)}
                        className={`transition-all hover:scale-110 ${user.isVerified ? 'text-blue-500' : 'text-gray-600'}`}
                      >
                        {user.isVerified ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select 
                    className={`text-xs font-bold rounded-lg border px-2 py-1 bg-gray-950 focus:outline-none transition-all ${
                      user.status === 'active' ? 'text-green-500 border-green-500/30 bg-green-500/5' : 'text-red-500 border-red-500/30 bg-red-500/5'
                    }`}
                    value={user.status}
                    onChange={(e) => handleStatusUpdate(user._id, e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-3">
                    <Link 
                      href={`/admin/users/${user._id}`}
                      className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-all"
                      title="View Details"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <button 
                      onClick={() => handleDeleteUser(user._id)}
                      className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-red-500 hover:bg-red-900/20 transition-all"
                      title="Delete User"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && (
          <div className="py-20 text-center">
            <UserIcon className="h-12 w-12 text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500 italic">No users found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredUsers.map((user) => (
          <div key={user._id} className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4 shadow-lg">
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                  <Building className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <div className="text-sm font-bold text-white">{user.businessName}</div>
                  <div className="text-xs text-gray-500">{user.name}</div>
                </div>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                user.subscription?.plan === 'Free Trial' ? 'bg-gray-800 text-gray-400' : 'bg-blue-900/20 text-blue-400'
              }`}>
                {user.subscription?.plan === 'Free Trial' ? 'Free' : 'Pro'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-gray-950 p-2 rounded-lg border border-gray-800">
                <span className="block text-gray-500 uppercase tracking-tighter mb-1 text-[9px]">Email Status</span>
                <div className="flex items-center gap-1">
                  {user.isEmailVerified ? <CheckCircle className="h-3 w-3 text-green-500" /> : <XCircle className="h-3 w-3 text-gray-600" />}
                  <span className={user.isEmailVerified ? 'text-green-500' : 'text-gray-600'}>
                    {user.isEmailVerified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              </div>
              <div className="bg-gray-950 p-2 rounded-lg border border-gray-800">
                <span className="block text-gray-500 uppercase tracking-tighter mb-1 text-[9px]">Account Status</span>
                <div className="flex items-center gap-1">
                  <div className={`h-1.5 w-1.5 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className={user.status === 'active' ? 'text-green-500 font-bold' : 'text-red-500 font-bold uppercase'}>
                    {user.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Link 
                href={`/admin/users/${user._id}`}
                className="flex-1 flex justify-center items-center gap-2 py-2 rounded-lg bg-gray-800 text-xs font-bold text-gray-300 hover:bg-gray-700"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Details
              </Link>
              <button 
                onClick={() => handleStatusUpdate(user._id, user.status === 'active' ? 'suspended' : 'active')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                  user.status === 'active' ? 'border-red-500/30 text-red-400 bg-red-500/5' : 'border-green-500/30 text-green-400 bg-green-500/5'
                }`}
              >
                {user.status === 'active' ? 'Suspend' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <div className="py-12 text-center text-gray-500 text-sm italic">No users found.</div>
        )}
      </div>
    </div>
  );
}
