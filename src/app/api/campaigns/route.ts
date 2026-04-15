import { NextRequest, NextResponse } from "next/server";
import { createCampaign, listCampaigns } from "@/lib/db/store";

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name || !body.startDate || !body.landingUrl) {
    return NextResponse.json(
      { error: "name, startDate, landingUrl은 필수입니다." },
      { status: 400 }
    );
  }
  const campaign = createCampaign(body);
  return NextResponse.json(campaign, { status: 201 });
}

export async function GET() {
  return NextResponse.json(listCampaigns());
}
