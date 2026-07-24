from app.modules.analyses.engine.quick_sizing.build_step2_assumptions import (
    build_quick_sizing_step2_assumptions,
)
from app.modules.analyses.engine.quick_sizing.config import (
    DEFAULT_QUICK_SIZING_CONFIG,
    QuickSizingConfig,
)
from app.modules.analyses.engine.quick_sizing.models import QuickSizingInput, QuickSizingResult


class QuickSizingCalculator:
    def __init__(self, config: QuickSizingConfig | None = None) -> None:
        self.config = config or DEFAULT_QUICK_SIZING_CONFIG

    def calculate(self, inputs: QuickSizingInput) -> QuickSizingResult:
        return build_quick_sizing_step2_assumptions(inputs, self.config)
