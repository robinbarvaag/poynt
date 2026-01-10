# Task 4: Data Schema

> **Read PLAN.md first** for full context.

## Prerequisites

- Payload 3.0 running in `apps/web`.

## Goal

Implement the core business entities in Payload: Products, Orders, Users, CourseContent.

## Files to Modify

| File                                        | Action | Description                      |
| ------------------------------------------- | ------ | -------------------------------- |
| `apps/web/src/collections/Pages.ts`         | Create | Flexible website pages           |
| `apps/web/src/blocks/*`                     | Create | Layout blocks (Hero, Image, etc) |
| `apps/web/src/collections/Users.ts`         | Create | User schema                      |
| `apps/web/src/collections/Products.ts`      | Create | Product schema                   |
| `apps/web/src/collections/Orders.ts`        | Create | Order schema                     |
| `apps/web/src/collections/CourseContent.ts` | Create | Course content schema            |
| `apps/web/payload.config.ts`                | Modify | Import collections               |

## Steps

### 1. Flexible Content Blocks

**Folder**: `apps/web/src/blocks/`
**Action**: Create
Define reusable Payload Blocks:

- `HeroBlock`: title, subtitle, image, link.
- `ContentBlock`: richText.
- `MediaBlock`: image/video, caption.
- `ArchiveBlock`: automatic list of courses active/latest.

### 2. Pages Collection

**File**: `apps/web/src/collections/Pages.ts`
**Action**: Create
Fields:

- `title`
- `slug`
- `layout` (blocks field: Hero, Content, Media, Archive)
- `meta` (SEO fields override)

### 3. Users Collection

**File**: `apps/web/src/collections/Users.ts`
**Action**: Create
Fields:

- `name` (text)
- `roles` (select: 'admin', 'customer')
- `stripeCustomerId` (text, admin hidden)
- `purchases` (relationship: 'orders', hasMany)

### 2. Products Collection

**File**: `apps/web/src/collections/Products.ts`
**Action**: Create
Fields:

- `name`, `slug`, `description` (richText)
- `price` (number - øre)
- `type` (select: 'course', 'pdf', 'bundle')
- `stripeProductId`, `stripePriceId`
- `active` (checkbox)

### 3. Orders Collection

**File**: `apps/web/src/collections/Orders.ts`
**Action**: Create
Fields:

- `user` (relationship: 'users')
- `items` (array) -> `product` (relationship), `priceAtPurchase`
- `status` (select: 'pending', 'completed')
- `stripeCheckoutSessionId`

### 4. CourseContent Collection

**File**: `apps/web/src/collections/CourseContent.ts`
**Action**: Create
Fields:

- `title`
- `product` (relationship: 'products') - Which product unlocks this?
- `modules` (array) -> `title`, `videoUrl`, `resources`

**Access Control**:

- Read access ONLY if `req.user` has purchased the related `product` (check `user.purchases`).

## Verification

### Manual

- Visit `/admin`
- Create a Product
- Create a User
- Verify relations works
