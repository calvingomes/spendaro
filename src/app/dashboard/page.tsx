import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Dashboard } from "@/components/dashboard-view/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  
  const [{ data: { user } }, { data: expenses }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("expenses").select("*").order("created_at", { ascending: false }).order("id", { ascending: false })
  ]);

  if (!user) redirect("/sign-in");

  return <Dashboard initialExpenses={expenses ?? []} />;
}
