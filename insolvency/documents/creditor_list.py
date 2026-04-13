"""채권자목록 생성기

법원 양식에 따른 채권자목록 자동 생성
각 채무(채권)가 1행으로 출력

출력 컬럼:
  순번 | 채권자 | 채권원인 | 원금 | 이자 | 지연손해금 | 합계 | 담보부/우선 | 비고
"""

from dataclasses import dataclass
from typing import Optional

from ..models.case import Case
from ..models.claim import Claim


@dataclass
class CreditorListRow:
    """채권자목록 1행"""
    number: int         # 순번
    creditor: str       # 채권자
    cause: str          # 채권원인 (YYYY.MM.DD. 채무종류)
    principal: int      # 원금
    interest: int       # 이자
    penalty: int        # 지연손해금
    total: int          # 합계
    claim_type: str     # 구분 (일반/담보부/우선)
    note: str           # 비고


@dataclass
class CreditorListDocument:
    """채권자목록 문서"""
    case_number: Optional[str]
    debtor_name: str
    reference_date: str
    rows: list[CreditorListRow]
    total_principal: int
    total_interest: int
    total_penalty: int
    grand_total: int
    secured_total: int      # 담보부채권 합계
    priority_total: int     # 우선채권 합계
    unsecured_total: int    # 일반채권 합계


class CreditorListGenerator:
    """채권자목록 생성기"""

    def generate(self, case: Case, claims: list[Claim]) -> CreditorListDocument:
        """채권자목록 생성

        Args:
            case: 사건 정보
            claims: 채권 목록 (claim_number 순 정렬)

        Returns:
            CreditorListDocument
        """
        sorted_claims = sorted(claims, key=lambda c: c.claim_number)
        rows = []

        for claim in sorted_claims:
            cause = f"{claim.cause_date.year}.{claim.cause_date.month:02d}.{claim.cause_date.day:02d}. {claim.debt_type}"
            if claim.cause_detail:
                cause += f" ({claim.cause_detail})"

            if claim.secured:
                claim_type = "담보부"
            elif claim.priority:
                claim_type = "우선"
            else:
                claim_type = "일반"

            rows.append(CreditorListRow(
                number=claim.claim_number,
                creditor=claim.creditor_name,
                cause=cause,
                principal=claim.principal,
                interest=claim.interest,
                penalty=claim.penalty,
                total=claim.total,
                claim_type=claim_type,
                note="",
            ))

        total_principal = sum(c.principal for c in sorted_claims)
        total_interest = sum(c.interest for c in sorted_claims)
        total_penalty = sum(c.penalty for c in sorted_claims)
        grand_total = sum(c.total for c in sorted_claims)
        secured_total = sum(c.total for c in sorted_claims if c.secured)
        priority_total = sum(c.total for c in sorted_claims if c.priority)
        unsecured_total = grand_total - secured_total - priority_total

        return CreditorListDocument(
            case_number=case.case_number,
            debtor_name=case.debtor_name,
            reference_date=f"{case.reference_date.year}.{case.reference_date.month:02d}.{case.reference_date.day:02d}.",
            rows=rows,
            total_principal=total_principal,
            total_interest=total_interest,
            total_penalty=total_penalty,
            grand_total=grand_total,
            secured_total=secured_total,
            priority_total=priority_total,
            unsecured_total=unsecured_total,
        )

    def to_text(self, doc: CreditorListDocument) -> str:
        """텍스트 형식으로 출력"""
        lines = []
        lines.append("=" * 90)
        lines.append("채  권  자  목  록")
        lines.append("=" * 90)
        lines.append("")
        if doc.case_number:
            lines.append(f"사건번호: {doc.case_number}")
        lines.append(f"채무자: {doc.debtor_name}")
        lines.append(f"기준일: {doc.reference_date}")
        lines.append("")
        lines.append("-" * 90)
        lines.append(
            f"{'순번':>4} | {'채권자':<14} | {'채권원인':<24} | "
            f"{'원금':>12} | {'이자':>10} | {'지연손해금':>10} | {'합계':>12} | {'구분':<6}"
        )
        lines.append("-" * 90)

        for row in doc.rows:
            lines.append(
                f"{row.number:>4} | {row.creditor:<14} | {row.cause:<24} | "
                f"{row.principal:>12,} | {row.interest:>10,} | {row.penalty:>10,} | "
                f"{row.total:>12,} | {row.claim_type:<6}"
            )

        lines.append("-" * 90)
        lines.append(
            f"{'합계':>4} | {'':14} | {'':24} | "
            f"{doc.total_principal:>12,} | {doc.total_interest:>10,} | "
            f"{doc.total_penalty:>10,} | {doc.grand_total:>12,} |"
        )
        lines.append("")
        lines.append(f"  담보부채권 합계: {doc.secured_total:>15,}원")
        lines.append(f"  우선채권   합계: {doc.priority_total:>15,}원")
        lines.append(f"  일반채권   합계: {doc.unsecured_total:>15,}원")
        lines.append(f"  채권 총액     : {doc.grand_total:>15,}원")
        lines.append("=" * 90)

        return "\n".join(lines)

    def to_dict(self, doc: CreditorListDocument) -> dict:
        """사전 형식으로 변환 (JSON/Excel 출력용)"""
        return {
            "title": "채권자목록",
            "case_number": doc.case_number,
            "debtor_name": doc.debtor_name,
            "reference_date": doc.reference_date,
            "rows": [
                {
                    "순번": r.number,
                    "채권자": r.creditor,
                    "채권원인": r.cause,
                    "원금": r.principal,
                    "이자": r.interest,
                    "지연손해금": r.penalty,
                    "합계": r.total,
                    "구분": r.claim_type,
                    "비고": r.note,
                }
                for r in doc.rows
            ],
            "totals": {
                "원금합계": doc.total_principal,
                "이자합계": doc.total_interest,
                "지연손해금합계": doc.total_penalty,
                "총합계": doc.grand_total,
                "담보부채권": doc.secured_total,
                "우선채권": doc.priority_total,
                "일반채권": doc.unsecured_total,
            },
        }
