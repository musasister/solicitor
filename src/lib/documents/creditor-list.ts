/**
 * 채권자목록 생성기 - 법원 양식
 * 각 채무(채권)가 1행으로 출력
 */

import type { Case, Claim } from "../db/types";

export interface CreditorListRow {
  number: number;
  creditor: string;
  cause: string;
  principal: number;
  interest: number;
  penalty: number;
  total: number;
  claimType: string;
  note: string;
}

export interface CreditorListDocument {
  caseNumber: string | null;
  debtorName: string;
  referenceDate: string;
  rows: CreditorListRow[];
  totalPrincipal: number;
  totalInterest: number;
  totalPenalty: number;
  grandTotal: number;
  securedTotal: number;
  priorityTotal: number;
  unsecuredTotal: number;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}.`;
}

export function generateCreditorList(
  cs: Case,
  claims: Claim[]
): CreditorListDocument {
  const sorted = [...claims].sort((a, b) => a.claimNumber - b.claimNumber);

  const rows: CreditorListRow[] = sorted.map((cl) => {
    let cause = `${formatDate(cl.causeDate)} ${cl.debtType}`;
    if (cl.causeDetail) cause += ` (${cl.causeDetail})`;

    return {
      number: cl.claimNumber,
      creditor: cl.creditorName,
      cause,
      principal: cl.principal,
      interest: cl.interest,
      penalty: cl.penalty,
      total: cl.total,
      claimType: cl.secured ? "담보부" : cl.priority ? "우선" : "일반",
      note: "",
    };
  });

  const totalPrincipal = sorted.reduce((s, c) => s + c.principal, 0);
  const totalInterest = sorted.reduce((s, c) => s + c.interest, 0);
  const totalPenalty = sorted.reduce((s, c) => s + c.penalty, 0);
  const grandTotal = sorted.reduce((s, c) => s + c.total, 0);
  const securedTotal = sorted.filter((c) => c.secured).reduce((s, c) => s + c.total, 0);
  const priorityTotal = sorted.filter((c) => c.priority).reduce((s, c) => s + c.total, 0);
  const unsecuredTotal = grandTotal - securedTotal - priorityTotal;

  return {
    caseNumber: cs.caseNumber,
    debtorName: cs.debtorName,
    referenceDate: formatDate(cs.referenceDate),
    rows,
    totalPrincipal,
    totalInterest,
    totalPenalty,
    grandTotal,
    securedTotal,
    priorityTotal,
    unsecuredTotal,
  };
}

export function creditorListToText(doc: CreditorListDocument): string {
  const lines: string[] = [];
  lines.push("=".repeat(90));
  lines.push("채  권  자  목  록");
  lines.push("=".repeat(90));
  lines.push("");
  if (doc.caseNumber) lines.push(`사건번호: ${doc.caseNumber}`);
  lines.push(`채무자: ${doc.debtorName}`);
  lines.push(`기준일: ${doc.referenceDate}`);
  lines.push("");

  for (const row of doc.rows) {
    lines.push(
      `${row.number}. ${row.creditor} | ${row.cause} | ` +
      `원금 ${row.principal.toLocaleString()} | 이자 ${row.interest.toLocaleString()} | ` +
      `지연손해금 ${row.penalty.toLocaleString()} | 합계 ${row.total.toLocaleString()} | ${row.claimType}`
    );
  }

  lines.push("-".repeat(90));
  lines.push(`담보부채권 합계: ${doc.securedTotal.toLocaleString()}원`);
  lines.push(`우선채권   합계: ${doc.priorityTotal.toLocaleString()}원`);
  lines.push(`일반채권   합계: ${doc.unsecuredTotal.toLocaleString()}원`);
  lines.push(`채권 총액     : ${doc.grandTotal.toLocaleString()}원`);
  lines.push("=".repeat(90));

  return lines.join("\n");
}
