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

  const addCount = transactions.filter((t) => t.type === "add").length;
  const withdrawCount = transactions.filter(
    (t) => t.type === "withdraw",
  ).length;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="header-green">
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight">
            📋 ประวัติการทำรายการ
          </h1>
          <p className="text-sm text-white/80 mt-1">
            บันทึกการเบิก-เพิ่ม Stock
          </p>
        </div>
      </div>

      {/* Stats Mini */}
      {!loading && transactions.length > 0 && (
        <div className="px-4 -mt-3 relative z-10">
          <div className="card p-4 flex items-center gap-3">
            <div className="flex-1 flex items-center gap-3 bg-green-50 rounded-xl p-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-lg">
                ➕
              </div>
              <div>
                <p className="text-xl font-extrabold text-green-600">
                  {addCount}
                </p>
                <p className="text-xs text-green-500 font-medium">เติม</p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-3 bg-orange-50 rounded-xl p-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-lg">
                📤
              </div>
              <div>
                <p className="text-xl font-extrabold text-orange-600">
                  {withdrawCount}
                </p>
                <p className="text-xs text-orange-500 font-medium">เบิก</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="px-4 mt-4 flex gap-2">
        {[
          { key: "all", label: "ทั้งหมด", icon: "📋" },
          { key: "add", label: "เติม", icon: "➕" },
          { key: "withdraw", label: "เบิก", icon: "📤" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`chip whitespace-nowrap ${
              filter === f.key ? "chip-active" : "chip-inactive"
            }`}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="px-4 mt-3 space-y-2">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-[#06C755]/10 rounded-full flex items-center justify-center mb-4 animate-pulse-soft">
              <span className="text-3xl">📋</span>
            </div>
            <p className="text-gray-400 font-medium">กำลังโหลด...</p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">📭</span>
            </div>
            <p className="text-gray-500 font-medium text-lg">
              {filter !== "all" ? "ไม่มีประวัติในหมวดนี้" : "ยังไม่มีประวัติ"}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {filter !== "all"
                ? "ลองเลือกตัวกรองอื่น"
                : "การทำรายการจะปรากฏที่นี่"}
            </p>
          </div>
        )}

        {filtered.map((tx, index) => (
          <div
            key={tx.id}
            className="card-hover flex items-center gap-3 animate-fade-in"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm ${
                tx.type === "add"
                  ? "bg-gradient-to-br from-green-100 to-green-200"
                  : "bg-gradient-to-br from-orange-100 to-orange-200"
              }`}
            >
              {tx.type === "add" ? "➕" : "📤"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-800 truncate text-[15px]">
                {tx.stockName}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {tx.date}
                {tx.note && <span className="text-gray-300"> • {tx.note}</span>}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p
                className={`text-lg font-extrabold tracking-tight ${
                  tx.type === "add" ? "text-green-500" : "text-red-500"
                }`}
              >
                {tx.type === "add" ? "+" : "−"}
                {tx.quantity}
              </p>
              <span
                className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-semibold ${
                  tx.type === "add"
                    ? "bg-green-50 text-green-600"
                    : "bg-orange-50 text-orange-600"
                }`}
              >
                {tx.type === "add" ? "เติม" : "เบิก"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <BottomNav current="history" />
    </div>
  );
}
