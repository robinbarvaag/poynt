# Poynt E-commerce Setup (Next.js 16 + Payload 3.0)

> **Plan Directory**: `.plans/2026-01-10-poynt-setup/`
> **Created**: 2026-01-10
> **Status**: Draft

## Goal

Create a production-ready Turborepo monorepo for a high-quality digital product website ("Poynt"). While it features e-commerce for courses and PDFs, **the primary focus is a flexible, design-driven CMS website**. The system uses a custom Next.js 16 frontend with embedded Payload CMS 3.0.

## Key Decisions

| Decision             | Choice                 | Rationale                                                                                                                                  |
| -------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Monorepo Manager** | Turborepo              | Optimized for JS/TS, caching, and task orchestration.                                                                                      |
| **Package Manager**  | Bun                    | Fast installation and execution.                                                                                                           |
| **CMS Architecture** | Payload 3.0 (Embedded) | Removes need for separate server, simpler deployment.                                                                                      |
| **Components**       | shadcn/ui              | High-quality, accessible components in `@poynt/ui`.                                                                                        |
| **API/State**        | Server Actions + RSC   | **Replaces tRPC**. Next.js 16 Server Actions provide the same end-to-end type safety with less boilerplate when using Payload's Local API. |
| **Database**         | Postgres               | Robust relational data, required for Payload's Postgres adapter.                                                                           |
| **Namespace**        | `@poynt/*`             | Internal package namespace.                                                                                                                |

## File Map

| Path               | Purpose                                        |
| ------------------ | ---------------------------------------------- |
| `/`                | Root config (package.json, turbo.json)         |
| `/apps/web`        | Next.js 16 App + Payload 3.0 (CMS & Frontend)  |
| `/packages/access` | (Optional) Shared permissions logic if needed  |
| `/packages/cart`   | React Context + hooks for shopping cart        |
| `/packages/config` | Shared constants and env schemas               |
| `/packages/email`  | Resend integration for transactional emails    |
| `/packages/stripe` | Stripe SDK wrappers and webhook utilities      |
| `/packages/types`  | Shared TS types (e.g. Payload generated types) |
| `/packages/ui`     | Shared UI components (Button, Input, etc)      |
| `/tooling/*`       | Shared configs (eslint, typescript, tailwind)  |

## Patterns & Conventions

### Code Style

- **Language**: TypeScript throughout.
- **Comments**: Norwegian comments allowed/encouraged per user request.
- **UI Components**: All primitive UI components (Buttons, Inputs, Dialogs) must come from `@poynt/ui` (shadcn).

### Payload CMS

- **Location**: `apps/web/src/payload.config.ts`
- **Collections**: `Pages`, `Posts`, `Products` (flexible content).
- **Blocks**: Build reusable layout blocks (Hero, Content, CallToAction) for the `Pages` collection
- **Access Control**: Use Payload's `access` functions to restrict course content to owners.

### State Management

- **Cart**: React Context + `localStorage` persistence.
- **Server State**: React Server Components (RSC) for fetching CMS data.

## Task Summary

| #   | Name                   | Description                                                       | File        | Status         |
| --- | ---------------------- | ----------------------------------------------------------------- | ----------- | -------------- |
| 1   | Repo Init & Tooling    | Setup Turborepo, Bun, and shared configs (ESLint, TS).            | `task-1.md` | ✅ Complete    |
| 2   | Shared Packages        | Scaffold functional packages (Cart, Stripe, Email, UI).           | `task-2.md` | ✅ Complete    |
| 3   | Web App & Payload Base | Initialize Next.js 16 with embedded Payload 3.0 & Postgres.       | `task-3.md` | ✅ Complete    |
| 4   | Data Schema            | Implement Payload collections (Users, Products, Orders, Courses). | `task-4.md` | ✅ Complete    |
| 5   | Public Frontend        | Landing page, Product page, and Cart UI.                          | `task-5.md` | ⬜ Not Started |
| 6   | Stripe Integration     | Implement Checkout Session flow and Webhook handler.              | `task-6.md` | ⬜ Not Started |
| 7   | Dashboard & Access     | Build "Min side" and protected course content views.              | `task-7.md` | ⬜ Not Started |

## Risks & Mitigations

| Risk                     | Impact | Mitigation                                                                           |
| ------------------------ | ------ | ------------------------------------------------------------------------------------ |
| **Bun + Payload Compat** | High   | Use `--disable-transpile` for scripts. Explicit `sharp` import.                      |
| **Type Sharing**         | Med    | Ensure Payload types are exported/generated to a shared place or usable by frontend. |
| **Webhook Testing**      | Med    | Use Stripe CLI for local webhook forwarding.                                         |
