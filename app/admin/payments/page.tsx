import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectDB from "@/lib/db";
import { Sidebar } from "@/components/layout/Sidebar";
import User from "@/models/User";
import Payment from "@/models/Payment";
import { redirect } from "next/navigation";
import { PaymentManager } from "@/components/admin/PaymentManager";

export default async function AdminPaymentsPage() {
  const session = await getServerSession(authOptions);

  if (!session || (session.user as any)?.role !== "admin") {
    redirect("/login");
  }

  await connectDB();

  // Fetch payments and users for the dropdown
  const [paymentsRaw, usersRaw] = await Promise.all([
    Payment.find().populate("userId", "name email businessName").sort({ createdAt: -1 }).lean(),
    User.find({ role: "business" }).select("name businessName").sort({ businessName: 1 }).lean(),
  ]);

  const payments = paymentsRaw.map((p: any) => ({
    ...p,
    _id: p._id.toString(),
    userId: p.userId ? {
      ...p.userId,
      _id: p.userId._id.toString(),
    } : null,
    createdAt: p.createdAt?.toISOString(),
    updatedAt: p.updatedAt?.toISOString(),
    paymentDate: p.paymentDate?.toISOString(),
  }));

  const users = usersRaw.map((u: any) => ({
    ...u,
    _id: u._id.toString(),
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
              <h1 className="text-3xl font-black text-white tracking-tight uppercase italic">Subscription Payments</h1>
              <p className="mt-2 text-sm text-gray-400 font-medium tracking-wide">Manage manual transactions and subscription lifecycle events.</p>
            </div>

            <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 mt-10">
              <PaymentManager initialPayments={payments} users={users} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
