import { NextResponse } from "next/server";
import { getTransactions } from "@/lib/supabase";

export async function GET() {
  try {
    const rows = await getTransactions(50);
    const transactions = rows.map((tx) => ({
      id: tx.id,
      date: new Date(tx.created_at).toLocaleString("th-TH"),
      stockName: tx.stock_name,
      type: tx.type,
      quantity: tx.quantity,
      userId: tx.user_id,
      note: tx.note,
    }));
    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error("GET /api/stock/transactions error:", error);
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
