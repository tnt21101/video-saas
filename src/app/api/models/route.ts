import { NextResponse } from "next/server";
import { VIDEO_MODELS } from "@/types/video-models";

export async function GET() {
  // Return client-safe model info (strip buildPayload functions)
  const models = VIDEO_MODELS.map(({ buildPayload, ...rest }) => rest);
  return NextResponse.json(models);
}
