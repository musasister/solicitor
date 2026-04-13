"use client";

import { useState } from "react";

interface Props {
  onCreated: () => void;
  onCancel: () => void;
}

export default function CaseForm({ onCreated, onCancel }: Props) {
  const [form, setForm] = useState({
    debtorName: "",
    debtorBirth: "",
    referenceDate: new Date().toISOString().slice(0, 10),
    caseNumber: "",
    courtName: "",
    repaymentMonths: 36,
    monthlyIncome: 0,
    monthlyExpense: 0,
    monthlyRepayment: 0,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) onCreated();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-gray-200 p-6 mb-6"
    >
      <h3 className="text-lg font-semibold mb-4">새 사건 등록</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            채무자 성명 *
          </label>
          <input
            type="text"
            required
            value={form.debtorName}
            onChange={(e) => setForm({ ...form, debtorName: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            생년월일 *
          </label>
          <input
            type="date"
            required
            value={form.debtorBirth}
            onChange={(e) => setForm({ ...form, debtorBirth: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            사건번호
          </label>
          <input
            type="text"
            placeholder="2026개회12345"
            value={form.caseNumber}
            onChange={(e) => setForm({ ...form, caseNumber: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            기준일 *
          </label>
          <input
            type="date"
            required
            value={form.referenceDate}
            onChange={(e) =>
              setForm({ ...form, referenceDate: e.target.value })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            관할법원
          </label>
          <input
            type="text"
            value={form.courtName}
            onChange={(e) => setForm({ ...form, courtName: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            변제기간 (월)
          </label>
          <select
            value={form.repaymentMonths}
            onChange={(e) =>
              setForm({ ...form, repaymentMonths: parseInt(e.target.value) })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={36}>36개월</option>
            <option value={48}>48개월</option>
            <option value={60}>60개월</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            월수입 (원)
          </label>
          <input
            type="number"
            min={0}
            value={form.monthlyIncome || ""}
            onChange={(e) =>
              setForm({ ...form, monthlyIncome: parseInt(e.target.value) || 0 })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            월지출 (원)
          </label>
          <input
            type="number"
            min={0}
            value={form.monthlyExpense || ""}
            onChange={(e) =>
              setForm({
                ...form,
                monthlyExpense: parseInt(e.target.value) || 0,
              })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            월변제액 (원)
          </label>
          <input
            type="number"
            min={0}
            value={form.monthlyRepayment || ""}
            onChange={(e) =>
              setForm({
                ...form,
                monthlyRepayment: parseInt(e.target.value) || 0,
              })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "저장 중..." : "사건 등록"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-600 px-5 py-2 rounded-lg hover:bg-gray-100 text-sm"
        >
          취소
        </button>
      </div>
    </form>
  );
}
