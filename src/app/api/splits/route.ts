import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SPLIT_CATEGORY_TAG } from "@/utils/expense-utils";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: splits, error: splitsError } = await supabase
    .from("splits")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (splitsError) return NextResponse.json({ error: splitsError.message }, { status: 500 });

  const { data: splitPeers, error: spError } = await supabase
    .from("split_peers")
    .select("*, peers(name)")
    .eq("user_id", user.id);

  if (spError) return NextResponse.json({ error: spError.message }, { status: 500 });

  const splitsWithPeers = (splits || []).map((split) => {
    const peers = (splitPeers || [])
      .filter((sp) => sp.split_id === split.id)
      .map((sp) => ({
        peer_id: sp.peer_id,
        peer_name: (sp.peers as { name: string } | null)?.name ?? "",
        amount_owed: sp.amount_owed,
        amount_repaid: sp.amount_repaid,
      }));
    return { ...split, peer_breakdown: peers };
  });

  return NextResponse.json({ splits: splitsWithPeers });
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    id,
    label,
    category,
    my_share,
    peer_total,
    split_method,
    note,
    date,
    peers,
  } = body;

  if (!label || !category || my_share == null || peer_total == null || !split_method || !peers?.length) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const now = date ? new Date(date).toISOString() : new Date().toISOString();
  const sourceId = id ?? crypto.randomUUID();
  const peerLedgerId = body.peer_ledger_expense_id ?? crypto.randomUUID();
  const splitId = body.split_id ?? crypto.randomUUID();

  const { error: srcErr } = await supabase.from("expenses").insert({
    id: sourceId,
    user_id: user.id,
    label,
    category,
    amount: Number(my_share),
    type: "debit",
    created_at: now,
    updated_at: now,
  });
  if (srcErr) return NextResponse.json({ error: srcErr.message }, { status: 500 });

  const { error: ledgerErr } = await supabase.from("expenses").insert({
    id: peerLedgerId,
    user_id: user.id,
    label: `Split · ${label}`,
    category: SPLIT_CATEGORY_TAG,
    amount: Number(peer_total),
    type: "debit",
    created_at: now,
    updated_at: now,
  });
  if (ledgerErr) {
    await supabase.from("expenses").delete().eq("id", sourceId);
    return NextResponse.json({ error: ledgerErr.message }, { status: 500 });
  }

  const { error: splitErr } = await supabase.from("splits").insert({
    id: splitId,
    user_id: user.id,
    source_expense_id: sourceId,
    peer_ledger_expense_id: peerLedgerId,
    label,
    category,
    my_share: Number(my_share),
    peer_total: Number(peer_total),
    split_method,
    note: note || null,
    created_at: now,
    updated_at: now,
  });
  if (splitErr) {
    await supabase.from("expenses").delete().eq("id", peerLedgerId);
    await supabase.from("expenses").delete().eq("id", sourceId);
    return NextResponse.json({ error: splitErr.message }, { status: 500 });
  }

  const splitPeerRows = (peers as { peer_id: string; amount_owed: number }[]).map((p) => ({
    split_id: splitId,
    user_id: user.id,
    peer_id: p.peer_id,
    amount_owed: Number(p.amount_owed),
    amount_repaid: 0,
    created_at: now,
    updated_at: now,
  }));

  const { error: spErr } = await supabase.from("split_peers").insert(splitPeerRows);
  if (spErr) {
    await supabase.from("splits").delete().eq("id", splitId);
    await supabase.from("expenses").delete().eq("id", peerLedgerId);
    await supabase.from("expenses").delete().eq("id", sourceId);
    return NextResponse.json({ error: spErr.message }, { status: 500 });
  }

  return NextResponse.json({
    split_id: splitId,
    source_expense_id: sourceId,
    peer_ledger_expense_id: peerLedgerId,
  }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const action = searchParams.get("action");
  if (!id || action !== "void") return NextResponse.json({ error: "id and action=void required" }, { status: 400 });

  const { error } = await supabase
    .from("splits")
    .update({ status: "voided", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
