import { describe, expect, test } from "bun:test";
import {
  addMonths,
  anonymizedIdentity,
  answersDeleteAt,
  eventEndedAt,
  hasAnswers,
  isAnonymizedEmail,
  registrationsAnonymizeAt,
  retentionAction,
  retentionCutoff,
} from "./retention";

const event = {
  startsAt: "2026-10-15T16:00:00.000Z",
  endsAt: "2026-10-15T19:00:00.000Z",
};

describe("lagringstid for påmeldinger", () => {
  test("eventet er ferdig ved sluttid, ellers starttid", () => {
    expect(eventEndedAt(event).toISOString()).toBe("2026-10-15T19:00:00.000Z");
    expect(
      eventEndedAt({ startsAt: event.startsAt, endsAt: null }).toISOString()
    ).toBe("2026-10-15T16:00:00.000Z");
  });

  test("svar slettes 14 dager etter, resten anonymiseres 6 måneder etter", () => {
    expect(answersDeleteAt(event).toISOString()).toBe(
      "2026-10-29T19:00:00.000Z"
    );
    expect(registrationsAnonymizeAt(event).toISOString()).toBe(
      "2027-04-15T19:00:00.000Z"
    );
  });

  test("addMonths hopper ikke over månedsslutt", () => {
    expect(
      addMonths(new Date("2026-08-31T12:00:00.000Z"), 6).toISOString()
    ).toBe("2027-02-28T12:00:00.000Z");
    expect(
      addMonths(new Date("2027-08-31T12:00:00.000Z"), 6).toISOString()
    ).toBe("2028-02-29T12:00:00.000Z");
  });

  test("riktig handling til riktig tid", () => {
    expect(retentionAction(event, new Date("2026-10-15T20:00:00Z"))).toBe(
      "keep"
    );
    expect(retentionAction(event, new Date("2026-10-29T18:59:59Z"))).toBe(
      "keep"
    );
    expect(retentionAction(event, new Date("2026-10-29T19:00:00Z"))).toBe(
      "clear_answers"
    );
    expect(retentionAction(event, new Date("2027-04-15T18:59:59Z"))).toBe(
      "clear_answers"
    );
    expect(retentionAction(event, new Date("2027-04-15T19:00:00Z"))).toBe(
      "anonymize"
    );
  });

  test("ugyldig dato gir aldri sletting", () => {
    expect(retentionAction({ startsAt: "ikke en dato" }, new Date())).toBe(
      "keep"
    );
  });

  test("kandidat-grensen ligger 14 dager bak", () => {
    expect(
      retentionCutoff(new Date("2026-10-29T19:00:00.000Z")).toISOString()
    ).toBe("2026-10-15T19:00:00.000Z");
  });

  test("anonymiserte påmeldinger er unike og gjenkjennelige", () => {
    const a = anonymizedIdentity(12);
    const b = anonymizedIdentity(13);
    expect(a.email).not.toBe(b.email);
    expect(a.code).not.toBe(b.code);
    expect(isAnonymizedEmail(a.email)).toBe(true);
    expect(isAnonymizedEmail("kari@example.no")).toBe(false);
  });

  test("hasAnswers", () => {
    expect(hasAnswers(null)).toBe(false);
    expect(hasAnswers({})).toBe(false);
    expect(hasAnswers({ allergier: "nøtter" })).toBe(true);
  });
});
