"use client";

import { getMediaUrl } from "@/lib/media-url";
import { Button, Text, cn } from "@poynt/ui";
import { ChevronDown, Menu, Search, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CartDrawer } from "./cart-drawer";

interface NavItem {
  label: string;
  linkType: "custom" | "page" | "blog" | "product";
  url?: string;
  page?: { slug: string } | null;
  blogPost?: { slug: string } | null;
  product?: { slug: string } | null;
  openInNewTab?: boolean;
  subItems?: {
    label: string;
    description?: string;
    linkType: "custom" | "page" | "blog" | "product";
    url?: string;
    page?: { slug: string } | null;
    blogPost?: { slug: string } | null;
    product?: { slug: string } | null;
    openInNewTab?: boolean;
  }[];
}

interface HeaderProps {
  siteName?: string;
  logo?: { url: string; alt?: string } | null;
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
        return `/post/${item.blogPost.slug}`;
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

export function Header({
  siteName = "Poynt",
  logo,
  showSearch = true,
  showLogin = true,
  ctaButton,
  navItems = [],
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full px-4 sm:px-6 lg:px-8 pt-4 pointer-events-none">
      <nav
        className={cn(
          "mx-auto max-w-6xl rounded-2xl transition-all duration-300 pointer-events-auto",
          scrolled
            ? "bg-background/80 backdrop-blur-xl shadow-lg shadow-foreground/5 ring-1 ring-foreground/5"
            : "bg-background/50 backdrop-blur-md ring-1 ring-foreground/3"
        )}
      >
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            {logo ? (
              <Image
                src={getMediaUrl(logo.url)}
                alt={logo.alt || siteName}
                width={120}
                height={40}
                className="h-7 w-auto"
              />
            ) : (
              <span className="text-lg font-bold font-heading text-foreground">
                {siteName}
              </span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-0.5">
            {navItems.map((item, index) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() =>
                  item.subItems?.length && setOpenDropdown(index)
                }
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  href={getHref(item)}
                  target={item.openInNewTab ? "_blank" : undefined}
                  rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                  className={cn(
                    "flex items-center gap-1 px-3.5 py-1.5 text-sm font-medium rounded-full transition-colors",
                    "text-foreground/70 hover:text-foreground hover:bg-foreground/5",
                    openDropdown === index && "bg-foreground/5 text-foreground"
                  )}
                >
                  {item.label}
                  {item.subItems && item.subItems.length > 0 && (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </Link>

                {/* Dropdown */}
                {item.subItems &&
                  item.subItems.length > 0 &&
                  openDropdown === index && (
                    <div className="absolute top-full left-0 pt-2 w-72">
                      <div className="rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl p-2 shadow-lg">
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.label}
                            href={getHref(subItem)}
                            target={subItem.openInNewTab ? "_blank" : undefined}
                            rel={
                              subItem.openInNewTab
                                ? "noopener noreferrer"
                                : undefined
                            }
                            className="block rounded-xl px-3 py-2.5 hover:bg-foreground/5 transition-colors"
                          >
                            <Text
                              type="span"
                              weight="medium"
                              size="body-small"
                              customStyles="block"
                            >
                              {subItem.label}
                            </Text>
                            {subItem.description && (
                              <Text
                                type="span"
                                size="body-detail"
                                color="muted"
                                customStyles="block mt-0.5"
                              >
                                {subItem.description}
                              </Text>
                            )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-1.5">
            {showSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex h-8 w-8 rounded-full"
              >
                <Search className="h-4 w-4" />
              </Button>
            )}

            {showLogin && (
              <Link href="/min-side">
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden sm:flex h-8 w-8 rounded-full"
                >
                  <User className="h-4 w-4" />
                </Button>
              </Link>
            )}

            <CartDrawer />

            {ctaButton?.show && ctaButton.text && ctaButton.url && (
              <Link href={ctaButton.url}>
                <Button
                  size="sm"
                  className="hidden sm:flex rounded-full px-5 h-8 text-xs"
                >
                  {ctaButton.text}
                </Button>
              </Link>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 rounded-full"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-foreground/5 px-4 pb-4 pt-2">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <div key={item.label}>
                  <Link
                    href={getHref(item)}
                    target={item.openInNewTab ? "_blank" : undefined}
                    rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                    className="block py-2.5 px-3 rounded-xl font-medium text-sm hover:bg-foreground/5 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                  {item.subItems && item.subItems.length > 0 && (
                    <div className="ml-4 pl-3 border-l-2 border-primary/20">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.label}
                          href={getHref(subItem)}
                          target={subItem.openInNewTab ? "_blank" : undefined}
                          rel={
                            subItem.openInNewTab
                              ? "noopener noreferrer"
                              : undefined
                          }
                          className="block py-2 px-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-3 mt-3 border-t border-foreground/5">
                {showLogin && (
                  <Link href="/min-side" className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-full"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Logg inn
                    </Button>
                  </Link>
                )}
                {ctaButton?.show && ctaButton.text && ctaButton.url && (
                  <Link href={ctaButton.url} className="flex-1">
                    <Button size="sm" className="w-full rounded-full">
                      {ctaButton.text}
                    </Button>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </nav>
    </header>
  );
}
