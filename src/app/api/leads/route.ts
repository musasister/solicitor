import { NextRequest, NextResponse } from "next/server";
import { createLead, listLeads, getLeadSummary } from "@/lib/db/store";

// CORS 헤더 (DBCart 랜딩페이지에서의 요청 허용)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name || !body.phone) {
    return NextResponse.json(
      { error: "name, phone은 필수입니다." },
      { status: 400, headers: corsHeaders }
    );
  }

  const lead = createLead({
    name: body.name,
    phone: body.phone,
    debtRange: body.debtRange,
    consultType: body.consultType,
    memo: body.memo,
    utmSource: body.utm_source || body.utmSource,
    utmMedium: body.utm_medium || body.utmMedium,
    utmCampaign: body.utm_campaign || body.utmCampaign,
    utmContent: body.utm_content || body.utmContent,
    utmTerm: body.utm_term || body.utmTerm,
    utmId: body.utm_id || body.utmId,
    fbclid: body.fbclid,
  });

  return NextResponse.json(lead, { status: 201, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const summary = searchParams.get("summary");

  if (summary === "true") {
    return NextResponse.json(getLeadSummary());
  }

  const status = searchParams.get("status") ?? undefined;
  const source = searchParams.get("source") ?? undefined;
  return NextResponse.json(listLeads({ status, source }));
}
