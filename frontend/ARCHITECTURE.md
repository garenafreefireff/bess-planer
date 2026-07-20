# Frontend Architecture — seep-oee-frontend

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| UI | Tailwind CSS + shadcn/ui (`components/ui/`) |
| Data fetching | TanStack React Query v5 |
| Global state | Zustand (used only for `auth`, `production`) |
| HTTP client | Axios — singleton at `lib/api/client.ts` |
| Notifications | Sonner (`toast.success` / `toast.error`) |
| Forms | React Hook Form + Zod (when complex validation is needed) |

---

## Folder structure

```
seep-oee-frontend/
├── app/                        # Next.js App Router — pages & layouts only
│   ├── (protected)/            # Route group, requires auth
│   │   ├── reports/
│   │   │   ├── machine-running-rate/page.tsx
│   │   │   └── machine-activity-analysis/page.tsx
│   │   ├── master-data/
│   │   └── ...
│   └── login/
├── features/                   # ★ Feature-based domain layer — primary logic lives here
│   ├── asset/
│   │   ├── api/asset.api.ts
│   │   ├── hooks/useAssets.ts
│   │   └── components/
│   ├── group-node/
│   │   ├── api/group-node.api.ts
│   │   ├── hooks/useGroupNodes.ts         # + useFilteredAssetsByGroupNode
│   │   └── components/GroupNodeTreePicker.tsx
│   ├── machine-operation-analysis/
│   │   ├── api/machine-operation-analysis.api.ts
│   │   ├── hooks/useMachineOperationAnalysis.ts  # useHourlyAvailability, useTimelineBatch, ...
│   │   └── utils/timeline-transform.ts    # buildHourlyMachineData(...)
│   ├── iot/
│   ├── oee-variable-mapping/
│   └── auth/
├── components/                 # Shared UI components (no business logic)
│   ├── ui/                     # shadcn primitives — do NOT edit directly
│   ├── layout/                 # AppLayout, Sidebar, Header
│   ├── machine-running-rate/   # Shared display components for this domain
│   └── masters-data/
├── lib/                        # Pure utilities (no React dependency)
│   ├── api/client.ts           # Axios instance with interceptors
│   ├── date-utils.ts           # clampSeconds, toDateString, getWeekRange, ...
│   └── utils.ts                # cn(), ...
└── hooks/                      # Global React hooks (not tied to a specific feature)
```

---

## Feature-based Design Pattern

### Rule 1 — Every feature has 3 layers

```
features/<domain>/
├── api/<domain>.api.ts       # HTTP calls, response normalization, TS interfaces
├── hooks/use<Domain>.ts      # React Query hooks (useQuery / useMutation)
└── components/               # Domain UI components
```

### Rule 2 — Pages only “wire” UI (no business logic)

Pages (`app/.../page.tsx`) are allowed to:
- Call hooks from `features/*/hooks/`
- Use helpers from `lib/`
- Render JSX

Pages are NOT allowed to:
- Call `apiClient.*` or `fooApi.*` directly
- Inline `useQuery({ queryFn: () => someApi.get(...) })` — must be wrapped in a feature hook
- Implement domain logic (group filtering, descendant computation, segment building, etc.)
- Re-declare helper functions that are duplicated across pages

### Rule 3 — API layer only does HTTP

`features/<domain>/api/<domain>.api.ts`:
- Call `apiClient.get/post/put/delete`
- Normalize/map responses into TypeScript interfaces
- Must not contain `useState`, `useQuery`, or UI logic

### Rule 4 — Hooks wrap queries/mutations

`features/<domain>/hooks/use<Domain>.ts`:
- Put `'use client'` at the top of the file
- One hook = one `useQuery` or `useMutation`
- Keep `queryKey` consistent: `['<domain>', '<sub>', ...params]`
- Use `toast.success` / `toast.error` in `onSuccess` / `onError` for mutations

### Rule 5 — Shared UI components must be extracted

If a UI component is used in more than one page:
- If it belongs to a domain → `features/<domain>/components/`
- If it’s generic/shared → `components/<group>/`

Do not write complex inline components in a page (> 30 lines of JSX with its own state/logic).

### Rule 6 — Shared utilities belong in `lib/`

Pure functions (no React/hooks) used across multiple places:
- Date/time → `lib/date-utils.ts`
- String/number formatting → `lib/utils.ts`
- Must not be re-implemented inline in pages/components

---

## Good example — Adding a new feature

### Scenario: Add a “Shift Productivity Report” page

