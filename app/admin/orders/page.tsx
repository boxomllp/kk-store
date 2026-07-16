"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";
import { STATE_CODES } from "@/lib/types";

const STATUS_OPTIONS = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [verifyFilter, setVerifyFilter] = useState<string>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [bulkStatus, setBulkStatus] = useState<string>("pending");

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders((data ?? []) as Order[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (search) {
        const s = search.toLowerCase();
        if (!o.customer_name.toLowerCase().includes(s) && !o.phone.includes(search)) return false;
      }
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (verifyFilter === "verified" && o.verification_status !== "verified") return false;
      if (verifyFilter === "unverified" && o.verification_status !== "unverified") return false;
      if (fromDate && new Date(o.created_at) < new Date(fromDate)) return false;
      if (toDate && new Date(o.created_at) > new Date(toDate + "T23:59:59")) return false;
      return true;
    });
  }, [orders, search, statusFilter, verifyFilter, fromDate, toDate]);

  async function updateStatus(id: string, status: string) {
    const supabase = createClient();
    await supabase.from("orders").update({ status }).eq("id", id);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: status as Order["status"] } : o)));
  }

  async function updateTracking(id: string, tracking_number: string) {
    const supabase = createClient();
    await supabase.from("orders").update({ tracking_number }).eq("id", id);
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, tracking_number } : o)));
  }

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function handleBulkUpdate() {
    if (selected.size === 0) return;
    const supabase = createClient();
    await supabase.from("orders").update({ status: bulkStatus }).in("id", Array.from(selected));
    setOrders((prev) =>
      prev.map((o) => (selected.has(o.id) ? { ...o, status: bulkStatus as Order["status"] } : o))
    );
    setSelected(new Set());
  }

  function exportCsv() {
    const headers = [
      "Order Number", "Date", "Full Name", "Phone", "Address Line 1", "Address Line 2",
      "Landmark", "City", "Pincode", "State", "Product", "Variant", "Price",
      "Fulfillment Status", "Verification Status",
    ];
    const rows = filtered.map((o) => [
      o.order_number,
      new Date(o.created_at).toLocaleString("en-IN"),
      o.customer_name,
      o.phone,
      o.address_line1,
      o.address_line2 || "",
      o.landmark || "",
      o.city || "",
      o.pincode || "",
      STATE_CODES[o.state || ""] || o.state || "",
      o.product_name,
      o.variant || "",
      o.product_price,
      o.status,
      o.verification_status,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-navy">Orders</h1>
        <button onClick={exportCsv} className="bg-navy text-white text-sm font-semibold px-4 py-2 rounded-lg">
          Export CSV ({filtered.length})
        </button>
      </div>

      <div className="bg-white border rounded-xl p-4 mb-4 grid sm:grid-cols-5 gap-3">
        <input
          placeholder="Search name or phone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm sm:col-span-2"
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={verifyFilter} onChange={(e) => setVerifyFilter(e.target.value)} className="border rounded-lg px-3 py-2 text-sm">
          <option value="all">All Verification</option>
          <option value="verified">OTP Verified</option>
          <option value="unverified">Not Verified</option>
        </select>
        <div className="flex gap-2">
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border rounded-lg px-2 py-2 text-sm flex-1" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border rounded-lg px-2 py-2 text-sm flex-1" />
        </div>
      </div>

      {selected.size > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex items-center gap-3 text-sm">
          <span>{selected.size} selected</span>
          <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="border rounded-lg px-2 py-1">
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button onClick={handleBulkUpdate} className="bg-cta text-white px-3 py-1.5 rounded-lg font-medium">
            Update Status
          </button>
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={(e) =>
                    setSelected(e.target.checked ? new Set(filtered.map((o) => o.id)) : new Set())
                  }
                />
              </th>
              <th className="px-3 py-2">Order #</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Customer</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Product</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Verification</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              filtered.map((o) => (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleSelect(o.id)} />
                  </td>
                  <td className="px-3 py-2 font-medium">#{o.order_number}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{new Date(o.created_at).toLocaleString("en-IN")}</td>
                  <td className="px-3 py-2">{o.customer_name}</td>
                  <td className="px-3 py-2">{o.phone}</td>
                  <td className="px-3 py-2">{o.product_name}{o.variant ? ` (${o.variant})` : ""}</td>
                  <td className="px-3 py-2">₹{o.product_price}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        o.verification_status === "verified"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {o.verification_status === "verified" ? "OTP Verified" : "Not Verified"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="border rounded-lg px-2 py-1 text-xs"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <button onClick={() => setDetailOrder(o)} className="text-ctatext font-medium">View</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {!loading && filtered.length === 0 && (
          <p className="text-center text-gray-400 py-10 text-sm">No orders match these filters.</p>
        )}
      </div>

      {detailOrder && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setDetailOrder(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full p-5 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">#{detailOrder.order_number}</h2>
              <button onClick={() => setDetailOrder(null)} className="text-gray-400 text-2xl leading-none">&times;</button>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-gray-500">Customer:</span> {detailOrder.customer_name}</p>
              <p><span className="text-gray-500">Phone:</span> {detailOrder.phone}</p>
              <p><span className="text-gray-500">Product:</span> {detailOrder.product_name} {detailOrder.variant && `(${detailOrder.variant})`}</p>
              <p><span className="text-gray-500">Amount:</span> ₹{detailOrder.product_price}</p>
              <p><span className="text-gray-500">Address 1:</span> {detailOrder.address_line1}</p>
              {detailOrder.address_line2 && <p><span className="text-gray-500">Address 2:</span> {detailOrder.address_line2}</p>}
              {detailOrder.landmark && <p><span className="text-gray-500">Landmark:</span> {detailOrder.landmark}</p>}
              <p><span className="text-gray-500">City/State/Pincode:</span> {detailOrder.city}, {detailOrder.state} - {detailOrder.pincode}</p>
              <p><span className="text-gray-500">Verification:</span> {detailOrder.verification_status}</p>

              <div className="pt-2">
                <label className="text-gray-500 text-sm">Tracking Number</label>
                <input
                  defaultValue={detailOrder.tracking_number || ""}
                  onBlur={(e) => updateTracking(detailOrder.id, e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                  placeholder="Enter tracking number"
                />
              </div>

              <div className="pt-2">
                <label className="text-gray-500 text-sm">Fulfillment Status</label>
                <select
                  value={detailOrder.status}
                  onChange={(e) => {
                    updateStatus(detailOrder.id, e.target.value);
                    setDetailOrder({ ...detailOrder, status: e.target.value as Order["status"] });
                  }}
                  className="w-full border rounded-lg px-3 py-2 mt-1"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
