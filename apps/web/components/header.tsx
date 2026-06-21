"use client";

import { type MediaResource, PayloadImage } from "@/components/payload-image";
import {
  Button,
  SiteHeader,
  type SiteHeaderLinkProps,
  type SiteHeaderNavItem,
} from "@poynt/ui";
import { Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CartDrawer } from "./cart-drawer";
import { ContactLink } from "./contact/contact-link";

interface SubNavItem {
  label: string;
  description?: string;
  linkType: "custom" | "page" | "blog" | "product";
  url?: string;
  page?: { slug: string } | null;
  blogPost?: { slug: string } | null;
  product?: { slug: string } | null;
  openInNewTab?: boolean;
}

interface NavItem {
  label: string;
  linkType: "custom" | "page" | "blog" | "product";
  url?: string;
  page?: { slug: string } | null;
  blogPost?: { slug: string } | null;
  product?: { slug: string } | null;
  openInNewTab?: boolean;
  subItems?: SubNavItem[];
}

interface HeaderProps {
  siteName?: string;
  logo?: MediaResource | null;
  showSearch?: boolean;
  showLogin?: boolean;
  ctaButton?: {
    show?: boolean;
    text?: string;
    url?: string;
  };
  navItems?: NavItem[];
}

function getHref(item: {
  linkType: string;
  url?: string;
  page?: { slug: string } | null;
  blogPost?: { slug: string } | null;
  product?: { slug: string } | null;
}): string {
  switch (item.linkType) {
    case "page":
      if (item.page) {
        return item.page.slug === "forside" ? "/" : `/${item.page.slug}`;
      }
      break;
    case "blog":
      if (item.blogPost) {
        return `/blogg/${item.blogPost.slug}`;
      }
      break;
    case "product":
      if (item.product) {
        return `/produkter/${item.product.slug}`;
      }
      break;
    default:
      return item.url || "#";
  }
  return item.url || "#";
}

// next/link som SiteHeader sin lenkekomponent (klient-navigasjon + prefetch).
function NavLink({ href, children, ...rest }: SiteHeaderLinkProps) {
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}

export function Header({
  siteName = "Poynt",
  logo,
  showSearch = true,
  showLogin = true,
  ctaButton,
  navItems = [],
}: HeaderProps) {
  const pathname = usePathname();

  const items: SiteHeaderNavItem[] = navItems.map((item) => ({
    label: item.label,
    href: getHref(item),
    external: item.openInNewTab,
    subItems: item.subItems?.map((sub) => ({
      label: sub.label,
      href: getHref(sub),
      description: sub.description,
      external: sub.openInNewTab,
    })),
  }));

  const logoNode = logo?.url ? (
    <PayloadImage
      media={logo}
      alt={logo.alt || siteName}
      width={120}
      height={40}
      className="h-8 w-auto"
    />
  ) : (
    siteName
  );

  const hasCta = !!(ctaButton?.show && ctaButton.text && ctaButton.url);
  // Peker CTA-en mot /kontakt? Da brukes ContactLink, som åpner skjemaet i et
  // modal (intercepting-route) og stempler innsendingen med kilde "header".
  const ctaUrl = ctaButton?.url ?? "#";
  const ctaIsContact = ctaUrl.startsWith("/kontakt");
  const ctaText = ctaButton?.text;

  const actions = (
    <>
      {showSearch && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Søk"
          className="hidden size-9 rounded-full sm:flex"
        >
          <Search className="size-4" />
        </Button>
      )}
      {showLogin && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Logg inn"
          className="hidden size-9 rounded-full sm:flex"
          asChild
        >
          <Link href="/min-side">
            <User className="size-4" />
          </Link>
        </Button>
      )}
      <CartDrawer />
      {hasCta && (
        <Button
          size="sm"
          className="hidden h-9 rounded-full px-5 sm:flex"
          asChild
        >
          {ctaIsContact ? (
            <ContactLink kilde="header">{ctaText}</ContactLink>
          ) : (
            <Link href={ctaUrl}>{ctaText}</Link>
          )}
        </Button>
      )}
    </>
  );

  const mobileFooter =
    showLogin || hasCta ? (
      <>
        {showLogin && (
          <Button variant="outline" className="w-full rounded-full" asChild>
            <Link href="/min-side">
              <User className="mr-2 size-4" />
              Logg inn
            </Link>
          </Button>
        )}
        {hasCta && (
          <Button className="w-full rounded-full" asChild>
            {ctaIsContact ? (
              <ContactLink kilde="header-mobil">{ctaText}</ContactLink>
            ) : (
              <Link href={ctaUrl}>{ctaText}</Link>
            )}
          </Button>
        )}
      </>
    ) : undefined;

  return (
    <SiteHeader
      logo={logoNode}
      navItems={items}
      actions={actions}
      mobileFooter={mobileFooter}
      linkComponent={NavLink}
      pathname={pathname}
    />
  );
}
