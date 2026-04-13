"""사건(Case) 모델 - 개인회생 사건 단위"""

from datetime import date
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class CaseStatus(str, Enum):
    DRAFT = "작성중"
    FILED = "접수"
    IN_PROGRESS = "진행중"
    APPROVED = "인가"
    COMPLETED = "종결"
    DISMISSED = "기각"


class CaseCreate(BaseModel):
    """사건 생성 요청"""
    case_number: Optional[str] = Field(None, description="사건번호 (예: 2026개회12345)")
    debtor_name: str = Field(..., description="채무자 성명")
    debtor_birth: date = Field(..., description="채무자 생년월일")
    debtor_id_last: Optional[str] = Field(None, description="주민번호 뒷자리 (마스킹)")
    filing_date: Optional[date] = Field(None, description="신청일")
    reference_date: date = Field(..., description="기준일 (채권조사 기준일)")
    court_name: Optional[str] = Field(None, description="관할법원")
    repayment_months: int = Field(36, ge=36, le=60, description="변제기간 (월)")
    monthly_income: int = Field(0, ge=0, description="월수입 (원)")
    monthly_expense: int = Field(0, ge=0, description="월지출 (원)")
    monthly_repayment: int = Field(0, ge=0, description="월변제액 (원)")


class CaseUpdate(BaseModel):
    """사건 수정 요청"""
    case_number: Optional[str] = None
    debtor_name: Optional[str] = None
    debtor_birth: Optional[date] = None
    debtor_id_last: Optional[str] = None
    filing_date: Optional[date] = None
    reference_date: Optional[date] = None
    court_name: Optional[str] = None
    repayment_months: Optional[int] = Field(None, ge=36, le=60)
    monthly_income: Optional[int] = Field(None, ge=0)
    monthly_expense: Optional[int] = Field(None, ge=0)
    monthly_repayment: Optional[int] = Field(None, ge=0)
    status: Optional[CaseStatus] = None


class Case(BaseModel):
    """사건 전체 정보"""
    id: str
    case_number: Optional[str] = None
    debtor_name: str
    debtor_birth: date
    debtor_id_last: Optional[str] = None
    filing_date: Optional[date] = None
    reference_date: date
    court_name: Optional[str] = None
    repayment_months: int = 36
    monthly_income: int = 0
    monthly_expense: int = 0
    monthly_repayment: int = 0
    status: CaseStatus = CaseStatus.DRAFT
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class CaseSummary(BaseModel):
    """사건 요약 (목록 조회용)"""
    id: str
    case_number: Optional[str] = None
    debtor_name: str
    status: CaseStatus
    total_claims: int = 0
    total_claim_amount: int = 0
    created_at: Optional[str] = None
