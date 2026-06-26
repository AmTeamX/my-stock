import { NextRequest, NextResponse } from "next/server";
import { initializeSheets } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    await initializeSheets();
    return NextResponse.json({
      success: true,
      message: "Supabase initialized",
    });
  } catch (error: any) {
    console.error("Init error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initialize" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to check Supabase connection",
  });
}
