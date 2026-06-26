import { NextRequest, NextResponse } from "next/server";
import { getStockList } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const wardId = request.nextUrl.searchParams.get("wardId") || "";
    const stocks = await getStockList(wardId);
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
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
