import { describe, expect, test } from "bun:test";
import { regionFromPostcode } from "./postcode-region";

describe("regionFromPostcode", () => {
  test("kjente byer havner i riktig fylke", () => {
    expect(regionFromPostcode("0250")).toBe("Oslo");
    expect(regionFromPostcode("1383")).toBe("Akershus"); // Asker
    expect(regionFromPostcode("1607")).toBe("Østfold"); // Fredrikstad
    expect(regionFromPostcode("2000")).toBe("Akershus"); // Lillestrøm
    expect(regionFromPostcode("2317")).toBe("Innlandet"); // Hamar
    expect(regionFromPostcode("3015")).toBe("Buskerud"); // Drammen
    expect(regionFromPostcode("3111")).toBe("Vestfold"); // Tønsberg
    expect(regionFromPostcode("3300")).toBe("Buskerud"); // Hokksund
    expect(regionFromPostcode("3724")).toBe("Telemark"); // Skien
    expect(regionFromPostcode("4006")).toBe("Rogaland"); // Stavanger
    expect(regionFromPostcode("4611")).toBe("Agder"); // Kristiansand
    expect(regionFromPostcode("5003")).toBe("Vestland"); // Bergen
    expect(regionFromPostcode("6002")).toBe("Møre og Romsdal"); // Ålesund
    expect(regionFromPostcode("6800")).toBe("Vestland"); // Førde
    expect(regionFromPostcode("7010")).toBe("Trøndelag"); // Trondheim
    expect(regionFromPostcode("8006")).toBe("Nordland"); // Bodø
    expect(regionFromPostcode("9008")).toBe("Troms"); // Tromsø
    expect(regionFromPostcode("9510")).toBe("Finnmark"); // Alta
  });

  test("tåler mellomrom, og gir undefined på tull", () => {
    expect(regionFromPostcode(" 0250 ")).toBe("Oslo");
    expect(regionFromPostcode("")).toBeUndefined();
    expect(regionFromPostcode(null)).toBeUndefined();
    expect(regionFromPostcode("abc")).toBeUndefined();
    expect(regionFromPostcode("12345")).toBeUndefined();
  });
});
