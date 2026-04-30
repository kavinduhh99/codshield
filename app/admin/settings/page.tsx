import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import { Sidebar } from "@/components/layout/Sidebar";
import AdminSettings from "@/models/AdminSettings";
import { redirect } from "next/navigation";
import { Settings, Save, Bell, Shield, UserPlus, Globe, Loader2 } from "lucide-react";
import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm";

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== "admin") {
    redirect("/login");
  }

  await connectDB();
  let settings = await AdminSettings.findOne().lean();
  if (!settings) {
    settings = JSON.parse(JSON.stringify(await AdminSettings.create({})));
  } else {
    settings = JSON.parse(JSON.stringify(settings));
  }

  return (
    <div className="flex min-h-screen w-full bg-gray-950 text-gray-300">
      <Sidebar
        businessName={(session.user as any)?.businessName}
        userName={session.user?.name}
        role={(session.user as any)?.role}
      />

      <div className="flex flex-1 flex-col pt-14 md:pt-0 md:pl-64 h-full border-l border-gray-800">
        <main className="flex-1 overflow-y-auto">
          <div className="py-8 min-h-screen font-sans">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-8">
              <h1 className="text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-3">
                <Settings className="h-8 w-8 text-gray-500" />
                Global Parameters
              </h1>
              <p className="mt-2 text-sm text-gray-400 font-medium tracking-wide">Configure the BizFlow SaaS core engine and platform policies.</p>
            </div>

            <div className="mx-auto max-w-4xl px-4 sm:px-6 md:px-8 mt-10">
              <AdminSettingsForm initialSettings={settings} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
