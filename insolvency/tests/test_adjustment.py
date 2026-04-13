"""보정재산 통제 엔진 테스트"""

import pytest
from insolvency.engine.adjustment import AdjustmentEngine
from insolvency.engine.calculator import Calculator


@pytest.fixture
def engine():
    return AdjustmentEngine()


class TestAdjustmentCheck:
    """보정재산 허용 여부 검증"""

    def test_allowed(self, engine):
        """허용 범위 내 보정재산"""
        result = engine.check(
            monthly_repayment=500_000,
            repayment_months=36,
            explicit_property_value=1_000_000,
            adjustment_value=500_000,
        )
        assert result.allowed
        assert result.excess == 0

    def test_exceeded(self, engine):
        """허용 범위 초과 보정재산"""
        result = engine.check(
            monthly_repayment=100_000,
            repayment_months=36,
            explicit_property_value=3_000_000,
            adjustment_value=5_000_000,
        )
        assert not result.allowed
        assert result.excess > 0

    def test_exact_limit(self, engine):
        """정확히 허용 한계인 경우"""
        calc = Calculator()
        pv = calc.present_value(500_000, 36)
        explicit = 1_000_000
        adj_max = pv.present_value - explicit

        result = engine.check(
            monthly_repayment=500_000,
            repayment_months=36,
            explicit_property_value=explicit,
            adjustment_value=adj_max,
        )
        assert result.allowed
        assert result.excess == 0

    def test_zero_adjustment(self, engine):
        """보정재산 0인 경우"""
        result = engine.check(
            monthly_repayment=500_000,
            repayment_months=36,
            explicit_property_value=1_000_000,
            adjustment_value=0,
        )
        assert result.allowed
        assert result.excess == 0


class TestMaximumAdjustment:
    """최대 보정재산 계산"""

    def test_basic(self, engine):
        """기본 최대 보정재산 계산"""
        calc = Calculator()
        pv = calc.present_value(500_000, 36)
        explicit = 1_000_000
        expected_max = pv.present_value - explicit

        result = engine.maximum_adjustment(500_000, 36, explicit)
        assert result == expected_max

    def test_explicit_exceeds_pv(self, engine):
        """명시적 재산이 현재가치를 초과하면 최대 보정재산 = 0"""
        result = engine.maximum_adjustment(10_000, 36, 100_000_000)
        assert result == 0

    def test_longer_period_allows_more(self, engine):
        """기간이 길면 더 많은 보정재산 허용"""
        max_36 = engine.maximum_adjustment(500_000, 36, 1_000_000)
        max_60 = engine.maximum_adjustment(500_000, 60, 1_000_000)
        assert max_60 > max_36
