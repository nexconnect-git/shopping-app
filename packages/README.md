# Customer Shared Packages

These packages hold framework-independent customer-facing code shared by the Angular web app and the React Native mobile app.

## Rules

- Keep packages pure TypeScript unless the package is explicitly an adapter.
- Do not import Angular, React, React Native, Expo, browser APIs, `localStorage`, `sessionStorage`, AsyncStorage, or SecureStore from shared core packages.
- Put platform behavior behind interfaces such as `TokenStorage`, `HttpTransport`, `AnalyticsAdapter`, `LoggerAdapter`, and `PlatformConfig`.
- Export intentionally from each package `src/index.ts`.
- Keep UI components inside the apps.

## Packages

- `@nexconnect/customer-types`: API DTOs and shared domain contracts.
- `@nexconnect/customer-config`: endpoint builders, storage keys, and customer constants.
- `@nexconnect/customer-validation`: pure validation helpers.
- `@nexconnect/customer-core`: pure formatting, cart, checkout, and payment metadata helpers.
- `@nexconnect/customer-analytics`: analytics event names, payload contracts, and adapter interface.
- `@nexconnect/customer-api-client`: adapter-based API client shell using injected transport and token storage.

## Verification

Run package builds/tests before app verification:

```bash
pnpm -r --filter "@nexconnect/*" build
pnpm -r --filter "@nexconnect/*" test
cd frontend && npm run build -- customer-app
cd ../shopping-mobile-app/mobile-customer && npm.cmd run typecheck
```
