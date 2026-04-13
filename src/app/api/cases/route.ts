import { NextRequest, NextResponse } from "next/server";
import { createCase, listCases } from "@/lib/db/store";

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.debtorName || !body.debtorBirth || !body.referenceDate) {
    return NextResponse.json(
      { error: "debtorName, debtorBirth, referenceDate는 필수입니다." },
      { status: 400 }
    );
  }
  const c = createCase(body);
  return NextResponse.json(c, { status: 201 });
}

export async function GET() {
  return NextResponse.json(listCases());
}
