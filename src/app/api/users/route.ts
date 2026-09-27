import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { User } from "@/lib/types";
import { v4 as uuid } from "uuid";

const COLORS = ["#0078d4", "#107c10", "#e81123", "#8764b8", "#ca5010", "#038387", "#004e8c", "#5c2d91"];

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
    const { name, email, color } = body;
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Name and email required" }, { status: 400 });
    }

    const user: User = {
      id: uuid(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      color: color || COLORS[Math.floor(Math.random() * COLORS.length)],
    };

    const db = await getDb();
    const existing = await db.collection<User>("users").findOne({ email: user.email });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists", user: existing },
        { status: 409 }
      );
    }

    await db.collection<User>("users").insertOne(user);
    return NextResponse.json(user, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: dbErrorMessage(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, email, color } = body;
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const set: Record<string, string> = {};
    if (typeof name === "string" && name.trim()) set.name = name.trim();
    if (typeof email === "string" && email.trim()) set.email = email.trim().toLowerCase();
    if (typeof color === "string" && color.trim()) set.color = color.trim();

    if (!Object.keys(set).length) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const db = await getDb();

    if (set.email) {
      const clash = await db.collection<User>("users").findOne({
        email: set.email,
        id: { $ne: id },
      });
      if (clash) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
    }

    const result = await db
      .collection<User>("users")
      .findOneAndUpdate({ id }, { $set: set }, { returnDocument: "after" });

    if (!result) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: dbErrorMessage(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const db = await getDb();
    const result = await db.collection("users").deleteOne({ id });
    if (!result.deletedCount) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Unassign tickets that pointed at this user
    await db.collection("tickets").updateMany(
      { assignedTo: id },
      { $set: { assignedTo: null, updatedAt: new Date().toISOString() } }
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: dbErrorMessage(e) }, { status: 500 });
  }
}
