"use client";

import { useState, useEffect, useCallback } from "react";
import type { Lead, LeadSummary } from "@/lib/db/types";

const STATUS_COLORS: Record<string, string> = {
  "신규": "bg-yellow-100 text-yellow-700",
  "상담중": "bg-blue-100 text-blue-700",
  "완료": "bg-green-100 text-green-700",
  "미전환": "bg-gray-100 text-gray-500",
};

const SOURCE_LABELS: Record<string, string> = {
  th: "Threads",
  ig: "Instagram",
  fb: "Facebook",
  direct: "직접 유입",
};

export default function LeadDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [summary, setSummary] = useState<LeadSummary | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const loadLeads = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    const res = await fetch(`/api/leads?${params}`);
    if (res.ok) setLeads(await res.json());
  }, [filterStatus]);

  const loadSummary = useCallback(async () => {
    const res = await fetch("/api/leads?summary=true");
    if (res.ok) setSummary(await res.json());
  }, []);

  useEffect(() => {
    loadLeads();
    loadSummary();
  }, [loadLeads, loadSummary]);

  async function updateLeadStatus(id: string, status: string) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadLeads();
    loadSummary();
    if (selectedLead?.id === id) {
      setSelectedLead((prev) => prev ? { ...prev, status } : null);
    }
  }

  async function updateLeadNote(id: string, note: string) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
  }

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label="전체 리드" value={summary.total} color="blue" />
          <SummaryCard label="오늘 유입" value={summary.todayCount} color="green" />
          <SummaryCard label="이번 주" value={summary.weekCount} color="purple" />
          <SummaryCard
            label="신규 대기"
            value={summary.byStatus["신규"] || 0}
            color="yellow"
          />
        </div>
      )}

      {/* 유입 채널별 분포 */}
      {summary && Object.keys(summary.bySource).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-700 mb-3">유입 채널</h3>
          <div className="flex gap-4 flex-wrap">
            {Object.entries(summary.bySource).map(([src, count]) => (
              <div key={src} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${src === "th" ? "bg-purple-500" : src === "ig" ? "bg-pink-500" : src === "fb" ? "bg-blue-500" : "bg-gray-400"}`} />
                <span className="text-sm text-gray-600">
                  {SOURCE_LABELS[src] || src}
                </span>
                <span className="text-sm font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 필터 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">상태:</span>
        {["", "신규", "상담중", "완료", "미전환"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              filterStatus === s
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s || "전체"}
          </button>
        ))}
      </div>

      {/* 리드 목록 + 상세 */}
      <div className="flex gap-4">
        {/* 리드 리스트 */}
        <div className={`space-y-2 ${selectedLead ? "w-1/2" : "w-full"}`}>
          {leads.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-400">
                {filterStatus ? `"${filterStatus}" 상태의 리드가 없습니다` : "아직 유입된 리드가 없습니다"}
              </p>
              <p className="text-gray-300 text-sm mt-2">
                Threads 광고를 통해 리드가 유입되면 여기에 표시됩니다
              </p>
            </div>
          ) : (
            leads.map((lead) => (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`bg-white rounded-xl border p-4 cursor-pointer transition-all hover:shadow-sm ${
                  selectedLead?.id === lead.id
                    ? "border-blue-400 shadow-sm"
                    : "border-gray-200 hover:border-blue-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">{lead.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status] || "bg-gray-100 text-gray-500"}`}>
                      {lead.status}
                    </span>
                    {lead.utm.utmSource && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                        {SOURCE_LABELS[lead.utm.utmSource] || lead.utm.utmSource}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{lead.createdAt}</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {lead.phone} · {lead.consultType}
                  {lead.debtRange && ` · ${lead.debtRange}`}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 상세 패널 */}
        {selectedLead && (
          <div className="w-1/2 bg-white rounded-xl border border-gray-200 p-5 sticky top-4 self-start">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900">{selectedLead.name}</h3>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <InfoRow label="연락처" value={selectedLead.phone} />
              <InfoRow label="상담 유형" value={selectedLead.consultType} />
              <InfoRow label="채무 규모" value={selectedLead.debtRange || "-"} />
              <InfoRow label="메모" value={selectedLead.memo || "-"} />
              <InfoRow label="유입 채널" value={SOURCE_LABELS[selectedLead.utm.utmSource || ""] || selectedLead.utm.utmSource || "직접 유입"} />
              <InfoRow label="접수일" value={selectedLead.createdAt} />

              {/* UTM 상세 */}
              {selectedLead.utm.utmCampaign && (
                <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
                  <div>Campaign: {selectedLead.utm.utmCampaign}</div>
                  {selectedLead.utm.utmContent && <div>Content: {selectedLead.utm.utmContent}</div>}
                  {selectedLead.utm.fbclid && <div>FBCLID: {selectedLead.utm.fbclid.slice(0, 20)}...</div>}
                </div>
              )}
            </div>

            {/* 상태 변경 */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <label className="text-sm font-medium text-gray-600 block mb-2">상태 변경</label>
              <div className="flex gap-2 flex-wrap">
                {["신규", "상담중", "완료", "미전환"].map((s) => (
                  <button
                    key={s}
                    onClick={() => updateLeadStatus(selectedLead.id, s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedLead.status === s
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 노트 */}
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-600 block mb-2">상담 노트</label>
              <textarea
                defaultValue={selectedLead.note || ""}
                onBlur={(e) => updateLeadNote(selectedLead.id, e.target.value)}
                placeholder="상담 내용을 기록하세요..."
                className="w-full p-3 border border-gray-200 rounded-lg text-sm resize-none h-24 focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700",
    yellow: "bg-yellow-50 text-yellow-700",
  };
  return (
    <div className={`rounded-xl p-4 ${colorMap[color] || "bg-gray-50 text-gray-700"}`}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm mt-1 opacity-80">{label}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  );
}
