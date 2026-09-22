"use client";

import { Link, NavGroup } from "@payloadcms/ui";
import { usePathname } from "next/navigation";

const baseClass = "nav";

/**
 * «Boka»-gruppa: alt som hører til «Verdifull vekst» samlet ett sted.
 * Collections og global her er skjult fra standard-nav via `group: false`.
 *
 * Dashbordet ligger utenfor admin (Payload-admin har verken Tailwind eller
 * graf-bibliotek), men bak samme innlogging — derfor står lenka øverst her.
 */
const links = [
  { href: "/intern/boksalg", label: "Boksalg-dashbord" },
  { href: "/admin/collections/book-expenses", label: "Bokutgifter" },
  { href: "/admin/collections/book-sales", label: "Boksalg (manuelt)" },
  { href: "/admin/collections/book-stores", label: "Butikker" },
  { href: "/admin/collections/book-stock-events", label: "Lagerendringer" },
  { href: "/admin/collections/book-stock-snapshots", label: "Lagerbilder" },
  { href: "/admin/globals/book-economy", label: "Bokøkonomi" },
];

export const BookNavGroup = () => {
  const pathname = usePathname();

  return (
    <NavGroup label="Boka">
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
