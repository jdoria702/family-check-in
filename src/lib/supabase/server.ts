import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/*
  Server client needs access to the cookies for the current request
  Contains what the browser's incoming cookies are
  Writes what outgoing cookies should be written
*/

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            })
          } catch {
            /*
              catch runs in Server Component where cookies cannot be modified
              route handlers and server actions can write them
            */
          }
        }
      }
    }
  )
}