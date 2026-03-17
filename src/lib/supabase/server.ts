import { createClient as createJsClient } from "@supabase/supabase-js";

export async function createClient() {
  // Dev mode: use anon key directly (RLS policies are set to allow all)
  return createJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
