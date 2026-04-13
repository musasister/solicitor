import { NextRequest, NextResponse } from "next/server";
import { getCase, listClaimsByCase, listPropertiesByCase } from "@/lib/db/store";
import { validateCase } from "@/lib/engine/validation";

export async function POST(req: NextRequest) {
  const { caseId } = await req.json();
  if (!caseId) {
    return NextResponse.json({ error: "caseId는 필수입니다." }, { status: 400 });
  }

  const cs = getCase(caseId);
  if (!cs) {
    return NextResponse.json({ error: "사건을 찾을 수 없습니다." }, { status: 404 });
  }

  const claims = listClaimsByCase(caseId);
  const properties = listPropertiesByCase(caseId);

  const result = validateCase(cs, claims, properties);
  return NextResponse.json(result);
}
