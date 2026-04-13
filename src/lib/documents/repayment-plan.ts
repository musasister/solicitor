/**
 * 변제계획안 생성기 - 법원 양식
 */

import { presentValue, totalRepayment, repaymentRate, LEGAL_MONTHLY_RATE } from "../engine/calculator";
import type { Case, Claim, Property } from "../db/types";

export interface RepaymentScheduleRow {
  month: number;
  paymentAmount: number;
  cumulative: number;
  presentValueAmount: number;
}

export interface RepaymentPlanDocument {
  caseNumber: string | null;
  debtorName: string;
  totalClaims: number;
  unsecuredClaims: number;
  monthlyRepayment: number;
  repaymentMonths: number;
  totalRepaymentAmt: number;
  presentValueAmt: number;
  liquidationValue: number;
  repaymentRatePct: number;
  pvGeLiquidation: boolean;
  schedule: RepaymentScheduleRow[];
}

export function generateRepaymentPlan(
  cs: Case,
  claims: Claim[],
  props: Property[]
): RepaymentPlanDocument {
  const totalClaimsAmt = claims.reduce((s, c) => s + c.total, 0);
  const securedClaims = claims.filter((c) => c.secured).reduce((s, c) => s + c.total, 0);
  const unsecuredClaims = totalClaimsAmt - securedClaims;

  const totalRepay = totalRepayment(cs.monthlyRepayment, cs.repaymentMonths);
  const pvResult = presentValue(cs.monthlyRepayment, cs.repaymentMonths);
  const liquidation = props.reduce((s, p) => s + p.liquidationValue, 0);
  const rate = repaymentRate(totalRepay, unsecuredClaims);

  const schedule: RepaymentScheduleRow[] = [];
  let cumulative = 0;
  for (let m = 1; m <= cs.repaymentMonths; m++) {
    cumulative += cs.monthlyRepayment;
    let pv: number;
    if (m <= 3) {
      pv = cs.monthlyRepayment;
    } else {
      pv = Math.floor(cs.monthlyRepayment / Math.pow(1 + LEGAL_MONTHLY_RATE, m - 3));
    }
    schedule.push({
      month: m,
      paymentAmount: cs.monthlyRepayment,
      cumulative,
      presentValueAmount: pv,
    });
  }

  return {
    caseNumber: cs.caseNumber,
    debtorName: cs.debtorName,
    totalClaims: totalClaimsAmt,
    unsecuredClaims,
    monthlyRepayment: cs.monthlyRepayment,
    repaymentMonths: cs.repaymentMonths,
    totalRepaymentAmt: totalRepay,
    presentValueAmt: pvResult.presentValue,
    liquidationValue: liquidation,
    repaymentRatePct: Math.round(rate * 10000) / 100,
    pvGeLiquidation: pvResult.presentValue >= liquidation,
    schedule,
  };
}
