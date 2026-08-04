"use client";

import { Link, NavGroup } from "@payloadcms/ui";
import { usePathname } from "next/navigation";

const baseClass = "nav";

// Driftsting partneren sjelden trenger: teknisk oppsett og innstillinger.
// Globals/collections her er skjult fra standard-nav via `group: false`.
const links = [
  {
    href: "/admin/oppsett",
    label: "Betalingsoppsett",
  },
  {
    href: "/admin/globals/site-settings",
    label: "Nettsted-innstillinger",
  },
  {
    href: "/admin/globals/checkout-settings",
    label: "Kasse og kvittering",
  },
  {
    href: "/admin/epost",
    label: "E-post",
  },
  {
    href: "/admin/collections/redirects",
    label: "Omdirigeringer",
  },
];

export const SetupNavGroup = () => {
  const pathname = usePathname();

  return (
    <NavGroup label="Drift">
      {links.map((link) => {
        const isActive =
          pathname?.startsWith(link.href) &&
          ["/", undefined].includes(pathname[link.href.length]);

        const Label = (
          <>
            {isActive && <div className={`${baseClass}__link-indicator`} />}
            <span className={`${baseClass}__link-label`}>{link.label}</span>
          </>
        );

        if (pathname === link.href) {
          return (
            <div key={link.href} className={`${baseClass}__link`}>
              {Label}
            </div>
          );
        }

        return (
          <Link
            key={link.href}
            className={`${baseClass}__link`}
            href={link.href}
            prefetch={false}
          >
            {Label}
          </Link>
        );
      })}
    </NavGroup>
  );
};
