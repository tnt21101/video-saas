import { createClient as createJsClient } from "@supabase/supabase-js";

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  console.log("[supabase] URL:", url ? `${url.slice(0, 30)}...` : "MISSING");
  console.log("[supabase] Key:", key ? `${key.slice(0, 20)}...` : "MISSING");
  // Dev mode: use anon key directly (RLS policies are set to allow all)
  return createJsClient(url!, key!);
}
