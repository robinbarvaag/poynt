# Coding Conventions

**Analysis Date:** 2026-02-03

## Naming Patterns

**Files:**
- TypeScript/JavaScript: camelCase (e.g., `add-to-cart-button.tsx`, `media-url.ts`)
- Payload CMS collections: PascalCase exported constant (e.g., `export const Products`, `export const Users` in `src/collections/`)
- Blocks: PascalCase exported constant (e.g., `export const Hero` in `src/blocks/`)
- Components: kebab-case file names with PascalCase function exports (e.g., `add-to-cart-button.tsx` exports `AddToCartButton`)
- Directories: kebab-case or lowercase (e.g., `collections/`, `components/`, `lib/`)

**Functions:**
- camelCase for all function names
- Action handlers use `handle` prefix: `handleAddToCart()`, `handleClick()`
- Getter functions use `get` prefix: `getStripe()`, `getResend()`
- Async functions follow camelCase: `createCheckoutSession()`, `subscribeToNewsletter()`
- Factory/utility functions: `cn()` for className utilities (see `@poynt/ui`)

**Variables & Constants:**
- camelCase for local variables and state
- UPPER_SNAKE_CASE for module-level constants: `STRIPE_SECRET_KEY` (env vars)
- camelCase for exported constant objects: `tierConfig`, `mainNavItems`, `channelLinks`
- Array constants use camelCase singular or plural appropriately: `quickActions`, `tools`, `medalConfig`

**Types & Interfaces:**
- PascalCase for all type/interface names: `CartItem`, `Product`, `AddToCartButtonProps`
- Payload-specific: `CollectionConfig`, `Block` types from "payload" package
- Props interfaces suffix with `Props`: `AddToCartButtonProps`, `HeaderProps`, `FooterProps`
- Type aliases use PascalCase: `Tool`, `ViewState`, `MedalConfig`
- Payload fields follow naming per label (mix of camelCase code and Norwegian labels)

**Stripe Fields:**
- Format: camelCase for code, label text in Norwegian or as ID names
- Examples: `stripeSessionId`, `stripePaymentIntentId`, `stripeCustomerId`, `stripePriceId`, `stripeProductId`
- Pattern: field name is camelCase, label shows user-friendly name

## Code Style

**Formatting:**
- Tool: **Biome** (v1.9.4)
- Indent: 2 spaces
- Line width: 80 characters
- Quotes: double quotes
- Semicolons: always
- Arrow function parentheses: always `(param) => value` (not `param => value`)
- Trailing commas: ES5 style

**Linting:**
- Tool: **Biome** (same tool, different mode)
- Rules: `recommended` enabled
- Warnings: `noExplicitAny` (suspicious), `noNonNullAssertion` (style)
- VCS integration: enabled with Git

**Run Format/Lint:**
```bash
bun run check           # Biome lint + format (with fixes)
bun run check:ci        # CI-friendly Biome check (no fixes)
bun run format          # Format only (Biome)
bun run typecheck       # TypeScript validation
bun run lint            # ESLint (secondary)
```

## Import Organization

**Order:**
1. External packages (React, Next.js, third-party)
2. Payload imports (`payload`, `@payloadcms/*`)
3. Relative imports from `@/` alias (same workspace)
4. Package imports from `@poynt/` (monorepo packages)
5. Utility imports (local utils, types)

**Path Aliases:**
- `@/*` → Current workspace root (apps/web)
- `@payload-config` → `./payload.config.ts`
- `@poynt/cart` → `packages/cart`
- `@poynt/email` → `packages/email`
- `@poynt/stripe` → `packages/stripe`
- `@poynt/types` → `packages/types`
- `@poynt/ui` → `packages/ui`
- `@poynt/ui/icons` → Named exports from `packages/ui/icons`

**Biome Auto-Organization:**
- `organizeImports.enabled: true` automatically sorts imports
- Developers should not manually reorder imports

**Example:**
```typescript
import { Button } from "@poynt/ui";
import { useCart } from "@poynt/cart";
import type { Product } from "@poynt/types";
import { Check } from "lucide-react";
import { useState } from "react";
```

## Error Handling

**Patterns:**
- Wrap external service calls in try-catch
- Log errors with Payload logger: `req.payload.logger.error(message)`
- Log to console in packages: `console.error("Context: ", error)`
- Return null or undefined on expected failures (not throwing)
- Throw with meaningful message only on configuration issues

