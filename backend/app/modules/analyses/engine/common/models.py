from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class TimeSeriesPoint:
    timestamp: datetime
    value: float
