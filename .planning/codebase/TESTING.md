# Testing Patterns

**Analysis Date:** 2026-02-03

## Test Framework

**Status:**
- **No test framework currently configured**
- No test files in source code (only in node_modules dependencies)
- No Jest, Vitest, or other runner configured
- No test scripts in package.json

**Available Tools:**
- **Biome** for linting/formatting (already in use)
- **TypeScript** for type checking via `bun run typecheck`
- **Puppeteer** in devDependencies (v24.36.0) - available for E2E testing if needed

**Build/Dev Tools:**
- **Turbo** - orchestrates monorepo builds
- **Bun** - package manager and runtime (v1.2.0)

## Code Quality Validation

**Current Approach:**
```bash
bun run check           # Biome lint + format with fixes
bun run check:ci        # CI validation (no fixes)
bun run typecheck       # TypeScript type checking
bun run lint            # ESLint (supplementary)
```

**Type Safety:**
- TypeScript enforced across all `.ts` and `.tsx` files
- Strict typing used in components and Payload collections
- Type inference heavy (minimal `any` type usage)

## Testing Strategy Recommendations

### Recommended Test Framework
**Vitest** would be ideal for this monorepo:
- Fast, Vite-native test runner
- Compatible with Bun
- Works with TypeScript without extra config
- Good mocking support
- Already available in some dependencies

### Test Organization (Proposed)

**File Location:**
- Co-located with source: `src/components/__tests__/add-to-cart-button.test.tsx`
- Or separate: `tests/unit/components/add-to-cart-button.test.ts`

**Naming:**
- `*.test.ts` for unit tests
- `*.test.tsx` for component tests
- `*.integration.test.ts` for integration tests
- `*.e2e.test.ts` for E2E tests

## Example Test Structures (Not Currently Implemented)

### Unit Test Pattern
```typescript
// tests/unit/lib/media-url.test.ts
describe("mediaUrl utilities", () => {
  describe("getMediaUrl()", () => {
    it("should return correct URL for media object", () => {
      const media = { url: "https://example.com/image.jpg" };
      expect(getMediaUrl(media)).toBe(media.url);
    });

    it("should return empty string for null media", () => {
      expect(getMediaUrl(null)).toBe("");
    });
  });
});
```

### Component Test Pattern
```typescript
// tests/unit/components/add-to-cart-button.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { useCart } from "@poynt/cart";

vi.mock("@poynt/cart");

describe("AddToCartButton", () => {
  it("should render button with product name", () => {
    const mockProduct = {
      id: "1",
      name: "Test Course",
      price: 99900,
    };

    render(<AddToCartButton product={mockProduct} />);
    expect(screen.getByText("Legg i handlekurv")).toBeInTheDocument();
  });

  it("should call addItem when clicked", () => {
    const mockAddItem = vi.fn();
    vi.mocked(useCart).mockReturnValue({
      addItem: mockAddItem,
      items: [],
      removeItem: vi.fn(),
      clearCart: vi.fn(),
      total: vi.fn(() => 0),
    });

    const product = { id: "1", name: "Test", price: 99900 };
    render(<AddToCartButton product={product} />);

    fireEvent.click(screen.getByRole("button"));
    expect(mockAddItem).toHaveBeenCalledWith(expect.objectContaining(product));
  });

  it("should show 'Added!' state briefly after clicking", async () => {
    const product = { id: "1", name: "Test", price: 99900 };
    render(<AddToCartButton product={product} />);

    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Lagt til!")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Lagt til!")).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
```

### Zustand Store Test Pattern
```typescript
// tests/unit/stores/cart.test.ts
import { useCart } from "@poynt/cart";
import { renderHook, act } from "@testing-library/react";

describe("Cart Store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should initialize with empty items", () => {
    const { result } = renderHook(() => useCart());
    expect(result.current.items).toEqual([]);
  });

  it("should add product to cart", () => {
    const { result } = renderHook(() => useCart());
    const product = { id: "1", name: "Test", price: 99900, slug: "test" };

    act(() => {
      result.current.addItem(product);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].id).toBe("1");
  });

  it("should not allow duplicates (digital products)", () => {
    const { result } = renderHook(() => useCart());
    const product = { id: "1", name: "Test", price: 99900, slug: "test" };

    act(() => {
      result.current.addItem(product);
      result.current.addItem(product);
    });

    expect(result.current.items).toHaveLength(1);
  });

  it("should calculate total correctly", () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      result.current.addItem({ id: "1", name: "Product 1", price: 10000, slug: "p1" });
      result.current.addItem({ id: "2", name: "Product 2", price: 5000, slug: "p2" });
    });

    expect(result.current.total()).toBe(15000);
  });

  it("should persist to localStorage", () => {
    const { result: hook1 } = renderHook(() => useCart());

    act(() => {
      hook1.current.addItem({ id: "1", name: "Test", price: 99900, slug: "test" });
    });

    // Create new hook instance to test persistence
    const { result: hook2 } = renderHook(() => useCart());
    expect(hook2.current.items).toHaveLength(1);
  });
});
```