**Examples:**
```typescript
// Stripe price creation - log error without throwing
try {
  const price = await stripe.prices.create({ /* ... */ });
} catch (error) {
  req.payload.logger.error(`Klarte ikke opprette pris i Stripe: ${error}`);
}

// Initialization errors - throw
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
  }
}

// Newsletter/async operations - console.error
try {
  await resend.emails.send({ /* ... */ });
} catch (error) {
  console.error("Newsletter subscription error:", error);
}

// Data fetch - return null
const [siteSettings, header, footer] = await Promise.all([
  payload.findGlobal({ slug: "site-settings" }).catch(() => null),
  payload.findGlobal({ slug: "header" }).catch(() => null),
  payload.findGlobal({ slug: "footer" }).catch(() => null),
]);
```

## Logging

**Framework:** Mixed approach
- Payload: `req.payload.logger.error(message)` for CMS-related errors
- Next.js/Node: `console.error()` for application errors
- Warning messages: `console.warn()` (e.g., "Icon not found")

**When to Log:**
- Error conditions (always)
- Initialization issues
- External service calls that might fail
- Warnings on missing assets or fallbacks

**What NOT to Log:**
- Business logic flow (use monitoring instead)
- User inputs (privacy)
- Debug info in production (check env)

## Comments

**When to Comment:**
- Complex algorithms or non-obvious logic
- Why something is done a certain way (not what)
- Workarounds or temporary solutions: `// For backward compatibility`
- Important constraints: `// Only allow 1 of each digital product`
- Warnings: `// Disable auto-push to prevent conflicts with planner tables (managed by Drizzle)`

**JSDoc/TSDoc:**
- Not heavily used in this codebase
- Focus on TypeScript inference and clear naming
- Use for exported public functions in packages (optional but recommended)

**Example:**
```typescript
// For backward compatibility - lazy getter
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

// Only allow 1 of each digital product
if (existing) return state;
```

## Function Design

**Size:** Keep small and focused
- Single responsibility
- Average 5-20 lines
- Complex logic broken into named helpers

**Parameters:**
- Use object destructuring for multiple params: `({ product }: AddToCartButtonProps)`
- Use type annotations always
- Prefer typed props objects over individual params

**Return Values:**
- Use explicit return types in function signatures
- Return objects for related data (not tuples)
- Use `void` for side-effect-only functions

**Examples:**
```typescript
export function AddToCartButton({ product }: AddToCartButtonProps) {
  // Single responsibility: handle cart addition
}

function generateSlug(text: string): string {
  // Single input, single output
}

export async function createCheckoutSession(
  priceId: string,
  userId: string,
  customerEmail?: string
) {
  // Multiple related params OK
}
```

## Module Design

**Exports:**
- Default export for single component per file
- Named exports for utilities and types
- Barrel files (index.ts) for package organization: `export { Button, buttonVariants };`

**Barrel Files:**
- Located at package roots: `packages/cart/index.ts`, `packages/stripe/index.ts`
- Re-export public API only
- Used for backward compatibility with lazy proxies

**Examples:**
```typescript
// packages/stripe/index.ts - barrel file
export function getStripe(): Stripe { /* ... */ }
export const stripe = new Proxy({} as Stripe, { /* ... */ });
export async function createCheckoutSession(...) { /* ... */ }

// components/add-to-cart-button.tsx - default export
export function AddToCartButton({ product }: AddToCartButtonProps) { /* ... */ }

// lib/types.ts - named exports
export interface CartItem { /* ... */ }
export type ViewState = "intro" | "saved" | "quiz" | "result";
```

## React/Next.js Patterns

**Component Structure:**
- Use `"use client"` directive at top for client components
- Props passed as destructured interface
- Hooks after component signature
- JSX after logic
- State initialized with `useState()`

**Server vs Client:**
- Default to server components (no directive)
- Use `"use client"` only when using hooks or browser APIs
- Server actions use `"use server"` directive

**Example:**
```typescript
"use client";

import { useCart } from "@poynt/cart";
import { Button } from "@poynt/ui";

interface AddToCartButtonProps {
  product: Product;
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    addItem(product);
    setAdded(true);
  };

  return <Button onClick={handleAddToCart}>Add</Button>;
}
```

**Zustand Stores:**
- Define interface extending store shape
- Use `create()` with middleware directly
- Persist middleware with custom name: `{ name: "poynt-cart" }`

**Payload Collections:**
- Export as PascalCase constant: `export const Products: CollectionConfig`
- Define fields with Norwegian labels for admin UI
- Use hooks for beforeChange/afterChange lifecycle
- Stripe fields use naming pattern: `stripe{Property}Id`

---

*Convention analysis: 2026-02-03*
