import { createClient } from "@supabase/supabase-js";

/*
  Creates object that can communicate with:
    - Supabase Auth
    - Supabase database APIs
    - Supabase storage and other services

  Every request gets its own client because every request has different cookies
  */


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

if (!supabasePublishableKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable");
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
)