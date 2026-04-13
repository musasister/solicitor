"""문서 생성 엔진 테스트"""

import pytest
from datetime import date

from insolvency.documents.creditor_list import CreditorListGenerator
from insolvency.documents.repayment_plan import RepaymentPlanGenerator
from insolvency.models.case import Case, CaseStatus
from insolvency.models.claim import Claim
from insolvency.models.property import Property


def make_case(**kwargs) -> Case:
    defaults = {
        "id": "case_test1",
        "debtor_name": "홍길동",
        "debtor_birth": "1985-03-15",
        "reference_date": "2026-04-14",
        "repayment_months": 36,
        "monthly_repayment": 500_000,
        "status": CaseStatus.DRAFT,
    }
    defaults.update(kwargs)
    return Case(**defaults)


def make_claims() -> list[Claim]:
    return [
        Claim(
            id="cl_1", case_id="case_test1", claim_number=1,
            creditor_name="KB국민카드", cause_date="2023-08-10",
            debt_type="현금서비스", principal=3_000_000, interest=200_000,
            penalty=0, total=3_200_000,
        ),
        Claim(
            id="cl_2", case_id="case_test1", claim_number=2,
            creditor_name="KB국민카드", cause_date="2024-01-23",
            debt_type="대출금", principal=5_000_000, interest=300_000,
            penalty=0, total=5_300_000,
        ),
        Claim(
            id="cl_3", case_id="case_test1", claim_number=3,
            creditor_name="신한카드", cause_date="2024-03-02",
            debt_type="카드론", principal=2_000_000, interest=100_000,
            penalty=50_000, total=2_150_000, secured=True,
        ),
    ]


class TestCreditorList:
    """채권자목록 생성 테스트"""

    def test_generate(self):
        gen = CreditorListGenerator()
        case = make_case()
        claims = make_claims()

        doc = gen.generate(case, claims)
        assert len(doc.rows) == 3
        assert doc.grand_total == 10_650_000
        assert doc.secured_total == 2_150_000
        assert doc.unsecured_total == 8_500_000

    def test_cause_display_format(self):
        """채권원인 출력 형식: YYYY.MM.DD. 채무종류"""
        gen = CreditorListGenerator()
        case = make_case()
        claims = make_claims()

        doc = gen.generate(case, claims)
        assert doc.rows[0].cause == "2023.08.10. 현금서비스"
        assert doc.rows[1].cause == "2024.01.23. 대출금"

    def test_same_creditor_separate_rows(self):
        """같은 채권자라도 별도 행으로 출력"""
        gen = CreditorListGenerator()
        case = make_case()
        claims = make_claims()

        doc = gen.generate(case, claims)
        kb_rows = [r for r in doc.rows if r.creditor == "KB국민카드"]
        assert len(kb_rows) == 2  # KB국민카드 2행

    def test_to_text(self):
        gen = CreditorListGenerator()
        case = make_case(case_number="2026개회12345")
        claims = make_claims()

        doc = gen.generate(case, claims)
        text = gen.to_text(doc)

        assert "채  권  자  목  록" in text
        assert "2026개회12345" in text
        assert "KB국민카드" in text
        assert "홍길동" in text

    def test_to_dict(self):
        gen = CreditorListGenerator()
        case = make_case()
        claims = make_claims()

        doc = gen.generate(case, claims)
        d = gen.to_dict(doc)

        assert d["title"] == "채권자목록"
        assert len(d["rows"]) == 3
        assert d["totals"]["총합계"] == 10_650_000

    def test_empty_claims(self):
        gen = CreditorListGenerator()
        case = make_case()

        doc = gen.generate(case, [])
        assert len(doc.rows) == 0
        assert doc.grand_total == 0


class TestRepaymentPlan:
    """변제계획안 생성 테스트"""

    def test_generate(self):
        gen = RepaymentPlanGenerator()
        case = make_case()
        claims = make_claims()
        props = [Property(
            id="prop_1", case_id="case_test1",
            property_type="예금", description="보통예금",
            liquidation_value=1_000_000,
        )]

        doc = gen.generate(case, claims, props)
        assert doc.monthly_repayment == 500_000
        assert doc.repayment_months == 36
        assert doc.total_repayment == 18_000_000
        assert doc.liquidation_value == 1_000_000
        assert len(doc.schedule) == 36

    def test_schedule_cumulative(self):
        """누적변제금 정확성"""
        gen = RepaymentPlanGenerator()
        case = make_case()

        doc = gen.generate(case, make_claims(), [])
        for i, row in enumerate(doc.schedule, 1):
            assert row.cumulative == 500_000 * i

    def test_pv_check(self):
        """현재가치 ≥ 청산가치 체크"""
        gen = RepaymentPlanGenerator()
        case = make_case(monthly_repayment=500_000)
        claims = make_claims()
        props = [Property(
            id="prop_1", case_id="case_test1",
            property_type="예금", description="보통예금",
            liquidation_value=1_000_000,
        )]

        doc = gen.generate(case, claims, props)
        assert doc.pv_ge_liquidation  # 500,000 × 36개월 PV >> 1,000,000

    def test_to_text(self):
        gen = RepaymentPlanGenerator()
        case = make_case(case_number="2026개회12345")

        doc = gen.generate(case, make_claims(), [])
        text = gen.to_text(doc)

        assert "변  제  계  획  안" in text
        assert "2026개회12345" in text
