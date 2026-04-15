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
  Lead, LeadCreate, LeadUpdate, LeadSummary,
  AdCampaign, AdCampaignCreate, AdCampaignUpdate,
} from "./types";

function genId(prefix: string): string {
  return `${prefix}_${uuidv4().replace(/-/g, "").slice(0, 12)}`;
}

function now(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

// --- 저장소 (globalThis로 dev 핫리로드 시에도 유지) ---
interface StoreData {
  cases: Map<string, Case>;
  claims: Map<string, Claim>;
  properties: Map<string, Property>;
  evidences: Map<string, Evidence>;
  leads: Map<string, Lead>;
  campaigns: Map<string, AdCampaign>;
}

const globalStore = globalThis as unknown as { __insolvencyStore?: StoreData };
if (!globalStore.__insolvencyStore) {
  globalStore.__insolvencyStore = {
    cases: new Map(),
    claims: new Map(),
    properties: new Map(),
    evidences: new Map(),
    leads: new Map(),
    campaigns: new Map(),
  };
}
// 기존 저장소에 leads/campaigns가 없으면 추가
if (!globalStore.__insolvencyStore.leads) {
  globalStore.__insolvencyStore.leads = new Map();
}
if (!globalStore.__insolvencyStore.campaigns) {
  globalStore.__insolvencyStore.campaigns = new Map();
}

const cases = globalStore.__insolvencyStore.cases;
const claims = globalStore.__insolvencyStore.claims;
const properties = globalStore.__insolvencyStore.properties;
const evidences = globalStore.__insolvencyStore.evidences;
const leads = globalStore.__insolvencyStore.leads;
const campaigns = globalStore.__insolvencyStore.campaigns;

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

// ===== Lead (Threads 광고 리드) =====
export function createLead(data: LeadCreate): Lead {
  const id = genId("lead");
  const ts = now();
  const lead: Lead = {
    id,
    name: data.name,
    phone: data.phone,
    debtRange: data.debtRange ?? null,
    consultType: data.consultType ?? "개인회생",
    memo: data.memo ?? null,
    utm: {
      utmSource: data.utmSource ?? null,
      utmMedium: data.utmMedium ?? null,
      utmCampaign: data.utmCampaign ?? null,
      utmContent: data.utmContent ?? null,
      utmTerm: data.utmTerm ?? null,
      utmId: data.utmId ?? null,
      fbclid: data.fbclid ?? null,
    },
    status: "신규",
    assignedTo: null,
    caseId: null,
    note: null,
    createdAt: ts,
    updatedAt: ts,
  };
  leads.set(id, lead);

  // 해당 캠페인의 리드 수 증가
  if (data.utmCampaign) {
    for (const c of campaigns.values()) {
      if (c.utmCampaign === data.utmCampaign) {
        campaigns.set(c.id, { ...c, leads: c.leads + 1, updatedAt: ts });
        break;
      }
    }
  }

  return lead;
}

export function getLead(id: string): Lead | null {
  return leads.get(id) ?? null;
}

export function listLeads(filter?: { status?: string; source?: string }): Lead[] {
  const result: Lead[] = [];
  for (const l of leads.values()) {
    if (filter?.status && l.status !== filter.status) continue;
    if (filter?.source && l.utm.utmSource !== filter.source) continue;
    result.push(l);
  }
  return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function updateLead(id: string, data: LeadUpdate): Lead | null {
  const l = leads.get(id);
  if (!l) return null;
  const updated: Lead = {
    ...l,
    ...(data.status !== undefined && { status: data.status }),
    ...(data.assignedTo !== undefined && { assignedTo: data.assignedTo }),
    ...(data.caseId !== undefined && { caseId: data.caseId }),
    ...(data.note !== undefined && { note: data.note }),
    updatedAt: now(),
  };
  leads.set(id, updated);
  return updated;
}

export function deleteLead(id: string): boolean {
  return leads.delete(id);
}

export function getLeadSummary(): LeadSummary {
  const allLeads = listLeads();
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().replace("T", " ").slice(0, 19);

  const byStatus: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  const byConsultType: Record<string, number> = {};
  let todayCount = 0;
  let weekCount = 0;

  for (const l of allLeads) {
    byStatus[l.status] = (byStatus[l.status] || 0) + 1;
    const src = l.utm.utmSource || "direct";
    bySource[src] = (bySource[src] || 0) + 1;
    byConsultType[l.consultType] = (byConsultType[l.consultType] || 0) + 1;
    if (l.createdAt.startsWith(today)) todayCount++;
    if (l.createdAt >= weekAgo) weekCount++;
  }

  return { total: allLeads.length, byStatus, bySource, byConsultType, todayCount, weekCount };
}

// ===== AdCampaign (광고 캠페인) =====
export function createCampaign(data: AdCampaignCreate): AdCampaign {
  const id = genId("camp");
  const ts = now();
  const campaign: AdCampaign = {
    id,
    name: data.name,
    platform: data.platform,
    metaCampaignId: data.metaCampaignId ?? null,
    budget: data.budget ?? 0,
    startDate: data.startDate,
    endDate: data.endDate ?? null,
    landingUrl: data.landingUrl,
    utmSource: data.utmSource ?? "th",
    utmMedium: data.utmMedium ?? "paid",
    utmCampaign: data.utmCampaign ?? id,
    status: "활성",
    leads: 0,
    spent: 0,
    createdAt: ts,
    updatedAt: ts,
  };
  campaigns.set(id, campaign);
  return campaign;
}

export function getCampaign(id: string): AdCampaign | null {
  return campaigns.get(id) ?? null;
}

export function listCampaigns(): AdCampaign[] {
  const result: AdCampaign[] = [];
  for (const c of campaigns.values()) {
    result.push(c);
  }
  return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function updateCampaign(id: string, data: AdCampaignUpdate): AdCampaign | null {
  const c = campaigns.get(id);
  if (!c) return null;
  const updated: AdCampaign = {
    ...c,
    ...(data.name !== undefined && { name: data.name }),
    ...(data.budget !== undefined && { budget: data.budget }),
    ...(data.endDate !== undefined && { endDate: data.endDate }),
    ...(data.status !== undefined && { status: data.status }),
    ...(data.spent !== undefined && { spent: data.spent }),
    updatedAt: now(),
  };
  campaigns.set(id, updated);
  return updated;
}

export function deleteCampaign(id: string): boolean {
  return campaigns.delete(id);
}
