"use client";

import { useState } from "react";

interface Props {
  caseId: string;
}

export default function DocumentPanel({ caseId }: Props) {
  const [output, setOutput] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const generate = async (docType: string, format: string = "text") => {
    setLoading(docType);
    const res = await fetch("/api/generate-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId,
        documentType: docType,
        format,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (format === "text") {
        setOutput(data.content);
      } else {
        setOutput(JSON.stringify(data, null, 2));
      }
    }
    setLoading(null);
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        법원 양식에 따른 서류를 자동 생성합니다
      </p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h4 className="font-medium text-gray-900 mb-2">채권자목록</h4>
          <p className="text-sm text-gray-500 mb-4">
            채권 단위 목록 (채무 1건 = 1행)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => generate("creditor_list", "text")}
              disabled={loading === "creditor_list"}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
            >
              {loading === "creditor_list" ? "생성 중..." : "텍스트"}
            </button>
            <button
              onClick={() => generate("creditor_list", "json")}
              className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-sm"
            >
              JSON
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h4 className="font-medium text-gray-900 mb-2">변제계획안</h4>
          <p className="text-sm text-gray-500 mb-4">
            현재가치/청산가치 포함 계획안
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => generate("repayment_plan", "json")}
              disabled={loading === "repayment_plan"}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
            >
              {loading === "repayment_plan" ? "생성 중..." : "JSON"}
            </button>
          </div>
        </div>
      </div>

      {output && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">생성 결과</h4>
            <button
              onClick={() => setOutput(null)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              닫기
            </button>
          </div>
          <pre className="bg-gray-50 rounded-lg p-4 text-sm overflow-x-auto whitespace-pre-wrap font-mono text-gray-800 max-h-[500px] overflow-y-auto">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}
