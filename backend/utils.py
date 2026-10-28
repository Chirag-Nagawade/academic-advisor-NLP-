"""
utils.py - General helper functions for data sanitation and JSON compliance.
"""

import math
from typing import Any


def sanitize_json(obj: Any) -> Any:
    """
    Recursively replaces NaN, Inf, and -Inf float values with None,
    ensuring all objects are strictly RFC 8259 JSON compliant.
    """
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    elif isinstance(obj, dict):
        return {k: sanitize_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_json(v) for v in obj]
    elif isinstance(obj, tuple):
        return tuple(sanitize_json(v) for v in obj)
    return obj
