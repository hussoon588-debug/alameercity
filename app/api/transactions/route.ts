import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, users } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(transactions).orderBy(transactions.id);
  const usersRows = await db.select().from(users);
  const balance = usersRows[0]?.balance ?? 0;
  return NextResponse.json({ ok: true, data: rows.slice().reverse(), balance });
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const kind = b.kind as string; // deposit | withdraw
    const amount = Math.abs(Number(b.amount ?? 0));
    if (!amount || amount <= 0) return NextResponse.json({ ok: false, error: "أدخل مبلغاً صحيحاً" }, { status: 400 });
    const usersRows = await db.select().from(users);
    const u = usersRows[0];
    if (!u) return NextResponse.json({ ok: false }, { status: 404 });
    const signed = kind === "withdraw" ? -amount : amount;
    if (kind === "withdraw" && (u.balance ?? 0) < amount) {
      return NextResponse.json({ ok: false, error: "الرصيد غير كافٍ" }, { status: 400 });
    }
    await db.insert(transactions).values({
      type: kind === "withdraw" ? "withdraw" : "deposit",
      amount: signed,
      description: b.description ?? (kind === "withdraw" ? "سحب من المحفظة" : "شحن المحفظة"),
      status: "completed",
    });
    const { eq } = await import("drizzle-orm");
    await db.update(users).set({ balance: (u.balance ?? 0) + signed }).where(eq(users.id, u.id));
    return NextResponse.json({ ok: true, balance: (u.balance ?? 0) + signed });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "failed" }, { status: 500 });
  }
}
