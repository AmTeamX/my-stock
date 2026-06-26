import { NextRequest, NextResponse } from "next/server";
import {
  uploadImageToStorage,
  updateStockImage,
  getStockList,
} from "@/lib/supabase";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, stockId, wardId } = body;

    if (!image) {
      return NextResponse.json({ error: "กรุณาเลือกรูปภาพ" }, { status: 400 });
    }
    if (!stockId) {
      return NextResponse.json(
        { error: "กรุณาระบุรายการ Stock" },
        { status: 400 },
      );
    }

    // Validate stock exists
    const stocks = await getStockList(wardId || "");
    const stock = stocks.find((s) => s.id === stockId);
    if (!stock) {
      return NextResponse.json(
        { error: "ไม่พบรายการ Stock นี้" },
        { status: 404 },
      );
    }

    const fileName = `${stockId}/${Date.now()}.jpg`;
    const imageUrl = await uploadImageToStorage(image, fileName);
    await updateStockImage(wardId || "", stockId, imageUrl);

    return NextResponse.json({
      success: true,
      imageUrl,
      message: "อัปโหลดรูปภาพสำเร็จ",
    });
  } catch (error: any) {
    console.error("Upload image error:", error);
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาดในการอัปโหลด" },
      { status: 500 },
    );
  }
}
