from collections.abc import Mapping
from typing import Any


def without_none(values: Mapping[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in values.items() if value is not None}
