"use client";

import { useState, useEffect, useCallback } from "react";
import type { CaseSummary } from "@/lib/db/types";
import CaseDetail from "@/components/CaseDetail";
import CaseForm from "@/components/CaseForm";
import VideoAdHero from "@/components/VideoAdHero";
import AdLandingSection from "@/components/AdLandingSection";

export default function Home() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showLanding, setShowLanding] = useState(false);

  const loadCases = useCallback(async () => {
    const res = await fetch("/api/cases");
    if (res.ok) setCases(await res.json());
  }, []);

  useEffect(() => {
    loadCases();
  }, [loadCases]);

  // Threads/Meta 광고를 통해 유입된 경우 랜딩페이지를 먼저 표시
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source");
    const fbclid = params.get("fbclid");
    const showAd = params.get("ad");
    if (utmSource === "th" || fbclid || showAd === "1") {
      setShowLanding(true);
    }
  }, []);

  const handleCtaClick = () => {
    setShowLanding(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (selectedCaseId) {
    return (
      <CaseDetail
        caseId={selectedCaseId}
        onBack={() => {
          setSelectedCaseId(null);
          loadCases();
        }}
      />
    );
  }

  if (showLanding) {
    return (
      <div className="min-h-screen">
        <VideoAdHero onCtaClick={handleCtaClick} />
        <AdLandingSection onCtaClick={handleCtaClick} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          개인회생 서식 자동화 시스템
        </h1>
        <p className="text-gray-500 mt-1">
          채권 단위로 사건을 구조화하고 계산/검증을 자동화
        </p>
      </header>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">사건 목록</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + 새 사건
        </button>
      </div>

      {showForm && (
        <CaseForm
          onCreated={() => {
            setShowForm(false);
            loadCases();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {cases.length === 0 && !showForm ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400 text-lg">등록된 사건이 없습니다</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
          >
            첫 번째 사건 등록하기
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedCaseId(c.id)}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">
                      {c.debtorName}
                    </span>
                    {c.caseNumber && (
                      <span className="text-sm text-gray-500">
                        {c.caseNumber}
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.status === "인가"
                          ? "bg-green-100 text-green-700"
                          : c.status === "진행중"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    채권 {c.totalClaims}건 / 총{" "}
                    {c.totalClaimAmount.toLocaleString()}원
                  </p>
                </div>
                <span className="text-gray-400 text-sm">&rarr;</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
