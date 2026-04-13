"""API 엔드포인트 테스트"""

import os
import tempfile
import pytest
from fastapi.testclient import TestClient

from insolvency.app import create_app
from insolvency.database import Database
from insolvency.api.routes import set_db


@pytest.fixture
def client():
    """테스트용 클라이언트 (임시 DB 사용)"""
    fd, db_path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    try:
        app = create_app(db_path=db_path)
        with TestClient(app) as c:
            yield c
    finally:
        os.unlink(db_path)


@pytest.fixture
def case_id(client):
    """테스트 사건 생성"""
    resp = client.post("/api/cases", json={
        "debtor_name": "홍길동",
        "debtor_birth": "1985-03-15",
        "reference_date": "2026-04-14",
        "repayment_months": 36,
        "monthly_income": 3000000,
        "monthly_expense": 2500000,
        "monthly_repayment": 500000,
    })
    assert resp.status_code == 201
    return resp.json()["id"]


class TestCaseAPI:
    """사건 API 테스트"""

    def test_create_case(self, client):
        resp = client.post("/api/cases", json={
            "debtor_name": "김철수",
            "debtor_birth": "1990-06-20",
            "reference_date": "2026-04-14",
            "repayment_months": 60,
            "monthly_repayment": 300000,
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["debtor_name"] == "김철수"
        assert data["repayment_months"] == 60
        assert data["status"] == "작성중"

    def test_get_case(self, client, case_id):
        resp = client.get(f"/api/cases/{case_id}")
        assert resp.status_code == 200
        assert resp.json()["debtor_name"] == "홍길동"

    def test_list_cases(self, client, case_id):
        resp = client.get("/api/cases")
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_update_case(self, client, case_id):
        resp = client.put(f"/api/cases/{case_id}", json={
            "monthly_repayment": 600000,
        })
        assert resp.status_code == 200
        assert resp.json()["monthly_repayment"] == 600000

    def test_delete_case(self, client, case_id):
        resp = client.delete(f"/api/cases/{case_id}")
        assert resp.status_code == 200
        resp = client.get(f"/api/cases/{case_id}")
        assert resp.status_code == 404

    def test_get_nonexistent_case(self, client):
        resp = client.get("/api/cases/nonexistent")
        assert resp.status_code == 404


class TestClaimAPI:
    """채권 API 테스트"""

    def test_create_claim(self, client, case_id):
        """채권 생성 (채무 1개 = 채권 1건)"""
        resp = client.post(f"/api/cases/{case_id}/claims", json={
            "case_id": case_id,
            "creditor_name": "KB국민카드",
            "cause_date": "2024-01-23",
            "debt_type": "대출금",
            "principal": 5000000,
            "interest": 300000,
            "penalty": 0,
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["creditor_name"] == "KB국민카드"
        assert data["claim_number"] == 1
        assert data["total"] == 5300000

    def test_same_creditor_multiple_claims(self, client, case_id):
        """같은 채권자 반복 입력 (PRD 핵심 요구사항)"""
        claims_data = [
            {"creditor_name": "KB국민카드", "cause_date": "2023-08-10",
             "debt_type": "현금서비스", "principal": 3000000, "interest": 200000},
            {"creditor_name": "KB국민카드", "cause_date": "2024-01-23",
             "debt_type": "대출금", "principal": 5000000, "interest": 300000},
            {"creditor_name": "KB국민카드", "cause_date": "2024-03-02",
             "debt_type": "카드론", "principal": 2000000, "interest": 100000},
        ]

        for i, data in enumerate(claims_data, 1):
            data["case_id"] = case_id
            resp = client.post(f"/api/cases/{case_id}/claims", json=data)
            assert resp.status_code == 201
            assert resp.json()["claim_number"] == i

        # 목록 조회 시 3건 모두 반환
        resp = client.get(f"/api/cases/{case_id}/claims")
        assert resp.status_code == 200
        claims = resp.json()
        assert len(claims) == 3
        assert all(c["creditor_name"] == "KB국민카드" for c in claims)

    def test_list_claims(self, client, case_id):
        # 채권 2건 추가
        for dt in ["대출금", "카드론"]:
            client.post(f"/api/cases/{case_id}/claims", json={
                "case_id": case_id,
                "creditor_name": "신한카드",
                "cause_date": "2024-05-01",
                "debt_type": dt,
                "principal": 1000000,
            })

        resp = client.get(f"/api/cases/{case_id}/claims")
        assert resp.status_code == 200
        assert len(resp.json()) == 2

    def test_update_claim(self, client, case_id):
        resp = client.post(f"/api/cases/{case_id}/claims", json={
            "case_id": case_id,
            "creditor_name": "하나카드",
            "cause_date": "2024-02-01",
            "debt_type": "대출금",
            "principal": 1000000,
        })
        claim_id = resp.json()["id"]

        resp = client.put(f"/api/claims/{claim_id}", json={
            "principal": 2000000,
            "interest": 100000,
        })
        assert resp.status_code == 200
        assert resp.json()["total"] == 2100000

    def test_delete_claim(self, client, case_id):
        resp = client.post(f"/api/cases/{case_id}/claims", json={
            "case_id": case_id,
            "creditor_name": "삭제테스트",
            "cause_date": "2024-01-01",
            "debt_type": "기타",
            "principal": 100000,
        })
        claim_id = resp.json()["id"]

        resp = client.delete(f"/api/claims/{claim_id}")
        assert resp.status_code == 200


class TestPropertyAPI:
    """재산 API 테스트"""

    def test_create_property(self, client, case_id):
        resp = client.post(f"/api/cases/{case_id}/properties", json={
            "case_id": case_id,
            "property_type": "예금",
            "description": "국민은행 보통예금",
            "appraised_value": 1000000,
            "liquidation_value": 1000000,
        })
        assert resp.status_code == 201

    def test_adjustment_property_blocked(self, client, case_id):
        """보정재산 초과 시 저장 차단 테스트"""
        # 명시적 재산 추가
        client.post(f"/api/cases/{case_id}/properties", json={
            "case_id": case_id,
            "property_type": "예금",
            "description": "보통예금",
            "liquidation_value": 5000000,
        })
        # 과도한 보정재산 시도 → 차단
        resp = client.post(f"/api/cases/{case_id}/properties", json={
            "case_id": case_id,
            "property_type": "기타",
            "description": "보정재산",
            "liquidation_value": 100_000_000,
            "is_adjustment": True,
        })
        assert resp.status_code == 422
        assert resp.json()["detail"]["error_code"] == "R-ADJ-001"


class TestValidationAPI:
    """정합성 검증 API 테스트"""

    def test_validate_valid_case(self, client, case_id):
        """유효한 사건 검증"""
        # 채권 추가
        client.post(f"/api/cases/{case_id}/claims", json={
            "case_id": case_id,
            "creditor_name": "KB국민카드",
            "cause_date": "2024-01-23",
            "debt_type": "대출금",
            "principal": 5000000,
            "interest": 300000,
        })
        # 재산 추가
        client.post(f"/api/cases/{case_id}/properties", json={
            "case_id": case_id,
            "property_type": "예금",
            "description": "보통예금",
            "liquidation_value": 1000000,
        })

        resp = client.post("/api/validate", json={"case_id": case_id})
        assert resp.status_code == 200
        data = resp.json()
        assert "summary" in data

    def test_validate_nonexistent_case(self, client):
        resp = client.post("/api/validate", json={"case_id": "nonexistent"})
        assert resp.status_code == 404


class TestDocumentGenerationAPI:
    """문서 생성 API 테스트"""

    def _setup_case_with_claims(self, client, case_id):
        """테스트용 채권/재산 세팅"""
        claims = [
            {"creditor_name": "KB국민카드", "cause_date": "2023-08-10",
             "debt_type": "현금서비스", "principal": 3000000, "interest": 200000},
            {"creditor_name": "KB국민카드", "cause_date": "2024-01-23",
             "debt_type": "대출금", "principal": 5000000, "interest": 300000},
            {"creditor_name": "신한카드", "cause_date": "2024-05-01",
             "debt_type": "카드론", "principal": 2000000, "interest": 100000},
        ]
        for c in claims:
            c["case_id"] = case_id
            client.post(f"/api/cases/{case_id}/claims", json=c)

        client.post(f"/api/cases/{case_id}/properties", json={
            "case_id": case_id,
            "property_type": "예금",
            "description": "보통예금",
            "liquidation_value": 1000000,
        })

    def test_generate_creditor_list_json(self, client, case_id):
        self._setup_case_with_claims(client, case_id)
        resp = client.post("/api/generate-document", json={
            "case_id": case_id,
            "document_type": "creditor_list",
            "format": "json",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "채권자목록"
        assert len(data["rows"]) == 3

    def test_generate_creditor_list_text(self, client, case_id):
        self._setup_case_with_claims(client, case_id)
        resp = client.post("/api/generate-document", json={
            "case_id": case_id,
            "document_type": "creditor_list",
            "format": "text",
        })
        assert resp.status_code == 200
        content = resp.json()["content"]
        assert "채  권  자  목  록" in content
        assert "KB국민카드" in content

    def test_generate_repayment_plan(self, client, case_id):
        self._setup_case_with_claims(client, case_id)
        resp = client.post("/api/generate-document", json={
            "case_id": case_id,
            "document_type": "repayment_plan",
            "format": "json",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "변제계획안"
        assert len(data["schedule"]) == 36

    def test_invalid_document_type(self, client, case_id):
        resp = client.post("/api/generate-document", json={
            "case_id": case_id,
            "document_type": "invalid",
        })
        assert resp.status_code == 400


class TestExtractAPI:
    """AI 보조 추출 API 테스트"""

    def test_extract_from_text(self, client):
        text = (
            "KB국민카드, 2023-08-10, 현금서비스, 3000000, 200000, 0\n"
            "KB국민카드, 2024-01-23, 대출금, 5000000, 300000, 0\n"
            "신한카드, 2024-03-02, 카드론, 2000000, 100000, 50000"
        )
        resp = client.post("/api/extract", json={"text": text})
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] == 3

    def test_apply_extraction(self, client, case_id):
        resp = client.post("/api/apply-extraction", json={
            "case_id": case_id,
            "claims": [
                {"case_id": case_id, "creditor_name": "KB국민카드",
                 "cause_date": "2023-08-10", "debt_type": "현금서비스",
                 "principal": 3000000, "interest": 200000},
                {"case_id": case_id, "creditor_name": "신한카드",
                 "cause_date": "2024-05-01", "debt_type": "카드론",
                 "principal": 2000000},
            ],
        })
        assert resp.status_code == 200
        assert resp.json()["created"] == 2
