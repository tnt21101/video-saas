import { NextResponse } from "next/server";
import { requireUser } from "@/lib/dal";
import { analyzeImage } from "@/lib/services/claude";
import { analyzeRequestSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    await requireUser();
    const parsed = analyzeRequestSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { imageUrl } = parsed.data;

    // SSRF protection: only allow Supabase Storage URLs
    const allowedPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`;
    if (!imageUrl.startsWith(allowedPrefix)) {
      return NextResponse.json(
        { error: "Image URL must be from Supabase Storage" },
        { status: 400 }
      );
    }

    const analysis = await analyzeImage(imageUrl);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("[analyze] Error:", error);
    const message = error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
