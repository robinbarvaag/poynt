import { describe, expect, it, mock } from "bun:test";
import type { Database } from "@poynt/planner-db";

// "@poynt/planner-db" oppretter en postgres-tilkobling (lat, kobler ikke før
// første spørring) når modulen lastes, og krever DATABASE_URI. Sett en
// dummy-verdi før dynamisk import av modulen under test, slik at testen kan
// kjøre uten en ekte database - vi bruker likevel bare den falske db-en under.
process.env.DATABASE_URI ??= "postgres://test:test@localhost:5432/test";
const { claimWebhookEvent, releaseWebhookEvent } = await import(
  "./webhook-events"
);

function createFakeDb(returningResult: Array<{ eventId: string }>) {
  const whereCall = mock((_condition: unknown) => Promise.resolve());
  const deleteCall = mock(() => ({ where: whereCall }));

  const returningCall = mock(() => Promise.resolve(returningResult));
  const onConflictDoNothingCall = mock((_args: unknown) => ({
    returning: returningCall,
  }));
  const valuesCall = mock((_values: unknown) => ({
    onConflictDoNothing: onConflictDoNothingCall,
  }));
  const insertCall = mock(() => ({ values: valuesCall }));

  const fakeDb = {
    insert: insertCall,
    delete: deleteCall,
  } as unknown as Database;

  return {
    fakeDb,
    insertCall,
    valuesCall,
    onConflictDoNothingCall,
    returningCall,
    deleteCall,
    whereCall,
  };
}

describe("claimWebhookEvent", () => {
  it("returns true when the insert wins the claim", async () => {
    const { fakeDb } = createFakeDb([{ eventId: "evt_1" }]);

    const claimed = await claimWebhookEvent(
      fakeDb,
      "evt_1",
      "checkout.session.completed"
    );

    expect(claimed).toBe(true);
  });

  it("returns false when the event is already claimed (conflict)", async () => {
    const { fakeDb } = createFakeDb([]);

    const claimed = await claimWebhookEvent(
      fakeDb,
      "evt_1",
      "checkout.session.completed"
    );

    expect(claimed).toBe(false);
  });
});

describe("releaseWebhookEvent", () => {
  it("deletes the row for the given eventId", async () => {
    const { fakeDb, deleteCall, whereCall } = createFakeDb([]);

    await releaseWebhookEvent(fakeDb, "evt_1");

    expect(deleteCall).toHaveBeenCalledTimes(1);
    expect(whereCall).toHaveBeenCalledTimes(1);
  });
});
