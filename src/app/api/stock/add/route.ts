import { NextRequest, NextResponse } from "next/server";
import { addStock } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, quantity, unit, minThreshold, category, userId, wardId } =
      body;
    if (!name || !name.trim())
      return NextResponse.json(
        { error: "กรุณากรอกชื่อรายการ" },
        { status: 400 },
      );
    await addStock({
      wardId: wardId || "",
      name: name.trim(),
      quantity: Math.max(1, parseInt(quantity) || 1),
      unit: unit || "ชิ้น",
      minThreshold: Math.max(0, parseInt(minThreshold) || 0),
      category: category || "อื่นๆ",
      userId: userId || "unknown",
    });
    return NextResponse.json({
      success: true,
      message: `เพิ่ม ${name} จำนวน ${quantity} ${unit} สำเร็จ`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาด" },
      { status: 500 },
    );
  }
}
