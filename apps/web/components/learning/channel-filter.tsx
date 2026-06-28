"use client";

import { ContentFilterBar } from "@poynt/ui";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export interface ChannelOption {
  value: string;
  label: string;
  color?: string;
}

/**
 * Kanal-filter for Læring-huben. Bruker samme pille-komponent som type-filteret
 * for et helhetlig uttrykk, men med en liten fargeprikk (kategoriens farge) som
 * identitet i stedet for emoji. Aktiv-tilstanden er merkevare-konsistent.
 */
export function ChannelFilter({ channels }: { channels: ChannelOption[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = searchParams.get("kategori") ?? "alle";

  const onChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "alle") {
        params.delete("kategori");
      } else {
        params.set("kategori", next);
      }
      const query = params.toString();
      router.push(query ? `?${query}` : "?", { scroll: false });
    },
    [router, searchParams]
  );

  const options = [
    { value: "alle", label: "Alle kanaler" },
    ...channels.map((c) => ({ value: c.value, label: c.label, dot: c.color })),
  ];

  return (
    <ContentFilterBar options={options} value={value} onChange={onChange} />
  );
}
