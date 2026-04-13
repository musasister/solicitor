import { NextRequest, NextResponse } from "next/server";
import { getClaim, updateClaim, deleteClaim } from "@/lib/db/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cl = getClaim(params.id);
  if (!cl) return NextResponse.json({ error: "채권을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(cl);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const cl = updateClaim(params.id, body);
  if (!cl) return NextResponse.json({ error: "채권을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json(cl);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!deleteClaim(params.id)) {
    return NextResponse.json({ error: "채권을 찾을 수 없습니다." }, { status: 404 });
  }
  return NextResponse.json({ message: "삭제되었습니다." });
}
