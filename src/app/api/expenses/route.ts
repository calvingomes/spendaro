import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ expenses: data });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const id = body.id ? String(body.id).trim() : undefined;
  const label = String(body.label ?? "").trim();
  const category = String(body.category ?? "").trim();
  const amount = Number(body.amount);
  const type = (body.type === "credit" ? "credit" : "debit") as "credit" | "debit";
  const createdAt = body.created_at ? new Date(body.created_at).toISOString() : new Date().toISOString();

  if (!label || !category || Number.isNaN(amount)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      ...(id && { id }),
      user_id: user.id,
      label,
      category,
      amount,
      type,
      created_at: createdAt
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/dashboard");
  return NextResponse.json({ expense: data }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const id = String(body.id ?? "").trim();
  const label = String(body.label ?? "").trim();
  const category = String(body.category ?? "").trim();
  const amount = Number(body.amount);
  const type = (body.type === "credit" ? "credit" : "debit") as "credit" | "debit";
  const createdAt = body.created_at ? new Date(body.created_at).toISOString() : new Date().toISOString();

  if (!id || !label || !category || Number.isNaN(amount)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("expenses")
    .update({
      label,
      category,
      amount,
      type,
      created_at: createdAt
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/dashboard");
  return NextResponse.json({ expense: data });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const id = String(body.id ?? "").trim();

  if (!id) {
    return NextResponse.json({ error: "Missing expense id" }, { status: 400 });
  }

  const { error } = await supabase.from("expenses").delete().eq("id", id).eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/dashboard");
  return NextResponse.json({ ok: true });
}
