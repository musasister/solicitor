/**
 * 인메모리 데이터 저장소
 *
 * Vercel 서버리스 환경에서 동작하는 간이 저장소.
 * 프로덕션에서는 Vercel Postgres 등으로 교체 가능.
 */

import { v4 as uuidv4 } from "uuid";
import type {
  Case, CaseCreate, CaseUpdate, CaseSummary,
  Claim, ClaimCreate, ClaimUpdate,
  Property, PropertyCreate, PropertyUpdate,
  Evidence, EvidenceCreate,
} from "./types";

function genId(prefix: string): string {
  return `${prefix}_${uuidv4().replace(/-/g, "").slice(0, 12)}`;
}

function now(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

// --- 저장소 ---
const cases = new Map<string, Case>();
const claims = new Map<string, Claim>();
const properties = new Map<string, Property>();
const evidences = new Map<string, Evidence>();

// ===== Case =====
export function createCase(data: CaseCreate): Case {
  const id = genId("case");
  const ts = now();
  const c: Case = {
    id,
    caseNumber: data.caseNumber ?? null,
    debtorName: data.debtorName,
    debtorBirth: data.debtorBirth,
    debtorIdLast: data.debtorIdLast ?? null,
    filingDate: data.filingDate ?? null,
    referenceDate: data.referenceDate,
    courtName: data.courtName ?? null,
    repaymentMonths: data.repaymentMonths ?? 36,
    monthlyIncome: data.monthlyIncome ?? 0,
    monthlyExpense: data.monthlyExpense ?? 0,
    monthlyRepayment: data.monthlyRepayment ?? 0,
    status: "작성중",
    createdAt: ts,
    updatedAt: ts,
  };
  cases.set(id, c);
  return c;
}

export function getCase(id: string): Case | null {
  return cases.get(id) ?? null;
}

export function listCases(): CaseSummary[] {
  const result: CaseSummary[] = [];
  for (const c of cases.values()) {
    const caseClaims = listClaimsByCase(c.id);
    result.push({
      id: c.id,
      caseNumber: c.caseNumber,
      debtorName: c.debtorName,
      status: c.status,
      totalClaims: caseClaims.length,
      totalClaimAmount: caseClaims.reduce((s, cl) => s + cl.total, 0),
      createdAt: c.createdAt,
    });
  }
  return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function updateCase(id: string, data: CaseUpdate): Case | null {
  const c = cases.get(id);
  if (!c) return null;
  const updated: Case = {
    ...c,
    ...(data.caseNumber !== undefined && { caseNumber: data.caseNumber }),
    ...(data.debtorName !== undefined && { debtorName: data.debtorName }),
    ...(data.debtorBirth !== undefined && { debtorBirth: data.debtorBirth }),
    ...(data.debtorIdLast !== undefined && { debtorIdLast: data.debtorIdLast }),
    ...(data.filingDate !== undefined && { filingDate: data.filingDate }),
    ...(data.referenceDate !== undefined && { referenceDate: data.referenceDate }),
    ...(data.courtName !== undefined && { courtName: data.courtName }),
    ...(data.repaymentMonths !== undefined && { repaymentMonths: data.repaymentMonths }),
    ...(data.monthlyIncome !== undefined && { monthlyIncome: data.monthlyIncome }),
    ...(data.monthlyExpense !== undefined && { monthlyExpense: data.monthlyExpense }),
    ...(data.monthlyRepayment !== undefined && { monthlyRepayment: data.monthlyRepayment }),
    ...(data.status !== undefined && { status: data.status }),
    updatedAt: now(),
  };
  cases.set(id, updated);
  return updated;
}

export function deleteCase(id: string): boolean {
  // Cascade delete claims, properties, evidences
  for (const cl of claims.values()) {
    if (cl.caseId === id) claims.delete(cl.id);
  }
  for (const p of properties.values()) {
    if (p.caseId === id) properties.delete(p.id);
  }
  for (const e of evidences.values()) {
    if (e.caseId === id) evidences.delete(e.id);
  }
  return cases.delete(id);
}

// ===== Claim =====
export function createClaim(data: ClaimCreate): Claim {
  const id = genId("cl");
  const ts = now();
  const interest = data.interest ?? 0;
  const penalty = data.penalty ?? 0;
  const total = data.principal + interest + penalty;

  // 자동 채권번호
  const existing = listClaimsByCase(data.caseId);
  const maxNum = existing.reduce((m, c) => Math.max(m, c.claimNumber), 0);

  const cl: Claim = {
    id,
    caseId: data.caseId,
    claimNumber: maxNum + 1,
    creditorName: data.creditorName,
    causeDate: data.causeDate,
    debtType: data.debtType,
    causeDetail: data.causeDetail ?? null,
    principal: data.principal,
    interest,
    penalty,
    total,
    secured: data.secured ?? false,
    priority: data.priority ?? false,
    evidenceIds: data.evidenceIds ?? [],
    status: "확정",
    createdAt: ts,
    updatedAt: ts,
  };
  claims.set(id, cl);
  return cl;
}

export function getClaim(id: string): Claim | null {
  return claims.get(id) ?? null;
}

export function listClaimsByCase(caseId: string): Claim[] {
  const result: Claim[] = [];
  for (const cl of claims.values()) {
    if (cl.caseId === caseId) result.push(cl);
  }
  return result.sort((a, b) => a.claimNumber - b.claimNumber);
}

export function updateClaim(id: string, data: ClaimUpdate): Claim | null {
  const cl = claims.get(id);
  if (!cl) return null;
  const principal = data.principal ?? cl.principal;
  const interest = data.interest ?? cl.interest;
  const penalty = data.penalty ?? cl.penalty;
  const updated: Claim = {
    ...cl,
    ...(data.creditorName !== undefined && { creditorName: data.creditorName }),
    ...(data.causeDate !== undefined && { causeDate: data.causeDate }),
    ...(data.debtType !== undefined && { debtType: data.debtType }),
    ...(data.causeDetail !== undefined && { causeDetail: data.causeDetail }),
    ...(data.secured !== undefined && { secured: data.secured }),
    ...(data.priority !== undefined && { priority: data.priority }),
    ...(data.status !== undefined && { status: data.status }),
    ...(data.evidenceIds !== undefined && { evidenceIds: data.evidenceIds }),
    principal,
    interest,
    penalty,
    total: principal + interest + penalty,
    updatedAt: now(),
  };
  claims.set(id, updated);
  return updated;
}

export function deleteClaim(id: string): boolean {
  return claims.delete(id);
}

// ===== Property =====
export function createProperty(data: PropertyCreate): Property {
  const id = genId("prop");
  const ts = now();
  const p: Property = {
    id,
    caseId: data.caseId,
    propertyType: data.propertyType,
    description: data.description,
    appraisedValue: data.appraisedValue ?? 0,
    liquidationValue: data.liquidationValue ?? 0,
    isAdjustment: data.isAdjustment ?? false,
    note: data.note ?? null,
    createdAt: ts,
    updatedAt: ts,
  };
  properties.set(id, p);
  return p;
}

export function getProperty(id: string): Property | null {
  return properties.get(id) ?? null;
}

export function listPropertiesByCase(caseId: string): Property[] {
  const result: Property[] = [];
  for (const p of properties.values()) {
    if (p.caseId === caseId) result.push(p);
  }
  return result;
}

export function updateProperty(id: string, data: PropertyUpdate): Property | null {
  const p = properties.get(id);
  if (!p) return null;
  const updated: Property = {
    ...p,
    ...(data.propertyType !== undefined && { propertyType: data.propertyType }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.appraisedValue !== undefined && { appraisedValue: data.appraisedValue }),
    ...(data.liquidationValue !== undefined && { liquidationValue: data.liquidationValue }),
    ...(data.isAdjustment !== undefined && { isAdjustment: data.isAdjustment }),
    ...(data.note !== undefined && { note: data.note }),
    updatedAt: now(),
  };
  properties.set(id, updated);
  return updated;
}

export function deleteProperty(id: string): boolean {
  return properties.delete(id);
}

// ===== Evidence =====
export function createEvidence(data: EvidenceCreate): Evidence {
  const id = genId("ev");
  const e: Evidence = {
    id,
    caseId: data.caseId,
    claimId: data.claimId ?? null,
    evidenceType: data.evidenceType,
    description: data.description ?? null,
    filePath: data.filePath ?? null,
    validFrom: data.validFrom ?? null,
    validUntil: data.validUntil ?? null,
    status: "미확인",
    createdAt: now(),
  };
  evidences.set(id, e);
  return e;
}

export function listEvidencesByCase(caseId: string): Evidence[] {
  const result: Evidence[] = [];
  for (const e of evidences.values()) {
    if (e.caseId === caseId) result.push(e);
  }
  return result;
}

export function deleteEvidence(id: string): boolean {
  return evidences.delete(id);
}
