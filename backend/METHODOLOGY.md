# BESS Planner methodology

## Product boundary

The platform contains two intentionally different calculation paths.

### Quick Sizing

Quick Sizing is a pre-sales screening tool. It does not require historical Load/PV files and uses normalized Step 1 inputs, configurable assumptions, scenario defaults, candidate generation and simplified annual cash-flow models. Every output must be presented as a preliminary estimate rather than an engineering guarantee.

### BESS Planner / Sizing Lab

BESS Planner requires an authenticated user and an actual Load profile. PV is optional. It runs a 15-minute optimization over candidate BESS sizes, scores the resulting electricity bill, constructs a Pareto front and selects a balanced candidate.

## Processing pipeline

1. Validate CSV/XLSX file type and configured size limit.
2. Parse Load/PV profiles into 96 intervals per day (`DT_HOURS = 0.25`).
3. Reject or warn about days that do not contain the expected interval count.
4. Build a candidate grid from automatic sizing rules or a user-defined range.
5. For each candidate, solve the daily linear program.
6. Compare the optimized bill with the no-BESS bill.
7. Annualize savings and apply the configured realization factor.
8. Calculate CAPEX, OPEX, NPV, ROI and payback.
9. Build a non-dominated Pareto front using annual savings and ROI.
10. Select the SLSM candidate whose normalized saving/ROI slope is closest to one.
11. Produce monthly sizing, Pmax risk, scenario and longevity outputs.

## Daily linear program

Decision variables include:

- battery discharge power;
- grid charging power;
- PV charging power;
- state of charge for every 15-minute interval;
- optimized peak power;
- peak excess above the current floor.

The objective minimizes energy purchase cost plus a demand-charge penalty. The constraints enforce:

- state-of-charge balance;
- charge/discharge efficiency;
- minimum and maximum SOC;
- rated power limits;
- PV-surplus charging limits;
- end-of-day SOC reserve;
- rolling 30-minute Pmax constraints.

The implementation uses `scipy.optimize.linprog(method="highs")` in `oracle_engine.py`.

## Billing model

Energy cost is calculated for every 15-minute interval using configured peak, normal and off-peak tariffs. Demand cost is:

`Pmax_month × demand_charge_VND_per_kW_month`

Pmax is the maximum rolling average of two 15-minute intervals, equivalent to a 30-minute measurement window.

## Financial model

For each BESS candidate:

`CAPEX = battery_unit_cost × energy_kWh + PCS_unit_cost × power_kW`

Additional EPC and other cost rates are included when configured.

`Annual cash flow = realized annual saving - annual OPEX`

`NPV = -CAPEX + Σ(cash_flow_y / (1 + discount_rate)^y)`

Quick Sizing additionally separates unlevered project cash flow from equity cash flow and calculates debt service, interest, Equity NPV/IRR and DSCR.

## Pareto and SLSM

A candidate is Pareto-efficient when no other candidate has both higher annual saving and higher ROI, with at least one strict improvement.

SLSM is an internal balanced-selection heuristic. Savings and ROI are min-max normalized, and the candidate whose normalized saving-to-ROI slope is closest to 1 is selected. This heuristic is not presented as a universal scientific optimum; it must be validated against customer decisions and realized project outcomes.

## Model governance

Every analysis stores:

- engine version;
- effective configuration/parity version;
- input-quality summary;
- assumptions;
- candidate set;
- selected candidate;
- warnings and blockers.

Changes to tariff rules, candidate generation, optimization constraints, financial formulas or selection logic require a new engine/config version and regression tests.

## Validation requirements

Before production claims are made, validation must include:

1. synthetic profiles with analytically predictable dispatch;
2. comparison with the EMS reference implementation;
3. replay against historical customer profiles;
4. comparison of Quick Sizing and BESS Planner outputs;
5. comparison with quoted and installed BESS sizes;
6. realized bill savings after commissioning;
7. error metrics segmented by industry, load shape, PV penetration and tariff;
8. documented acceptance thresholds.

Until ground-truth validation is available, outputs must retain the labels “preliminary”, “estimated” or “screening result”.
