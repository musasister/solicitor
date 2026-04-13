"""증빙(Evidence) 모델 - 소명자료 관리"""

from datetime import date
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class EvidenceStatus(str, Enum):
    VALID = "유효"
    EXPIRED = "만료"
    UNVERIFIED = "미확인"


class EvidenceType(str, Enum):
    """증빙 종류"""
    CREDIT_REPORT = "개인신용정보"
    DEBT_CERTIFICATE = "채권증서"
    TRANSACTION_HISTORY = "거래내역"
    INCOME_PROOF = "소득증빙"
    PROPERTY_PROOF = "재산증빙"
    RESIDENT_REGISTER = "주민등록등본"
    FAMILY_RELATION = "가족관계증명"
    SEAL_CERTIFICATE = "인감증명서"
    OTHER = "기타"


class EvidenceCreate(BaseModel):
    """증빙 생성 요청"""
    case_id: str = Field(..., description="사건 ID")
    claim_id: Optional[str] = Field(None, description="연결된 채권 ID")
    evidence_type: str = Field(..., description="증빙 종류")
    description: Optional[str] = Field(None, description="증빙 설명")
    file_path: Optional[str] = Field(None, description="파일 경로")
    valid_from: Optional[date] = Field(None, description="유효기간 시작일")
    valid_until: Optional[date] = Field(None, description="유효기간 종료일")


class Evidence(BaseModel):
    """증빙 전체 정보"""
    id: str
    case_id: str
    claim_id: Optional[str] = None
    evidence_type: str
    description: Optional[str] = None
    file_path: Optional[str] = None
    valid_from: Optional[date] = None
    valid_until: Optional[date] = None
    status: EvidenceStatus = EvidenceStatus.UNVERIFIED
    created_at: Optional[str] = None
