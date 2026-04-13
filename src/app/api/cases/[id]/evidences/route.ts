import { NextRequest, NextResponse } from "next/server";
import { getCase, createEvidence, listEvidencesByCase } from "@/lib/db/store";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!getCase(params.id)) {
    return NextResponse.json({ error: "사건을 찾을 수 없습니다." }, { status: 404 });
  }
  const body = await req.json();
  body.caseId = params.id;
  const ev = createEvidence(body);
  return NextResponse.json(ev, { status: 201 });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(listEvidencesByCase(params.id));
}
