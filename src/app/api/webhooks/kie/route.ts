import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createHmac, timingSafeEqual } from "crypto";

// Webhook handler for Kie.ai callbacks — uses service role for direct DB access
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    // Optional HMAC signature verification (enabled when KIE_WEBHOOK_SECRET is set)
    const webhookSecret = process.env.KIE_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get("x-kie-signature") ?? "";
      const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
      if (!signature || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        console.error("[webhook/kie] Invalid signature");
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = JSON.parse(rawBody);
    console.log("[webhook/kie] Received:", { taskId: body.taskId || body.data?.taskId, status: body.status || body.data?.status });

    const taskId = body.taskId || body.data?.taskId || body.task_id;
    const status = body.status || body.data?.status;
    const videoUrl =
      body.output?.video_url ||
      body.output?.url ||
      body.data?.output?.video_url ||
      body.video_url ||
      body.url;

    if (!taskId) {
      console.error("[webhook/kie] No taskId in payload");
      return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
    }

    // Use anon key since we may not have service role key yet
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: () => {},
        },
      }
    );

    const { data: scene } = await supabase
      .from("video_scenes")
      .select("id")
      .eq("kie_task_id", taskId)
      .single();

    if (!scene) {
      console.error(`[webhook/kie] No scene found for taskId: ${taskId}`);
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    const isComplete = status === "completed" || status === "SUCCESS";
    const isFailed = status === "failed" || status === "FAILED";

    if (isComplete && videoUrl) {
      await supabase
        .from("video_scenes")
        .update({ status: "complete", clip_url: videoUrl })
        .eq("id", scene.id);
    } else if (isFailed) {
      await supabase
        .from("video_scenes")
        .update({
          status: "failed",
          error_message: body.error || body.message || "Generation failed",
        })
        .eq("id", scene.id);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[webhook/kie] Error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
