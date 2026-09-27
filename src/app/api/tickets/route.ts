import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Ticket } from "@/lib/types";
import { v4 as uuid } from "uuid";

export async function GET() {
  try {
    const db = await getDb();
    const tickets = await db
      .collection<Ticket>("tickets")
      .find({})
      .sort({ order: 1, createdAt: -1 })
      .toArray();
    return NextResponse.json(tickets);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, type, priority, createdBy, assignedTo, images } = body;

    if (!title?.trim() || !createdBy) {
      return NextResponse.json({ error: "Title and createdBy required" }, { status: 400 });
    }

    const db = await getDb();
    const count = await db.collection("tickets").countDocuments({ status: "New" });
    const now = new Date().toISOString();

    const ticket: Ticket = {
      id: uuid(),
      title: title.trim(),
      description: description?.trim() || "",
      type: type || "Task",
      status: "New",
      priority: priority || "Medium",
      createdBy,
      assignedTo: assignedTo || null,
      images: images || [],
      order: count,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection<Ticket>("tickets").insertOne(ticket);
    return NextResponse.json(ticket, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const allowed = [
      "title",
      "description",
      "type",
      "status",
      "priority",
      "assignedTo",
      "images",
      "order",
    ] as const;

    const set: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    for (const key of allowed) {
      if (key in updates) set[key] = updates[key];
    }

    const db = await getDb();
    const result = await db
      .collection<Ticket>("tickets")
      .findOneAndUpdate({ id }, { $set: set }, { returnDocument: "after" });

    if (!result) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
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
    await db.collection("tickets").deleteOne({ id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
  }
}
