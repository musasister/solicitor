import { NextRequest, NextResponse } from "next/server";
import { getCase, updateCase, deleteCase } from "@/lib/db/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const c = getCase(params.id);
  if (!c) return NextResponse.json({ error: "사건을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(c);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const c = updateCase(params.id, body);
  if (!c) return NextResponse.json({ error: "사건을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(c);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!deleteCase(params.id)) {
    return NextResponse.json({ error: "사건을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ message: "삭제되었습니다." });
}
