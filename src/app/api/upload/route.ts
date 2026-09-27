import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only images allowed" }, { status: 400 });
    }

    // Cap at ~4MB to stay within serverless/body limits
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be under 4MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const id = uuid();

    const db = await getDb();
    await db.collection("uploads").insertOne({
      id,
      filename: file.name || "screenshot.png",
      contentType: file.type || "image/png",
      data: buffer,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ url: `/api/images/${id}` });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
