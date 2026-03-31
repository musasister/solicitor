"""
법인등기 수수료 계산 모듈
"""

from data.registration_types import FEE_TABLE, CAPITAL_BASED_TYPES


def calculate_fees(reg_type, capital_amount=0, is_metro=False):
    """
    등기 유형별 수수료를 계산한다.

    Args:
        reg_type: 등기 유형명 (REGISTRATION_TYPES 중 하나)
        capital_amount: 자본금 또는 증자액 (원)
        is_metro: 수도권과밀억제권역 여부

    Returns:
        dict: {
            "등록면허세": int,
            "지방교육세": int,
            "등기신청수수료": int,
            "법무사 보수": int,
            "합계": int,
        }
    """
    if reg_type not in FEE_TABLE:
        return None

    fee_info = FEE_TABLE[reg_type]
    tax_info = fee_info["registration_tax"]

    # 등록면허세 계산
    if "rate" in tax_info:
        # 자본금 기반 계산
        registration_tax = int(capital_amount * tax_info["rate"])
        min_tax = tax_info.get("min", 0)
        if registration_tax < min_tax:
            registration_tax = min_tax
        if is_metro:
            registration_tax = int(registration_tax * tax_info.get("metro_multiplier", 1))
    elif "fixed" in tax_info:
        registration_tax = tax_info["fixed"]
        count = tax_info.get("count", 1)
        registration_tax *= count
    elif "fixed_under_1b" in tax_info:
        # 임원변경 등 자본금 구간별
        if capital_amount >= 1_000_000_000:
            registration_tax = tax_info["fixed_over_1b"]
        else:
            registration_tax = tax_info["fixed_under_1b"]
    else:
        registration_tax = 0

    # 지방교육세
    education_tax = int(registration_tax * fee_info["education_tax_rate"])

    # 등기신청수수료
    court_fee = fee_info["court_fee"]
    court_fee_count = fee_info.get("court_fee_count", 1)
    court_fee_total = court_fee * court_fee_count

    # 법무사 보수
    scrivener_fee = fee_info["judicial_scrivener_fee"]

    # 합계
    total = registration_tax + education_tax + court_fee_total + scrivener_fee

    return {
        "등록면허세": registration_tax,
        "지방교육세": education_tax,
        "등기신청수수료": court_fee_total,
        "법무사 보수": scrivener_fee,
        "합계": total,
    }


def format_currency(amount):
    """금액을 한국 원화 형식으로 포맷팅"""
    return f"{amount:,.0f}원"
