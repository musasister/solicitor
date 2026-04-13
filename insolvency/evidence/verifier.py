"""증빙 검증 엔진

검증 항목:
  1. 필수 증빙 존재 여부
  2. 유효기간 체크
  3. 미매핑 채권 검출
"""

from dataclasses import dataclass, field
from datetime import date
from typing import Optional

from ..models.claim import Claim
from ..models.evidence import Evidence, EvidenceStatus


# 필수 증빙 종류 (사건 단위)
REQUIRED_CASE_EVIDENCES = [
    "개인신용정보",
    "주민등록등본",
    "가족관계증명",
]


@dataclass
class EvidenceIssue:
    """증빙 문제"""
    issue_type: str  # missing, expired, unmapped
    message: str
    claim_id: Optional[str] = None
    evidence_id: Optional[str] = None


@dataclass
class EvidenceVerificationResult:
    """증빙 검증 결과"""
    valid: bool
    issues: list[EvidenceIssue] = field(default_factory=list)
    total_evidences: int = 0
    valid_evidences: int = 0
    expired_evidences: int = 0
    unmapped_claims: int = 0


class EvidenceVerifier:
    """증빙 검증 엔진"""

    def verify(self, claims: list[Claim], evidences: list[Evidence],
               check_date: Optional[date] = None) -> EvidenceVerificationResult:
        """증빙 검증 수행

        Args:
            claims: 채권 목록
            evidences: 증빙 목록
            check_date: 검증 기준일 (기본: 오늘)

        Returns:
            EvidenceVerificationResult
        """
        if check_date is None:
            check_date = date.today()

        issues: list[EvidenceIssue] = []
        valid_count = 0
        expired_count = 0

        # 1. 필수 증빙 존재 여부 확인
        evidence_types = {e.evidence_type for e in evidences}
        for req_type in REQUIRED_CASE_EVIDENCES:
            if req_type not in evidence_types:
                issues.append(EvidenceIssue(
                    issue_type="missing",
                    message=f"필수 증빙 '{req_type}'이(가) 누락되었습니다.",
                ))

        # 2. 유효기간 체크
        for ev in evidences:
            if ev.valid_until:
                valid_until = ev.valid_until if isinstance(ev.valid_until, date) else date.fromisoformat(str(ev.valid_until))
                if valid_until < check_date:
                    expired_count += 1
                    issues.append(EvidenceIssue(
                        issue_type="expired",
                        message=f"증빙 '{ev.evidence_type}'의 유효기간이 "
                                f"만료되었습니다 ({valid_until}).",
                        evidence_id=ev.id,
                    ))
                else:
                    valid_count += 1
            else:
                valid_count += 1

        # 3. 미매핑 채권 검출 (증빙이 연결되지 않은 채권)
        unmapped_count = 0
        for claim in claims:
            if not claim.evidence_ids:
                unmapped_count += 1
                issues.append(EvidenceIssue(
                    issue_type="unmapped",
                    message=f"채권 {claim.claim_number}번 "
                            f"({claim.creditor_name})에 증빙이 연결되지 않았습니다.",
                    claim_id=claim.id,
                ))

        has_critical = any(i.issue_type == "missing" for i in issues)

        return EvidenceVerificationResult(
            valid=not has_critical,
            issues=issues,
            total_evidences=len(evidences),
            valid_evidences=valid_count,
            expired_evidences=expired_count,
            unmapped_claims=unmapped_count,
        )
