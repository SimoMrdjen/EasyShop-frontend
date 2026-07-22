# Copilot instructions for EasyShop Frontend

## Project snapshot
- Angular 19 app using **standalone components** and `bootstrapApplication` (see `src/main.ts`).
- SSR is enabled with an Express server in `src/server.ts` and server-specific config in `src/app/app.config.server.ts`.
- Routing is centralized in `src/app/app.routes.ts` (currently empty) and wired via `provideRouter` in `src/app/app.config.ts`.

## Key patterns and examples
- **App providers** live in `src/app/app.config.ts` and include `provideHttpClient`, `provideRouter`, `provideNzI18n`, `FormsModule`, and async animations.
- **NG-ZORRO UI** is the primary component library (see `src/app/login-form/login-form.component.html`).
- **Login flow**: `LoginFormComponent` (`src/app/login-form/login-form.component.ts`) builds a reactive `FormGroup`, calls `LoginService`, stores `token`, `role`, and `indirektni` in `localStorage`, then navigates to `/`.
- **HTTP services** use `HttpClient` and build URLs from `BASE_URL` (see `src/app/services/login-service.service.ts`).
- **SSR routes** are configured for prerendering in `src/app/app.routes.server.ts`.

## Workflows
- Dev server: `npm start` (Angular CLI `ng serve`).
- Unit tests: `npm test` (Karma + Jasmine).
- Production build: `npm run build`.
- SSR runtime after build: `npm run serve:ssr:EasyShop-frontend`.

## Integration points
- API base URL is expected to be defined via `BASE_URL` (used by login service) and/or `src/environments/environment.ts` (`apiUrl`).
- The SSR server uses Express; if you add API endpoints, place them in `src/server.ts` before the `app.use('/**', ...)` handler.
