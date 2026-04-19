"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, CheckCircle2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isVerified = searchParams.get("verified") === "1";
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
        <div className="rounded-xl bg-green-500/10 p-4 mb-6 border border-green-500/20">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle2 className="h-5 w-5 text-green-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-400">
                Email perfectly verified! You can now sign in and access your dashboard.
              </p>
            </div>
          </div>
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

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
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium leading-6 text-slate-300"
              >
                Password
              </label>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
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
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
      </form>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-slate-950 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="flex justify-center">
          <div className="p-3 bg-indigo-600/10 rounded-2xl border border-indigo-500/20">
            <ShieldAlert className="h-10 w-10 text-indigo-500" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold tracking-tight text-white">
          Sign in to CODShield
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/50 border border-slate-800 p-8 shadow-2xl rounded-3xl backdrop-blur-sm">
        <Suspense fallback={<div className="text-center text-sm text-slate-500 animate-pulse">Initializing secure login...</div>}>
          <LoginForm />
        </Suspense>

        <p className="mt-10 text-center text-sm text-slate-400">
          Not a member?{" "}
          <Link
            href="/register"
            className="font-semibold leading-6 text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Create a secure account
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
