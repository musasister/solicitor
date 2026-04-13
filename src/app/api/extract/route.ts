import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text) {
    return NextResponse.json({ error: "text는 필수입니다." }, { status: 400 });
  }

  const lines = text
    .trim()
    .split("\n")
    .map((l: string) => l.trim())
    .filter(Boolean);

  const candidates = lines
    .map((line: string) => {
      const parts = line.split(",").map((p: string) => p.trim());
      if (parts.length < 3) return null;
      return {
        creditorName: parts[0],
        causeDate: parts[1] || null,
        debtType: parts[2] || "기타",
        principal: parts[3] && /^\d+$/.test(parts[3]) ? parseInt(parts[3]) : 0,
        interest: parts[4] && /^\d+$/.test(parts[4]) ? parseInt(parts[4]) : 0,
        penalty: parts[5] && /^\d+$/.test(parts[5]) ? parseInt(parts[5]) : 0,
      };
    })
    .filter(Boolean);

  return NextResponse.json({
    candidates,
    count: candidates.length,
    message: `${candidates.length}건의 채권 후보가 추출되었습니다.`,
  });
}
