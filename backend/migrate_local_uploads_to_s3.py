"""Deprecated: Sizing Lab now uses transient uploads and does not persist source files."""


def main() -> None:
    print(
        "No migration is required. The current Sizing Lab flow processes Load/PV files "
        "temporarily and deletes them after the analysis request completes."
    )


if __name__ == "__main__":
    main()
