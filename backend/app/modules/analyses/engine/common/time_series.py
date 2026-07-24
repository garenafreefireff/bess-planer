from collections.abc import Sequence


def require_equal_lengths(*series: Sequence[object]) -> None:
    lengths = {len(item) for item in series}
    if len(lengths) > 1:
        raise ValueError("Time series inputs must have equal lengths.")
