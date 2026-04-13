"""REST API 라우트

엔드포인트:
  POST   /cases                 - 사건 생성
  GET    /cases                 - 사건 목록
  GET    /cases/{id}            - 사건 조회
  PUT    /cases/{id}            - 사건 수정
  DELETE /cases/{id}            - 사건 삭제

  POST   /cases/{id}/claims     - 채권 추가
  GET    /cases/{id}/claims     - 채권 목록
  GET    /claims/{id}           - 채권 조회
  PUT    /claims/{id}           - 채권 수정
  DELETE /claims/{id}           - 채권 삭제

  POST   /cases/{id}/properties - 재산 추가
  GET    /cases/{id}/properties - 재산 목록
  PUT    /properties/{id}       - 재산 수정
  DELETE /properties/{id}       - 재산 삭제

  POST   /cases/{id}/evidences  - 증빙 추가
  GET    /cases/{id}/evidences  - 증빙 목록

  POST   /validate              - 정합성 검증
  POST   /generate-document     - 문서 생성
"""

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..database import Database, CaseRepository, ClaimRepository, PropertyRepository, EvidenceRepository
from ..models.case import CaseCreate, CaseUpdate, CaseSummary, Case
from ..models.claim import ClaimCreate, ClaimUpdate, Claim
from ..models.property import PropertyCreate, PropertyUpdate, Property
from ..models.evidence import EvidenceCreate, Evidence
from ..engine.calculator import Calculator
from ..engine.validation import ValidationEngine
from ..engine.adjustment import AdjustmentEngine
from ..evidence.verifier import EvidenceVerifier
from ..documents.creditor_list import CreditorListGenerator
from ..documents.repayment_plan import RepaymentPlanGenerator


router = APIRouter()

# 의존성 (앱 초기화 시 설정)
_db: Optional[Database] = None


def get_db() -> Database:
    global _db
    if _db is None:
        _db = Database()
    return _db


def set_db(db: Database):
    global _db
    _db = db


# ===== 사건 (Case) =====

@router.post("/cases", response_model=Case, status_code=201)
def create_case(data: CaseCreate):
    """사건 생성"""
    repo = CaseRepository(get_db())
    return repo.create(data)


@router.get("/cases", response_model=list[CaseSummary])
def list_cases():
    """사건 목록 조회"""
    repo = CaseRepository(get_db())
    return repo.list_all()


@router.get("/cases/{case_id}", response_model=Case)
def get_case(case_id: str):
    """사건 조회"""
    repo = CaseRepository(get_db())
    case = repo.get(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="사건을 찾을 수 없습니다.")
    return case


@router.put("/cases/{case_id}", response_model=Case)
def update_case(case_id: str, data: CaseUpdate):
    """사건 수정"""
    repo = CaseRepository(get_db())
    case = repo.update(case_id, data)
    if not case:
        raise HTTPException(status_code=404, detail="사건을 찾을 수 없습니다.")
    return case


@router.delete("/cases/{case_id}")
def delete_case(case_id: str):
    """사건 삭제"""
    repo = CaseRepository(get_db())
    if not repo.delete(case_id):
        raise HTTPException(status_code=404, detail="사건을 찾을 수 없습니다.")
    return {"message": "삭제되었습니다."}


# ===== 채권 (Claim) =====

@router.post("/cases/{case_id}/claims", response_model=Claim, status_code=201)
def create_claim(case_id: str, data: ClaimCreate):
    """채권 추가 (채무 1개 = 채권 1건)"""
    case_repo = CaseRepository(get_db())
    if not case_repo.get(case_id):
        raise HTTPException(status_code=404, detail="사건을 찾을 수 없습니다.")

    data.case_id = case_id
    repo = ClaimRepository(get_db())
    return repo.create(data)


@router.get("/cases/{case_id}/claims", response_model=list[Claim])
def list_claims(case_id: str):
    """채권 목록 조회"""
    repo = ClaimRepository(get_db())
    return repo.list_by_case(case_id)


@router.get("/claims/{claim_id}", response_model=Claim)
def get_claim(claim_id: str):
    """채권 조회"""
    repo = ClaimRepository(get_db())
    claim = repo.get(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="채권을 찾을 수 없습니다.")
    return claim


