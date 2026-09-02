"""Cheap, dependency-free sanity checks for optional report text."""

import re

_REPEATED_CHARS = re.compile(r"(.)\1{4,}", re.DOTALL)


def is_low_quality_text(text: str) -> bool:
    """Return True when free text looks empty, spammy, or like keyboard mash.

    This is intentionally advisory: structured report fields remain the source of
    truth and callers should store, but not use, text that fails this check.
    """
    if not isinstance(text, str):
        return True
    trimmed = text.strip()
    if len(trimmed) < 3:
        return True
    if not any(ch.isalpha() for ch in trimmed):
        return True
    if _REPEATED_CHARS.search(trimmed):
        return True

    # Long, unspaced all-caps strings are usually keyboard mashes rather than
    # useful prose. Keep normal acronyms/short status notes unaffected.
    if len(trimmed) >= 10 and " " not in trimmed and trimmed.isupper():
        return True
    return False
