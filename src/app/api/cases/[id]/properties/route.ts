import { NextRequest, NextResponse } from "next/server";
import {
  getCase,
  createProperty,
  listPropertiesByCase,
} from "@/lib/db/store";
import { checkAdjustment } from "@/lib/engine/adjustment";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cs = getCase(params.id);
  if (!cs) {
    return NextResponse.json({ error: "사건을 찾을 수 없습니다." }, { status: 404 });
  }

  const body = await req.json();
  body.caseId = params.id;

  // 보정재산 통제
  if (body.isAdjustment) {
    const existing = listPropertiesByCase(params.id);
    const explicitValue = existing
      .filter((p) => !p.isAdjustment)
      .reduce((s, p) => s + p.liquidationValue, 0);
    const currentAdj = existing
      .filter((p) => p.isAdjustment)
      .reduce((s, p) => s + p.liquidationValue, 0);
    const newTotalAdj = currentAdj + (body.liquidationValue ?? 0);

    const result = checkAdjustment(
      cs.monthlyRepayment,
      cs.repaymentMonths,
      explicitValue,
      newTotalAdj
    );

    if (!result.allowed) {
      return NextResponse.json(
        {
          errorCode: "R-ADJ-001",
          message: result.message,
          adjustmentMax: result.adjustmentMax,
          excess: result.excess,
        },
        { status: 422 }
      );
    }
  }

  const p = createProperty(body);
  return NextResponse.json(p, { status: 201 });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(listPropertiesByCase(params.id));
}
