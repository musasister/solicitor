"""정합성 검증 엔진 테스트"""

import pytest
from datetime import date

from insolvency.engine.validation import ValidationEngine, ErrorCode
from insolvency.engine.calculator import Calculator
from insolvency.models.case import Case, CaseStatus
from insolvency.models.claim import Claim, ClaimStatus
from insolvency.models.property import Property
from insolvency.models.evidence import Evidence


def make_case(**kwargs) -> Case:
    defaults = {
        "id": "case_test1",
        "debtor_name": "홍길동",
        "debtor_birth": "1985-03-15",
        "reference_date": "2026-04-14",
        "repayment_months": 36,
        "monthly_income": 3_000_000,
        "monthly_expense": 2_500_000,
        "monthly_repayment": 500_000,
        "status": CaseStatus.DRAFT,
    }
    defaults.update(kwargs)
    return Case(**defaults)


def make_claim(**kwargs) -> Claim:
    defaults = {
        "id": "cl_test1",
        "case_id": "case_test1",
        "claim_number": 1,
        "creditor_name": "KB국민카드",
        "cause_date": "2024-01-23",
        "debt_type": "대출금",
        "principal": 5_000_000,
        "interest": 300_000,
        "penalty": 0,
        "total": 5_300_000,
        "secured": False,
        "priority": False,
        "evidence_ids": ["ev_001"],
        "status": ClaimStatus.CONFIRMED,
    }
    defaults.update(kwargs)
    return Claim(**defaults)


def make_property(**kwargs) -> Property:
    defaults = {
        "id": "prop_test1",
        "case_id": "case_test1",
        "property_type": "예금",
        "description": "국민은행 보통예금",
        "appraised_value": 1_000_000,
        "liquidation_value": 1_000_000,
        "is_adjustment": False,
    }
    defaults.update(kwargs)
    return Property(**defaults)


@pytest.fixture
def engine():
    return ValidationEngine()


class TestPVValidation:
    """현재가치 ≥ 청산가치 검증"""

    def test_pv_sufficient(self, engine):
        """현재가치가 청산가치 이상이면 통과"""
        case = make_case(monthly_repayment=500_000, repayment_months=36)
        claims = [make_claim(principal=5_000_000, interest=300_000, total=5_300_000)]
        props = [make_property(liquidation_value=1_000_000)]

        result = engine.validate_case(case, claims, props, [])
        assert result.valid
        assert result.summary["pv_ge_liquidation"]

    def test_pv_insufficient(self, engine):
        """현재가치가 청산가치보다 작으면 에러"""
        case = make_case(monthly_repayment=100_000, repayment_months=36)
        claims = [make_claim()]
        props = [make_property(liquidation_value=10_000_000)]

        result = engine.validate_case(case, claims, props, [])
        assert not result.valid
        error_codes = [e.code for e in result.errors]
        assert ErrorCode.PV_LESS_THAN_LIQUIDATION in error_codes

    def test_pv_insufficient_but_60_month_possible(self, engine):
        """36개월로는 부족하지만 60개월이면 가능한 경우 경고"""
        # 60개월 PV > 청산가치 > 36개월 PV가 되는 값
        calc = Calculator()
        pv36 = calc.present_value(300_000, 36)
        pv60 = calc.present_value(300_000, 60)
        target = (pv36.present_value + pv60.present_value) // 2

        case = make_case(monthly_repayment=300_000, repayment_months=36)
        claims = [make_claim()]
        props = [make_property(liquidation_value=target)]

        result = engine.validate_case(case, claims, props, [])
        warning_codes = [w.code for w in result.warnings]
        assert ErrorCode.EXTEND_TO_60_POSSIBLE in warning_codes


class TestAdjustmentValidation:
    """보정재산 통제 검증"""

    def test_adjustment_within_limit(self, engine):
        """보정재산이 허용 범위 내"""
        case = make_case(monthly_repayment=500_000, repayment_months=36)
        claims = [make_claim()]
        explicit_prop = make_property(liquidation_value=1_000_000, is_adjustment=False)
        adj_prop = make_property(
            id="prop_adj1",
            liquidation_value=500_000,
            is_adjustment=True,
        )

        result = engine.validate_case(case, claims, [explicit_prop, adj_prop], [])
        assert result.summary["adjustment_within_limit"]

    def test_adjustment_exceeded(self, engine):
        """보정재산이 허용 범위 초과"""
        case = make_case(monthly_repayment=100_000, repayment_months=36)
        claims = [make_claim()]
        explicit_prop = make_property(liquidation_value=2_000_000, is_adjustment=False)
        adj_prop = make_property(
            id="prop_adj1",
            liquidation_value=5_000_000,  # 과도한 보정재산
            is_adjustment=True,
        )

        result = engine.validate_case(case, claims, [explicit_prop, adj_prop], [])
        error_codes = [e.code for e in result.errors]
        assert ErrorCode.ADJUSTMENT_EXCEEDED in error_codes


class TestMonthlyRepaymentValidation:
    """월변제액 충분성 검증"""

    def test_sufficient_repayment(self, engine):
        """월변제액이 충분한 경우"""
        case = make_case(monthly_repayment=500_000, repayment_months=36)
        claims = [make_claim()]
        props = [make_property(liquidation_value=1_000_000)]

        result = engine.validate_case(case, claims, props, [])
        monthly_short_errors = [
            e for e in result.errors if e.code == ErrorCode.MONTHLY_REPAYMENT_SHORT
        ]
        assert len(monthly_short_errors) == 0

    def test_insufficient_repayment(self, engine):
        """월변제액이 부족한 경우"""
        case = make_case(monthly_repayment=10_000, repayment_months=36)
        claims = [make_claim()]
        props = [make_property(liquidation_value=10_000_000)]

        result = engine.validate_case(case, claims, props, [])
        error_codes = [e.code for e in result.errors]
        assert ErrorCode.MONTHLY_REPAYMENT_SHORT in error_codes


class TestEvidenceValidation:
    """증빙 검증"""

    def test_claims_without_evidence(self, engine):
        """증빙이 없는 채권에 대한 경고"""
        case = make_case(monthly_repayment=500_000)
        claims = [
            make_claim(evidence_ids=[]),  # 증빙 없음
        ]
        props = [make_property(liquidation_value=1_000_000)]

        result = engine.validate_case(case, claims, props, [])
        warning_codes = [w.code for w in result.warnings]
        assert ErrorCode.EVIDENCE_MISSING in warning_codes


class TestValidationSummary:
    """검증 요약 테스트"""

    def test_summary_fields(self, engine):
        """요약에 필요한 필드가 모두 포함되는지"""
        case = make_case(monthly_repayment=500_000, repayment_months=36)
        claims = [
            make_claim(principal=5_000_000, interest=300_000, total=5_300_000),
            make_claim(
                id="cl_test2", claim_number=2,
                creditor_name="신한카드",
                principal=3_000_000, interest=200_000, penalty=0, total=3_200_000,
                secured=True,
            ),
        ]
        props = [make_property(liquidation_value=1_000_000)]

        result = engine.validate_case(case, claims, props, [])
        s = result.summary

        assert s["total_claims"] == 8_500_000
        assert s["secured_claims"] == 3_200_000
        assert s["unsecured_claims"] == 5_300_000
        assert s["explicit_property_value"] == 1_000_000
        assert s["monthly_repayment"] == 500_000
        assert s["repayment_months"] == 36
        assert "repayment_rate" in s
        assert "present_value" in s
        assert "leibniz_coefficient" in s
