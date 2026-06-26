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

  // Deduplicate categories
  const categories = [
    "ทั้งหมด",
    ...Array.from(new Set(stocks.map((s) => s.category).filter(Boolean))),
  ];

  const filteredStocks = stocks.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "ทั้งหมด" || s.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-[#06C755] text-white px-5 pt-12 pb-6 rounded-b-3xl shadow-md">
        <h1 className="text-2xl font-bold mb-1">📦 MyStock</h1>
        <p className="text-sm opacity-90">จัดการ Stock พยาบาล</p>
      </div>

      {/* Search */}
      <div className="px-4 -mt-3 relative z-10">
        <input
          type="text"
          className="input-field shadow-sm"
          placeholder="🔍 ค้นหารายการ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Category Filter */}
      <div className="px-4 mt-3 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`chip whitespace-nowrap transition-colors ${
              category === cat
                ? "bg-[#06C755] text-white"
                : "bg-white text-gray-600 border border-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stock List */}
      <div className="px-4 mt-2 space-y-3">
        {loading && (
          <div className="text-center py-12 text-gray-400">
            <div className="animate-pulse text-4xl mb-2">📦</div>
            <p>กำลังโหลด...</p>
          </div>
        )}

        {error && (
          <div className="card text-center py-8">
            <p className="text-red-500">⚠️ {error}</p>
            <button onClick={fetchStocks} className="btn-primary mt-3 text-sm py-2 px-4">
              ลองใหม่
            </button>
          </div>
        )}

        {!loading && !error && filteredStocks.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-lg">ไม่พบรายการ</p>
            {search && <p className="text-sm mt-1">ลองเปลี่ยนคำค้นหา</p>}
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
          <div className="card flex justify-between items-center">
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-[#06C755]">{stocks.length}</p>
              <p className="text-xs text-gray-500">รายการทั้งหมด</p>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-[#FF6B6B]">
                {stocks.filter((s) => s.quantity <= s.minThreshold).length}
              </p>
              <p className="text-xs text-gray-500">ใกล้หมด</p>
            </div>
            <div className="w-px h-10 bg-gray-200" />
            <div className="text-center flex-1">
              <p className="text-2xl font-bold text-blue-500">
                {categories.length - 1}
              </p>
              <p className="text-xs text-gray-500">หมวดหมู่</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav current="home" />
    </div>
  );
}
