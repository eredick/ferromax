# Copilot Instructions

## Stack

- This is an Angular application with Server-Side Rendering (`@angular/ssr`, Express entry in `src/server.ts`). Use `package.json` as the source of truth for versions: Angular runtime, CLI, build, and compiler packages `21.2.25`; TypeScript `^5.9.3`; RxJS `^7.8.2`; Tailwind CSS and its PostCSS plugin `^4.2.1`; `zone.js` `^0.15.1`; `tw-animate-css` `^1.3.4`; `@fontsource/ibm-plex-sans` `^5.3.0`; and `tslib` `^2.8.1`.
- Development tooling is ESLint and `@eslint/js` `^9.32.0`, `eslint-config-prettier` `^10.1.1`, `eslint-plugin-prettier` `^5.2.6`, `globals` `^15.15.0`, Prettier `^3.7.3`, `typescript-eslint` `^8.56.1`, and Vitest `^4.1.10`.
- The app is built with Angular CLI's `@angular/build:application` builder (`outputMode: "server"`). Shared providers live in `src/app/app.config.ts` (hydration with event replay), server providers in `app.config.server.ts`, and per-route render modes in `app.routes.server.ts`. It uses standalone components and `zone.js`; do not introduce NgModules or a backend unless the task explicitly requires an architectural change.
- Code must be SSR-safe: never touch `window`, `document`, `localStorage`, `navigator`, or timers during construction or rendering. Use `isPlatformBrowser(inject(PLATFORM_ID))`, `inject(DOCUMENT)`, or `afterNextRender`. Do not render different templates per platform (hydration mismatches). Catalog data reaches the browser through `TransferState` (see `ProductService`). Add new routes to both `app.routes.ts` and `app.routes.server.ts`.
- Node.js `20.19+` or `22.12+` and npm are required.
- Tailwind CSS is loaded through `src/styles.css` and `@tailwindcss/postcss`. Keep shared design tokens and global styles there; follow the existing utility-class and component-template patterns.
- Prettier uses 100-character lines, semicolons, double quotes, and trailing commas. TypeScript is strict; preserve type safety and Angular strict template checking.

## Project Structure and Patterns

- `src/main.ts` bootstraps the app and registers HTTP and router providers. Routes and route metadata live in `src/app/app.routes.ts`.
- `src/app/pages/` contains routed pages; `src/app/components/` contains feature components; `src/app/shared/` contains reusable UI; `src/app/services/` contains application services; `src/app/core/` contains cross-cutting utilities; `src/app/config/` contains app configuration.
- Keep components standalone and colocate their `.component.ts`, `.component.html`, and `*.spec.ts` files when applicable. Use Angular Router for navigation and Angular dependency injection for services.
- Use Angular signals and `computed` for synchronous reactive state. Use RxJS observables for HTTP and asynchronous streams. Follow the local service patterns rather than adding a state-management library.
- Keep framework-independent order and product domain types and logic in `shared/`; Angular-specific UI, services, and integrations belong in `src/app/`. Reuse existing domain types instead of creating parallel models.
- Catalog loading uses Angular `HttpClient`, with configuration in `src/app/config/catalog.config.ts` and service logic in `src/app/services/product.service.ts`. The app can use its local public JSON or Google Sheets; product images are served through Cloudinary. Orders and contact messages are sent to a Google Apps Script endpoint (`src/app/services/pedido.service.ts`); orders can also go through WhatsApp. There is no backend or database.
- `src/app/config/catalog.secrets.ts` is intentionally ignored by Git. Never commit credentials or local secrets; update the example file when documenting required configuration.
- Use external HTML templates and the existing CSS design tokens. Avoid adding UI libraries or changing the visual system without a task requirement.
- For product data shape, catalog setup, and deployment behavior, see `README.md`.

## Build, Lint, and Tests

- `npm run dev` — start the Angular development server.
- `npm run build` — create the production build (`dist/todoferromax/browser` and `dist/todoferromax/server`).
- `npm run serve:ssr:todoferromax` — run the built server (`PORT`, default 4000).
- `npm run build:dev` — create a development build.
- `npm run lint` — lint `src/app` and `shared`.
- `npm test` — run Vitest tests.
- `npm run test:watch` — run Vitest in watch mode.
- Vitest uses the Node environment. Tests are `*.spec.ts` under `src/` and `*.test.ts` / `*.spec.ts` under `shared/`.

Run the narrowest relevant tests and checks after code changes. Update tests when behavior changes.
