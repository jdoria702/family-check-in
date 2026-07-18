import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/sign-in");
  }

  return (
    <main>
      <h1>Protected Dashboard</h1>
      <p>You are signed in as {user.email}</p>
      <p>User ID: {user.id}</p>
    </main>
  );
}