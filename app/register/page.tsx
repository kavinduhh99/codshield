"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { ShieldAlert, CheckCircle, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          businessName: formData.businessName,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.message || "Registration failed");
        setLoading(false);
        return;
      }

      router.push("/verify-email");
    } catch (err) {
      setError("An unexpected error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-slate-950 font-sans selection:bg-blue-500/30">
      {/* Dynamic Background Gradient */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-blob"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-blob animation-delay-2000"></div>
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
          
          <ul className="space-y-4 mb-10">
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

          <div className="inline-block bg-slate-900/50 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm max-w-md">
            <p className="text-white font-medium text-lg">Start your 30-day free trial.</p>
            <p className="text-slate-400 mt-1">No credit card required.</p>
          </div>
        </div>

        {/* Right Side: Form Card */}
        <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 lg:py-24">
          <div className="mx-auto w-full max-w-md">
            
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-8 sm:p-10 shadow-2xl shadow-black/50 rounded-3xl relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
              
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Create an account</h2>
                <p className="text-sm text-slate-400">Join BizFlow to scale your business securely</p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 mb-2">
                    <p className="text-sm text-red-400 text-center font-medium">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium leading-6 text-slate-300">
                      Owner Name
                    </label>
                    <div className="mt-2">
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        className="block w-full rounded-xl border-0 py-2.5 bg-slate-900/50 text-white shadow-inner ring-1 ring-inset ring-slate-700/50 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 px-4 transition-all outline-none backdrop-blur-sm"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="businessName" className="block text-sm font-medium leading-6 text-slate-300">
                      Business Name
                    </label>
                    <div className="mt-2">
                      <input
                        id="businessName"
                        name="businessName"
                        type="text"
                        required
                        className="block w-full rounded-xl border-0 py-2.5 bg-slate-900/50 text-white shadow-inner ring-1 ring-inset ring-slate-700/50 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 px-4 transition-all outline-none backdrop-blur-sm"
                        value={formData.businessName}
                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium leading-6 text-slate-300">
                    Business Phone
                  </label>
                  <div className="mt-2">
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      className="block w-full rounded-xl border-0 py-2.5 bg-slate-900/50 text-white shadow-inner ring-1 ring-inset ring-slate-700/50 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 px-4 transition-all outline-none backdrop-blur-sm"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

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
                      className="block w-full rounded-xl border-0 py-2.5 bg-slate-900/50 text-white shadow-inner ring-1 ring-inset ring-slate-700/50 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 px-4 transition-all outline-none backdrop-blur-sm"
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
                      autoComplete="new-password"
                      required
                      className="block w-full rounded-xl border-0 py-2.5 bg-slate-900/50 text-white shadow-inner ring-1 ring-inset ring-slate-700/50 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 px-4 pr-10 transition-all outline-none backdrop-blur-sm"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-slate-300">
                    Confirm Password
                  </label>
                  <div className="mt-2 relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      className="block w-full rounded-xl border-0 py-2.5 bg-slate-900/50 text-white shadow-inner ring-1 ring-inset ring-slate-700/50 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:text-sm sm:leading-6 px-4 pr-10 transition-all outline-none backdrop-blur-sm"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-200 transition-colors"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-3">
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
                        Creating account...
                      </span>
                    ) : (
                      "Create Account"
                    )}
                  </button>
                </div>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700/50"></div>
                </div>
                <div className="relative flex justify-center text-sm font-medium leading-6">
                  <span className="bg-slate-900/60 px-4 text-slate-400">or continue with</span>
                </div>
              </div>

              <button
                onClick={() => signIn("google", { callbackUrl: "/" })}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-100 transition-all active:scale-[0.98]"
              >
                <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign up with Google
              </button>
              
              <p className="mt-8 text-center text-sm text-slate-400">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
