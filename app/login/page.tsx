"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShieldAlert, CheckCircle2, Eye, EyeOff, CheckCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isVerified = searchParams.get("verified") === "1";
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: formData.email,
        password: formData.password,
      });

      if (res?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {isVerified && (
        <div className="rounded-xl bg-green-500/10 p-4 mb-6 border border-green-500/20 flex items-start">
          <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <p className="ml-3 text-sm font-medium text-green-400">
            Email successfully verified! You can now sign in to your dashboard.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 mb-6">
          <p className="text-sm text-red-400 text-center font-medium">{error}</p>
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium leading-6 text-slate-300">
            Email address
          </label>
          <div className="mt-2">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full rounded-xl border-0 py-3 bg-slate-900/50 text-white shadow-inner ring-1 ring-inset ring-slate-700/50 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 px-4 transition-all outline-none backdrop-blur-sm"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium leading-6 text-slate-300">
            Password
          </label>
          <div className="mt-2 relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              className="block w-full rounded-xl border-0 py-3 bg-slate-900/50 text-white shadow-inner ring-1 ring-inset ring-slate-700/50 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 px-4 pr-10 transition-all outline-none backdrop-blur-sm"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 hover:from-blue-500 hover:to-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </div>
      </form>
      
      <p className="mt-8 text-center text-sm text-slate-400">
        Don't have an account?{" "}
        <Link href="/register" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
          Create an account
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full bg-slate-950 font-sans selection:bg-blue-500/30">
      {/* Dynamic Background Gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-blob"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 flex flex-col md:flex-row w-full max-w-7xl mx-auto">
        
        {/* Left Side: Branding / Marketing */}
        <div className="flex-1 flex flex-col justify-center px-8 py-12 md:px-16 lg:px-24">
          <div className="flex items-center mb-8">
            <div className="mr-3 overflow-hidden rounded-xl bg-slate-900 border border-slate-800">
              <Image src="/logo.png" alt="BizFlow Logo" width={48} height={48} className="object-contain w-auto h-auto" />
            </div>
            <span className="text-3xl font-bold tracking-tight text-white">BizFlow</span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-6">
            All-in-one business management system for online sellers
          </h1>
          
          <p className="text-lg text-slate-400 mb-10 max-w-lg">
            Manage orders, stock, finance and COD risk in one place.
          </p>
          
          <ul className="space-y-4">
            <li className="flex items-center text-slate-300">
              <CheckCircle className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" />
              <span className="text-lg">Smart COD Shield</span>
            </li>
            <li className="flex items-center text-slate-300">
              <CheckCircle className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" />
              <span className="text-lg">Stock Management</span>
            </li>
            <li className="flex items-center text-slate-300">
              <CheckCircle className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" />
              <span className="text-lg">Finance Tracking</span>
            </li>
          </ul>
        </div>

        {/* Right Side: Form Card */}
        <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 lg:py-24">
          <div className="mx-auto w-full max-w-md">
            
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-8 sm:p-10 shadow-2xl shadow-black/50 rounded-3xl relative overflow-hidden">
              {/* Subtle top glow on card */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
              
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
                <p className="text-sm text-slate-400">Sign in to continue to your dashboard</p>
              </div>

              <Suspense fallback={<div className="text-center text-sm text-slate-500 animate-pulse py-10">Initializing secure login...</div>}>
                <LoginForm />
              </Suspense>
              
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