@router.put("/claims/{claim_id}", response_model=Claim)
def update_claim(claim_id: str, data: ClaimUpdate):
    """채권 수정"""
    repo = ClaimRepository(get_db())
    claim = repo.update(claim_id, data)
    if not claim:
        raise HTTPException(status_code=404, detail="채권을 찾을 수 없습니다.")
    return claim


@router.delete("/claims/{claim_id}")
def delete_claim(claim_id: str):
    """채권 삭제"""
    repo = ClaimRepository(get_db())
    if not repo.delete(claim_id):
        raise HTTPException(status_code=404, detail="채권을 찾을 수 없습니다.")
    return {"message": "삭제되었습니다."}


# ===== 재산 (Property) =====

@router.post("/cases/{case_id}/properties", response_model=Property, status_code=201)
def create_property(case_id: str, data: PropertyCreate):
    """재산 추가"""
    case_repo = CaseRepository(get_db())
    if not case_repo.get(case_id):
        raise HTTPException(status_code=404, detail="사건을 찾을 수 없습니다.")

    # 보정재산인 경우 허용 여부 검증
    if data.is_adjustment:
        case = case_repo.get(case_id)
        prop_repo = PropertyRepository(get_db())
        existing_props = prop_repo.list_by_case(case_id)

        explicit_value = sum(p.liquidation_value for p in existing_props if not p.is_adjustment)
        current_adj = sum(p.liquidation_value for p in existing_props if p.is_adjustment)
        new_total_adj = current_adj + data.liquidation_value

        adj_engine = AdjustmentEngine()
        result = adj_engine.check(
            case.monthly_repayment, case.repayment_months,
            explicit_value, new_total_adj,
        )
        if not result.allowed:
            raise HTTPException(
                status_code=422,
                detail={
                    "error_code": "R-ADJ-001",
                    "message": result.message,
                    "adjustment_max": result.adjustment_max,
                    "excess": result.excess,
                },
            )

    data.case_id = case_id
    repo = PropertyRepository(get_db())
    return repo.create(data)


@router.get("/cases/{case_id}/properties", response_model=list[Property])
def list_properties(case_id: str):
    """재산 목록 조회"""
    repo = PropertyRepository(get_db())
    return repo.list_by_case(case_id)


@router.put("/properties/{property_id}", response_model=Property)
def update_property(property_id: str, data: PropertyUpdate):
    """재산 수정"""
    repo = PropertyRepository(get_db())
    prop = repo.update(property_id, data)
    if not prop:
        raise HTTPException(status_code=404, detail="재산을 찾을 수 없습니다.")
    return prop


@router.delete("/properties/{property_id}")
def delete_property(property_id: str):
    """재산 삭제"""
    repo = PropertyRepository(get_db())
    if not repo.delete(property_id):
        raise HTTPException(status_code=404, detail="재산을 찾을 수 없습니다.")
    return {"message": "삭제되었습니다."}


# ===== 증빙 (Evidence) =====

@router.post("/cases/{case_id}/evidences", response_model=Evidence, status_code=201)
def create_evidence(case_id: str, data: EvidenceCreate):
    """증빙 추가"""
    case_repo = CaseRepository(get_db())
    if not case_repo.get(case_id):
        raise HTTPException(status_code=404, detail="사건을 찾을 수 없습니다.")

    data.case_id = case_id
    repo = EvidenceRepository(get_db())
    return repo.create(data)


@router.get("/cases/{case_id}/evidences", response_model=list[Evidence])
def list_evidences(case_id: str):
    """증빙 목록 조회"""
    repo = EvidenceRepository(get_db())
    return repo.list_by_case(case_id)


# ===== 검증 (Validation) =====

class ValidateRequest(BaseModel):
    case_id: str


@router.post("/validate")
def validate_case(req: ValidateRequest):
    """사건 정합성 검증

    검증 항목:
      - 현재가치 ≥ 청산가치
      - 보정재산 통제
      - 월변제액 충분성
      - 증빙 검증
    """
    db = get_db()
    case_repo = CaseRepository(db)
    case = case_repo.get(req.case_id)
    if not case:
        raise HTTPException(status_code=404, detail="사건을 찾을 수 없습니다.")

    claims = ClaimRepository(db).list_by_case(req.case_id)
    properties = PropertyRepository(db).list_by_case(req.case_id)
    evidences = EvidenceRepository(db).list_by_case(req.case_id)

    # 정합성 검증
    engine = ValidationEngine()
    result = engine.validate_case(case, claims, properties, evidences)

    # 증빙 검증
    verifier = EvidenceVerifier()
    ev_result = verifier.verify(claims, evidences)

    return {
        "valid": result.valid and ev_result.valid,
        "errors": [
            {"code": e.code.value, "message": e.message, "details": e.details}
            for e in result.errors
        ],
        "warnings": [
            {"code": w.code.value, "message": w.message, "details": w.details}
            for w in result.warnings
        ],
        "evidence_issues": [
            {"type": i.issue_type, "message": i.message}
            for i in ev_result.issues
        ],
        "summary": result.summary,
    }


