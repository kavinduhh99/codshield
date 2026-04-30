import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import Expense from "@/models/Expense";
import mongoose from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const userId = session.user.id;

    // Parse query params
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "thisMonth";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    const now = new Date();
    
    if (range === "thisMonth") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (range === "lastMonth") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (range === "thisYear") {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else if (range === "custom" && startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
      endDate.setHours(23, 59, 59, 999);
    }

    // Build date filter
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.$gte = startDate;
      dateFilter.$lte = endDate;
    }

    // Prepare queries
    const orderQuery: any = { userId };
    if (Object.keys(dateFilter).length > 0) {
      orderQuery.createdAt = dateFilter; // Using createdAt as the primary date field
    }

    const expenseQuery: any = { userId };
    if (Object.keys(dateFilter).length > 0) {
      expenseQuery.$or = [
        { date: dateFilter },
        { createdAt: dateFilter }
      ];
    }

    // Fetch data
    const orders = await Order.find(orderQuery).populate('productId').lean();
    const expenses = await Expense.find(expenseQuery).lean();

    // Calculate overall stats
    let deliveredRevenue = 0;
    let productCost = 0;
    let deliveryFees = 0;
    let returnedProductValue = 0;
    let returnLoss = 0;

    // Monthly summary map: 'YYYY-MM' -> metrics
    const monthlyMap: Record<string, any> = {};

    const getMonthKey = (dateStr: any) => {
      if (!dateStr) return "Unknown";
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const ensureMonth = (key: string) => {
      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          month: key,
          deliveredRevenue: 0,
          productCost: 0,
          deliveryFees: 0,
          returnedProductValue: 0,
          returnLoss: 0,
          expenses: 0,
          profit: 0
        };
      }
    };

    orders.forEach((order) => {
      const monthKey = getMonthKey(order.createdAt);
      ensureMonth(monthKey);

      let pRevenue = 0;
      let pCost = 0;

      if (order.items && order.items.length > 0) {
        order.items.forEach((item: any) => {
          pRevenue += (item.unitSellingPrice || 0) * (item.quantity || 1);
          pCost += (item.costPrice || 0) * (item.quantity || 1);
        });
      } else {
        pRevenue = (order.sellingPrice || 0) * (order.quantity || 1);
        pCost = (order.costPrice || 0) * (order.quantity || 1);
      }

      const discount = order.discount || 0;
      const netRevenue = Math.max(0, pRevenue - discount);

      let isPaidOrCOD = true;
      if (order.paymentMethod !== "COD" && order.paymentStatus !== "paid") {
         isPaidOrCOD = false;
      }

      if (order.status === "delivered" && isPaidOrCOD) {
        deliveredRevenue += netRevenue;
        productCost += pCost;
        deliveryFees += order.deliveryFee || 0;

        monthlyMap[monthKey].deliveredRevenue += netRevenue;
        monthlyMap[monthKey].productCost += pCost;
        monthlyMap[monthKey].deliveryFees += order.deliveryFee || 0;
      } else if (order.status === "returned") {
        returnedProductValue += pRevenue;
        returnLoss += order.deliveryFee || 0;
        monthlyMap[monthKey].returnedProductValue += pRevenue;
        monthlyMap[monthKey].returnLoss += order.deliveryFee || 0;
      }
    });

    let totalExpenses = 0;
    expenses.forEach((expense) => {
      const monthKey = getMonthKey(expense.date || expense.createdAt);
      ensureMonth(monthKey);

      totalExpenses += expense.amount;
      monthlyMap[monthKey].expenses += expense.amount;
    });

    // Calculate profit per month
    Object.keys(monthlyMap).forEach(key => {
      monthlyMap[key].profit = monthlyMap[key].deliveredRevenue - monthlyMap[key].productCost - monthlyMap[key].expenses - monthlyMap[key].returnLoss;
    });

    const estimatedProfit = deliveredRevenue - productCost - totalExpenses - returnLoss;

    // Sort monthly summary descending
    const monthlySummary = Object.values(monthlyMap).sort((a, b) => b.month.localeCompare(a.month));

    return NextResponse.json({
      deliveredRevenue,
      returnedProductValue,
      returnLoss,
      totalExpenses,
      estimatedProfit,
      productCost,
      deliveryFees,
      monthlySummary,
      orders // send back orders for the CSV report
    }, { status: 200 });

  } catch (error: any) {
    console.error("Finance GET Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
