import { NextResponse } from "next/server";
import { pollStitch } from "@/lib/services/stitch";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const result = await pollStitch(requestId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[stitch/poll] Error:", error);
    return NextResponse.json(
      { status: "failed", error: "Poll failed" },
      { status: 500 }
    );
  }
}
