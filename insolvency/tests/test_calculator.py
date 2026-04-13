"""계산 엔진 테스트"""

import pytest
from insolvency.engine.calculator import Calculator, LEGAL_ANNUAL_RATE


@pytest.fixture
def calc():
    return Calculator()


class TestLeibnizCoefficient:
    """라이프니츠 계수 테스트"""

    def test_zero_months(self, calc):
        assert calc.leibniz_coefficient(0) == 0.0

    def test_negative_months(self, calc):
        assert calc.leibniz_coefficient(-5) == 0.0

    def test_one_month(self, calc):
        # L(1) = 1/(1+r) where r = 0.05/12
        r = LEGAL_ANNUAL_RATE / 12
        expected = 1 / (1 + r)
        assert abs(calc.leibniz_coefficient(1) - expected) < 1e-10

    def test_twelve_months(self, calc):
        r = LEGAL_ANNUAL_RATE / 12
        expected = (1 - (1 + r) ** (-12)) / r
        assert abs(calc.leibniz_coefficient(12) - expected) < 1e-6

    def test_monotonically_increasing(self, calc):
        """기간이 길수록 라이프니츠 계수가 커야 함"""
        prev = 0
        for m in range(1, 61):
            current = calc.leibniz_coefficient(m)
            assert current > prev
            prev = current

    def test_57_months(self, calc):
        """60개월 변제 시 할인 적용 57개월의 라이프니츠 계수"""
        result = calc.leibniz_coefficient(57)
        # 약 52.xx 정도 예상 (월 0.4167% 할인율 기준)
        assert 50 < result < 55


class TestPresentValue:
    """현재가치 테스트"""

    def test_basic_36_months(self, calc):
        """36개월 변제 현재가치"""
        result = calc.present_value(500000, 36)
        # PV = 500000 × (3 + L(33))
        assert result.monthly_repayment == 500000
        assert result.repayment_months == 36
        assert result.initial_months == 3
        assert result.present_value > 0
        # 명목 총액보다 작아야 함 (할인 효과)
        assert result.present_value < 500000 * 36

    def test_basic_60_months(self, calc):
        """60개월 변제 현재가치"""
        result = calc.present_value(500000, 60)
        assert result.present_value > 0
        assert result.present_value < 500000 * 60

    def test_36_less_than_60(self, calc):
        """같은 월변제액이면 60개월 PV > 36개월 PV"""
        pv36 = calc.present_value(500000, 36)
        pv60 = calc.present_value(500000, 60)
        assert pv60.present_value > pv36.present_value

    def test_pv_factor_structure(self, calc):
        """PV factor = initial_months + leibniz"""
        result = calc.present_value(500000, 36)
        expected_factor = 3 + calc.leibniz_coefficient(33)
        assert abs(result.pv_factor - expected_factor) < 1e-4

    def test_zero_repayment(self, calc):
        result = calc.present_value(0, 36)
        assert result.present_value == 0


class TestMinimumMonthlyRepayment:
    """최소 월변제액 테스트"""

    def test_basic(self, calc):
        """청산가치를 충족하는 최소 월변제액"""
        liquidation = 10_000_000
        min_m = calc.minimum_monthly_repayment(liquidation, 36)
        # 이 금액으로 PV를 계산하면 청산가치 이상이어야 함
        pv = calc.present_value(min_m, 36)
        assert pv.present_value >= liquidation

    def test_longer_period_lower_payment(self, calc):
        """기간이 길면 최소 월변제액이 낮아짐"""
        liquidation = 10_000_000
        min_36 = calc.minimum_monthly_repayment(liquidation, 36)
        min_60 = calc.minimum_monthly_repayment(liquidation, 60)
        assert min_60 < min_36

    def test_zero_liquidation(self, calc):
        assert calc.minimum_monthly_repayment(0, 36) == 0


class TestRepaymentRate:
    """변제율 테스트"""

    def test_normal_rate(self, calc):
        rate = calc.repayment_rate(5_000_000, 50_000_000)
        assert rate == 0.1  # 10%

    def test_full_repayment(self, calc):
        rate = calc.repayment_rate(50_000_000, 50_000_000)
        assert rate == 1.0

    def test_over_repayment_capped(self, calc):
        rate = calc.repayment_rate(60_000_000, 50_000_000)
        assert rate == 1.0  # 100% 상한

    def test_zero_claims(self, calc):
        rate = calc.repayment_rate(5_000_000, 0)
        assert rate == 0.0
