"use client";

import { useState } from "react";
import type { Claim } from "@/lib/db/types";

const DEBT_TYPES = [
  "대출금", "현금서비스", "카드론", "카드대금", "주택담보대출",
  "개인대출", "보증채무", "세금", "보험료", "공과금", "기타",
];

interface Props {
  caseId: string;
  claims: Claim[];
  onUpdate: () => void;
}

export default function ClaimSection({ caseId, claims, onUpdate }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    creditorName: "",
    causeDate: "",
    debtType: "대출금",
    principal: 0,
    interest: 0,
    penalty: 0,
    secured: false,
    priority: false,
  });
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setForm({
      creditorName: "",
      causeDate: "",
      debtType: "대출금",
      principal: 0,
      interest: 0,
      penalty: 0,
      secured: false,
      priority: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/cases/${caseId}/claims`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      resetForm();
      setShowForm(false);
      onUpdate();
    }
  };

  const handleDelete = async (claimId: string) => {
    if (!confirm("이 채권을 삭제하시겠습니까?")) return;
    await fetch(`/api/claims/${claimId}`, { method: "DELETE" });
    onUpdate();
  };

  const totalPrincipal = claims.reduce((s, c) => s + c.principal, 0);
  const totalInterest = claims.reduce((s, c) => s + c.interest, 0);
  const totalPenalty = claims.reduce((s, c) => s + c.penalty, 0);
  const grandTotal = claims.reduce((s, c) => s + c.total, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          채무 1개 = 채권 1건 = 채권자목록 1행 (같은 채권자 반복 가능)
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + 채권 추가
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-50 rounded-xl border border-gray-200 p-5 mb-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                채권자명 *
              </label>
              <input
                type="text"
                required
                value={form.creditorName}
                onChange={(e) =>
                  setForm({ ...form, creditorName: e.target.value })
                }
                placeholder="KB국민카드"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                채무 발생일 *
              </label>
              <input
                type="date"
                required
                value={form.causeDate}
                onChange={(e) =>
                  setForm({ ...form, causeDate: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                채무종류 *
              </label>
              <select
                value={form.debtType}
                onChange={(e) =>
                  setForm({ ...form, debtType: e.target.value })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DEBT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                원금 (원) *
              </label>
              <input
                type="number"
                required
                min={0}
                value={form.principal || ""}
                onChange={(e) =>
                  setForm({ ...form, principal: parseInt(e.target.value) || 0 })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이자 (원)
              </label>
              <input
                type="number"
                min={0}
                value={form.interest || ""}
                onChange={(e) =>
                  setForm({ ...form, interest: parseInt(e.target.value) || 0 })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                지연손해금 (원)
              </label>
              <input
                type="number"
                min={0}
                value={form.penalty || ""}
                onChange={(e) =>
                  setForm({ ...form, penalty: parseInt(e.target.value) || 0 })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2 flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.secured}
                  onChange={(e) =>
                    setForm({ ...form, secured: e.target.checked })
                  }
                  className="rounded"
                />
                담보부채권
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.checked })
                  }
                  className="rounded"
                />
                우선채권
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {loading ? "저장 중..." : "채권 추가"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); resetForm(); }}
              className="text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 text-sm"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {claims.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-400">등록된 채권이 없습니다</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    번호
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    채권자
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    채권원인
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    원금
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    이자
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    지연손해금
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    합계
                  </th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">
                    구분
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {claims.map((cl) => {
                  const d = new Date(cl.causeDate);
                  const cause = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}. ${cl.debtType}`;
                  return (
                    <tr
                      key={cl.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-gray-500">
                        {cl.claimNumber}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {cl.creditorName}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{cause}</td>
                      <td className="px-4 py-3 text-right">
                        {cl.principal.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {cl.interest.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {cl.penalty.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {cl.total.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            cl.secured
                              ? "bg-orange-100 text-orange-700"
                              : cl.priority
                              ? "bg-purple-100 text-purple-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {cl.secured ? "담보부" : cl.priority ? "우선" : "일반"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDelete(cl.id)}
                          className="text-red-400 hover:text-red-600 text-xs"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-medium">
                  <td className="px-4 py-3" colSpan={3}>
                    합계
                  </td>
                  <td className="px-4 py-3 text-right">
                    {totalPrincipal.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {totalInterest.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {totalPenalty.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {grandTotal.toLocaleString()}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
