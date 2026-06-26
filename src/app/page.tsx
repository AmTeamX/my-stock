"use client";

import { useState, useEffect, useCallback } from "react";
import { StockItem } from "@/types";
import { useWardId } from "./components/useWardId";
import { useLiffUser } from "./components/useLiffUser";
import BottomNav from "./components/BottomNav";
import StockCard from "./components/StockCard";
import { Search, Inbox, AlertTriangle, Package, X } from "lucide-react";

export default function HomePage() {
  const { wardId, wardName } = useWardId();
  const { userName } = useLiffUser();
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ทั้งหมด");
  const [error, setError] = useState("");

  const fetchStocks = useCallback(async () => {
    if (!wardId) return;
    setLoading(true);
    setError("");
    try {
      setStocks(
        (
          await (
            await fetch(`/api/stock?wardId=${encodeURIComponent(wardId)}`)
          ).json()
        ).stocks || [],
      );
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [wardId]);
  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  const categories = [
    "ทั้งหมด",
    ...Array.from(new Set(stocks.map((s) => s.category).filter(Boolean))),
  ];
  const filtered = stocks.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) &&
      (category === "ทั้งหมด" || s.category === category),
  );
  const lowCount = stocks.filter((s) => s.quantity <= s.minThreshold).length;

  return (
    <div className="pb-24">
      <div className="header-app">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              {wardName || "MyStock"}
            </h1>
            <p className="text-sm text-white/75 mt-0.5">เบิกของ</p>
          </div>
          {lowCount > 0 && (
            <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1">
              <AlertTriangle size={12} />
              {lowCount} ใกล้หมด
            </span>
          )}
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-10">
        <div className="relative">
          <input
            className="input-field pl-10 pr-10 bg-white shadow-card-raised border-rule"
            placeholder="ค้นหา..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-muted hover:text-ink-2 focus-visible:outline-2 focus-visible:outline-focus"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`chip whitespace-nowrap ${category === cat ? "chip-active" : "chip-inactive"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="px-4 mt-3 space-y-3">
        {loading && (
          <div className="text-center py-20">
            <Package size={40} className="text-muted/40 mx-auto mb-4" />
            <p className="text-muted">กำลังโหลด...</p>
          </div>
        )}
        {error && (
          <div className="card text-center py-10">
            <p className="text-danger mb-3">{error}</p>
            <button onClick={fetchStocks} className="btn-primary">
              ลองใหม่
            </button>
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20">
            <Inbox size={48} className="text-muted/30 mx-auto mb-4" />
            <p className="text-ink-2 text-lg">
              {search ? `ไม่พบ "${search}"` : "ยังไม่มีรายการ"}
            </p>
          </div>
        )}
        {!loading &&
          filtered.map((stock) => (
            <StockCard key={stock.id} stock={stock} onUpdate={fetchStocks} />
          ))}
      </div>

      <BottomNav current="home" />
    </div>
  );
}
