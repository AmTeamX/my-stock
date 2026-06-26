import { NextRequest, NextResponse } from "next/server";
import { uploadImageToStorage } from "@/lib/supabase";

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();
    if (!image) return NextResponse.json({ error: "กรุณาเลือกรูปภาพ" }, { status: 400 });
    const imageUrl = await uploadImageToStorage(image, `temp/${Date.now()}.jpg`);
    return NextResponse.json({ success: true, imageUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
