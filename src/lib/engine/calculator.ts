/**
 * 계산 엔진 - 라이프니츠 계수, 현재가치 계산
 *
 * 법정이율 5% (연) 기반 현재가치 산정
 * PV(n) = M × (3 + 라이프니츠(n-3))
 */

export const LEGAL_ANNUAL_RATE = 0.05;
export const LEGAL_MONTHLY_RATE = LEGAL_ANNUAL_RATE / 12;

export interface PresentValueResult {
  monthlyRepayment: number;
  repaymentMonths: number;
  leibnizCoefficient: number;
  pvFactor: number;
  presentValue: number;
  initialMonths: number;
}

/**
 * 라이프니츠 계수 (현가계수)
 * L(n) = [1 - (1+r)^(-n)] / r
 */
export function leibnizCoefficient(
  months: number,
  monthlyRate: number = LEGAL_MONTHLY_RATE
): number {
  if (months <= 0) return 0;
  return (1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate;
}

/**
 * 현재가치 계산
 * PV(n) = M × (initialMonths + 라이프니츠(n - initialMonths))
 */
export function presentValue(
  monthlyRepayment: number,
  repaymentMonths: number,
  initialMonths: number = 3
): PresentValueResult {
  const discountedMonths = Math.max(0, repaymentMonths - initialMonths);
  const leibniz = leibnizCoefficient(discountedMonths);
  const pvFactor = initialMonths + leibniz;
  const pv = Math.floor(monthlyRepayment * pvFactor);

  return {
    monthlyRepayment,
    repaymentMonths,
    leibnizCoefficient: Math.round(leibniz * 1e6) / 1e6,
    pvFactor: Math.round(pvFactor * 1e6) / 1e6,
    presentValue: pv,
    initialMonths,
  };
}

/**
 * 최소 월변제액
 * M ≥ 청산가치 / (initialMonths + 라이프니츠(n - initialMonths))
 */
export function minimumMonthlyRepayment(
  liquidationValue: number,
  repaymentMonths: number,
  initialMonths: number = 3
): number {
  const discountedMonths = Math.max(0, repaymentMonths - initialMonths);
  const leibniz = leibnizCoefficient(discountedMonths);
  const pvFactor = initialMonths + leibniz;
  if (pvFactor <= 0) return liquidationValue;
  return Math.ceil(liquidationValue / pvFactor);
}

/** 총 변제액 (명목가치) */
export function totalRepayment(
  monthlyRepayment: number,
  repaymentMonths: number
): number {
  return monthlyRepayment * repaymentMonths;
}

/** 변제율 (0~1) */
export function repaymentRate(
  totalRepay: number,
  totalClaims: number
): number {
  if (totalClaims <= 0) return 0;
  return Math.min(1.0, totalRepay / totalClaims);
}
