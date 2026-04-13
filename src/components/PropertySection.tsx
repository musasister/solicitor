"use client";

import { useState } from "react";
import type { Property } from "@/lib/db/types";

const PROPERTY_TYPES = [
  "부동산", "예금", "보험", "차량", "동산",
  "유가증권", "채권(매출채권 등)", "퇴직금", "기타",
];

interface Props {
  caseId: string;
  properties: Property[];
  onUpdate: () => void;
}

export default function PropertySection({ caseId, properties, onUpdate }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    propertyType: "예금",
    description: "",
    appraisedValue: 0,
    liquidationValue: 0,
    isAdjustment: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/cases/${caseId}/properties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      setForm({
        propertyType: "예금",
        description: "",
        appraisedValue: 0,
        liquidationValue: 0,
        isAdjustment: false,
      });
      setShowForm(false);
      onUpdate();
    } else {
      const data = await res.json();
      setError(data.message || data.error || "저장 실패");
    }
  };

  const handleDelete = async (propId: string) => {
    if (!confirm("이 재산을 삭제하시겠습니까?")) return;
    await fetch(`/api/properties/${propId}`, { method: "DELETE" });
    onUpdate();
  };

  const explicitTotal = properties
    .filter((p) => !p.isAdjustment)
    .reduce((s, p) => s + p.liquidationValue, 0);
  const adjustmentTotal = properties
    .filter((p) => p.isAdjustment)
    .reduce((s, p) => s + p.liquidationValue, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          청산가치 = 명시적 재산 + 보정재산
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + 재산 추가
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-50 rounded-xl border border-gray-200 p-5 mb-4"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                재산 종류
              </label>
              <select
                value={form.propertyType}
                onChange={(e) =>
                  setForm({ ...form, propertyType: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                재산 내역 *
              </label>
              <input
                type="text"
                required
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="국민은행 보통예금"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                감정가/평가액 (원)
              </label>
              <input
                type="number"
                min={0}
                value={form.appraisedValue || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    appraisedValue: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                청산가치 (원)
              </label>
              <input
                type="number"
                min={0}
                value={form.liquidationValue || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    liquidationValue: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isAdjustment}
                  onChange={(e) =>
                    setForm({ ...form, isAdjustment: e.target.checked })
                  }
                  className="rounded"
                />
                보정재산 (Adj_max 통제 대상)
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {loading ? "저장 중..." : "재산 추가"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 text-sm"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {properties.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400">등록된 재산이 없습니다</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    종류
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    내역
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    평가액
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    청산가치
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">
                    구분
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {properties.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">{p.propertyType}</td>
                    <td className="px-4 py-3">{p.description}</td>
                    <td className="px-4 py-3 text-right">
                      {p.appraisedValue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {p.liquidationValue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          p.isAdjustment
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {p.isAdjustment ? "보정" : "명시적"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-lg border p-4">
              <span className="text-gray-500">명시적 재산</span>
              <p className="text-lg font-semibold mt-1">
                {explicitTotal.toLocaleString()}원
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
              <span className="text-yellow-700">보정재산</span>
              <p className="text-lg font-semibold mt-1 text-yellow-800">
                {adjustmentTotal.toLocaleString()}원
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <span className="text-blue-700">총 청산가치</span>
              <p className="text-lg font-semibold mt-1 text-blue-800">
                {(explicitTotal + adjustmentTotal).toLocaleString()}원
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
