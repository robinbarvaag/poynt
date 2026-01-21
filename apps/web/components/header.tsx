"use client";

import { useCart } from "@poynt/cart";
import { Button, cn, Text } from "@poynt/ui";
import { ChevronDown, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

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
    case "custom":
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
  const { items } = useCart();
  const itemCount = items.length;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            {logo ? (
              <Image
                src={logo.url}
                alt={logo.alt || siteName}
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            ) : (
              <span className="text-xl font-bold text-foreground">{siteName}</span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item, index) => (
              <div
                key={index}
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
                    "flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                    "text-foreground hover:bg-accent hover:text-accent-foreground",
                    openDropdown === index && "bg-accent text-accent-foreground"
                  )}
                >
                  {item.label}
                  {item.subItems && item.subItems.length > 0 && (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Link>

                {/* Dropdown */}
                {item.subItems &&
                  item.subItems.length > 0 &&
                  openDropdown === index && (
                    <div className="absolute top-full left-0 pt-2 w-72">
                      <div className="rounded-lg border border-border bg-card p-2 shadow-lg">
                        {item.subItems.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            href={getHref(subItem)}
                            target={subItem.openInNewTab ? "_blank" : undefined}
                            rel={subItem.openInNewTab ? "noopener noreferrer" : undefined}
                            className="block rounded-md px-3 py-2 hover:bg-accent transition-colors"
                          >
                            <Text as="span" className="font-medium block">
                              {subItem.label}
                            </Text>
                            {subItem.description && (
                              <Text as="span" variant="subtle" className="block mt-0.5">
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
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {showSearch && (
              <Button variant="ghost" size="sm" className="hidden sm:flex gap-2">
                <Search className="h-4 w-4" />
                <span className="hidden lg:inline">Søk</span>
              </Button>
            )}

            {showLogin && (
              <Link href="/min-side">
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  <User className="h-4 w-4 mr-2" />
                  Logg inn
                </Button>
              </Link>
            )}

            <Link href="/handlekurv">
              <Button variant="outline" size="icon" className="relative">
                <ShoppingCart className="h-4 w-4" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>

            {ctaButton?.show && ctaButton.text && ctaButton.url && (
              <Link href={ctaButton.url}>
                <Button size="sm" className="hidden sm:flex">
                  {ctaButton.text}
                </Button>
              </Link>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-1">
              {navItems.map((item, index) => (
                <div key={index}>
                  <Link
                    href={getHref(item)}
                    target={item.openInNewTab ? "_blank" : undefined}
                    rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                    className="block py-2 px-3 rounded-md font-medium hover:bg-accent transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                  {item.subItems && item.subItems.length > 0 && (
                    <div className="ml-4 pl-3 border-l border-border">
                      {item.subItems.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          href={getHref(subItem)}
                          target={subItem.openInNewTab ? "_blank" : undefined}
                          rel={subItem.openInNewTab ? "noopener noreferrer" : undefined}
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
              <div className="flex gap-2 pt-4 mt-4 border-t border-border">
                {showLogin && (
                  <Link href="/min-side" className="flex-1">
                    <Button variant="outline" className="w-full">
                      <User className="h-4 w-4 mr-2" />
                      Logg inn
                    </Button>
                  </Link>
                )}
                {ctaButton?.show && ctaButton.text && ctaButton.url && (
                  <Link href={ctaButton.url} className="flex-1">
                    <Button className="w-full">{ctaButton.text}</Button>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
