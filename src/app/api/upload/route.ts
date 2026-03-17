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
