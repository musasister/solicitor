"""변제계획안 생성기

법원 양식에 따른 변제계획안 자동 생성
현재가치/청산가치 정합성 포함
"""

from dataclasses import dataclass
from typing import Optional

from ..models.case import Case
from ..models.claim import Claim
from ..models.property import Property
from ..engine.calculator import Calculator


@dataclass
class RepaymentScheduleRow:
    """변제 스케줄 1행 (월별)"""
    month: int              # 회차
    payment_amount: int     # 변제금액
    cumulative: int         # 누적변제금
    present_value: int      # 현재가치 (해당 회차)


@dataclass
class RepaymentPlanDocument:
    """변제계획안 문서"""
    case_number: Optional[str]
    debtor_name: str
    total_claims: int           # 총 채권액
    unsecured_claims: int       # 일반채권 합계
    monthly_repayment: int      # 월변제액
    repayment_months: int       # 변제기간
    total_repayment: int        # 총변제액 (명목)
    present_value: int          # 현재가치
    liquidation_value: int      # 청산가치
    repayment_rate: float       # 변제율 (%)
    pv_ge_liquidation: bool     # 현재가치 ≥ 청산가치 여부
    schedule: list[RepaymentScheduleRow]


class RepaymentPlanGenerator:
    """변제계획안 생성기"""

    def __init__(self, calculator: Optional[Calculator] = None):
        self.calc = calculator or Calculator()

    def generate(self, case: Case, claims: list[Claim],
                 properties: list[Property]) -> RepaymentPlanDocument:
        """변제계획안 생성

        Args:
            case: 사건 정보
            claims: 채권 목록
            properties: 재산 목록

        Returns:
            RepaymentPlanDocument
        """
        total_claims = sum(c.total for c in claims)
        secured_claims = sum(c.total for c in claims if c.secured)
        unsecured_claims = total_claims - secured_claims

        total_repayment = self.calc.total_repayment(
            case.monthly_repayment, case.repayment_months
        )
        pv_result = self.calc.present_value(
            case.monthly_repayment, case.repayment_months
        )
        liquidation_value = sum(p.liquidation_value for p in properties)
        repayment_rate = self.calc.repayment_rate(total_repayment, unsecured_claims)

        # 월별 변제 스케줄 생성
        schedule = self._generate_schedule(
            case.monthly_repayment, case.repayment_months
        )

        return RepaymentPlanDocument(
            case_number=case.case_number,
            debtor_name=case.debtor_name,
            total_claims=total_claims,
            unsecured_claims=unsecured_claims,
            monthly_repayment=case.monthly_repayment,
            repayment_months=case.repayment_months,
            total_repayment=total_repayment,
            present_value=pv_result.present_value,
            liquidation_value=liquidation_value,
            repayment_rate=round(repayment_rate * 100, 2),
            pv_ge_liquidation=pv_result.present_value >= liquidation_value,
            schedule=schedule,
        )

    def _generate_schedule(self, monthly_repayment: int,
                           repayment_months: int) -> list[RepaymentScheduleRow]:
        """월별 변제 스케줄 생성"""
        schedule = []
        cumulative = 0
        r = self.calc.monthly_rate

        for month in range(1, repayment_months + 1):
            cumulative += monthly_repayment
            # 해당 회차 현재가치 (할인)
            if month <= 3:
                pv = monthly_repayment  # 초기 3개월은 할인 없음
            else:
                discount_period = month - 3
                pv = int(monthly_repayment / ((1 + r) ** discount_period))

            schedule.append(RepaymentScheduleRow(
                month=month,
                payment_amount=monthly_repayment,
                cumulative=cumulative,
                present_value=pv,
            ))

        return schedule

    def to_text(self, doc: RepaymentPlanDocument) -> str:
        """텍스트 형식으로 출력"""
        lines = []
        lines.append("=" * 70)
        lines.append("변  제  계  획  안")
        lines.append("=" * 70)
        lines.append("")
        if doc.case_number:
            lines.append(f"사건번호: {doc.case_number}")
        lines.append(f"채무자: {doc.debtor_name}")
        lines.append("")
        lines.append("[ 변제 개요 ]")
        lines.append(f"  총 채권액           : {doc.total_claims:>15,}원")
        lines.append(f"  일반채권 합계       : {doc.unsecured_claims:>15,}원")
        lines.append(f"  월 변제액           : {doc.monthly_repayment:>15,}원")
        lines.append(f"  변제기간            : {doc.repayment_months:>15}개월")
        lines.append(f"  총 변제액 (명목)    : {doc.total_repayment:>15,}원")
        lines.append(f"  현재가치            : {doc.present_value:>15,}원")
        lines.append(f"  청산가치            : {doc.liquidation_value:>15,}원")
        lines.append(f"  변제율              : {doc.repayment_rate:>14.2f}%")
        lines.append("")

        pv_check = "충족 ✓" if doc.pv_ge_liquidation else "미충족 ✗"
        lines.append(f"  현재가치 ≥ 청산가치 : {pv_check}")
        lines.append("")

        lines.append("[ 월별 변제 스케줄 ]")
        lines.append("-" * 60)
        lines.append(f"{'회차':>4} | {'변제금액':>12} | {'누적변제금':>12} | {'현재가치':>12}")
        lines.append("-" * 60)

        # 처음 6개월과 마지막 3개월만 표시 (중간 생략)
        show_rows = doc.schedule[:6]
        if len(doc.schedule) > 9:
            show_rows.append(None)  # 생략 표시
            show_rows.extend(doc.schedule[-3:])
        elif len(doc.schedule) > 6:
            show_rows.extend(doc.schedule[6:])

        for row in show_rows:
            if row is None:
                lines.append(f"{'...':>4} | {'...':>12} | {'...':>12} | {'...':>12}")
            else:
                lines.append(
                    f"{row.month:>4} | {row.payment_amount:>12,} | "
                    f"{row.cumulative:>12,} | {row.present_value:>12,}"
                )

        lines.append("-" * 60)
        total_pv = sum(r.present_value for r in doc.schedule)
        lines.append(f"{'합계':>4} | {doc.total_repayment:>12,} | {'':12} | {total_pv:>12,}")
        lines.append("=" * 70)

        return "\n".join(lines)

    def to_dict(self, doc: RepaymentPlanDocument) -> dict:
        """사전 형식으로 변환"""
        return {
            "title": "변제계획안",
            "case_number": doc.case_number,
            "debtor_name": doc.debtor_name,
            "summary": {
                "총채권액": doc.total_claims,
                "일반채권합계": doc.unsecured_claims,
                "월변제액": doc.monthly_repayment,
                "변제기간": doc.repayment_months,
                "총변제액_명목": doc.total_repayment,
                "현재가치": doc.present_value,
                "청산가치": doc.liquidation_value,
                "변제율": doc.repayment_rate,
                "현재가치_충족": doc.pv_ge_liquidation,
            },
            "schedule": [
                {
                    "회차": r.month,
                    "변제금액": r.payment_amount,
                    "누적변제금": r.cumulative,
                    "현재가치": r.present_value,
                }
                for r in doc.schedule
            ],
        }
