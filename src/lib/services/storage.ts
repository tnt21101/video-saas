import { createClient } from "@/lib/supabase/server";

const BUCKET = "images";

export async function uploadImage(
  file: File,
  orgId: string,
  projectId: string
): Promise<string> {
  const supabase = await createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const filePath = `${orgId}/${projectId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

  return publicUrl;
}

export async function uploadImageFromBuffer(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  orgId: string,
  projectId: string
): Promise<string> {
  const supabase = await createClient();
  const ext = fileName.split(".").pop() || "jpg";
  const filePath = `${orgId}/${projectId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, buffer, {
      cacheControl: "3600",
      upsert: false,
      contentType,
    });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

  return publicUrl;
}

export async function deleteImage(filePath: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
  if (error) throw error;
}
