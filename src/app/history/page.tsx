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
      <div className="header-app">
        <h1 className="text-3xl font-extrabold tracking-tight font-[family-name:var(--font-display)]">
          ประวัติการทำรายการ
        </h1>
        <p className="text-sm text-white/75 mt-1 font-[family-name:var(--font-body)]">
          บันทึกการเบิก-เติม Stock
        </p>
      </div>

      {/* Stats Mini */}
      {!loading && transactions.length > 0 && (
        <div className="px-4 -mt-3 relative z-10">
          <div className="card p-4 flex gap-3">
            <div className="flex-1 flex items-center gap-3 bg-success-bg rounded-lg p-3">
              <span className="text-lg">➕</span>
              <div>
                <p className="text-xl font-extrabold text-success tabular-nums font-[family-name:var(--font-display)]">
                  {addCount}
                </p>
                <p className="text-xs text-success/70 font-medium font-[family-name:var(--font-body)]">
                  เติม
                </p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-3 bg-warning-bg rounded-lg p-3">
              <span className="text-lg">📤</span>
              <div>
                <p className="text-xl font-extrabold text-warning tabular-nums font-[family-name:var(--font-display)]">
                  {withdrawCount}
                </p>
                <p className="text-xs text-warning/70 font-medium font-[family-name:var(--font-body)]">
                  เบิก
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="px-4 mt-4 flex gap-2">
        {[
          { key: "all", label: "ทั้งหมด" },
          { key: "add", label: "เติม" },
          { key: "withdraw", label: "เบิก" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`chip whitespace-nowrap ${
              filter === f.key ? "chip-active" : "chip-inactive"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Transaction List */}
      <div className="px-4 mt-3 space-y-2">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-4xl mb-4 opacity-40">📋</span>
            <p className="text-muted font-medium font-[family-name:var(--font-body)]">
              กำลังโหลด...
            </p>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-5xl mb-4 opacity-30">📭</span>
            <p className="text-ink-2 font-medium text-lg font-[family-name:var(--font-body)]">
              {filter !== "all" ? "ไม่มีประวัติในหมวดนี้" : "ยังไม่มีประวัติ"}
            </p>
            <p className="text-muted text-sm mt-1 font-[family-name:var(--font-body)]">
              {filter !== "all"
                ? "ลองเลือกตัวกรองอื่น"
                : "การทำรายการจะปรากฏที่นี่"}
            </p>
          </div>
        )}

        {filtered.map((tx) => (
          <div key={tx.id} className="card flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                tx.type === "add" ? "bg-success-bg" : "bg-warning-bg"
              }`}
            >
              {tx.type === "add" ? "➕" : "📤"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-ink truncate text-[15px] font-[family-name:var(--font-body)]">
                {tx.stockName}
              </p>
              <p className="text-xs text-muted mt-0.5 font-[family-name:var(--font-body)]">
                {tx.date}
                {tx.note && <span className="text-rule-2"> · {tx.note}</span>}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p
                className={`text-lg font-extrabold tracking-tight tabular-nums font-[family-name:var(--font-display)] ${
                  tx.type === "add" ? "text-success" : "text-danger"
                }`}
              >
                {tx.type === "add" ? "+" : "−"}
                {tx.quantity}
              </p>
              <span
                className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold font-[family-name:var(--font-body)] ${
                  tx.type === "add"
                    ? "bg-success-bg text-success"
                    : "bg-warning-bg text-warning"
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
