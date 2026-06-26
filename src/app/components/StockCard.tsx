"use client";

import { useState, useRef } from "react";
import { StockItem } from "@/types";

interface StockCardProps {
  stock: StockItem;
  onUpdate: () => void;
}

export default function StockCard({ stock, onUpdate }: StockCardProps) {
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawQty, setWithdrawQty] = useState(1);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLow = stock.quantity <= stock.minThreshold;
  const isWarning = !isLow && stock.quantity < stock.minThreshold * 3;
  const stockLevel = Math.min(
    100,
    (stock.quantity / (stock.minThreshold * 5 || 1)) * 100,
  );

  const handleWithdraw = async () => {
    if (withdrawQty <= 0 || withdrawQty > stock.quantity) return;
    setWithdrawing(true);
    setMessage("");

    try {
      const res = await fetch("/api/stock/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockId: stock.id,
          quantity: withdrawQty,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เบิกไม่สำเร็จ");
      }

      setMessage(`✅ เบิก ${stock.name} ${withdrawQty} ${stock.unit} สำเร็จ`);

      if (data.lowStock) {
        setMessage(
          (prev) =>
            prev +
            `\n⚠️ ${stock.name} เหลือน้อยกว่า ${stock.minThreshold} ${stock.unit} แล้ว!`,
        );
      }

      setShowWithdraw(false);
      setWithdrawQty(1);
      onUpdate();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setWithdrawing(false);
    }
  };

  const handleQuickWithdraw = async (qty: number) => {
    if (qty > stock.quantity) return;
    setWithdrawing(true);
    setMessage("");

    try {
      const res = await fetch("/api/stock/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockId: stock.id,
          quantity: qty,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เบิกไม่สำเร็จ");

      if (data.lowStock) {
        setMessage(
          `⚠️ ${stock.name} ใกล้หมดแล้ว! เหลือ ${data.remaining} ${stock.unit}`,
        );
      }

      onUpdate();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setWithdrawing(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setMessage("❌ รูปภาพต้องมีขนาดไม่เกิน 3MB");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/stock/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64,
          stockId: stock.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "อัปโหลดไม่สำเร็จ");

      setMessage("✅ อัปโหลดรูปภาพสำเร็จ");
      onUpdate();
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const progressColor = isLow
    ? "from-[#FF6B6B] to-[#E55555]"
    : isWarning
      ? "from-amber-400 to-amber-500"
      : "from-[#06C755] to-[#05A84A]";

  const progressBgColor = isLow
    ? "bg-red-100"
    : isWarning
      ? "bg-amber-100"
      : "bg-gray-100";

  return (
    <div className={`card-hover ${isLow ? "ring-1 ring-red-200" : ""}`}>
      {/* Image + Title row */}
      <div className="flex gap-3 mb-3">
        {/* Image area */}
        <div
          className="relative w-[4.5rem] h-[4.5rem] rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0 cursor-pointer group shadow-sm"
          onClick={() => fileInputRef.current?.click()}
        >
          {stock.imageUrl ? (
            <>
              <img
                src={stock.imageUrl}
                alt={stock.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (
                    e.target as HTMLImageElement
                  ).nextElementSibling?.classList.remove("hidden");
                }}
              />
              <div className="hidden absolute inset-0 bg-gray-100 flex items-center justify-center text-2xl">
                📦
              </div>
            </>
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center text-2xl ${
                isLow ? "bg-red-50" : "bg-gray-50"
              }`}
            >
              📦
            </div>
          )}
          {/* Upload overlay */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-2xl">
            {uploading ? (
              <span className="text-white text-sm font-medium animate-pulse">
                ⏳
              </span>
            ) : (
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-white text-lg">📷</span>
                <span className="text-white text-[10px] font-medium">
                  เปลี่ยนรูป
                </span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="font-semibold text-gray-800 truncate text-[15px] leading-tight">
              {stock.name}
            </h3>
            {isLow && (
              <span className="chip bg-red-50 text-red-600 text-[10px] py-1 px-2 flex-shrink-0 font-semibold">
                ⚠️ ใกล้หมด
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{stock.category}</p>
          <div className="flex items-baseline gap-1 mt-2">
            <p
              className={`text-[1.75rem] font-extrabold leading-none tracking-tight ${
                isLow ? "text-[#FF6B6B]" : "text-[#06C755]"
              }`}
            >
              {stock.quantity}
            </p>
            <p className="text-xs text-gray-400 font-medium">{stock.unit}</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className={`w-full ${progressBgColor} rounded-full h-2.5 mb-3 overflow-hidden`}
      >
        <div
          className={`h-2.5 rounded-full bg-gradient-to-r ${progressColor} transition-all duration-500 ease-out`}
          style={{ width: `${stockLevel}%` }}
        />
      </div>

      {/* Threshold info */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-[11px] text-gray-400">
          🔻 แจ้งเตือนเมื่อเหลือ &lt;{" "}
          <span className="font-semibold text-gray-500">
            {stock.minThreshold} {stock.unit}
          </span>
        </span>
      </div>

      {/* Action buttons */}
      {!showWithdraw ? (
        <div className="flex gap-2">
          <button
            onClick={() => handleQuickWithdraw(1)}
            disabled={withdrawing || stock.quantity < 1}
            className="flex-1 py-2.5 bg-gradient-to-br from-[#06C755] to-[#05A84A] text-white rounded-xl text-sm font-semibold
                       active:scale-[0.97] transition-all duration-150 disabled:opacity-40 disabled:active:scale-100"
          >
            -1
          </button>
          <button
            onClick={() => handleQuickWithdraw(5)}
            disabled={withdrawing || stock.quantity < 5}
            className="flex-1 py-2.5 bg-gradient-to-br from-[#06C755] to-[#05A84A] text-white rounded-xl text-sm font-semibold
                       active:scale-[0.97] transition-all duration-150 disabled:opacity-40 disabled:active:scale-100"
          >
            -5
          </button>
          <button
            onClick={() => setShowWithdraw(true)}
            disabled={withdrawing || stock.quantity < 1}
            className="flex-1 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold
                       active:bg-gray-200 active:scale-[0.97] transition-all duration-150 disabled:opacity-40"
          >
            ระบุจำนวน
          </button>
        </div>
      ) : (
        <div className="space-y-2.5 p-3 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-2">
            <input
              type="number"
              className="input-field flex-1 text-center text-lg font-bold bg-white"
              value={withdrawQty}
              min={1}
              max={stock.quantity}
              onChange={(e) =>
                setWithdrawQty(
                  Math.min(parseInt(e.target.value) || 1, stock.quantity),
                )
              }
              autoFocus
            />
            <span className="text-sm text-gray-500 font-medium">
              {stock.unit}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleWithdraw}
              disabled={
                withdrawing || withdrawQty <= 0 || withdrawQty > stock.quantity
              }
              className="flex-1 py-2.5 bg-gradient-to-br from-[#06C755] to-[#05A84A] text-white rounded-xl text-sm font-semibold
                         active:scale-[0.97] transition-all duration-150 disabled:opacity-40"
            >
              {withdrawing ? "⏳ กำลังดำเนินการ..." : "✅ ยืนยันเบิก"}
            </button>
            <button
              onClick={() => {
                setShowWithdraw(false);
                setWithdrawQty(1);
                setMessage("");
              }}
              className="flex-1 py-2.5 bg-white text-gray-600 rounded-xl text-sm font-semibold border border-gray-200
                         active:bg-gray-50 active:scale-[0.97] transition-all duration-150"
            >
              ยกเลิก
            </button>
          </div>
          {/* Quick quantity buttons */}
          <div className="flex gap-1.5">
            {[1, 2, 5, 10].map((qty) => (
              <button
                key={qty}
                type="button"
                disabled={qty > stock.quantity}
                onClick={() => setWithdrawQty(qty)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${
                    withdrawQty === qty
                      ? "bg-[#06C755] text-white"
                      : "bg-white text-gray-500 border border-gray-200 hover:border-[#06C755]/30"
                  } disabled:opacity-30`}
              >
                {qty}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          className={`mt-3 p-3 rounded-xl text-xs font-medium whitespace-pre-line ${
            message.startsWith("✅")
              ? "bg-green-50 text-green-700 border border-green-100"
              : message.startsWith("⚠️")
                ? "bg-yellow-50 text-yellow-700 border border-yellow-100"
                : "bg-red-50 text-red-700 border border-red-100"
          }`}
        >
          {message}
        </div>
      )}

      {/* Low stock warning */}
      {isLow && (
        <div className="mt-3 p-3 bg-red-50 rounded-xl text-xs text-red-600 flex items-center gap-2 border border-red-100">
          <span className="text-base">📢</span>
          <span className="font-medium">แจ้งเตือนไปยังผู้เกี่ยวข้องแล้ว</span>
        </div>
      )}
    </div>
  );
}
