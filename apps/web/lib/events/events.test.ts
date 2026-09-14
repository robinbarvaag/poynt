import { describe, expect, test } from "bun:test";
import {
  decideRegistrationStatus,
  registrationWindow,
  sanitizeGuestNames,
  spotsLeft,
} from "./capacity";
import {
  TICKET_CODE_ALPHABET,
  extractTicketToken,
  generateTicketCode,
  generateTicketToken,
  isTicketToken,
  normalizeTicketCode,
  ticketPath,
} from "./codes";
import {
  formatEventLocation,
  formatEventRange,
  formatEventTime,
} from "./format";
import { buildIcs } from "./ics";

describe("billettkoder", () => {
  test("koden har prefiks og bare tegn fra alfabetet", () => {
    for (let i = 0; i < 50; i++) {
      const code = generateTicketCode();
      expect(code).toMatch(/^POY-[A-Z2-9]{4}$/);
      for (const char of code.slice(4)) {
        expect(TICKET_CODE_ALPHABET).toContain(char);
      }
    }
  });

  test("koden bruker aldri 0, O, 1 eller I", () => {
    expect(TICKET_CODE_ALPHABET).not.toMatch(/[01OI]/);
  });

  test("håndtastede varianter normaliseres", () => {
    expect(normalizeTicketCode("poy 7k3m")).toBe("POY-7K3M");
    expect(normalizeTicketCode("7K3M")).toBe("POY-7K3M");
    expect(normalizeTicketCode(" POY-7K3M ")).toBe("POY-7K3M");
  });

  test("ugyldige koder avvises", () => {
    expect(normalizeTicketCode("POY-7K3")).toBeNull();
    expect(normalizeTicketCode("POY-OOOO")).toBeNull();
    expect(normalizeTicketCode("")).toBeNull();
  });
});

