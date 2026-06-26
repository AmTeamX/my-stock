"use client";

import { useState, useEffect } from "react";
import BottomNav from "../components/BottomNav";
import { Transaction } from "@/types";

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "add" | "withdraw">("all");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stock/transactions");
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered =
    filter === "all"
      ? transactions
      : transactions.filter((t) => t.type === filter);

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-[#06C755] text-white px-5 pt-12 pb-6 rounded-b-3xl shadow-md">
        <h1 className="text-2xl font-bold mb-1">📋 ประวัติการทำรายการ</h1>
        <p className="text-sm opacity-90">บันทึกการเบิก-เพิ่ม Stock</p>
      </div>

      {/* Filter */}
      <div className="px-4 mt-4 flex gap-2">
        {[
          { key: "all", label: "ทั้งหมด" },
          { key: "add", label: "➕ เพิ่ม" },
          { key: "withdraw", label: "📤 เบิก" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`chip transition-colors ${
              filter === f.key
                ? "bg-[#06C755] text-white"
                : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="px-4 mt-3 space-y-2">
        {loading && (
          <div className="text-center py-12 text-gray-400">
            <div className="animate-pulse text-4xl mb-2">📋</div>
            <p>กำลังโหลด...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-lg">ยังไม่มีประวัติ</p>
          </div>
        )}

        {filtered.map((tx) => (
          <div
            key={tx.id}
            className="card flex items-center gap-3 animate-slide-up"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                ${tx.type === "add" ? "bg-green-100" : "bg-orange-100"}`}
            >
              {tx.type === "add" ? "➕" : "📤"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">
                {tx.stockName}
              </p>
              <p className="text-xs text-gray-400">
                {tx.date}
                {tx.note && ` • ${tx.note}`}
              </p>
            </div>
            <div className="text-right">
              <p
                className={`font-bold ${
                  tx.type === "add" ? "text-green-500" : "text-red-500"
                }`}
              >
                {tx.type === "add" ? "+" : "-"}
                {tx.quantity}
              </p>
              <p className="text-[10px] text-gray-400">
                {tx.type === "add" ? "เติม" : "เบิก"}
              </p>
            </div>
          </div>
        ))}
      </div>

      <BottomNav current="history" />
    </div>
  );
}
