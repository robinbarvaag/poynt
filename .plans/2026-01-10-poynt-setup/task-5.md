# Task 5: Public Frontend

> **Read PLAN.md first** for full context.

## Prerequisites

- Payload Collections exist.
- Shared `@poynt/ui` and `@poynt/cart` exist.

## Goal

Build the customer-facing pages: Landing, Product Details, and Cart.

## Files to Modify

| File                                           | Action | Description                  |
| ---------------------------------------------- | ------ | ---------------------------- |
| `apps/web/app/(frontend)/[...slug]/page.tsx`   | Create | Catch-all for CMS Pages      |
| `apps/web/src/components/blocks/*`             | Create | React components for blocks  |
| `apps/web/app/(frontend)/kurs/[slug]/page.tsx` | Create | Product detail               |
| `apps/web/app/(frontend)/handlekurv/page.tsx`  | Create | Cart page                    |
| `apps/web/app/(frontend)/layout.tsx`           | Create | Frontend layout (Nav/Footer) |

## Steps

### 1. Global Layout

**File**: `apps/web/app/(frontend)/layout.tsx`
**Action**: Create
Add `CartProvider` wrapper.
Add Header with "Min side" link and Cart icon.
**Note**: Navigation items should ideally come from a `Globals` collection in Payload.

### 2. Block Components

**Path**: `apps/web/src/components/blocks/`
**Action**: Create
Map Payload blocks to React components:

- `Hero` -> `src/components/blocks/Hero.tsx` using `@poynt/ui`.
- `Content` -> `src/components/blocks/RichText.tsx`.

### 3. CMS Catch-all Page

**File**: `apps/web/app/(frontend)/[...slug]/page.tsx`
**Action**: Create

- `generateStaticParams`: specific key pages.
- Fetch `Page` by slug.
- Loop and render `layout` blocks.

### 4. Product Page

**File**: `apps/web/app/(frontend)/kurs/[slug]/page.tsx`
**Action**: Create
Dynamic route. Fetch product by slug.
"Legg i handlekurv" button connecting to `useCart`.

### 4. Cart Page

**File**: `apps/web/app/(frontend)/handlekurv/page.tsx`
**Action**: Create
List items in cart.
Show total.
"Gå til kassen" button (links to `/api/checkout` later).

## Verification

### Manual

- Navigate to localhost:3000
- Add item to cart -> Persistence check (reload page).
- Verify styling matches Tailwind config.
