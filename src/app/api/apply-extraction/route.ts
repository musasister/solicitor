import { NextRequest, NextResponse } from "next/server";
import { getCase, createClaim } from "@/lib/db/store";

export async function POST(req: NextRequest) {
  const { caseId, claims: claimsData } = await req.json();

  if (!getCase(caseId)) {
    return NextResponse.json({ error: "사건을 찾을 수 없습니다." }, { status: 404 });
  }

  const created = claimsData.map((data: Record<string, unknown>) => {
    return createClaim({ ...data, caseId } as Parameters<typeof createClaim>[0]);
  });

  return NextResponse.json({
    created: created.length,
    claims: created,
    message: `${created.length}건의 채권이 저장되었습니다.`,
  });
}
