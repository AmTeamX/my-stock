import { NextResponse } from "next/server";
import { getTransactions } from "@/lib/googleSheets";

export async function GET() {
  try {
    const transactions = await getTransactions(50);
    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error("GET /api/stock/transactions error:", error);
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาด" },
      { status: 500 }
    );
  }
}
