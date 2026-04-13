"""SQLite 데이터베이스 연결 및 스키마 관리"""

import sqlite3
from pathlib import Path
from typing import Optional

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    case_number TEXT,
    debtor_name TEXT NOT NULL,
    debtor_birth TEXT NOT NULL,
    debtor_id_last TEXT,
    filing_date TEXT,
    reference_date TEXT NOT NULL,
    court_name TEXT,
    repayment_months INTEGER NOT NULL DEFAULT 36,
    monthly_income INTEGER NOT NULL DEFAULT 0,
    monthly_expense INTEGER NOT NULL DEFAULT 0,
    monthly_repayment INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT '작성중',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS claims (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    claim_number INTEGER NOT NULL,
    creditor_name TEXT NOT NULL,
    cause_date TEXT NOT NULL,
    debt_type TEXT NOT NULL,
    cause_detail TEXT,
    principal INTEGER NOT NULL DEFAULT 0,
    interest INTEGER NOT NULL DEFAULT 0,
    penalty INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    secured INTEGER NOT NULL DEFAULT 0,
    priority INTEGER NOT NULL DEFAULT 0,
    evidence_ids TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT '확정',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    property_type TEXT NOT NULL,
    description TEXT NOT NULL,
    appraised_value INTEGER NOT NULL DEFAULT 0,
    liquidation_value INTEGER NOT NULL DEFAULT 0,
    is_adjustment INTEGER NOT NULL DEFAULT 0,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evidences (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    claim_id TEXT,
    evidence_type TEXT NOT NULL,
    description TEXT,
    file_path TEXT,
    valid_from TEXT,
    valid_until TEXT,
    status TEXT NOT NULL DEFAULT '미확인',
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (claim_id) REFERENCES claims(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_claims_case_id ON claims(case_id);
CREATE INDEX IF NOT EXISTS idx_claims_case_claim_number ON claims(case_id, claim_number);
CREATE INDEX IF NOT EXISTS idx_properties_case_id ON properties(case_id);
CREATE INDEX IF NOT EXISTS idx_evidences_case_id ON evidences(case_id);
CREATE INDEX IF NOT EXISTS idx_evidences_claim_id ON evidences(claim_id);
"""


class Database:
    """SQLite 데이터베이스 연결 관리자"""

    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            db_dir = Path(__file__).parent.parent / "data"
            db_dir.mkdir(exist_ok=True)
            db_path = str(db_dir / "insolvency.db")
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """데이터베이스 초기화 및 스키마 생성"""
        conn = self.get_connection()
        try:
            conn.executescript(SCHEMA_SQL)
            conn.commit()
        finally:
            conn.close()

    def get_connection(self) -> sqlite3.Connection:
        """새 데이터베이스 연결 반환"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn
