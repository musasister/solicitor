"""개인회생 서식 자동화 시스템 - FastAPI 애플리케이션

사용법:
    uvicorn insolvency.app:app --reload --port 8000

API 문서:
    http://localhost:8000/docs (Swagger UI)
    http://localhost:8000/redoc (ReDoc)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import router, set_db
from .database import Database


def create_app(db_path: str = None) -> FastAPI:
    """애플리케이션 팩토리"""
    app = FastAPI(
        title="개인회생 서식 자동화 시스템",
        description=(
            "개인회생 사건 처리를 위한 자동화 시스템.\n\n"
            "- 채권자목록 등 서류 자동 작성\n"
            "- 현재가치/청산가치 정합성 자동 검증\n"
            "- 증빙(소명자료) 검증 자동화\n"
            "- 보정재산 남용 원천 차단\n\n"
            "**핵심 원칙: 채무 1개 = 채권 1건 = 채권자목록 1행**"
        ),
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    db = Database(db_path)
    set_db(db)

    app.include_router(router, prefix="/api")

    return app


# 기본 앱 인스턴스
app = create_app()
