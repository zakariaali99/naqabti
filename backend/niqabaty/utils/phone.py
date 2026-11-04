import re

LIBYA_CODE = '218'
_SEPARATORS = re.compile(r'[\s\-().]')


def normalize_phone(value):
    """Return a Libyan number as +218XXXXXXXXX; other input is only compacted.

    Accepts the ways people usually type it: 0912345678, 912345678,
    218912345678, 00218912345678 and +218 91 234 5678.
    """
    if value is None:
        return None
    compact = _SEPARATORS.sub('', str(value))
    if compact.startswith('00'):
        compact = '+' + compact[2:]
    if compact.startswith('+'):
        return compact
    if re.fullmatch(r'218\d{9}', compact):
        return '+' + compact
    if re.fullmatch(r'0\d{9}', compact):
        return '+' + LIBYA_CODE + compact[1:]
    if re.fullmatch(r'9\d{8}', compact):
        return '+' + LIBYA_CODE + compact
    return compact


def phone_variants(value):
    """Every stored form a number may have; older rows were saved as typed."""
    if not value or not str(value).strip():
        return []
    variants = {str(value).strip(), normalize_phone(value)}
    normalized = normalize_phone(value)
    if re.fullmatch(r'\+218\d{9}', normalized):
        local = normalized[4:]
        variants.update({'0' + local, LIBYA_CODE + local, '00' + LIBYA_CODE + local})
    return sorted(v for v in variants if v)
