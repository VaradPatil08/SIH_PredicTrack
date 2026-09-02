from app.services.report_filters import is_low_quality_text


def test_low_quality_text_detection():
    assert is_low_quality_text("")
    assert is_low_quality_text("  ")
    assert is_low_quality_text("ab")
    assert is_low_quality_text("12345!!!")
    assert is_low_quality_text("😀😀😀😀")
    assert is_low_quality_text("aaaaaa")
    assert is_low_quality_text("ABCDEFGHIJK")
    assert not is_low_quality_text("Signal hold outside Surat")
    assert not is_low_quality_text("15 min delay")
