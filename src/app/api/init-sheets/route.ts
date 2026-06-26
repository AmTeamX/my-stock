import { NextRequest, NextResponse } from "next/server";
import { initializeSheets } from "@/lib/googleSheets";

/**
 * Initialize Google Sheets - creates the required sheets and headers
 */
export async function POST(request: NextRequest) {
  try {
    await initializeSheets();
    return NextResponse.json({
      success: true,
      message: "Google Sheets initialized successfully",
    });
  } catch (error: any) {
    console.error("Init sheets error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initialize sheets" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to initialize sheets",
  });
}