### Payload Collection Hook Test Pattern
```typescript
// tests/unit/collections/products.test.ts
import { generateSlug } from "@/src/collections/products";

describe("Products collection hooks", () => {
  describe("generateSlug()", () => {
    it("should convert to lowercase and trim", () => {
      expect(generateSlug("  Test Product  ")).toBe("test-product");
    });

    it("should replace Norwegian characters", () => {
      expect(generateSlug("Læring med kurs")).toBe("lering-med-kurs");
      expect(generateSlug("Økonomi og driftsleder")).toBe("okonomi-og-driftsleder");
      expect(generateSlug("År av endringer")).toBe("ar-av-endringer");
    });

    it("should handle special characters", () => {
      expect(generateSlug("Course (2024)")).toBe("course-2024");
      expect(generateSlug("50% OFF!")).toBe("50-off");
    });

    it("should remove leading/trailing hyphens", () => {
      expect(generateSlug("---test---")).toBe("test");
    });

    it("should handle spaces and underscores", () => {
      expect(generateSlug("Test_Product Name")).toBe("test-product-name");
    });
  });
});
```

### Error Handling Test Pattern
```typescript
// tests/unit/lib/stripe.test.ts
import { getStripe, createCheckoutSession } from "@poynt/stripe";

describe("Stripe utilities", () => {
  describe("getStripe()", () => {
    it("should throw if STRIPE_SECRET_KEY is not set", () => {
      delete process.env.STRIPE_SECRET_KEY;
      expect(() => getStripe()).toThrow("STRIPE_SECRET_KEY is not set");
    });

    it("should return Stripe instance when key exists", () => {
      process.env.STRIPE_SECRET_KEY = "sk_test_123";
      const stripe = getStripe();
      expect(stripe).toBeDefined();
    });

    it("should return same instance on subsequent calls", () => {
      const instance1 = getStripe();
      const instance2 = getStripe();
      expect(instance1).toBe(instance2);
    });
  });

  describe("createCheckoutSession()", () => {
    it("should create session with correct parameters", async () => {
      const mockCreate = vi.fn().mockResolvedValue({ id: "sess_123" });
      vi.mocked(getStripe).mockReturnValue({
        checkout: { sessions: { create: mockCreate } },
      } as any);

      await createCheckoutSession("price_123", "user_456", "test@example.com");

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: "payment",
          line_items: [{ price: "price_123", quantity: 1 }],
          metadata: { userId: "user_456" },
          customer_email: "test@example.com",
        })
      );
    });
  });
});
```

## Mocking Patterns

**Framework:** Would use Vitest's `vi` object

**What to Mock:**
- External services (Stripe, Resend, Payload)
- HTTP requests and API calls
- Environment variables
- localStorage/sessionStorage
- Zustand stores in component tests

**What NOT to Mock:**
- User interaction (use fireEvent/userEvent)
- React hooks themselves
- Component render logic
- Utility functions (test directly)

**Mocking Strategy:**
```typescript
// Mock modules at top of test file
vi.mock("@poynt/stripe");
vi.mock("@poynt/email");

// Mock with return values
vi.mocked(useCart).mockReturnValue({
  items: [],
  addItem: vi.fn(),
  // ...
});

// Mock environment
beforeEach(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_123";
});
```

## Fixtures and Test Data

**Location (Proposed):**
- `tests/fixtures/` for shared test data
- `tests/factories/` for factory functions

**Pattern:**
```typescript
// tests/fixtures/products.ts
export const mockProduct = {
  id: "1",
  name: "Test Course",
  price: 99900,
  slug: "test-course",
  type: "course" as const,
};

// tests/factories/order.ts
export function createOrder(overrides = {}) {
  return {
    id: "order_123",
    user: "user_456",
    items: [{ product: "1", priceAtPurchase: 99900 }],
    total: 99900,
    status: "pending" as const,
    ...overrides,
  };
}
```

## Coverage

**Currently:** Not enforced

**Recommendation:**
- Target 80%+ coverage for business logic
- Focus on error paths and edge cases
- Lower coverage OK for UI/presentation layers

**View Coverage (Proposed):**
```bash
vitest --coverage
# or
vitest --ui
```

## Test Types

**Unit Tests (Priority 1):**
- Zustand cart store (state management)
- Stripe helpers (error handling)
- generateSlug() utility
- cn() className utility

**Integration Tests (Priority 2):**
- Payload hooks (beforeChange, afterChange)
- Cart + UI component interaction
- Newsletter subscription flow

**E2E Tests (Priority 3 - With Playwright or Puppeteer):**
- Complete checkout flow
- User authentication
- Blog post creation workflow

## Current Gaps

**Areas Without Tests:**
- Cart store functionality (critical)
- Component behavior (AddToCartButton, etc.)
- Stripe integration error handling
- Payload collection hooks
- Slug generation edge cases
- Email sending (Resend integration)

**Risk Areas:**
- No tests for duplicate product prevention in cart
- No tests for Stripe price/product creation
- No tests for state persistence in localStorage

---

*Testing analysis: 2026-02-03*
