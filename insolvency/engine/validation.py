"""정합성 검증 엔진

핵심 검증 규칙:
  1. 현재가치 ≥ 청산가치 (R-PLAN-002)
  2. 보정재산 ≤ 허용 최대값 (R-ADJ-001)
  3. 60개월 내 변제 가능 여부 (R-ADJ-002)
  4. 월변제액 충분성 (R-ADJ-003)
  5. 필수 증빙 존재 여부 (E-REQ-001)

AI 사용 금지 - 모든 검증은 확정적 규칙으로 수행
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

from ..models.case import Case
from ..models.claim import Claim
from ..models.property import Property
from ..models.evidence import Evidence
from .calculator import Calculator


class ErrorCode(str, Enum):
    """검증 에러 코드"""
    PV_LESS_THAN_LIQUIDATION = "R-PLAN-002"    # 현재가치 < 청산가치
    ADJUSTMENT_EXCEEDED = "R-ADJ-001"          # 보정재산 초과
    EXTEND_TO_60_POSSIBLE = "R-ADJ-002"        # 60개월 연장 시 가능
    MONTHLY_REPAYMENT_SHORT = "R-ADJ-003"      # 월변제액 부족
    EVIDENCE_MISSING = "E-REQ-001"             # 증빙 누락


@dataclass
class ValidationError:
    """검증 에러 상세"""
    code: ErrorCode
    message: str
    details: dict = field(default_factory=dict)


@dataclass
class ValidationResult:
    """검증 결과"""
    valid: bool
    errors: list[ValidationError] = field(default_factory=list)
    warnings: list[ValidationError] = field(default_factory=list)
    summary: dict = field(default_factory=dict)


class ValidationEngine:
    """정합성 검증 엔진

    역할: 계산과 검증을 수행 (AI 금지)
    """

    def __init__(self, calculator: Optional[Calculator] = None):
        self.calc = calculator or Calculator()

    def validate_case(self, case: Case, claims: list[Claim],
                      properties: list[Property],
                      evidences: list[Evidence]) -> ValidationResult:
        """사건 전체 정합성 검증

        Args:
            case: 사건 정보
            claims: 채권 목록
            properties: 재산 목록
            evidences: 증빙 목록

        Returns:
            ValidationResult
        """
        errors: list[ValidationError] = []
        warnings: list[ValidationError] = []

        # 총 채권액 계산
        total_claims = sum(c.total for c in claims)
        secured_claims = sum(c.total for c in claims if c.secured)
        unsecured_claims = total_claims - secured_claims

        # 청산가치 계산
        explicit_property_value = sum(
            p.liquidation_value for p in properties if not p.is_adjustment
        )
        adjustment_value = sum(
            p.liquidation_value for p in properties if p.is_adjustment
        )
        total_liquidation = explicit_property_value + adjustment_value

        # 현재가치 계산
        pv_result = self.calc.present_value(
            case.monthly_repayment, case.repayment_months
        )
        present_value = pv_result.present_value

        # === 검증 1: 현재가치 ≥ 청산가치 ===
        if present_value < total_liquidation:
            # 60개월 연장 시 해결 가능한지 확인
            if case.repayment_months < 60:
                pv_60 = self.calc.present_value(case.monthly_repayment, 60)
                if pv_60.present_value >= total_liquidation:
                    warnings.append(ValidationError(
                        code=ErrorCode.EXTEND_TO_60_POSSIBLE,
                        message="현재 변제기간으로는 청산가치를 충족하지 못하나, "
                                "60개월 연장 시 충족 가능합니다.",
                        details={
                            "current_months": case.repayment_months,
                            "current_pv": present_value,
                            "pv_at_60": pv_60.present_value,
                            "liquidation_value": total_liquidation,
                        },
                    ))
                else:
                    errors.append(ValidationError(
                        code=ErrorCode.PV_LESS_THAN_LIQUIDATION,
                        message=f"현재가치({present_value:,}원)가 "
                                f"청산가치({total_liquidation:,}원)보다 작습니다. "
                                f"60개월 연장으로도 해결 불가.",
                        details={
                            "present_value": present_value,
                            "liquidation_value": total_liquidation,
                            "shortfall": total_liquidation - present_value,
                        },
                    ))
            else:
                errors.append(ValidationError(
                    code=ErrorCode.PV_LESS_THAN_LIQUIDATION,
                    message=f"현재가치({present_value:,}원)가 "
                            f"청산가치({total_liquidation:,}원)보다 작습니다.",
                    details={
                        "present_value": present_value,
                        "liquidation_value": total_liquidation,
                        "shortfall": total_liquidation - present_value,
                    },
                ))

        # === 검증 2: 보정재산 통제 ===
        adj_max = max(0, present_value - explicit_property_value)
        if adjustment_value > adj_max:
            errors.append(ValidationError(
                code=ErrorCode.ADJUSTMENT_EXCEEDED,
                message=f"보정재산({adjustment_value:,}원)이 "
                        f"허용 최대값({adj_max:,}원)을 초과합니다.",
                details={
                    "adjustment_value": adjustment_value,
                    "adjustment_max": adj_max,
                    "present_value": present_value,
                    "explicit_property": explicit_property_value,
                    "excess": adjustment_value - adj_max,
                },
            ))

        # === 검증 3: 월변제액 충분성 ===
        if total_liquidation > 0:
            min_monthly = self.calc.minimum_monthly_repayment(
                total_liquidation, case.repayment_months
            )
            if case.monthly_repayment < min_monthly:
                errors.append(ValidationError(
                    code=ErrorCode.MONTHLY_REPAYMENT_SHORT,
                    message=f"월변제액({case.monthly_repayment:,}원)이 "
                            f"최소 필요액({min_monthly:,}원)보다 부족합니다.",
                    details={
                        "monthly_repayment": case.monthly_repayment,
                        "minimum_required": min_monthly,
                        "shortfall": min_monthly - case.monthly_repayment,
                    },
                ))

        # === 검증 4: 증빙 검증 ===
        claims_without_evidence = [
            c for c in claims if not c.evidence_ids
        ]
        if claims_without_evidence:
            warnings.append(ValidationError(
                code=ErrorCode.EVIDENCE_MISSING,
                message=f"증빙이 연결되지 않은 채권이 {len(claims_without_evidence)}건 있습니다.",
                details={
                    "missing_claims": [
                        {"claim_number": c.claim_number, "creditor": c.creditor_name}
                        for c in claims_without_evidence
                    ],
                },
            ))

        # 요약
        total_nominal = self.calc.total_repayment(
            case.monthly_repayment, case.repayment_months
        )
        repayment_rate = self.calc.repayment_rate(total_nominal, unsecured_claims)

        summary = {
            "total_claims": total_claims,
            "secured_claims": secured_claims,
            "unsecured_claims": unsecured_claims,
            "explicit_property_value": explicit_property_value,
            "adjustment_value": adjustment_value,
            "total_liquidation_value": total_liquidation,
            "present_value": present_value,
            "pv_factor": pv_result.pv_factor,
            "leibniz_coefficient": pv_result.leibniz_coefficient,
            "total_nominal_repayment": total_nominal,
            "repayment_rate": round(repayment_rate * 100, 2),
            "monthly_repayment": case.monthly_repayment,
            "repayment_months": case.repayment_months,
            "pv_ge_liquidation": present_value >= total_liquidation,
            "adjustment_within_limit": adjustment_value <= adj_max,
        }

        has_blocking_errors = any(
            e.code in (
                ErrorCode.PV_LESS_THAN_LIQUIDATION,
                ErrorCode.ADJUSTMENT_EXCEEDED,
                ErrorCode.MONTHLY_REPAYMENT_SHORT,
            )
            for e in errors
        )

        return ValidationResult(
            valid=not has_blocking_errors,
            errors=errors,
            warnings=warnings,
            summary=summary,
        )
