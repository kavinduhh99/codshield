"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    businessName: "",
    phone: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setError(errorData.message || "Registration failed");
        setLoading(false);
        return;
      }

      // Success - Redirect immediately to verification notice page
      // We DO NOT call signIn() here anymore to prevent unverified session creation.
      router.push("/verify-email");
    } catch (err) {
      setError("An unexpected error occurred during registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-950 overflow-y-auto font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex-shrink-0">
        <div className="flex justify-center">
          <div className="p-3 bg-indigo-600/10 rounded-2xl border border-indigo-500/20">
            <ShieldAlert className="h-10 w-10 text-indigo-500" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
          Join CODShield
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Secure your eCommerce business from RTO losses today.
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md flex-shrink-0">
        <div className="bg-slate-900/50 border border-slate-800 p-8 shadow-2xl rounded-3xl backdrop-blur-sm px-4 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium leading-6 text-slate-300"
              >
                Full Name
              </label>
              <div className="mt-2">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="block w-full rounded-xl border-0 py-2.5 bg-slate-900 text-white shadow-sm ring-1 ring-inset ring-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 px-4 transition-all"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium leading-6 text-slate-300"
              >
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-xl border-0 py-2.5 bg-slate-900 text-white shadow-sm ring-1 ring-inset ring-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 px-4 transition-all"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="businessName"
                className="block text-sm font-medium leading-6 text-slate-300"
              >
                Business Name
              </label>
              <div className="mt-2">
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  required
                  className="block w-full rounded-xl border-0 py-2.5 bg-slate-900 text-white shadow-sm ring-1 ring-inset ring-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 px-4 transition-all"
                  value={formData.businessName}
                  onChange={(e) =>
                    setFormData({ ...formData, businessName: e.target.value })
                  }
                />
              </div>
            </div>
            
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium leading-6 text-slate-300"
              >
                Phone Number (Optional)
              </label>
              <div className="mt-2">
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="block w-full rounded-xl border-0 py-2.5 bg-slate-900 text-white shadow-sm ring-1 ring-inset ring-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 px-4 transition-all"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-slate-300"
              >
                Password
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full rounded-xl border-0 py-2.5 bg-slate-900 text-white shadow-sm ring-1 ring-inset ring-slate-800 placeholder:text-slate-500 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 px-4 transition-all"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold leading-6 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? "Registering..." : "Create Account"}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-10 mb-10 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold leading-6 text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
