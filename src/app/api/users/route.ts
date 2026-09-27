import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { User } from "@/lib/types";
import { v4 as uuid } from "uuid";

function dbErrorMessage(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.includes("MONGODB_URI")) {
    return "Missing MONGODB_URI. Add it in Vercel → Settings → Environment Variables.";
  }
  if (/ENOTFOUND|ECONNREFUSED|timed out|SSL|authentication failed|IP|whitelist/i.test(msg)) {
    return "Cannot reach MongoDB. Check Atlas Network Access (allow 0.0.0.0/0) and your URI.";
  }
  return "Failed to reach database.";
}

export async function GET() {
  try {
    const db = await getDb();
    const users = await db.collection<User>("users").find({}).toArray();
    return NextResponse.json(users);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: dbErrorMessage(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email } = body;
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Name and email required" }, { status: 400 });
    }

    const colors = ["#0078d4", "#107c10", "#e81123", "#8764b8", "#ca5010", "#038387"];
    const user: User = {
      id: uuid(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      color: colors[Math.floor(Math.random() * colors.length)],
    };

    const db = await getDb();
    const existing = await db.collection<User>("users").findOne({ email: user.email });
    if (existing) {
      return NextResponse.json(existing);
    }

    await db.collection<User>("users").insertOne(user);
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: dbErrorMessage(e) }, { status: 500 });
  }
}
