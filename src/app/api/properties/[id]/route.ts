import { NextRequest, NextResponse } from "next/server";
import { getProperty, updateProperty, deleteProperty } from "@/lib/db/store";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const p = updateProperty(params.id, body);
  if (!p) return NextResponse.json({ error: "재산을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(p);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!deleteProperty(params.id)) {
    return NextResponse.json({ error: "재산을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ message: "삭제되었습니다." });
}
