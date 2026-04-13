"""채권(Claim) 모델 - 채무 1개 = 채권 1건 = 채권자목록 1행"""

from datetime import date
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, model_validator


class ClaimStatus(str, Enum):
    CONFIRMED = "확정"
    UNCONFIRMED = "미확정"
    DISPUTED = "이의"


class DebtType(str, Enum):
    """채무 종류"""
    LOAN = "대출금"
    CASH_ADVANCE = "현금서비스"
    CARD_LOAN = "카드론"
    CREDIT_CARD = "카드대금"
    MORTGAGE = "주택담보대출"
    PERSONAL_LOAN = "개인대출"
    GUARANTEE = "보증채무"
    TAX = "세금"
    INSURANCE = "보험료"
    UTILITY = "공과금"
    OTHER = "기타"


class ClaimCreate(BaseModel):
    """채권 생성 요청

    핵심 원칙: 채무 1개 = 채권 1건 = 채권자목록 1행
    같은 채권자라도 채무가 다르면 별도 채권으로 생성
    """
    case_id: str = Field(..., description="사건 ID")
    creditor_name: str = Field(..., min_length=1, description="채권자명")
    cause_date: date = Field(..., description="채무 발생일")
    debt_type: str = Field(..., description="채무종류 (대출금, 현금서비스 등)")
    cause_detail: Optional[str] = Field(None, description="채권원인 상세")
    principal: int = Field(..., ge=0, description="원금 (원)")
    interest: int = Field(0, ge=0, description="이자 (원)")
    penalty: int = Field(0, ge=0, description="지연손해금 (원)")
    secured: bool = Field(False, description="담보부채권 여부")
    priority: bool = Field(False, description="우선채권 여부")
    evidence_ids: list[str] = Field(default_factory=list, description="증빙 ID 목록")


class ClaimUpdate(BaseModel):
    """채권 수정 요청"""
    creditor_name: Optional[str] = Field(None, min_length=1)
    cause_date: Optional[date] = None
    debt_type: Optional[str] = None
    cause_detail: Optional[str] = None
    principal: Optional[int] = Field(None, ge=0)
    interest: Optional[int] = Field(None, ge=0)
    penalty: Optional[int] = Field(None, ge=0)
    secured: Optional[bool] = None
    priority: Optional[bool] = None
    status: Optional[ClaimStatus] = None
    evidence_ids: Optional[list[str]] = None


class Claim(BaseModel):
    """채권 전체 정보

    채권원인 출력 형식: YYYY.MM.DD. 채무종류
    예: 2024.01.23. 대출금
    """
    id: str
    case_id: str
    claim_number: int = Field(..., ge=1, description="채권번호 (사건 내 순번)")
    creditor_name: str
    cause_date: date
    debt_type: str
    cause_detail: Optional[str] = None
    principal: int
    interest: int = 0
    penalty: int = 0
    total: int = 0
    secured: bool = False
    priority: bool = False
    evidence_ids: list[str] = Field(default_factory=list)
    status: ClaimStatus = ClaimStatus.CONFIRMED
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def compute_total(cls, data):
        if isinstance(data, dict):
            principal = data.get("principal", 0)
            interest = data.get("interest", 0)
            penalty = data.get("penalty", 0)
            data["total"] = principal + interest + penalty
        return data

    @property
    def cause_display(self) -> str:
        """채권원인 표시 형식: YYYY.MM.DD. 채무종류"""
        d = self.cause_date
        return f"{d.year}.{d.month:02d}.{d.day:02d}. {self.debt_type}"
