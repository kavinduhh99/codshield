import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import { Sidebar } from "@/components/layout/Sidebar";
import User from "@/models/User";
import { redirect } from "next/navigation";
import { SubscriptionToggle } from "@/components/admin/SubscriptionToggle";
import { EmailVerifyToggle } from "@/components/admin/EmailVerifyToggle";
import { CheckCircle, XCircle } from "lucide-react";
import { UserTable } from "@/components/admin/UserTable";

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== "admin") {
    redirect("/login");
  }

  await connectDB();

  const rawUsers = await User.find({ role: "business" }).sort({ createdAt: -1 }).lean();
  
  const users = rawUsers.map((user: any) => ({
    ...user,
    _id: user._id.toString(),
    createdAt: user.createdAt?.toISOString(),
    updatedAt: user.updatedAt?.toISOString(),
    subscription: user.subscription ? {
      ...user.subscription,
      startDate: user.subscription.startDate?.toISOString(),
      endDate: user.subscription.endDate?.toISOString(),
    } : null,
  }));

  return (
    <div className="flex min-h-screen w-full bg-gray-950 text-gray-300">
      <Sidebar
        businessName={(session.user as any)?.businessName}
        userName={session.user?.name}
        role={(session.user as any)?.role}
      />

      <div className="flex flex-1 flex-col pt-14 md:pt-0 md:pl-64 h-full border-l border-gray-800">
        <main className="flex-1 overflow-y-auto">
          <div className="py-8 min-h-screen">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
              <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Access Directory</h1>
              <p className="mt-2 text-sm text-gray-400 font-medium">Strictly manage client authorization instances across the cluster.</p>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 mt-10">
              <UserTable initialUsers={users} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
