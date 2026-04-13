"""데이터 접근 계층 (Repository Pattern)"""

import json
import uuid
from datetime import datetime
from typing import Optional

from ..models.case import Case, CaseCreate, CaseUpdate, CaseSummary, CaseStatus
from ..models.claim import Claim, ClaimCreate, ClaimUpdate
from ..models.property import Property, PropertyCreate, PropertyUpdate
from ..models.evidence import Evidence, EvidenceCreate
from .connection import Database


def _gen_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def _now() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


class CaseRepository:
    """사건 데이터 접근"""

    def __init__(self, db: Database):
        self.db = db

    def create(self, data: CaseCreate) -> Case:
        case_id = _gen_id("case")
        now = _now()
        conn = self.db.get_connection()
        try:
            conn.execute(
                """INSERT INTO cases
                   (id, case_number, debtor_name, debtor_birth, debtor_id_last,
                    filing_date, reference_date, court_name,
                    repayment_months, monthly_income, monthly_expense, monthly_repayment,
                    status, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (case_id, data.case_number, data.debtor_name,
                 data.debtor_birth.isoformat(), data.debtor_id_last,
                 data.filing_date.isoformat() if data.filing_date else None,
                 data.reference_date.isoformat(), data.court_name,
                 data.repayment_months, data.monthly_income,
                 data.monthly_expense, data.monthly_repayment,
                 CaseStatus.DRAFT.value, now, now),
            )
            conn.commit()
            return self.get(case_id)
        finally:
            conn.close()

    def get(self, case_id: str) -> Optional[Case]:
        conn = self.db.get_connection()
        try:
            row = conn.execute("SELECT * FROM cases WHERE id = ?", (case_id,)).fetchone()
            if not row:
                return None
            return self._row_to_case(row)
        finally:
            conn.close()

    def list_all(self) -> list[CaseSummary]:
        conn = self.db.get_connection()
        try:
            rows = conn.execute("""
                SELECT c.id, c.case_number, c.debtor_name, c.status, c.created_at,
                       COALESCE(COUNT(cl.id), 0) AS total_claims,
                       COALESCE(SUM(cl.total), 0) AS total_claim_amount
                FROM cases c
                LEFT JOIN claims cl ON c.id = cl.case_id
                GROUP BY c.id
                ORDER BY c.created_at DESC
            """).fetchall()
            return [
                CaseSummary(
                    id=r["id"],
                    case_number=r["case_number"],
                    debtor_name=r["debtor_name"],
                    status=CaseStatus(r["status"]),
                    total_claims=r["total_claims"],
                    total_claim_amount=r["total_claim_amount"],
                    created_at=r["created_at"],
                )
                for r in rows
            ]
        finally:
            conn.close()

    def update(self, case_id: str, data: CaseUpdate) -> Optional[Case]:
        updates = data.model_dump(exclude_none=True)
        if not updates:
            return self.get(case_id)

        # Convert date fields
        for field in ("debtor_birth", "filing_date", "reference_date"):
            if field in updates and updates[field] is not None:
                updates[field] = updates[field].isoformat()
        if "status" in updates:
            updates["status"] = updates["status"].value

        updates["updated_at"] = _now()
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [case_id]

        conn = self.db.get_connection()
        try:
            conn.execute(f"UPDATE cases SET {set_clause} WHERE id = ?", values)
            conn.commit()
            return self.get(case_id)
        finally:
            conn.close()

    def delete(self, case_id: str) -> bool:
        conn = self.db.get_connection()
        try:
            cursor = conn.execute("DELETE FROM cases WHERE id = ?", (case_id,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()

    @staticmethod
    def _row_to_case(row) -> Case:
        return Case(
            id=row["id"],
            case_number=row["case_number"],
            debtor_name=row["debtor_name"],
            debtor_birth=row["debtor_birth"],
            debtor_id_last=row["debtor_id_last"],
            filing_date=row["filing_date"],
            reference_date=row["reference_date"],
            court_name=row["court_name"],
            repayment_months=row["repayment_months"],
            monthly_income=row["monthly_income"],
            monthly_expense=row["monthly_expense"],
            monthly_repayment=row["monthly_repayment"],
            status=CaseStatus(row["status"]),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )


class ClaimRepository:
    """채권 데이터 접근

    핵심: 채무 1개 = 채권 1건 = 채권자목록 1행
    같은 채권자명 반복 허용
    """

    def __init__(self, db: Database):
        self.db = db

    def create(self, data: ClaimCreate) -> Claim:
        claim_id = _gen_id("cl")
        now = _now()
        total = data.principal + data.interest + data.penalty

        conn = self.db.get_connection()
        try:
            # 자동 채권번호 부여 (사건 내 최대 번호 + 1)
            row = conn.execute(
                "SELECT COALESCE(MAX(claim_number), 0) AS max_num FROM claims WHERE case_id = ?",
                (data.case_id,),
            ).fetchone()
            claim_number = row["max_num"] + 1

            conn.execute(
                """INSERT INTO claims
                   (id, case_id, claim_number, creditor_name, cause_date, debt_type,
                    cause_detail, principal, interest, penalty, total,
                    secured, priority, evidence_ids, status, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (claim_id, data.case_id, claim_number, data.creditor_name,
                 data.cause_date.isoformat(), data.debt_type, data.cause_detail,
                 data.principal, data.interest, data.penalty, total,
                 int(data.secured), int(data.priority),
                 json.dumps(data.evidence_ids), "확정", now, now),
            )
            conn.commit()
            return self.get(claim_id)
        finally:
            conn.close()

    def get(self, claim_id: str) -> Optional[Claim]:
        conn = self.db.get_connection()
        try:
            row = conn.execute("SELECT * FROM claims WHERE id = ?", (claim_id,)).fetchone()
            if not row:
                return None
            return self._row_to_claim(row)
        finally:
            conn.close()

    def list_by_case(self, case_id: str) -> list[Claim]:
        conn = self.db.get_connection()
        try:
            rows = conn.execute(
                "SELECT * FROM claims WHERE case_id = ? ORDER BY claim_number",
                (case_id,),
            ).fetchall()
            return [self._row_to_claim(r) for r in rows]
        finally:
            conn.close()

    def update(self, claim_id: str, data: ClaimUpdate) -> Optional[Claim]:
        updates = data.model_dump(exclude_none=True)
        if not updates:
            return self.get(claim_id)

        if "cause_date" in updates:
            updates["cause_date"] = updates["cause_date"].isoformat()
        if "status" in updates:
            updates["status"] = updates["status"].value
        if "evidence_ids" in updates:
            updates["evidence_ids"] = json.dumps(updates["evidence_ids"])

        # Recalculate total if amounts changed
        existing = self.get(claim_id)
        if existing:
            principal = updates.get("principal", existing.principal)
            interest = updates.get("interest", existing.interest)
            penalty = updates.get("penalty", existing.penalty)
            updates["total"] = principal + interest + penalty

        updates["updated_at"] = _now()
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [claim_id]

        conn = self.db.get_connection()
        try:
            conn.execute(f"UPDATE claims SET {set_clause} WHERE id = ?", values)
            conn.commit()
            return self.get(claim_id)
        finally:
            conn.close()

    def delete(self, claim_id: str) -> bool:
        conn = self.db.get_connection()
        try:
            cursor = conn.execute("DELETE FROM claims WHERE id = ?", (claim_id,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()

    @staticmethod
    def _row_to_claim(row) -> Claim:
        return Claim(
            id=row["id"],
            case_id=row["case_id"],
            claim_number=row["claim_number"],
            creditor_name=row["creditor_name"],
            cause_date=row["cause_date"],
            debt_type=row["debt_type"],
            cause_detail=row["cause_detail"],
            principal=row["principal"],
            interest=row["interest"],
            penalty=row["penalty"],
            total=row["total"],
            secured=bool(row["secured"]),
            priority=bool(row["priority"]),
            evidence_ids=json.loads(row["evidence_ids"]),
            status=row["status"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )


class PropertyRepository:
    """재산 데이터 접근"""

    def __init__(self, db: Database):
        self.db = db

    def create(self, data: PropertyCreate) -> Property:
        prop_id = _gen_id("prop")
        now = _now()
        conn = self.db.get_connection()
        try:
            conn.execute(
                """INSERT INTO properties
                   (id, case_id, property_type, description,
                    appraised_value, liquidation_value, is_adjustment, note,
                    created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (prop_id, data.case_id, data.property_type, data.description,
                 data.appraised_value, data.liquidation_value,
                 int(data.is_adjustment), data.note, now, now),
            )
            conn.commit()
            return self.get(prop_id)
        finally:
            conn.close()

    def get(self, prop_id: str) -> Optional[Property]:
        conn = self.db.get_connection()
        try:
            row = conn.execute("SELECT * FROM properties WHERE id = ?", (prop_id,)).fetchone()
            if not row:
                return None
            return self._row_to_property(row)
        finally:
            conn.close()

    def list_by_case(self, case_id: str) -> list[Property]:
        conn = self.db.get_connection()
        try:
            rows = conn.execute(
                "SELECT * FROM properties WHERE case_id = ? ORDER BY created_at",
                (case_id,),
            ).fetchall()
            return [self._row_to_property(r) for r in rows]
        finally:
            conn.close()

    def update(self, prop_id: str, data: PropertyUpdate) -> Optional[Property]:
        updates = data.model_dump(exclude_none=True)
        if not updates:
            return self.get(prop_id)

        updates["updated_at"] = _now()
        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [prop_id]

        conn = self.db.get_connection()
        try:
            conn.execute(f"UPDATE properties SET {set_clause} WHERE id = ?", values)
            conn.commit()
            return self.get(prop_id)
        finally:
            conn.close()

    def delete(self, prop_id: str) -> bool:
        conn = self.db.get_connection()
        try:
            cursor = conn.execute("DELETE FROM properties WHERE id = ?", (prop_id,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()

    @staticmethod
    def _row_to_property(row) -> Property:
        return Property(
            id=row["id"],
            case_id=row["case_id"],
            property_type=row["property_type"],
            description=row["description"],
            appraised_value=row["appraised_value"],
            liquidation_value=row["liquidation_value"],
            is_adjustment=bool(row["is_adjustment"]),
            note=row["note"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )


class EvidenceRepository:
    """증빙 데이터 접근"""

    def __init__(self, db: Database):
        self.db = db

    def create(self, data: EvidenceCreate) -> Evidence:
        ev_id = _gen_id("ev")
        now = _now()
        conn = self.db.get_connection()
        try:
            conn.execute(
                """INSERT INTO evidences
                   (id, case_id, claim_id, evidence_type, description,
                    file_path, valid_from, valid_until, status, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (ev_id, data.case_id, data.claim_id, data.evidence_type,
                 data.description, data.file_path,
                 data.valid_from.isoformat() if data.valid_from else None,
                 data.valid_until.isoformat() if data.valid_until else None,
                 "미확인", now),
            )
            conn.commit()
            return self.get(ev_id)
        finally:
            conn.close()

    def get(self, ev_id: str) -> Optional[Evidence]:
        conn = self.db.get_connection()
        try:
            row = conn.execute("SELECT * FROM evidences WHERE id = ?", (ev_id,)).fetchone()
            if not row:
                return None
            return self._row_to_evidence(row)
        finally:
            conn.close()

    def list_by_case(self, case_id: str) -> list[Evidence]:
        conn = self.db.get_connection()
        try:
            rows = conn.execute(
                "SELECT * FROM evidences WHERE case_id = ? ORDER BY created_at",
                (case_id,),
            ).fetchall()
            return [self._row_to_evidence(r) for r in rows]
        finally:
            conn.close()

    def list_by_claim(self, claim_id: str) -> list[Evidence]:
        conn = self.db.get_connection()
        try:
            rows = conn.execute(
                "SELECT * FROM evidences WHERE claim_id = ? ORDER BY created_at",
                (claim_id,),
            ).fetchall()
            return [self._row_to_evidence(r) for r in rows]
        finally:
            conn.close()

    def delete(self, ev_id: str) -> bool:
        conn = self.db.get_connection()
        try:
            cursor = conn.execute("DELETE FROM evidences WHERE id = ?", (ev_id,))
            conn.commit()
            return cursor.rowcount > 0
        finally:
            conn.close()

    @staticmethod
    def _row_to_evidence(row) -> Evidence:
        return Evidence(
            id=row["id"],
            case_id=row["case_id"],
            claim_id=row["claim_id"],
            evidence_type=row["evidence_type"],
            description=row["description"],
            file_path=row["file_path"],
            valid_from=row["valid_from"],
            valid_until=row["valid_until"],
            status=row["status"],
            created_at=row["created_at"],
        )
