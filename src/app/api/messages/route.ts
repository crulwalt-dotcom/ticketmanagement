import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ChatMessage, conversationIdFor, detectMessageType } from "@/lib/types";
import { v4 as uuid } from "uuid";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const withUserId = searchParams.get("withUserId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const db = await getDb();
    const col = db.collection<ChatMessage>("messages");

    if (withUserId) {
      const conversationId = conversationIdFor(userId, withUserId);
      const messages = await col
        .find({ conversationId })
        .sort({ createdAt: 1 })
        .toArray();
      return NextResponse.json(messages);
    }

    // Latest message per conversation involving this user
    const messages = await col
      .find({ $or: [{ fromUserId: userId }, { toUserId: userId }] })
      .sort({ createdAt: -1 })
      .toArray();

    const seen = new Set<string>();
    const previews: ChatMessage[] = [];
    for (const m of messages) {
      if (seen.has(m.conversationId)) continue;
      seen.add(m.conversationId);
      previews.push(m);
    }

    return NextResponse.json(previews);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fromUserId, toUserId, content, type, meta } = body;

    if (!fromUserId || !toUserId || (!content?.trim() && type !== "image")) {
      return NextResponse.json(
        { error: "fromUserId, toUserId and content required" },
        { status: 400 }
      );
    }

    if (fromUserId === toUserId) {
      return NextResponse.json({ error: "Cannot chat with yourself" }, { status: 400 });
    }

    const detected = content ? detectMessageType(content) : { type: "text" as const };
    const message: ChatMessage = {
      id: uuid(),
      conversationId: conversationIdFor(fromUserId, toUserId),
      fromUserId,
      toUserId,
      type: type || detected.type,
      content: (content || "").trim(),
      meta: meta || detected.meta,
      createdAt: new Date().toISOString(),
    };

    const db = await getDb();
    await db.collection<ChatMessage>("messages").insertOne(message);
    return NextResponse.json(message, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
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
    await db.collection("messages").deleteOne({ id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
