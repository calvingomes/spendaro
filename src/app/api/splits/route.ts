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
        status: sp.status ?? "open",
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
    direction = "they_owe_me",
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
  const sourceAmount = direction === "i_owe_them" ? 0 : Number(my_share);

  const { error: srcErr } = await supabase.from("expenses").insert({
    id: sourceId,
    user_id: user.id,
    label,
    category,
    amount: sourceAmount,
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
    my_share: sourceAmount,
    peer_total: Number(peer_total),
    direction,
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
  if (!id || !["void", "void-peer", "edit"].includes(action ?? "")) return NextResponse.json({ error: "id and a supported action are required" }, { status: 400 });

  if (action === "edit") {
    const body = await request.json();
    const { label, category, my_share, peer_total, split_method, direction = "they_owe_me", date, peers } = body;
    if (!label || !category || my_share == null || peer_total == null || !split_method || !Array.isArray(peers) || peers.length === 0) {
      return NextResponse.json({ error: "Missing required split fields" }, { status: 400 });
    }

    const { data: split } = await supabase.from("splits").select("*").eq("id", id).eq("user_id", user.id).single();
    if (!split) return NextResponse.json({ error: "Split not found" }, { status: 404 });
    if (split.status !== "open") return NextResponse.json({ error: "Only open splits can be edited" }, { status: 409 });
    const { data: existingRows, error: rowsError } = await supabase
      .from("split_peers")
      .select("id, peer_id, amount_owed, amount_repaid, status")
      .eq("split_id", id)
      .eq("user_id", user.id);
    if (rowsError) return NextResponse.json({ error: rowsError.message }, { status: 500 });
    const sharesLocked = (existingRows ?? []).some((row) => Number(row.amount_repaid) > 0 || row.status === "voided");
    const normalizedPeers = peers as { peer_id: string; amount_owed: number }[];
    if (sharesLocked) {
      const sameParticipants = normalizedPeers.length === (existingRows ?? []).length
        && (existingRows ?? []).every((row) => normalizedPeers.some((peer) => peer.peer_id === row.peer_id));
      const sameShares = sameParticipants && (existingRows ?? []).every((row) => {
        const peer = normalizedPeers.find((entry) => entry.peer_id === row.peer_id);
        return peer != null && Math.round(Number(peer.amount_owed) * 100) === Math.round(Number(row.amount_owed) * 100);
      });
      if (direction !== split.direction || split_method !== split.split_method || !sameShares) {
        return NextResponse.json({ error: "Participant shares cannot be changed after a payment or void" }, { status: 409 });
      }
    }
    const { data: ownedPeers, error: peersError } = await supabase.from("peers").select("id").eq("user_id", user.id).in("id", (peers as { peer_id: string }[]).map((peer) => peer.peer_id));
    if (peersError) return NextResponse.json({ error: peersError.message }, { status: 500 });
    if ((ownedPeers ?? []).length !== new Set((peers as { peer_id: string }[]).map((peer) => peer.peer_id)).size) {
      return NextResponse.json({ error: "One or more participants could not be found" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const createdAt = date ? new Date(date).toISOString() : split.created_at;
    const sourceAmount = direction === "i_owe_them" ? 0 : Number(my_share);
    const peerTotalAmount = direction === "i_owe_them" ? 0 : Number(peer_total);
    const { error: sourceError } = await supabase.from("expenses").update({
      label,
      category,
      amount: sourceAmount,
      created_at: createdAt,
      updated_at: now,
    }).eq("id", split.source_expense_id).eq("user_id", user.id);
    if (sourceError) return NextResponse.json({ error: sourceError.message }, { status: 500 });

    const { error: ledgerError } = await supabase.from("expenses").update({
      label: `Split · ${label}`,
      amount: peerTotalAmount,
      created_at: createdAt,
      updated_at: now,
    }).eq("id", split.peer_ledger_expense_id).eq("user_id", user.id);
    if (ledgerError) return NextResponse.json({ error: ledgerError.message }, { status: 500 });

    const { error: updateError } = await supabase.from("splits").update({
      label,
      category,
      my_share: sourceAmount,
      peer_total: peerTotalAmount,
      split_method,
      direction,
      created_at: createdAt,
      updated_at: now,
    }).eq("id", id).eq("user_id", user.id);
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    if (sharesLocked) return NextResponse.json({ success: true });

    const nextPeerIds = new Set(normalizedPeers.map((peer) => peer.peer_id));
    for (const oldRow of existingRows ?? []) {
      if (!nextPeerIds.has(oldRow.peer_id)) {
        const { error } = await supabase.from("split_peers").update({ amount_owed: 0, updated_at: now }).eq("id", oldRow.id).eq("user_id", user.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }
    for (const peer of normalizedPeers) {
      const oldRow = (existingRows ?? []).find((row) => row.peer_id === peer.peer_id);
      const rowPayload = { amount_owed: Number(peer.amount_owed), updated_at: now };
      const { error } = oldRow
        ? await supabase.from("split_peers").update(rowPayload).eq("id", oldRow.id).eq("user_id", user.id)
        : await supabase.from("split_peers").insert({ split_id: id, user_id: user.id, peer_id: peer.peer_id, ...rowPayload, amount_repaid: 0 });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  }

  if (action === "void-peer") {
    const peerId = searchParams.get("peer_id");
    if (!peerId) return NextResponse.json({ error: "peer_id is required" }, { status: 400 });
    const { error } = await supabase
      .from("split_peers")
      .update({ status: "voided", updated_at: new Date().toISOString() })
      .eq("split_id", id)
      .eq("peer_id", peerId)
      .eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase
    .from("splits")
    .update({ status: "voided", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const { data: split } = await supabase.from("splits").select("id, source_expense_id, peer_ledger_expense_id, status").eq("id", id).eq("user_id", user.id).single();
  if (!split) return NextResponse.json({ error: "Split not found" }, { status: 404 });
  if (split.status !== "open") return NextResponse.json({ error: "Only open splits can be deleted" }, { status: 409 });
  const { error: deleteError } = await supabase.from("splits").delete().eq("id", id).eq("user_id", user.id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  const { error: expensesError } = await supabase.from("expenses").delete().in("id", [split.source_expense_id, split.peer_ledger_expense_id]).eq("user_id", user.id);
  if (expensesError) return NextResponse.json({ error: expensesError.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
