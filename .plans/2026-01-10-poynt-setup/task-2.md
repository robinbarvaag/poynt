# Task 2: Shared Packages

> **Read PLAN.md first** for full context.

## Prerequisites

- Task 1 completed (Repo initialized)

## Goal

Scaffold the functional packages that will share logic between the backend (API/Webhooks) and frontend components.

## Files to Modify

| File                | Action | Description           |
| ------------------- | ------ | --------------------- |
| `packages/types/*`  | Create | Shared interfaces     |
| `packages/ui/*`     | Create | Shared UI components  |
| `packages/stripe/*` | Create | Stripe wrapper        |
| `packages/email/*`  | Create | Email service wrapper |
| `packages/cart/*`   | Create | Cart logic            |

## Steps

### 1. Types Package

**File**: `packages/types/package.json`
**Action**: Create
Basic setup for shared types.

**File**: `packages/types/src/index.ts`
**Action**: Create
Export placeholder types (e.g., `ProductType`, `OrderStatus`).

### 2. UI Package (Shadcn)

**File**: `packages/ui/package.json`
**Action**: Create
Dependencies: `react`, `react-dom`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `@radix-ui/*` (as needed).

**File**: `packages/ui/components.json`
**Action**: Create
Config for shadcn-ui CLI (if using CLI to add components locally then moving them here, or manually copying).

**File**: `packages/ui/src/utils.ts`
**Action**: Create
Standard `cn` (classname) utility.

**File**: `packages/ui/src/button.tsx`
**Action**: Create
Shadcn Button component.

**File**: `packages/ui/src/index.ts`
**Action**: Create
Export all components.

### 3. Stripe Package

**File**: `packages/stripe/package.json`
**Action**: Create
Dependencies: `stripe`.

**File**: `packages/stripe/src/index.ts`
**Action**: Create
Export singleton `stripe` client initializer.

### 4. Email Package

**File**: `packages/email/package.json`
**Action**: Create
Dependencies: `resend`.

**File**: `packages/email/src/client.ts`
**Action**: Create
Export Resend client wrapper.

### 5. Cart Package

**File**: `packages/cart/package.json`
**Action**: Create
Dependencies: `zustand` (or Context + reducer), `zod`.

**File**: `packages/cart/src/store.ts`
**Action**: Create
Scaffold the cart store (add, remove, clear, persist).

## Verification

### Automated

```bash
bun install
```

### Manual

- Check that all packages are linked in node_modules.
