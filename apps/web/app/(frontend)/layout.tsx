import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import config from "@payload-config";
import { unstable_cache } from "next/cache";
import { getPayload } from "payload";

async function getGlobals() {
  const payload = await getPayload({ config });

  const [siteSettings, header, footer] = await Promise.all([
    payload.findGlobal({ slug: "site-settings" }).catch(() => null),
    payload.findGlobal({ slug: "header" }).catch(() => null),
    payload.findGlobal({ slug: "footer" }).catch(() => null),
  ]);

  return { siteSettings, header, footer };
}

const getCachedGlobals = unstable_cache(getGlobals, ["globals"], {
  tags: ["globals"],
  revalidate: 60,
});

export default async function FrontendLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { siteSettings, header, footer } = await getCachedGlobals();

  return (
    <>
      <Header
        siteName={siteSettings?.siteName || "Poynt"}
        logo={siteSettings?.logo as { url: string; alt?: string } | null}
        showSearch={header?.showSearch ?? true}
        showLogin={header?.showLogin ?? true}
        ctaButton={header?.ctaButton as HeaderProps["ctaButton"]}
        navItems={header?.navItems as HeaderProps["navItems"]}
      />
      <main className="min-h-screen">{children}</main>
      <Footer
        siteName={siteSettings?.siteName || "Poynt"}
        logo={siteSettings?.logo as { url: string; alt?: string } | null}
        columns={footer?.columns as FooterProps["columns"]}
        bottomText={footer?.bottomText ?? undefined}
        showSocialLinks={footer?.showSocialLinks ?? true}
        socialLinks={siteSettings?.socialLinks as FooterProps["socialLinks"]}
        newsletter={
          footer?.showNewsletter
            ? {
                enabled: footer.showNewsletter,
                title: footer.newsletterTitle ?? undefined,
                description: footer.newsletterDescription ?? undefined,
              }
            : undefined
        }
      />
    </>
  );
}

// Type helpers for props
interface HeaderProps {
  ctaButton?: {
    show?: boolean;
    text?: string;
    url?: string;
  };
  navItems?: {
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
  }[];
}

interface FooterProps {
  columns?: {
    title: string;
    links?: {
      label: string;
      linkType: "internal" | "external";
      page?: { slug: string } | null;
      url?: string;
      openInNewTab?: boolean;
    }[];
  }[];
  socialLinks?: {
    platform:
      | "facebook"
      | "instagram"
      | "twitter"
      | "linkedin"
      | "youtube"
      | "tiktok";
    url: string;
  }[];
}
