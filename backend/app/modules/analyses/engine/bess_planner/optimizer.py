from typing import Any


class BessPlannerOptimizer:
    engine_version = "bess-precheck-0.1.0"

    def precheck(
        self,
        *,
        configuration: dict[str, Any],
        datasets: list[dict[str, Any]],
    ) -> dict[str, Any]:
        power_kw = _positive_number(configuration.get("powerKw"))
        energy_kwh = _positive_number(configuration.get("energyKwh"))
        load_dataset = next(
            (item for item in datasets if item.get("dataset_type") == "load_profile"),
            None,
        )
        pv_dataset = next(
            (item for item in datasets if item.get("dataset_type") == "pv_profile"),
            None,
        )

        warnings: list[str] = []
        blockers: list[str] = []
        if power_kw is None:
            blockers.append("Công suất BESS cấu hình phải lớn hơn 0.")
        if energy_kwh is None:
            blockers.append("Dung lượng BESS cấu hình phải lớn hơn 0.")
        if load_dataset is None:
            blockers.append("Cần có dataset phụ tải trước khi tối ưu.")
        elif load_dataset.get("status") == "invalid":
            blockers.append("Dataset phụ tải không hợp lệ.")
        elif load_dataset.get("status") == "warning":
            warnings.append("Dataset phụ tải có cảnh báo chất lượng dữ liệu.")

        if pv_dataset and pv_dataset.get("status") == "warning":
            warnings.append("Dataset điện mặt trời có cảnh báo chất lượng dữ liệu.")
        if pv_dataset and pv_dataset.get("status") == "invalid":
            warnings.append("Dataset điện mặt trời không hợp lệ và sẽ bị loại khỏi bước tối ưu.")

        duration_hours = energy_kwh / power_kw if power_kw and energy_kwh else None
        c_rate = power_kw / energy_kwh if power_kw and energy_kwh else None
        if duration_hours is not None and duration_hours < 0.5:
            warnings.append("Thời lượng BESS cấu hình thấp hơn 0,5 giờ.")
        if duration_hours is not None and duration_hours > 8:
            warnings.append("Thời lượng BESS cấu hình lớn hơn 8 giờ.")

        ready = not blockers
        return {
            "stage": "data_precheck",
            "ready_for_optimization": ready,
            "optimizer_executed": False,
            "optimizer_status": "not_implemented",
            "configured_system": {
                "power_kw": power_kw,
                "energy_kwh": energy_kwh,
                "duration_hours": round(duration_hours, 4) if duration_hours is not None else None,
                "c_rate": round(c_rate, 4) if c_rate is not None else None,
            },
            "datasets": datasets,
            "warnings": warnings,
            "blockers": blockers,
            "next_step": (
                "Triển khai dispatch optimizer và mô hình tài chính."
                if ready
                else "Xử lý các điều kiện chặn trước khi tối ưu."
            ),
        }

    def optimize(self, inputs: object) -> object:
        raise NotImplementedError("BESS planner dispatch optimization is not implemented yet.")


def _positive_number(value: object) -> float | None:
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    number = float(value)
    return number if number > 0 else None
