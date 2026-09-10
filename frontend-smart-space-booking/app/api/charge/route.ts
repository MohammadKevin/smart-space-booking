import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Direct client-side charge route is disabled for security reasons. Transactions must be initiated via the secure backend API.",
    },
    { status: 403 }
  );
}
