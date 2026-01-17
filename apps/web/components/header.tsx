"use client";

import { useCart } from "@poynt/cart";
import { Button, cn } from "@poynt/ui";
import { ChevronDown, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface NavItem {
  label: string;
  linkType: "internal" | "external";
  page?: { slug: string } | null;
  url?: string;
  subItems?: {
    label: string;
    description?: string;
    linkType: "internal" | "external";
    page?: { slug: string } | null;
    url?: string;
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
  page?: { slug: string } | null;
  url?: string;
}): string {
  if (item.linkType === "internal" && item.page) {
    return item.page.slug === "forside" ? "/" : `/${item.page.slug}`;
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4">
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
              <span className="text-xl font-bold">{siteName}</span>
            )}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
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
                  className={cn(
                    "flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary",
                    openDropdown === index && "text-primary"
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
                    <div className="absolute top-full left-0 pt-2 w-64">
                      <div className="rounded-lg border bg-background p-2 shadow-lg">
                        {item.subItems.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            href={getHref(subItem)}
                            className="block rounded-md px-3 py-2 hover:bg-muted"
                          >
                            <div className="font-medium">{subItem.label}</div>
                            {subItem.description && (
                              <div className="text-sm text-muted-foreground">
                                {subItem.description}
                              </div>
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
          <div className="flex items-center gap-4">
            {showSearch && (
              <button className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Search className="h-4 w-4" />
                <span className="hidden lg:inline">Søk</span>
              </button>
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
              <Button variant="outline" size="sm" className="relative">
                <ShoppingCart className="h-4 w-4" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
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
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col gap-4">
              {navItems.map((item, index) => (
                <div key={index}>
                  <Link
                    href={getHref(item)}
                    className="block py-2 font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                  {item.subItems && item.subItems.length > 0 && (
                    <div className="pl-4 border-l">
                      {item.subItems.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          href={getHref(subItem)}
                          className="block py-2 text-sm text-muted-foreground"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-4 border-t">
                {showLogin && (
                  <Link href="/min-side" className="flex-1">
                    <Button variant="outline" className="w-full">
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
