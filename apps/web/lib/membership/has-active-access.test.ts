import { describe, expect, test } from "bun:test";
import type { MembershipInfo } from "../membership";
import { hasActiveAccess, hasAiTools } from "./has-active-access";

function buildMembership(
  overrides: Partial<MembershipInfo> = {}
): MembershipInfo {
  return {
    tier: "community",
    status: "active",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    ...overrides,
  };
}

describe("hasAiTools", () => {
  test("true for community_ai og agency", () => {
    expect(hasAiTools("community_ai")).toBe(true);
    expect(hasAiTools("agency")).toBe(true);
  });

  test("false for community og none", () => {
    expect(hasAiTools("community")).toBe(false);
    expect(hasAiTools("none")).toBe(false);
  });
});

describe("hasActiveAccess", () => {
  test("false for tier none uavhengig av status", () => {
    expect(
      hasActiveAccess(buildMembership({ tier: "none", status: "active" }))
    ).toBe(false);
  });

  test("true for status active", () => {
    expect(
      hasActiveAccess(buildMembership({ tier: "community", status: "active" }))
    ).toBe(true);
  });

  test("canceled med currentPeriodEnd i fremtiden gir tilgang", () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    expect(
      hasActiveAccess(
        buildMembership({
          tier: "community",
          status: "canceled",
          currentPeriodEnd: future,
        })
      )
    ).toBe(true);
  });

  test("canceled med currentPeriodEnd i fortiden gir ikke tilgang", () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(
      hasActiveAccess(
        buildMembership({
          tier: "community",
          status: "canceled",
          currentPeriodEnd: past,
        })
      )
    ).toBe(false);
  });

  test("canceled uten currentPeriodEnd gir ikke tilgang", () => {
    expect(
      hasActiveAccess(
        buildMembership({
          tier: "community",
          status: "canceled",
          currentPeriodEnd: null,
        })
      )
    ).toBe(false);
  });

  test("past_due gir tilgang (grace period)", () => {
    expect(
      hasActiveAccess(
        buildMembership({ tier: "community", status: "past_due" })
      )
    ).toBe(true);
  });

  test("inactive gir ikke tilgang", () => {
    expect(
      hasActiveAccess(
        buildMembership({ tier: "community", status: "inactive" })
      )
    ).toBe(false);
  });
});