**Step 1 — Create an API client:**
```typescript
// features/production-shift/api/production-shift.api.ts
import apiClient from '@/lib/api/client'

export interface ShiftReport { ... }

export const productionShiftApi = {
  getByDateRange: async (startDate: string, endDate: string): Promise<ShiftReport[]> => {
    const res = await apiClient.get('/production-shift', { params: { startDate, endDate } })
    return res.data
  },
}
```

**Step 2 — Create a hook:**
```typescript
// features/production-shift/hooks/useProductionShift.ts
'use client'
import { useQuery } from '@tanstack/react-query'
import { productionShiftApi } from '../api/production-shift.api'

export function useProductionShiftReport(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['production-shift', 'report', startDate, endDate],
    queryFn: () => productionShiftApi.getByDateRange(startDate, endDate),
    enabled: Boolean(startDate && endDate),
  })
}
```

**Step 3 — The page only wires UI:**
```typescript
// app/(protected)/reports/production-shift/page.tsx
'use client'
import { useProductionShiftReport } from '@/features/production-shift/hooks/useProductionShift'
import { getWeekRange, toStartOfLocalDayUtcIso } from '@/lib/date-utils'

export default function ProductionShiftPage() {
  const [date, setDate] = useState(new Date())
  const { start, end } = getWeekRange(date)
  const { data, isLoading } = useProductionShiftReport(
    toStartOfLocalDayUtcIso(start),
    toEndOfLocalDayUtcIso(end),
  )
  // render...
}
```

---

## Anti-patterns — Do NOT do this

```typescript
// ❌ WRONG — page calls API client directly
import { machineOperationAnalysisApi } from '@/features/.../api'
const { data } = useQuery({ queryFn: () => machineOperationAnalysisApi.getTimeline(...) })

// ✅ RIGHT — page uses a hook
import { useTimeline } from '@/features/.../hooks/useMachineOperationAnalysis'
const { data } = useTimeline(machineId, startDate, endDate)
```

```typescript
// ❌ WRONG — domain logic inside a page
const descendantIds = useMemo(() => {
  const result = new Set<string>()
  const stack = [selectedGroupNodeId]
  while (stack.length) { ... }
  return result
}, [selectedGroupNodeId, groupNodes])

// ✅ RIGHT — move to a feature hook
const filteredMachines = useFilteredAssetsByGroupNode(selectedGroupNodeId, assets)
```

```typescript
// ❌ WRONG — helper function duplicated inline in pages
const toStartOfLocalDayUtcIso = (date: Date) => { ... }

// ✅ RIGHT — import from lib/
import { toStartOfLocalDayUtcIso } from '@/lib/date-utils'
```

```typescript
// ❌ WRONG — ~50 lines of transform logic inside a page useMemo
const machineData = useMemo(() => {
  const hourlyMap = new Map()
  for (const row of hourlyAvailability) { ... }
  // ... 50 lines
}, [hourlyAvailability, dayKeys])

// ✅ RIGHT — extract to a feature utility
import { buildHourlyMachineData } from '@/features/machine-operation-analysis/utils/timeline-transform'
const machineData = useMemo(() => buildHourlyMachineData(hourlyAvailability, dayKeys), [hourlyAvailability, dayKeys])
```

```typescript
// ❌ WRONG — fetching dead code you never use
const { data: dailyAvailability } = useDailyAvailability(...)
// dailyAvailability is not used anywhere in JSX/useMemo

// ✅ RIGHT — remove it completely
```

---

## QueryKey Convention

| Domain | Pattern |
|--------|---------|
| assets | `['assets']` |
| group-nodes | `['group-nodes']` |
| hourly availability | `['machine-operation-analysis', 'hourly', machineId, startDate, endDate]` |
| batch timeline | `['machine-operation-analysis', 'timeline-batch', machineIds, startDate, endDate]` |
| OEE variable mapping | `['oee-variable-mapping', assetId]` |
| IoT devices | `['iot', 'devices']` |
| IoT telemetry keys | `['iot', 'telemetry-keys', deviceId]` |

---

## Shared `lib/date-utils.ts` — API

| Function | Description |
|-----|-------|
| `clampSeconds(value, max)` | Clamp seconds to `[0, max]` |
| `toDateString(date)` | `Date` → `"YYYY-MM-DD"` |
| `toStartOfLocalDayUtcIso(date)` | Local 00:00:00 → UTC ISO string (for API `startDate`) |
| `toEndOfLocalDayUtcIso(date)` | Local 23:59:59.999 → UTC ISO string (for API `endDate`) |
| `getWeekRange(date)` | Returns `{ start: Date, end: Date }` — Monday to Sunday of the week containing `date` |
