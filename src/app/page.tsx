"use client";

import { useState, useEffect, useCallback } from "react";
import { StockItem } from "@/types";
import BottomNav from "./components/BottomNav";
import StockCard from "./components/StockCard";

export default function HomePage() {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ทั้งหมด");
  const [error, setError] = useState("");

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stock");
      if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
      const data = await res.json();
      setStocks(data.stocks || []);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  const categories = [
    "ทั้งหมด",
    ...Array.from(new Set(stocks.map((s) => s.category).filter(Boolean))),
  ];

  const filteredStocks = stocks.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "ทั้งหมด" || s.category === category;
    return matchSearch && matchCat;
  });

  const lowStockCount = stocks.filter(
    (s) => s.quantity <= s.minThreshold,
  ).length;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="header-app">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">MyStock</h1>
            <p className="text-sm text-white/75 mt-1">จัดการคลังเวชภัณฑ์</p>
          </div>
          <span className="text-3xl opacity-80">🏥</span>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 -mt-4 relative z-10">
        <div className="relative">
          <input
            type="text"
            className="input-field pl-10 pr-10 bg-white shadow-card-raised border-rule"
            placeholder="ค้นหาชื่อรายการ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none select-none text-base">
            🔍
          </span>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-muted hover:text-ink-2 focus-visible:outline-2 focus-visible:outline-focus"
              aria-label="ล้างการค้นหา"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-4 mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`chip whitespace-nowrap ${
              category === cat ? "chip-active" : "chip-inactive"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stock List */}
      <div className="px-4 mt-3 space-y-3">
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-4xl mb-4 opacity-40">📦</span>
            <p className="text-muted font-medium">กำลังโหลดข้อมูล...</p>
          </div>
        )}

        {error && (
          <div className="card text-center py-10">
            <span className="text-3xl block mb-3">⚠️</span>
            <p className="text-danger font-medium">
              {error}
            </p>
            <button onClick={fetchStocks} className="btn-primary mt-4">
              ลองใหม่อีกครั้ง
            </button>
          </div>
        )}

        {!loading && !error && filteredStocks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-5xl mb-4 opacity-30">📭</span>
            <p className="text-ink-2 font-medium text-lg">
              {search ? `ไม่พบ "${search}"` : "ยังไม่มีรายการ"}
            </p>
            <p className="text-muted text-sm mt-1">
              {search
                ? "ลองเปลี่ยนคำค้นหา"
                : "เพิ่มรายการแรกได้ที่หน้า เพิ่ม Stock"}
            </p>
          </div>
        )}

        {!loading &&
          filteredStocks.map((stock) => (
            <StockCard key={stock.id} stock={stock} onUpdate={fetchStocks} />
          ))}
      </div>

      {/* Stats Summary */}
      {!loading && stocks.length > 0 && (
        <div className="px-4 mt-4">
          <div className="card p-5 grid grid-cols-3">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-accent tabular-nums">
                {stocks.length}
              </p>
              <p className="text-xs text-muted mt-1">
                รายการทั้งหมด
              </p>
            </div>
            <div className="text-center border-x border-rule">
              <p
                className={`text-2xl font-extrabold tabular-nums ${
                  lowStockCount > 0 ? "text-danger" : "text-muted"
                }`}
              >
                {lowStockCount}
              </p>
              <p className="text-xs text-muted mt-1">
                ใกล้หมด
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-extrabold text-ink-2 tabular-nums">
                {categories.length - 1}
              </p>
              <p className="text-xs text-muted mt-1">
                หมวดหมู่
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav current="home" />
    </div>
  );
}
