import { ContactLink } from "@/components/rich-text/contact-link";
import {
  type LexicalLinkFields,
  resolveLexicalLink,
} from "@/lib/lexical/link-fields";
import type {
  SerializedAutoLinkNode,
  SerializedLinkNode,
} from "@payloadcms/richtext-lexical";
import type { JSXConverters } from "@payloadcms/richtext-lexical/react";
import { ExternalLink, Mail, Phone } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const SITE_URL = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

const iconClass = "inline-block size-[0.85em] shrink-0 align-[-0.1em]";

/**
 * Én lenke fra Lexical, rendret etter type:
 *
 * - eget nettsted → `next/link` (klientnavigasjon), ny fane bare om valgt
 * - annet nettsted → ny fane, `rel="noopener noreferrer"` og ekstern-ikon
 * - e-post/telefon → ikon foran + popover med «send/ring» og «kopier»
 * - uløselig (slettet side o.l.) → bare teksten, ikke et dødt `#`
 */
export function LexicalLink({
  fields,
  children,
}: {
  fields: LexicalLinkFields;
  children: ReactNode;
}) {
  const link = resolveLexicalLink(fields, { siteUrl: SITE_URL });
  if (!link) return <span>{children}</span>;

  switch (link.kind) {
    case "external":
      return (
        <a href={link.href} target="_blank" rel="noopener noreferrer">
          {children}
          <ExternalLink className={`${iconClass} ml-1`} aria-hidden="true" />
          <span className="sr-only"> (åpnes i ny fane)</span>
        </a>
      );
    case "email":
    case "phone": {
      const Icon = link.kind === "email" ? Mail : Phone;
      return (
        <ContactLink kind={link.kind} href={link.href} value={link.value}>
          <Icon className={`${iconClass} mr-1`} aria-hidden="true" />
          {children}
        </ContactLink>
      );
    }
    default:
      return (
        <Link
          href={link.href}
          target={link.newTab ? "_blank" : undefined}
          rel={link.newTab ? "noopener noreferrer" : undefined}
        >
          {children}
        </Link>
      );
  }
}

/**
 * Lexical → JSX for `link` og `autolink`. Spre inn etter `defaultConverters`
 * i alle `RichText`-konvertere (se `components/rich-text/index.tsx`).
 */
export const linkConverters: JSXConverters<
  SerializedLinkNode | SerializedAutoLinkNode
> = {
  link: ({ node, nodesToJSX }) => (
    <LexicalLink fields={node.fields}>
      {nodesToJSX({ nodes: node.children })}
    </LexicalLink>
  ),
  autolink: ({ node, nodesToJSX }) => (
    <LexicalLink fields={node.fields}>
      {nodesToJSX({ nodes: node.children })}
    </LexicalLink>
  ),
};
