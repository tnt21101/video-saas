import { NextResponse } from "next/server";
import { requireUser } from "@/lib/dal";
import { uploadImageFromBuffer } from "@/lib/services/storage";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const projectId = formData.get("projectId") as string | null;

    if (!file || !projectId) {
      return NextResponse.json(
        { error: "Missing file or projectId" },
        { status: 400 }
      );
    }

    // Validate file type
    const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
    const ALLOWED_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
    const ext = (file.name.split(".").pop() ?? "").toLowerCase();

    if (!ALLOWED_TYPES.has(file.type) || !ALLOWED_EXTS.has(ext)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const publicUrl = await uploadImageFromBuffer(
      buffer,
      file.name,
      file.type,
      user.organization_id,
      projectId
    );

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("[upload] Error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
