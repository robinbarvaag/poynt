"use client";

import type { BindersData } from "@/lib/radar/widget-data";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getBindersData } from "../../actions/radar";
import { BindersFab } from "./binders-fab";
import { BindersStyles, BindersWidget } from "./binders-widget";

/**
 * Den flytende Bindersen: en «chat-boble» nede i høyre hjørne som følger
 * partneren gjennom hele admin-panelet. Åpnes til samme assistent som på
 * dashbordet. Skjules på selve dashbordet, der widgeten allerede står inline.
 */

const OPEN_KEY = "poynt-binders-open";

export const BindersAssistant = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<BindersData | null>(null);

  const reload = useCallback(async () => {
    try {
      setData(await getBindersData());
    } catch {
      // Ikke innlogget admin (f.eks. login-siden) — vis ingenting.
      setData(null);
    }
  }, []);

  useEffect(() => {
    setOpen(window.localStorage.getItem(OPEN_KEY) === "1");
    void reload();
  }, [reload]);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    window.localStorage.setItem(OPEN_KEY, next ? "1" : "0");
    if (next) void reload();
  }

  // Dashbordet har allerede Bindersen inline.
  const onDashboard =
    !pathname || pathname === "/admin" || pathname === "/admin/";
  if (onDashboard || !data) return null;

  const count = data.suggestions.length;

  return (
    <>
      <BindersStyles />
      {open && (
        <div className="bndr-panel">
          <BindersWidget
            suggestions={data.suggestions}
            run={data.run}
            variant="floating"
            reload={reload}
          />
        </div>
      )}
      <BindersFab count={count} open={open} onClick={toggleOpen} />
    </>
  );
};
