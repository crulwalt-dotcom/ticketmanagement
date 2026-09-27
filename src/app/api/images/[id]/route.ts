import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const doc = await db.collection("uploads").findOne({ id });

    if (!doc?.data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = Buffer.isBuffer(doc.data)
      ? doc.data
      : Buffer.from(doc.data.buffer || doc.data);

    return new NextResponse(body, {
      headers: {
        "Content-Type": doc.contentType || "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load image" }, { status: 500 });
  }
}
