/**
 * 정합성 검증 엔진
 *
 * 검증 규칙:
 *   R-PLAN-002: 현재가치 < 청산가치
 *   R-ADJ-001:  보정재산 초과
 *   R-ADJ-002:  60개월 연장 시 가능
 *   R-ADJ-003:  월변제액 부족
 *   E-REQ-001:  증빙 누락
 */

import {
  presentValue,
  minimumMonthlyRepayment,
  totalRepayment,
  repaymentRate,
} from "./calculator";
import type { Case, Claim, Property } from "../db/types";

export type ErrorCode =
  | "R-PLAN-002"
  | "R-ADJ-001"
  | "R-ADJ-002"
  | "R-ADJ-003"
  | "E-REQ-001";

export interface ValidationError {
  code: ErrorCode;
  message: string;
  details: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: Record<string, unknown>;
}

export function validateCase(
  cs: Case,
  claims: Claim[],
  properties: Property[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const totalClaimsAmt = claims.reduce((s, c) => s + c.total, 0);
  const securedClaims = claims
    .filter((c) => c.secured)
    .reduce((s, c) => s + c.total, 0);
  const unsecuredClaims = totalClaimsAmt - securedClaims;

  const explicitPropertyValue = properties
    .filter((p) => !p.isAdjustment)
    .reduce((s, p) => s + p.liquidationValue, 0);
  const adjustmentValue = properties
    .filter((p) => p.isAdjustment)
    .reduce((s, p) => s + p.liquidationValue, 0);
  const totalLiquidation = explicitPropertyValue + adjustmentValue;

  const pvResult = presentValue(cs.monthlyRepayment, cs.repaymentMonths);
  const pv = pvResult.presentValue;

  // 검증 1: 현재가치 ≥ 청산가치
  if (pv < totalLiquidation) {
    if (cs.repaymentMonths < 60) {
      const pv60 = presentValue(cs.monthlyRepayment, 60);
      if (pv60.presentValue >= totalLiquidation) {
        warnings.push({
          code: "R-ADJ-002",
          message:
            "현재 변제기간으로는 청산가치를 충족하지 못하나, 60개월 연장 시 충족 가능합니다.",
          details: {
            currentMonths: cs.repaymentMonths,
            currentPv: pv,
            pvAt60: pv60.presentValue,
            liquidationValue: totalLiquidation,
          },
        });
      } else {
        errors.push({
          code: "R-PLAN-002",
          message: `현재가치(${pv.toLocaleString()}원)가 청산가치(${totalLiquidation.toLocaleString()}원)보다 작습니다. 60개월 연장으로도 해결 불가.`,
          details: {
            presentValue: pv,
            liquidationValue: totalLiquidation,
            shortfall: totalLiquidation - pv,
          },
        });
      }
    } else {
      errors.push({
        code: "R-PLAN-002",
        message: `현재가치(${pv.toLocaleString()}원)가 청산가치(${totalLiquidation.toLocaleString()}원)보다 작습니다.`,
        details: {
          presentValue: pv,
          liquidationValue: totalLiquidation,
          shortfall: totalLiquidation - pv,
        },
      });
    }
  }

  // 검증 2: 보정재산 통제
  const adjMax = Math.max(0, pv - explicitPropertyValue);
  if (adjustmentValue > adjMax) {
    errors.push({
      code: "R-ADJ-001",
      message: `보정재산(${adjustmentValue.toLocaleString()}원)이 허용 최대값(${adjMax.toLocaleString()}원)을 초과합니다.`,
      details: {
        adjustmentValue,
        adjustmentMax: adjMax,
        presentValue: pv,
        explicitProperty: explicitPropertyValue,
        excess: adjustmentValue - adjMax,
      },
    });
  }

  // 검증 3: 월변제액 충분성
  if (totalLiquidation > 0) {
    const minMonthly = minimumMonthlyRepayment(
      totalLiquidation,
      cs.repaymentMonths
    );
    if (cs.monthlyRepayment < minMonthly) {
      errors.push({
        code: "R-ADJ-003",
        message: `월변제액(${cs.monthlyRepayment.toLocaleString()}원)이 최소 필요액(${minMonthly.toLocaleString()}원)보다 부족합니다.`,
        details: {
          monthlyRepayment: cs.monthlyRepayment,
          minimumRequired: minMonthly,
          shortfall: minMonthly - cs.monthlyRepayment,
        },
      });
    }
  }

  // 검증 4: 증빙 누락 (경고)
  const claimsWithoutEvidence = claims.filter(
    (c) => !c.evidenceIds || c.evidenceIds.length === 0
  );
  if (claimsWithoutEvidence.length > 0) {
    warnings.push({
      code: "E-REQ-001",
      message: `증빙이 연결되지 않은 채권이 ${claimsWithoutEvidence.length}건 있습니다.`,
      details: {
        missingClaims: claimsWithoutEvidence.map((c) => ({
          claimNumber: c.claimNumber,
          creditor: c.creditorName,
        })),
      },
    });
  }

  const totalNominal = totalRepayment(cs.monthlyRepayment, cs.repaymentMonths);
  const rate = repaymentRate(totalNominal, unsecuredClaims);

  const summary = {
    totalClaims: totalClaimsAmt,
    securedClaims,
    unsecuredClaims,
    explicitPropertyValue,
    adjustmentValue,
    totalLiquidationValue: totalLiquidation,
    presentValue: pv,
    pvFactor: pvResult.pvFactor,
    leibnizCoefficient: pvResult.leibnizCoefficient,
    totalNominalRepayment: totalNominal,
    repaymentRate: Math.round(rate * 10000) / 100,
    monthlyRepayment: cs.monthlyRepayment,
    repaymentMonths: cs.repaymentMonths,
    pvGeLiquidation: pv >= totalLiquidation,
    adjustmentWithinLimit: adjustmentValue <= adjMax,
  };

  const hasBlockingErrors = errors.some((e) =>
    ["R-PLAN-002", "R-ADJ-001", "R-ADJ-003"].includes(e.code)
  );

  return { valid: !hasBlockingErrors, errors, warnings, summary };
}
