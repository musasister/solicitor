import { NextRequest, NextResponse } from "next/server";
import { getCase, listClaimsByCase, listPropertiesByCase } from "@/lib/db/store";
import { generateCreditorList, creditorListToText } from "@/lib/documents/creditor-list";
import { generateRepaymentPlan } from "@/lib/documents/repayment-plan";

export async function POST(req: NextRequest) {
  const { caseId, documentType, format } = await req.json();

  const cs = getCase(caseId);
  if (!cs) {
    return NextResponse.json({ error: "사건을 찾을 수 없습니다." }, { status: 404 });
  }

  const claims = listClaimsByCase(caseId);
  const properties = listPropertiesByCase(caseId);

  if (documentType === "creditor_list") {
    const doc = generateCreditorList(cs, claims);
    if (format === "text") {
      return NextResponse.json({ content: creditorListToText(doc) });
    }
    return NextResponse.json({ title: "채권자목록", ...doc });
  }

  if (documentType === "repayment_plan") {
    const doc = generateRepaymentPlan(cs, claims, properties);
    return NextResponse.json({ title: "변제계획안", ...doc });
  }

  return NextResponse.json(
    { error: `지원하지 않는 문서 유형: ${documentType}` },
    { status: 400 }
  );
}
