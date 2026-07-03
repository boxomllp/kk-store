"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    revenue: 0,
    pending: 0,
    verified: 0,
  });
  const [recent, setRecent] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [{ data: all }, { count: todayCount }, { count: weekCount }, { count: pendingCount }, { count: verifiedCount }] =
        await Promise.all([
          supabase.from("orders").select("product_price"),
          supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", startOfToday),
          supabase.from("orders").select("*", { count: "exact", head: true }).gte("created_at", weekAgo),
          supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("orders").select("*", { count: "exact", head: true }).eq("verification_status", "verified"),
        ]);

      const revenue = (all ?? []).reduce((sum, o: any) => sum + (o.product_price || 0), 0);

      setStats({
        today: todayCount ?? 0,
        week: weekCount ?? 0,
        revenue,
        pending: pendingCount ?? 0,
        verified: verifiedCount ?? 0,
      });

      const { data: recentOrders } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      setRecent((recentOrders ?? []) as Order[]);
      setLoading(false);
    }

    load();
  }, []);

  const cards = [
    { label: "Today's Orders", value: stats.today },
    { label: "Week Orders", value: stats.week },
    { label: "Total Revenue", value: `₹${stats.revenue.toLocaleString("en-IN")}` },
    { label: "Pending Orders", value: stats.pending },
    { label: "OTP Verified", value: stats.verified },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-navy mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className="text-xl font-bold text-navy mt-1">{loading ? "—" : c.value}</p>
          </div>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-gray-500 mb-2">Recent Orders</h2>
      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="px-4 py-2">Order #</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Product</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((o) => (
              <tr key={o.id} className="border-b last:border-0">
                <td className="px-4 py-2 font-medium">#{o.order_number}</td>
                <td className="px-4 py-2">{o.customer_name}</td>
                <td className="px-4 py-2">{o.product_name}</td>
                <td className="px-4 py-2">₹{o.product_price}</td>
                <td className="px-4 py-2 capitalize">{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