describe("billettnøkler", () => {
  test("nøkkelen er lang, url-trygg og unik", () => {
    const a = generateTicketToken();
    const b = generateTicketToken();
    expect(isTicketToken(a)).toBe(true);
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  test("skanneren finner nøkkelen i hele lenken og som rå verdi", () => {
    const token = generateTicketToken();
    expect(extractTicketToken(`https://www.poynt.no${ticketPath(token)}`)).toBe(
      token
    );
    expect(extractTicketToken(token)).toBe(token);
  });

  test("andre QR-koder gir null", () => {
    expect(extractTicketToken("https://example.com/noe-annet")).toBeNull();
    expect(extractTicketToken("POY-7K3M")).toBeNull();
  });
});

describe("kapasitet", () => {
  test("uten kapasitet er det alltid plass", () => {
    expect(decideRegistrationStatus({ capacity: null, seatsTaken: 500 })).toBe(
      "registered"
    );
    expect(spotsLeft(null, 10)).toBeNull();
  });

  test("ledig plass gir påmeldt", () => {
    expect(decideRegistrationStatus({ capacity: 80, seatsTaken: 79 })).toBe(
      "registered"
    );
    expect(spotsLeft(80, 79)).toBe(1);
  });

  test("fullt med venteliste gir venteliste, uten gir fullt", () => {
    expect(
      decideRegistrationStatus({
        capacity: 80,
        seatsTaken: 80,
        waitlistEnabled: true,
      })
    ).toBe("waitlisted");
    expect(decideRegistrationStatus({ capacity: 80, seatsTaken: 80 })).toBe(
      "full"
    );
    expect(spotsLeft(80, 85)).toBe(0);
  });

  test("hele følget må få plass samtidig", () => {
    expect(
      decideRegistrationStatus({ capacity: 10, seatsTaken: 7, partySize: 3 })
    ).toBe("registered");
    expect(
      decideRegistrationStatus({
        capacity: 10,
        seatsTaken: 8,
        partySize: 3,
        waitlistEnabled: true,
      })
    ).toBe("waitlisted");
    expect(
      decideRegistrationStatus({ capacity: 10, seatsTaken: 8, partySize: 3 })
    ).toBe("full");
  });
});

describe("følge", () => {
  test("ingen følge er alltid greit", () => {
    expect(sanitizeGuestNames(undefined, 0)).toEqual({ names: [] });
    expect(sanitizeGuestNames([], 2)).toEqual({ names: [] });
  });

  test("navn trimmes og godtas innenfor grensa", () => {
    expect(sanitizeGuestNames([" Ola ", "Kari"], 2)).toEqual({
      names: ["Ola", "Kari"],
    });
  });

  test("avvises når eventet ikke tar imot følge, navn mangler eller det er for mange", () => {
    expect(sanitizeGuestNames(["Ola"], 0).error).toBeDefined();
    expect(sanitizeGuestNames(["Ola", " "], 2).error).toBe(
      "Skriv navn på alle i følget."
    );
    expect(sanitizeGuestNames(["Ola", "Kari"], 1).error).toBe(
      "Du kan ta med inntil 1 person."
    );
  });
});

describe("påmeldingsvindu", () => {
  const event = {
    startsAt: "2026-10-15T16:00:00.000Z",
    registrationOpensAt: "2026-09-20T08:00:00.000Z",
    registrationClosesAt: "2026-10-14T20:00:00.000Z",
  };

  test("før åpning, åpen, stengt og over", () => {
    expect(registrationWindow(event, new Date("2026-09-19T00:00:00Z"))).toBe(
      "not_open"
    );
    expect(registrationWindow(event, new Date("2026-10-01T00:00:00Z"))).toBe(
      "open"
    );
    expect(registrationWindow(event, new Date("2026-10-15T10:00:00Z"))).toBe(
      "closed"
    );
    expect(registrationWindow(event, new Date("2026-10-15T17:00:00Z"))).toBe(
      "ended"
    );
  });

  test("uten åpning/frist er påmeldingen åpen til eventet starter", () => {
    expect(
      registrationWindow(
        { startsAt: event.startsAt },
        new Date("2026-10-15T15:59:00Z")
      )
    ).toBe("open");
  });
});

describe("visning av tid og sted", () => {
  test("tid vises i norsk tid", () => {
    // 16:00 UTC i oktober = 18:00 sommertid i Norge.
    expect(formatEventTime("2026-10-15T16:00:00.000Z")).toBe("18:00");
  });

  test("samme dag slås sammen til ett tidsrom", () => {
    const text = formatEventRange(
      "2026-10-15T16:00:00.000Z",
      "2026-10-15T19:00:00.000Z"
    );
    expect(text).toContain("15. oktober 2026");
    expect(text).toContain("18:00–21:00");
  });

  test("sted fra navn og adresse, digitalt som reserve", () => {
    expect(
      formatEventLocation({
        name: "Tou",
        address: "Kvitsøygata 25\n4014 Stavanger",
      })
    ).toBe("Tou, Kvitsøygata 25, 4014 Stavanger");
    expect(formatEventLocation({ online: true })).toBe("Digitalt");
    expect(formatEventLocation(null)).toBe("");
  });
});

describe("kalenderfil", () => {
  const ics = buildIcs(
    {
      uid: "event-1@poynt.no",
      title: "Lanseringsfest, «Verdifull vekst»",
      startsAt: "2026-10-15T16:00:00.000Z",
      location: "Tou; Stavanger",
      description: "Linje 1\nLinje 2",
    },
    new Date("2026-09-14T10:00:00.000Z")
  );

  test("har påkrevde felt i UTC", () => {
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("DTSTART:20261015T160000Z");
    // Uten sluttid: to timer.
    expect(ics).toContain("DTEND:20261015T180000Z");
    expect(ics).toContain("DTSTAMP:20260914T100000Z");
  });

  test("escaper komma, semikolon og linjeskift", () => {
    expect(ics).toContain("SUMMARY:Lanseringsfest\\, «Verdifull vekst»");
    expect(ics).toContain("LOCATION:Tou\\; Stavanger");
    expect(ics).toContain("DESCRIPTION:Linje 1\\nLinje 2");
  });

  test("bruker CRLF og bretter lange linjer", () => {
    const long = buildIcs({
      uid: "x",
      title: "a".repeat(200),
      startsAt: "2026-10-15T16:00:00.000Z",
    });
    expect(long).toContain("\r\n ");
    for (const line of long.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });
});
