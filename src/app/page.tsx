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
      <div className="header-green">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                📦 MyStock
              </h1>
              <p className="text-sm text-white/80 mt-1">จัดการคลังเวชภัณฑ์</p>
            </div>
            <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-sm">
              🏥
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 -mt-5 relative z-20">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            🔍
          </span>
          <input
            type="text"
            className="input-field pl-12 pr-4 shadow-lg shadow-black/5 bg-white border-0"
            placeholder="ค้นหาชื่อรายการ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
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
            {cat === "ทั้งหมด" ? "📋 " : ""}
            {cat}
          </button>
        ))}
      </div>

      {/* Stock List */}
      <div className="px-4 mt-2 space-y-3">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-[#06C755]/10 rounded-full flex items-center justify-center mb-4 animate-pulse-soft">
              <span className="text-3xl">📦</span>
            </div>
            <p className="text-gray-400 font-medium">กำลังโหลดข้อมูล...</p>
            <div className="flex gap-1.5 mt-3">
              <div
                className="w-2 h-2 rounded-full bg-[#06C755] animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-2 h-2 rounded-full bg-[#06C755] animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="w-2 h-2 rounded-full bg-[#06C755] animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
          </div>
        )}

        {error && (
          <div className="card text-center py-10">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-3xl">⚠️</span>
            </div>
            <p className="text-red-500 font-medium">{error}</p>
            <button
              onClick={fetchStocks}
              className="btn-primary mt-4 text-sm py-2.5 px-6"
            >
              🔄 ลองใหม่อีกครั้ง
            </button>
          </div>
        )}

        {!loading && !error && filteredStocks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl">📭</span>
            </div>
            <p className="text-gray-500 font-medium text-lg">ไม่พบรายการ</p>
            {search && (
              <p className="text-gray-400 text-sm mt-1">
                ไม่พบ "{search}" ลองเปลี่ยนคำค้นหา
              </p>
            )}
            {!search && (
              <p className="text-gray-400 text-sm mt-1">
                ยังไม่มีรายการ — เพิ่มรายการแรกเลย!
              </p>
            )}
          </div>
        )}

        {!loading &&
          filteredStocks.map((stock, index) => (
            <div
              key={stock.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <StockCard stock={stock} onUpdate={fetchStocks} />
            </div>
          ))}
      </div>

      {/* Stats Summary */}
      {!loading && stocks.length > 0 && (
        <div className="px-4 mt-4">
          <div className="card p-5 flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="w-10 h-10 bg-[#06C755]/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                <span className="text-lg">📦</span>
              </div>
              <p className="text-2xl font-extrabold text-[#06C755]">
                {stocks.length}
              </p>
              <p className="text-xs text-gray-400 font-medium">รายการทั้งหมด</p>
            </div>
            <div className="w-px h-12 bg-gray-100" />
            <div className="text-center flex-1">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${
                  lowStockCount > 0 ? "bg-red-50" : "bg-gray-50"
                }`}
              >
                <span className="text-lg">⚠️</span>
              </div>
              <p
                className={`text-2xl font-extrabold ${lowStockCount > 0 ? "text-[#FF6B6B]" : "text-gray-400"}`}
              >
                {lowStockCount}
              </p>
              <p className="text-xs text-gray-400 font-medium">ใกล้หมด</p>
            </div>
            <div className="w-px h-12 bg-gray-100" />
            <div className="text-center flex-1">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <span className="text-lg">🏷️</span>
              </div>
              <p className="text-2xl font-extrabold text-blue-500">
                {categories.length - 1}
              </p>
              <p className="text-xs text-gray-400 font-medium">หมวดหมู่</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav current="home" />
    </div>
  );
}
