/**
 * 보정재산 통제 엔진
 *
 * Adj_max = 현재가치 - 명시적 재산
 * Adj ≤ Adj_max → 허용
 * Adj > Adj_max → 차단
 */

import { presentValue } from "./calculator";

export interface AdjustmentCheckResult {
  allowed: boolean;
  adjustmentValue: number;
  adjustmentMax: number;
  presentValue: number;
  explicitPropertyValue: number;
  excess: number;
  message: string;
}

export function checkAdjustment(
  monthlyRepayment: number,
  repaymentMonths: number,
  explicitPropertyValue: number,
  adjustmentValue: number
): AdjustmentCheckResult {
  const pvResult = presentValue(monthlyRepayment, repaymentMonths);
  const pv = pvResult.presentValue;
  const adjMax = Math.max(0, pv - explicitPropertyValue);
  const excess = Math.max(0, adjustmentValue - adjMax);
  const allowed = adjustmentValue <= adjMax;

  const message = allowed
    ? `보정재산(${adjustmentValue.toLocaleString()}원)이 허용 범위(${adjMax.toLocaleString()}원) 이내입니다.`
    : `보정재산(${adjustmentValue.toLocaleString()}원)이 허용 최대값(${adjMax.toLocaleString()}원)을 ${excess.toLocaleString()}원 초과합니다. 저장이 차단됩니다.`;

  return {
    allowed,
    adjustmentValue,
    adjustmentMax: adjMax,
    presentValue: pv,
    explicitPropertyValue,
    excess,
    message,
  };
}

export function maximumAdjustment(
  monthlyRepayment: number,
  repaymentMonths: number,
  explicitPropertyValue: number
): number {
  const pvResult = presentValue(monthlyRepayment, repaymentMonths);
  return Math.max(0, pvResult.presentValue - explicitPropertyValue);
}
