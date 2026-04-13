"""재산(Property) 모델 - 청산가치 산정 대상"""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class PropertyType(str, Enum):
    """재산 종류"""
    REAL_ESTATE = "부동산"
    DEPOSIT = "예금"
    INSURANCE = "보험"
    VEHICLE = "차량"
    MOVABLE = "동산"
    SECURITIES = "유가증권"
    RECEIVABLE = "채권(매출채권 등)"
    RETIREMENT = "퇴직금"
    OTHER = "기타"


class PropertyCreate(BaseModel):
    """재산 생성 요청"""
    case_id: str = Field(..., description="사건 ID")
    property_type: str = Field(..., description="재산 종류")
    description: str = Field(..., description="재산 내역")
    appraised_value: int = Field(0, ge=0, description="감정가/평가액 (원)")
    liquidation_value: int = Field(0, ge=0, description="청산가치 (원)")
    is_adjustment: bool = Field(False, description="보정재산 여부")
    note: Optional[str] = Field(None, description="비고")


class PropertyUpdate(BaseModel):
    """재산 수정 요청"""
    property_type: Optional[str] = None
    description: Optional[str] = None
    appraised_value: Optional[int] = Field(None, ge=0)
    liquidation_value: Optional[int] = Field(None, ge=0)
    is_adjustment: Optional[bool] = None
    note: Optional[str] = None


class Property(BaseModel):
    """재산 전체 정보"""
    id: str
    case_id: str
    property_type: str
    description: str
    appraised_value: int = 0
    liquidation_value: int = 0
    is_adjustment: bool = False
    note: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
