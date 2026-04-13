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
