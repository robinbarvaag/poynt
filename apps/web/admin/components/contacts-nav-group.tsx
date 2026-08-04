"use client";

import { Link, NavGroup } from "@payloadcms/ui";
import { usePathname } from "next/navigation";

const baseClass = "nav";

// Egen liten gruppe for kunderettede oversikter (custom views kan ikke ligge
// i standard-collection-gruppene). Samme mønster som setup-nav-group.tsx.
const links = [
  {
    href: "/admin/kontakter",
    label: "Kontakter",
  },
];

export const ContactsNavGroup = () => {
  const pathname = usePathname();

  return (
    <NavGroup label="Kunder">
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
