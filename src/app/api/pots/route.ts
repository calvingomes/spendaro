import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// GET /api/pots - Fetch all pots for the current user
export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("pots")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST /api/pots - Create a new pot
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const id = body.id ? String(body.id).trim() : undefined;
  const name = body.name?.trim();
  const goal = body.goal ? Number(body.goal) : 0;
  const color = body.color?.trim() || '#f5a623';

  if (!name) {
    return NextResponse.json({ error: "Pot name is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("pots")
    .insert([
      {
        ...(id && { id }),
        user_id: user.id,
        name: name,
        goal: goal,
        color: color,
      }
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/dashboard");
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, name, goal, color } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing required pot id" }, { status: 400 });
  }

  const updateData: Record<string, string | number> = {
    updated_at: new Date().toISOString()
  };

  if (name?.trim()) {
    updateData.name = name.trim();
  }
  if (goal !== undefined) {
    updateData.goal = Number(goal) || 0;
  }
  if (color?.trim()) {
    updateData.color = color.trim();
  }

  const { data, error } = await supabase
    .from("pots")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/dashboard");
  return NextResponse.json(data);
}

// DELETE /api/pots - Delete a pot
export async function DELETE(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing pot id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("pots")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidatePath("/dashboard");
  return NextResponse.json({ success: true });
}
