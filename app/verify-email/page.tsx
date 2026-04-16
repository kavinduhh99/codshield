import Link from "next/link";
import { Mail, ShieldAlert } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="p-3 bg-blue-900/30 rounded-full border border-blue-500/30">
             <ShieldAlert className="h-12 w-12 text-blue-500" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Verify your email
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          We need to protect CODShield from malicious accounts.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-900 py-8 px-4 shadow-xl shadow-black/50 sm:rounded-xl border border-gray-800 sm:px-10 text-center">
          <Mail className="mx-auto h-16 w-16 text-gray-600 mb-6" />
          <h3 className="text-xl font-semibold text-white mb-2">Check your inbox</h3>
          <p className="text-gray-400 mb-6">
            We've sent a verification link to your email address. Please click the link to activate your account and access the dashboard.
          </p>
          <div className="mt-6 text-sm">
             <p className="text-gray-500">
               If you didn't receive an email, check your spam folder or contact support.
             </p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <Link href="/login" className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
