import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// GET /api/subscriptions - Fetch all subscriptions for the current user
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/subscriptions - Create a new subscription
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const name = body.name?.trim();
  const category = body.category?.trim() || "Subscriptions";
  const amount = body.amount ? Number(body.amount) : 0;
  const renewal_day = body.renewal_day ? Number(body.renewal_day) : 1;

  if (!name) {
    return NextResponse.json({ error: "Subscription name is required" }, { status: 400 });
  }

  if (renewal_day < 1 || renewal_day > 31) {
    return NextResponse.json({ error: "Renewal day must be between 1 and 31" }, { status: 400 });
  }

  // Handle optional explicit creation dates for synchronization/migration
  const created_at = body.created_at || new Date().toISOString();

  const { data, error } = await supabase
    .from("subscriptions")
    .insert([
      {
        user_id: user.id,
        name,
        category,
        amount,
        renewal_day,
        created_at,
        updated_at: new Date().toISOString()
      }
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ subscription: data });
}

// DELETE /api/subscriptions - Delete a subscription
export async function DELETE(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing subscription id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
