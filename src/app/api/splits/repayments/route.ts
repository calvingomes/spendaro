import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SPLIT_CATEGORY_TAG } from "@/utils/expense-utils";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { peer_id, amount, date } = body;
  if (!peer_id || amount == null) return NextResponse.json({ error: "peer_id and amount required" }, { status: 400 });

  const repaymentAmount = Number(amount);
  if (repaymentAmount <= 0) return NextResponse.json({ error: "amount must be positive" }, { status: 400 });

  const { data: peer } = await supabase.from("peers").select("name").eq("id", peer_id).eq("user_id", user.id).single();
  if (!peer) return NextResponse.json({ error: "Peer not found" }, { status: 404 });

  const { data: openRows, error: spErr } = await supabase
    .from("split_peers")
    .select("id, split_id, amount_owed, amount_repaid, splits(created_at, status)")
    .eq("peer_id", peer_id)
    .eq("user_id", user.id);

  if (spErr) return NextResponse.json({ error: spErr.message }, { status: 500 });

  const allocatable = (openRows || [])
    .filter((row) => {
      const split = row.splits as unknown as { created_at: string; status: string } | null;
      return split?.status === "open" && row.amount_owed > row.amount_repaid;
    })
    .sort((a, b) => {
      const sa = a.splits as unknown as { created_at: string } | null;
      const sb = b.splits as unknown as { created_at: string } | null;
      return new Date(sa?.created_at ?? 0).getTime() - new Date(sb?.created_at ?? 0).getTime();
    });

  const totalOutstanding = allocatable.reduce((s, r) => s + (r.amount_owed - r.amount_repaid), 0);
  if (repaymentAmount > totalOutstanding + 0.001) {
    return NextResponse.json({ error: `Repayment amount exceeds outstanding balance of ${totalOutstanding.toFixed(2)}` }, { status: 400 });
  }

  const now = date ? new Date(date).toISOString() : new Date().toISOString();
  const createdExpenses = [];
  let remaining = repaymentAmount;

  for (const row of allocatable) {
    if (remaining <= 0) break;
    const rowRemaining = row.amount_owed - row.amount_repaid;
    const allocated = Math.min(remaining, rowRemaining);

    const expenseId = crypto.randomUUID();
    const { error: expErr } = await supabase.from("expenses").insert({
      id: expenseId,
      user_id: user.id,
      label: `Repayment · ${peer.name}`,
      category: SPLIT_CATEGORY_TAG,
      amount: allocated,
      type: "credit",
      created_at: now,
      updated_at: now,
    });
    if (expErr) return NextResponse.json({ error: expErr.message }, { status: 500 });

    const { error: updateErr } = await supabase
      .from("split_peers")
      .update({ amount_repaid: row.amount_repaid + allocated, updated_at: now })
      .eq("id", row.id);
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    createdExpenses.push({
      id: expenseId,
      label: `Repayment · ${peer.name}`,
      category: SPLIT_CATEGORY_TAG,
      amount: allocated,
      type: "credit",
      created_at: now,
      updated_at: now,
      split_peer_id: row.id,
    });

    remaining -= allocated;
  }

  return NextResponse.json({ expenses: createdExpenses }, { status: 201 });
}
