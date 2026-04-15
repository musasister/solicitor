"use client";

import { useState, useEffect, useCallback } from "react";
import type { AdCampaign } from "@/lib/db/types";

const PLATFORM_LABELS: Record<string, { label: string; color: string }> = {
  threads: { label: "Threads", color: "bg-purple-100 text-purple-700" },
  instagram: { label: "Instagram", color: "bg-pink-100 text-pink-700" },
  facebook: { label: "Facebook", color: "bg-blue-100 text-blue-700" },
};

export default function CampaignManager() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [showForm, setShowForm] = useState(false);

  const loadCampaigns = useCallback(async () => {
    const res = await fetch("/api/campaigns");
    if (res.ok) setCampaigns(await res.json());
  }, []);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const body = {
      name: data.get("name"),
      platform: data.get("platform"),
      metaCampaignId: data.get("metaCampaignId") || null,
      budget: Number(data.get("budget")) || 0,
      startDate: data.get("startDate"),
      endDate: data.get("endDate") || null,
      landingUrl: data.get("landingUrl"),
      utmSource: data.get("platform") === "threads" ? "th" : data.get("platform") === "instagram" ? "ig" : "fb",
      utmMedium: "paid",
      utmCampaign: data.get("name"),
    };

    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setShowForm(false);
      loadCampaigns();
    }
  }

  async function toggleCampaignStatus(campaign: AdCampaign) {
    const newStatus = campaign.status === "활성" ? "일시중지" : "활성";
    await fetch(`/api/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    loadCampaigns();
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">캠페인 관리</h3>
          <p className="text-sm text-gray-500">Meta Ads 캠페인을 등록하고 성과를 추적합니다</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + 새 캠페인
        </button>
      </div>

      {/* 캠페인 생성 폼 */}
      {showForm && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm">
          <h4 className="font-semibold mb-4">새 광고 캠페인 등록</h4>
          <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">캠페인명</label>
              <input name="name" required placeholder="예: 개인회생_스레드_2026Q2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">플랫폼</label>
              <select name="platform" required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500">
                <option value="threads">Threads</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Meta 캠페인 ID</label>
              <input name="metaCampaignId" placeholder="120242539821120097"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">예산 (원)</label>
              <input name="budget" type="number" placeholder="500000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">시작일</label>
              <input name="startDate" type="date" required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">종료일</label>
              <input name="endDate" type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">랜딩 URL (DBCart)</label>
              <input name="landingUrl" required placeholder="https://yourname.dbcart.net"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
            </div>
            <div className="col-span-2 flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm bg-gray-100 text-gray-600 hover:bg-gray-200">
                취소
              </button>
              <button type="submit"
                className="px-4 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 font-medium">
                등록
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 캠페인 목록 */}
      {campaigns.length === 0 && !showForm ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400 text-lg">등록된 캠페인이 없습니다</p>
          <p className="text-gray-300 text-sm mt-2">
            새 캠페인을 등록하여 Threads 광고 성과를 추적하세요
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const pl = PLATFORM_LABELS[c.platform] || { label: c.platform, color: "bg-gray-100 text-gray-600" };
            const cpl = c.leads > 0 && c.spent > 0 ? Math.round(c.spent / c.leads) : null;
            return (
              <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{c.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pl.color}`}>
                      {pl.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      c.status === "활성"
                        ? "bg-green-100 text-green-700"
                        : c.status === "일시중지"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleCampaignStatus(c)}
                    className={`text-xs px-3 py-1 rounded-lg font-medium ${
                      c.status === "활성"
                        ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"
                        : "bg-green-50 text-green-600 hover:bg-green-100"
                    }`}
                  >
                    {c.status === "활성" ? "일시중지" : "활성화"}
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">리드 수</div>
                    <div className="font-bold text-lg text-gray-900">{c.leads}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">예산</div>
                    <div className="font-bold text-gray-900">{c.budget.toLocaleString()}원</div>
                  </div>
                  <div>
                    <div className="text-gray-500">집행액</div>
                    <div className="font-bold text-gray-900">{c.spent.toLocaleString()}원</div>
                  </div>
                  <div>
                    <div className="text-gray-500">리드당 비용</div>
                    <div className="font-bold text-gray-900">{cpl ? `${cpl.toLocaleString()}원` : "-"}</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-400">
                  기간: {c.startDate} ~ {c.endDate || "진행중"} · 랜딩: {c.landingUrl}
                </div>
                {c.metaCampaignId && (
                  <div className="mt-1 text-xs text-gray-400">
                    Meta ID: {c.metaCampaignId}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
