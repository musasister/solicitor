"use client";

import { useState } from "react";
import type { ValidationResult } from "@/lib/engine/validation";

interface Props {
  caseId: string;
}

export default function ValidationPanel({ caseId }: Props) {
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runValidation = async () => {
    setLoading(true);
    const res = await fetch("/api/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId }),
    });
    if (res.ok) setResult(await res.json());
    setLoading(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          현재가치 &ge; 청산가치 / 보정재산 통제 / 월변제액 충분성 검증
        </p>
        <button
          onClick={runValidation}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "검증 중..." : "정합성 검증 실행"}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          {/* 결과 헤더 */}
          <div
            className={`rounded-xl border p-6 ${
              result.valid
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {result.valid ? "\u2705" : "\u274C"}
              </span>
              <div>
                <h3
                  className={`text-lg font-semibold ${
                    result.valid ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {result.valid ? "검증 통과" : "검증 실패"}
                </h3>
                <p
                  className={`text-sm ${
                    result.valid ? "text-green-600" : "text-red-600"
                  }`}
                >
                  에러 {result.errors.length}건 / 경고{" "}
                  {result.warnings.length}건
                </p>
              </div>
            </div>
          </div>

          {/* 에러 목록 */}
          {result.errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-red-700">에러</h4>
              {result.errors.map((e, i) => (
                <div
                  key={i}
                  className="bg-white border border-red-200 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono bg-red-100 text-red-700 px-2 py-0.5 rounded">
                      {e.code}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{e.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* 경고 목록 */}
          {result.warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-yellow-700">경고</h4>
              {result.warnings.map((w, i) => (
                <div
                  key={i}
                  className="bg-white border border-yellow-200 rounded-lg p-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                      {w.code}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{w.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* 요약 */}
          {result.summary && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="font-medium text-gray-900 mb-4">검증 요약</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {[
                  ["총 채권액", result.summary.totalClaims, "원"],
                  ["담보부채권", result.summary.securedClaims, "원"],
                  ["일반채권", result.summary.unsecuredClaims, "원"],
                  ["명시적 재산", result.summary.explicitPropertyValue, "원"],
                  ["보정재산", result.summary.adjustmentValue, "원"],
                  [
                    "총 청산가치",
                    result.summary.totalLiquidationValue,
                    "원",
                  ],
                  ["현재가치", result.summary.presentValue, "원"],
                  [
                    "총 변제액(명목)",
                    result.summary.totalNominalRepayment,
                    "원",
                  ],
                  ["변제율", result.summary.repaymentRate, "%"],
                  [
                    "라이프니츠 계수",
                    result.summary.leibnizCoefficient,
                    "",
                  ],
                  ["PV Factor", result.summary.pvFactor, ""],
                ].map(([label, value, unit]) => (
                  <div key={String(label)}>
                    <span className="text-gray-500">{String(label)}</span>
                    <p className="font-medium">
                      {typeof value === "number"
                        ? Number.isInteger(value)
                          ? (value as number).toLocaleString()
                          : String(value)
                        : String(value ?? "")}
                      {String(unit ?? "")}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-6 text-sm">
                <span
                  className={
                    result.summary.pvGeLiquidation
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  PV &ge; 청산가치:{" "}
                  {result.summary.pvGeLiquidation ? "충족" : "미충족"}
                </span>
                <span
                  className={
                    result.summary.adjustmentWithinLimit
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  보정재산 통제:{" "}
                  {result.summary.adjustmentWithinLimit ? "통과" : "초과"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
