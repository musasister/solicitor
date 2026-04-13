"""계산 엔진 - 라이프니츠 계수, 현재가치 계산

법정이율 5% (연) 기반 현재가치 산정
PV(n) = M × (3 + 라이프니츠(n-3))

여기서:
  M = 월변제액
  n = 변제기간 (월)
  3 = 초기 3개월 (할인 없이 전액)
  라이프니츠(k) = 나머지 k개월의 현재가치 계수
"""

from dataclasses import dataclass

# 법정이율: 연 5% (민법 제379조)
LEGAL_ANNUAL_RATE = 0.05
LEGAL_MONTHLY_RATE = LEGAL_ANNUAL_RATE / 12


@dataclass
class PresentValueResult:
    """현재가치 계산 결과"""
    monthly_repayment: int
    repayment_months: int
    leibniz_coefficient: float
    pv_factor: float  # 3 + 라이프니츠(n-3)
    present_value: int
    initial_months: int = 3  # 할인 미적용 초기 개월수


class Calculator:
    """개인회생 계산 엔진

    AI 사용 금지 - 모든 계산은 확정적 알고리즘으로 수행
    """

    def __init__(self, annual_rate: float = LEGAL_ANNUAL_RATE):
        self.annual_rate = annual_rate
        self.monthly_rate = annual_rate / 12

    def leibniz_coefficient(self, months: int) -> float:
        """라이프니츠 계수 (현가계수) 계산

        L(n) = Σ(k=1~n) [1/(1+r)^k]
             = [1 - (1+r)^(-n)] / r

        Args:
            months: 할인 적용 기간 (월)

        Returns:
            라이프니츠 계수
        """
        if months <= 0:
            return 0.0
        r = self.monthly_rate
        return (1 - (1 + r) ** (-months)) / r

    def present_value(self, monthly_repayment: int, repayment_months: int,
                      initial_months: int = 3) -> PresentValueResult:
        """현재가치 계산

        PV(n) = M × (initial_months + 라이프니츠(n - initial_months))

        초기 initial_months개월은 할인 없이 전액 인정,
        나머지 기간은 라이프니츠 계수로 할인

        Args:
            monthly_repayment: 월변제액 (원)
            repayment_months: 총 변제기간 (월, 36~60)
            initial_months: 할인 미적용 초기 기간 (기본 3개월)

        Returns:
            PresentValueResult
        """
        discounted_months = max(0, repayment_months - initial_months)
        leibniz = self.leibniz_coefficient(discounted_months)
        pv_factor = initial_months + leibniz
        pv = int(monthly_repayment * pv_factor)

        return PresentValueResult(
            monthly_repayment=monthly_repayment,
            repayment_months=repayment_months,
            leibniz_coefficient=round(leibniz, 6),
            pv_factor=round(pv_factor, 6),
            present_value=pv,
            initial_months=initial_months,
        )

    def minimum_monthly_repayment(self, liquidation_value: int,
                                  repayment_months: int,
                                  initial_months: int = 3) -> int:
        """최소 월변제액 계산

        M ≥ 청산가치 / (initial_months + 라이프니츠(n - initial_months))

        Args:
            liquidation_value: 청산가치 (원)
            repayment_months: 변제기간 (월)
            initial_months: 할인 미적용 초기 기간

        Returns:
            최소 월변제액 (원, 올림)
        """
        discounted_months = max(0, repayment_months - initial_months)
        leibniz = self.leibniz_coefficient(discounted_months)
        pv_factor = initial_months + leibniz

        if pv_factor <= 0:
            return liquidation_value

        import math
        return math.ceil(liquidation_value / pv_factor)

    def total_repayment(self, monthly_repayment: int, repayment_months: int) -> int:
        """총 변제액 (명목가치)"""
        return monthly_repayment * repayment_months

    def repayment_rate(self, total_repayment: int, total_claims: int) -> float:
        """변제율 계산

        Args:
            total_repayment: 총 변제액
            total_claims: 총 채권액

        Returns:
            변제율 (0.0 ~ 1.0)
        """
        if total_claims <= 0:
            return 0.0
        return min(1.0, total_repayment / total_claims)
