import { NextResponse } from "next/server";
import { getStockList } from "@/lib/googleSheets";

export async function GET() {
  try {
    const stocks = await getStockList();
    return NextResponse.json({
      stocks,
      total: stocks.length,
    });
  } catch (error: any) {
    console.error("GET /api/stock error:", error);
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล" },
      { status: 500 }
    );
  }
}
