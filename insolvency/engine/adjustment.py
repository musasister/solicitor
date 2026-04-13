"""보정재산 통제 엔진

핵심 규칙:
  Adj_max = 현재가치 - 명시적 재산
  Adj ≤ Adj_max → 저장 허용
  Adj > Adj_max → 저장 차단

보정재산 남용을 원천 차단하기 위한 엔진
"""

from dataclasses import dataclass
from typing import Optional

from .calculator import Calculator


@dataclass
class AdjustmentCheckResult:
    """보정재산 검증 결과"""
    allowed: bool
    adjustment_value: int
    adjustment_max: int
    present_value: int
    explicit_property_value: int
    excess: int  # 초과분 (0이면 허용)
    message: str


class AdjustmentEngine:
    """보정재산 통제 엔진

    현재가치에서 명시적 재산을 차감한 나머지가
    보정재산의 허용 상한선.
    이를 초과하면 저장을 차단.
    """

    def __init__(self, calculator: Optional[Calculator] = None):
        self.calc = calculator or Calculator()

    def check(self, monthly_repayment: int, repayment_months: int,
              explicit_property_value: int,
              adjustment_value: int) -> AdjustmentCheckResult:
        """보정재산 허용 여부 검증

        Args:
            monthly_repayment: 월변제액
            repayment_months: 변제기간 (월)
            explicit_property_value: 명시적 재산 합계
            adjustment_value: 보정재산 합계

        Returns:
            AdjustmentCheckResult
        """
        pv_result = self.calc.present_value(monthly_repayment, repayment_months)
        present_value = pv_result.present_value

        adj_max = max(0, present_value - explicit_property_value)
        excess = max(0, adjustment_value - adj_max)
        allowed = adjustment_value <= adj_max

        if allowed:
            message = (
                f"보정재산({adjustment_value:,}원)이 "
                f"허용 범위({adj_max:,}원) 이내입니다."
            )
        else:
            message = (
                f"보정재산({adjustment_value:,}원)이 "
                f"허용 최대값({adj_max:,}원)을 "
                f"{excess:,}원 초과합니다. 저장이 차단됩니다."
            )

        return AdjustmentCheckResult(
            allowed=allowed,
            adjustment_value=adjustment_value,
            adjustment_max=adj_max,
            present_value=present_value,
            explicit_property_value=explicit_property_value,
            excess=excess,
            message=message,
        )

    def maximum_adjustment(self, monthly_repayment: int,
                           repayment_months: int,
                           explicit_property_value: int) -> int:
        """허용 가능한 최대 보정재산 계산

        Adj_max = PV - 명시적 재산

        Args:
            monthly_repayment: 월변제액
            repayment_months: 변제기간
            explicit_property_value: 명시적 재산 합계

        Returns:
            최대 보정재산 (원)
        """
        pv_result = self.calc.present_value(monthly_repayment, repayment_months)
        return max(0, pv_result.present_value - explicit_property_value)
