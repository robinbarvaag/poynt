# Task 7: Dashboard & Access

> **Read PLAN.md first** for full context.

## Prerequisites

- Orders creating successfully.
- User authentication (Payload handles this).

## Goal

Create the "Min side" where users access their purchased content.

## Files to Modify

| File                                                    | Action | Description               |
| ------------------------------------------------------- | ------ | ------------------------- |
| `apps/web/app/(frontend)/min-side/page.tsx`             | Create | Dashboard listing courses |
| `apps/web/app/(frontend)/min-side/kurs/[slug]/page.tsx` | Create | Video/Content player      |
| `apps/web/middleware.ts`                                | Modify | Protect `/min-side`       |

## Steps

### 1. Middleware / Auth Protection

Ensure `/min-side` redirects to login if no Payload session exists.

### 2. Dashboard

**File**: `apps/web/app/(frontend)/min-side/page.tsx`
**Action**: Create

- Fetch `req.user`.
- Fetch `Orders` via relationship.
- Identify unique purchased products.
- List available courses.

### 3. Content Viewer

**File**: `apps/web/app/(frontend)/min-side/kurs/[slug]/page.tsx`
**Action**: Create

- Fetch `CourseContent` by product slug.
- Check permissions (Server-side check against user purchases).
- Render `modules` (Video player, download links).

## Verification

### Manual

- Login as user with order.
- Verify access to `/min-side/kurs/example`.
- Login as user WITHOUT order.
- Verify access denied or 404.
