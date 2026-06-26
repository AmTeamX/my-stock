import { NextRequest, NextResponse } from "next/server";
import { uploadImageToDrive } from "@/lib/googleDrive";
import { updateStockImage, getStockList } from "@/lib/googleSheets";

// Increase body size limit for image uploads (max 5MB)
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, stockId } = body;

    if (!image) {
      return NextResponse.json(
        { error: "กรุณาเลือกรูปภาพ" },
        { status: 400 }
      );
    }

    if (!stockId) {
      return NextResponse.json(
        { error: "กรุณาระบุรายการ Stock" },
        { status: 400 }
      );
    }

    // Validate stockId exists
    const stocks = await getStockList();
    const stock = stocks.find((s) => s.id === stockId);
    if (!stock) {
      return NextResponse.json(
        { error: "ไม่พบรายการ Stock นี้" },
        { status: 404 }
      );
    }

    // Upload to Google Drive
    const fileName = `mystock_${stockId}_${Date.now()}.jpg`;
    const imageUrl = await uploadImageToDrive(image, fileName);

    // Update the stock item with the image URL in Google Sheets
    await updateStockImage(stockId, imageUrl);

    return NextResponse.json({
      success: true,
      imageUrl,
      message: "อัปโหลดรูปภาพสำเร็จ",
    });
  } catch (error: any) {
    console.error("Upload image error:", error);
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาดในการอัปโหลด" },
      { status: 500 }
    );
  }
}
