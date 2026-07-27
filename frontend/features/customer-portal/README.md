# Customer Portal feature

This feature owns all authenticated portal presentation and portal-specific data loading:

- authenticated portal layout, sidebar, topbar and footer;
- portal overview dashboard;
- applications, reports, organization, members and settings sections;
- portal overview aggregation API.

It may depend on `features/auth` only for authentication concerns:

- `authApi`;
- `useAuthStore`;
- `PortalAuthGate`.

Authentication code must not import portal components. BESS project workflows remain in
`features/bess-planner` and are composed into the portal through routes or component imports.

The files under `features/auth` that re-export portal modules are temporary compatibility
entry points. New code must import from `features/customer-portal` directly.
