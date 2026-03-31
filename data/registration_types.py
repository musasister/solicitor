"""
법인등기 유형별 수수료 데이터
"""

# 등기 유형 목록
REGISTRATION_TYPES = [
    "설립등기",
    "임원변경등기",
    "본점이전등기 (관할내)",
    "본점이전등기 (관할외)",
    "유상증자등기",
    "무상증자등기",
    "감자등기",
    "목적변경등기",
    "상호변경등기",
    "합병등기",
    "분할등기",
    "해산등기",
    "청산종결등기",
]

# 자본금 기반 계산이 필요한 등기 유형
CAPITAL_BASED_TYPES = [
    "설립등기",
    "유상증자등기",
    "무상증자등기",
    "합병등기",
]

# 등록면허세율 및 고정금액
# "rate" = 자본금 대비 비율, "fixed" = 고정금액(원)
# "min" = 최소 등록면허세, "metro_multiplier" = 수도권과밀억제권역 배율
FEE_TABLE = {
    "설립등기": {
        "registration_tax": {
            "rate": 0.004,          # 자본금 × 0.4%
            "min": 112500,          # 최소 112,500원
            "metro_multiplier": 3,  # 수도권과밀억제권역 3배
        },
        "education_tax_rate": 0.2,  # 등록면허세 × 20%
        "court_fee": 2000,          # 등기신청수수료 (전자신청)
        "judicial_scrivener_fee": 500000,  # 법무사 기본보수 (참고용)
    },
    "임원변경등기": {
        "registration_tax": {
            "fixed_under_1b": 40200,   # 자본금 10억 미만
            "fixed_over_1b": 40200,    # 자본금 10억 이상 (지방세법 기준)
        },
        "education_tax_rate": 0.2,
        "court_fee": 2000,
        "judicial_scrivener_fee": 300000,
    },
    "본점이전등기 (관할내)": {
        "registration_tax": {
            "fixed": 40200,
        },
        "education_tax_rate": 0.2,
        "court_fee": 2000,
        "judicial_scrivener_fee": 300000,
    },
    "본점이전등기 (관할외)": {
        "registration_tax": {
            "fixed": 40200,
            "count": 2,  # 전출 + 전입 2건
        },
        "education_tax_rate": 0.2,
        "court_fee": 2000,
        "court_fee_count": 2,
        "judicial_scrivener_fee": 400000,
    },
    "유상증자등기": {
        "registration_tax": {
            "rate": 0.004,          # 증자액 × 0.4%
            "min": 112500,
            "metro_multiplier": 3,
        },
        "education_tax_rate": 0.2,
        "court_fee": 2000,
        "judicial_scrivener_fee": 400000,
    },
    "무상증자등기": {
        "registration_tax": {
            "rate": 0.004,
            "min": 112500,
            "metro_multiplier": 3,
        },
        "education_tax_rate": 0.2,
        "court_fee": 2000,
        "judicial_scrivener_fee": 350000,
    },
    "감자등기": {
        "registration_tax": {
            "fixed": 40200,
        },
        "education_tax_rate": 0.2,
        "court_fee": 2000,
        "judicial_scrivener_fee": 400000,
    },
    "목적변경등기": {
        "registration_tax": {
            "fixed": 40200,
        },
        "education_tax_rate": 0.2,
        "court_fee": 2000,
        "judicial_scrivener_fee": 250000,
    },
    "상호변경등기": {
        "registration_tax": {
            "fixed": 40200,
        },
        "education_tax_rate": 0.2,
        "court_fee": 2000,
        "judicial_scrivener_fee": 250000,
    },
    "합병등기": {
        "registration_tax": {
            "rate": 0.004,
            "min": 112500,
            "metro_multiplier": 3,
        },
        "education_tax_rate": 0.2,
        "court_fee": 2000,
        "judicial_scrivener_fee": 800000,
    },
    "분할등기": {
        "registration_tax": {
            "fixed": 40200,
        },
        "education_tax_rate": 0.2,
        "court_fee": 2000,
        "judicial_scrivener_fee": 800000,
    },
    "해산등기": {
        "registration_tax": {
            "fixed": 40200,
        },
        "education_tax_rate": 0.2,
        "court_fee": 2000,
        "judicial_scrivener_fee": 300000,
    },
    "청산종결등기": {
        "registration_tax": {
            "fixed": 40200,
        },
        "education_tax_rate": 0.2,
        "court_fee": 2000,
        "judicial_scrivener_fee": 250000,
    },
}

# 견적서 항목 표시명
FEE_LABELS = {
    "registration_tax": "등록면허세",
    "education_tax": "지방교육세",
    "court_fee": "등기신청수수료",
    "judicial_scrivener_fee": "법무사 보수",
    "total": "합계",
}
