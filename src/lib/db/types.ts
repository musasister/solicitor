/** 데이터 모델 타입 정의 */

export interface Case {
  id: string;
  caseNumber: string | null;
  debtorName: string;
  debtorBirth: string;
  debtorIdLast: string | null;
  filingDate: string | null;
  referenceDate: string;
  courtName: string | null;
  repaymentMonths: number;
  monthlyIncome: number;
  monthlyExpense: number;
  monthlyRepayment: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseCreate {
  caseNumber?: string | null;
  debtorName: string;
  debtorBirth: string;
  debtorIdLast?: string | null;
  filingDate?: string | null;
  referenceDate: string;
  courtName?: string | null;
  repaymentMonths?: number;
  monthlyIncome?: number;
  monthlyExpense?: number;
  monthlyRepayment?: number;
}

export interface CaseUpdate {
  caseNumber?: string | null;
  debtorName?: string;
  debtorBirth?: string;
  debtorIdLast?: string | null;
  filingDate?: string | null;
  referenceDate?: string;
  courtName?: string | null;
  repaymentMonths?: number;
  monthlyIncome?: number;
  monthlyExpense?: number;
  monthlyRepayment?: number;
  status?: string;
}

/**
 * 채권 - 핵심 단위
 * 채무 1개 = 채권 1건 = 채권자목록 1행
 * 같은 채권자명 반복 허용
 */
export interface Claim {
  id: string;
  caseId: string;
  claimNumber: number;
  creditorName: string;
  causeDate: string;
  debtType: string;
  causeDetail: string | null;
  principal: number;
  interest: number;
  penalty: number;
  total: number;
  secured: boolean;
  priority: boolean;
  evidenceIds: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClaimCreate {
  caseId: string;
  creditorName: string;
  causeDate: string;
  debtType: string;
  causeDetail?: string | null;
  principal: number;
  interest?: number;
  penalty?: number;
  secured?: boolean;
  priority?: boolean;
  evidenceIds?: string[];
}

export interface ClaimUpdate {
  creditorName?: string;
  causeDate?: string;
  debtType?: string;
  causeDetail?: string | null;
  principal?: number;
  interest?: number;
  penalty?: number;
  secured?: boolean;
  priority?: boolean;
  status?: string;
  evidenceIds?: string[];
}

export interface Property {
  id: string;
  caseId: string;
  propertyType: string;
  description: string;
  appraisedValue: number;
  liquidationValue: number;
  isAdjustment: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyCreate {
  caseId: string;
  propertyType: string;
  description: string;
  appraisedValue?: number;
  liquidationValue?: number;
  isAdjustment?: boolean;
  note?: string | null;
}

export interface PropertyUpdate {
  propertyType?: string;
  description?: string;
  appraisedValue?: number;
  liquidationValue?: number;
  isAdjustment?: boolean;
  note?: string | null;
}

export interface Evidence {
  id: string;
  caseId: string;
  claimId: string | null;
  evidenceType: string;
  description: string | null;
  filePath: string | null;
  validFrom: string | null;
  validUntil: string | null;
  status: string;
  createdAt: string;
}

export interface EvidenceCreate {
  caseId: string;
  claimId?: string | null;
  evidenceType: string;
  description?: string | null;
  filePath?: string | null;
  validFrom?: string | null;
  validUntil?: string | null;
}

export interface CaseSummary {
  id: string;
  caseNumber: string | null;
  debtorName: string;
  status: string;
  totalClaims: number;
  totalClaimAmount: number;
  createdAt: string;
}

// ===== Threads 광고 리드 =====

export interface UTMParams {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  utmId: string | null;
  fbclid: string | null;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  debtRange: string | null;
  consultType: string;
  memo: string | null;
  utm: UTMParams;
  status: string;      // 신규 | 상담중 | 완료 | 미전환
  assignedTo: string | null;
  caseId: string | null; // 연결된 사건 ID
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadCreate {
  name: string;
  phone: string;
  debtRange?: string | null;
  consultType?: string;
  memo?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
  utmTerm?: string | null;
  utmId?: string | null;
  fbclid?: string | null;
}

export interface LeadUpdate {
  status?: string;
  assignedTo?: string | null;
  caseId?: string | null;
  note?: string | null;
}

export interface LeadSummary {
  total: number;
  byStatus: Record<string, number>;
  bySource: Record<string, number>;
  byConsultType: Record<string, number>;
  todayCount: number;
  weekCount: number;
}

// ===== 광고 캠페인 =====

export interface AdCampaign {
  id: string;
  name: string;
  platform: string;       // threads | instagram | facebook
  metaCampaignId: string | null;
  budget: number;
  startDate: string;
  endDate: string | null;
  landingUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  status: string;         // 활성 | 일시중지 | 종료
  leads: number;
  spent: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdCampaignCreate {
  name: string;
  platform: string;
  metaCampaignId?: string | null;
  budget?: number;
  startDate: string;
  endDate?: string | null;
  landingUrl: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export interface AdCampaignUpdate {
  name?: string;
  budget?: number;
  endDate?: string | null;
  status?: string;
  spent?: number;
}
