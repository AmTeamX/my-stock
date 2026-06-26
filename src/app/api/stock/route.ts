import { NextResponse } from "next/server";
import { getStockList } from "@/lib/supabase";

export async function GET() {
  try {
    const stocks = await getStockList();
    // Map supabase column names to frontend types
    const mapped = stocks.map((s) => ({
      id: s.id,
      name: s.name,
      quantity: s.quantity,
      unit: s.unit,
      minThreshold: s.min_threshold,
      category: s.category,
      updatedAt: s.updated_at,
      imageUrl: s.image_url,
    }));
    return NextResponse.json({ stocks: mapped, total: mapped.length });
  } catch (error: any) {
    console.error("GET /api/stock error:", error);
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล" },
      { status: 500 },
    );
  }
}
