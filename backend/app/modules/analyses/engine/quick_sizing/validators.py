from app.modules.analyses.engine.quick_sizing.models import QuickSizingInput


def validate_quick_sizing_input(inputs: QuickSizingInput) -> None:
    if len(inputs.bess_objectives) > 3:
        raise ValueError("Quick sizing supports at most 3 BESS objectives.")
