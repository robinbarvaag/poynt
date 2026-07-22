"use client";

import { Link, NavGroup } from "@payloadcms/ui";
import { usePathname } from "next/navigation";

const baseClass = "nav";

const links = [
  // Innholds-collections for medlemsområdet (skjult fra standard-nav via
  // `group: false` i collection-configen, så de bare vises her).
  {
    href: "/admin/collections/guides",
    label: "Guider",
  },
  {
    href: "/admin/collections/courses",
    label: "Kurs",
  },
  // Egenbygde admin-views (leser fra planner-skjemaet).
  {
    href: "/admin/soknader",
    label: "Søknader",
  },
  {
    href: "/admin/medlemmer",
    label: "Medlemmer",
  },
  {
    href: "/admin/bransjar",
    label: "Bransjer",
  },
  {
    href: "/admin/prompts",
    label: "Prompt-maler",
  },
  {
    href: "/admin/radar",
    label: "Innholdsradar",
  },
  {
    href: "/admin/inspirasjon",
    label: "Inspirasjonskilder",
  },
];

export const OnPoyntNavGroup = () => {
  const pathname = usePathname();

  return (
    <NavGroup label="On Poynt">
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
