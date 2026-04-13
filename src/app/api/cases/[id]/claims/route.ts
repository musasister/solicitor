import { NextRequest, NextResponse } from "next/server";
import { getCase, createClaim, listClaimsByCase } from "@/lib/db/store";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!getCase(params.id)) {
    return NextResponse.json({ error: "사건을 찾을 수 없습니다." }, { status: 404 });
  }
  const body = await req.json();
  body.caseId = params.id;
  if (!body.creditorName || !body.causeDate || !body.debtType || body.principal === undefined) {
    return NextResponse.json(
      { error: "creditorName, causeDate, debtType, principal은 필수입니다." },
      { status: 400 }
    );
  }
  const cl = createClaim(body);
  return NextResponse.json(cl, { status: 201 });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(listClaimsByCase(params.id));
}
