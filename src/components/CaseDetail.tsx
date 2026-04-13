"use client";

import { useState, useEffect, useCallback } from "react";
import type { Case, Claim, Property } from "@/lib/db/types";
import ClaimSection from "./ClaimSection";
import PropertySection from "./PropertySection";
import ValidationPanel from "./ValidationPanel";
import DocumentPanel from "./DocumentPanel";

interface Props {
  caseId: string;
  onBack: () => void;
}

type Tab = "claims" | "properties" | "validation" | "documents";

export default function CaseDetail({ caseId, onBack }: Props) {
  const [cs, setCs] = useState<Case | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tab, setTab] = useState<Tab>("claims");

  const load = useCallback(async () => {
    const [caseRes, claimsRes, propsRes] = await Promise.all([
      fetch(`/api/cases/${caseId}`),
      fetch(`/api/cases/${caseId}/claims`),
      fetch(`/api/cases/${caseId}/properties`),
    ]);
    if (caseRes.ok) setCs(await caseRes.json());
    if (claimsRes.ok) setClaims(await claimsRes.json());
    if (propsRes.ok) setProperties(await propsRes.json());
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!cs) return <div className="p-8 text-center text-gray-400">로딩 중...</div>;

  const tabs: { key: Tab; label: string }[] = [
    { key: "claims", label: `채권 (${claims.length})` },
    { key: "properties", label: `재산 (${properties.length})` },
    { key: "validation", label: "정합성 검증" },
    { key: "documents", label: "문서 생성" },
  ];

  const totalClaims = claims.reduce((s, c) => s + c.total, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block"
      >
        &larr; 사건 목록
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {cs.debtorName}
            </h2>
            {cs.caseNumber && (
              <p className="text-sm text-gray-500 mt-1">{cs.caseNumber}</p>
            )}
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              cs.status === "인가"
                ? "bg-green-100 text-green-700"
                : cs.status === "진행중"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {cs.status}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm">
          <div>
            <span className="text-gray-500">기준일</span>
            <p className="font-medium">{cs.referenceDate}</p>
          </div>
          <div>
            <span className="text-gray-500">변제기간</span>
            <p className="font-medium">{cs.repaymentMonths}개월</p>
          </div>
          <div>
            <span className="text-gray-500">월변제액</span>
            <p className="font-medium">
              {cs.monthlyRepayment.toLocaleString()}원
            </p>
          </div>
          <div>
            <span className="text-gray-500">총 채권액</span>
            <p className="font-medium">{totalClaims.toLocaleString()}원</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "claims" && (
        <ClaimSection caseId={caseId} claims={claims} onUpdate={load} />
      )}
      {tab === "properties" && (
        <PropertySection
          caseId={caseId}
          properties={properties}
          onUpdate={load}
        />
      )}
      {tab === "validation" && <ValidationPanel caseId={caseId} />}
      {tab === "documents" && <DocumentPanel caseId={caseId} />}
    </div>
  );
}