# ===== 문서 생성 (Document Generation) =====

class GenerateDocumentRequest(BaseModel):
    case_id: str
    document_type: str  # creditor_list, repayment_plan
    format: str = "json"  # json, text


@router.post("/generate-document")
def generate_document(req: GenerateDocumentRequest):
    """문서 생성

    지원 문서:
      - creditor_list: 채권자목록
      - repayment_plan: 변제계획안
    """
    db = get_db()
    case_repo = CaseRepository(db)
    case = case_repo.get(req.case_id)
    if not case:
        raise HTTPException(status_code=404, detail="사건을 찾을 수 없습니다.")

    claims = ClaimRepository(db).list_by_case(req.case_id)
    properties = PropertyRepository(db).list_by_case(req.case_id)

    if req.document_type == "creditor_list":
        gen = CreditorListGenerator()
        doc = gen.generate(case, claims)
        if req.format == "text":
            return {"content": gen.to_text(doc)}
        return gen.to_dict(doc)

    elif req.document_type == "repayment_plan":
        gen = RepaymentPlanGenerator()
        doc = gen.generate(case, claims, properties)
        if req.format == "text":
            return {"content": gen.to_text(doc)}
        return gen.to_dict(doc)

    else:
        raise HTTPException(
            status_code=400,
            detail=f"지원하지 않는 문서 유형: {req.document_type}. "
                   f"지원 유형: creditor_list, repayment_plan",
        )


# ===== AI 보조 추출 (Extract) =====

class ExtractRequest(BaseModel):
    text: str
    case_id: Optional[str] = None


@router.post("/extract")
def extract_claims(req: ExtractRequest):
    """텍스트에서 채권 정보 추출 (AI 보조)

    입력 텍스트를 파싱하여 채권 후보를 반환합니다.
    직원이 확인 후 /apply-extraction으로 저장합니다.

    현재는 구조화된 텍스트 파싱만 지원합니다.
    OCR 연동은 향후 구현 예정입니다.
    """
    lines = [l.strip() for l in req.text.strip().split("\n") if l.strip()]
    candidates = []

    for line in lines:
        parts = [p.strip() for p in line.split(",")]
        if len(parts) >= 3:
            candidates.append({
                "creditor_name": parts[0],
                "cause_date": parts[1] if len(parts) > 1 else None,
                "debt_type": parts[2] if len(parts) > 2 else "기타",
                "principal": int(parts[3]) if len(parts) > 3 and parts[3].isdigit() else 0,
                "interest": int(parts[4]) if len(parts) > 4 and parts[4].isdigit() else 0,
                "penalty": int(parts[5]) if len(parts) > 5 and parts[5].isdigit() else 0,
            })

    return {
        "candidates": candidates,
        "count": len(candidates),
        "message": f"{len(candidates)}건의 채권 후보가 추출되었습니다. 확인 후 저장하세요.",
    }


class ApplyExtractionRequest(BaseModel):
    case_id: str
    claims: list[ClaimCreate]


@router.post("/apply-extraction")
def apply_extraction(req: ApplyExtractionRequest):
    """추출된 채권 일괄 저장

    /extract에서 추출된 후보를 직원이 확인한 후 저장합니다.
    """
    db = get_db()
    case_repo = CaseRepository(db)
    if not case_repo.get(req.case_id):
        raise HTTPException(status_code=404, detail="사건을 찾을 수 없습니다.")

    claim_repo = ClaimRepository(db)
    created = []
    for claim_data in req.claims:
        claim_data.case_id = req.case_id
        created.append(claim_repo.create(claim_data))

    return {
        "created": len(created),
        "claims": created,
        "message": f"{len(created)}건의 채권이 저장되었습니다.",
    }
