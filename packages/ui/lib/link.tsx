"use client";

import * as React from "react";

export type UILinkProps = React.ComponentPropsWithoutRef<"a"> & {
  href: string;
};

export type UILinkComponent = React.ComponentType<
  UILinkProps & { ref?: React.Ref<HTMLAnchorElement> }
>;

const LinkContext = React.createContext<UILinkComponent | null>(null);

/**
 * Lar appen bestemme hvilken lenkekomponent designsystemet skal bruke for
 * interne lenker. Next-appen sender inn en `next/link`-innpakning, så kort og
 * knapper i @poynt/ui navigerer på klienten (instant navigation) i stedet for
 * å laste hele siden på nytt. Storybook har ingen router og faller tilbake til
 * vanlig `<a>`.
 */
export function LinkComponentProvider({
  component,
  children,
}: {
  component: UILinkComponent;
  children: React.ReactNode;
}) {
  return (
    <LinkContext.Provider value={component}>{children}</LinkContext.Provider>
  );
}

/** True for stier som skal navigeres på klienten (interne, samme fane). */
function isClientNavigable(href: string, target?: string) {
  if (target && target !== "_self") return false;
  // Interne stier starter med «/» — men ikke «//» (protokoll-relativ URL).
  return href.startsWith("/") && !href.startsWith("//");
}

/**
 * Lenken designsystemet bruker internt. Bruker appens lenkekomponent når den
 * finnes og målet er internt; ellers vanlig `<a>`.
 */
export const UILink = React.forwardRef<HTMLAnchorElement, UILinkProps>(
  function UILink(props, ref) {
    const Component = React.useContext(LinkContext);

    if (Component && isClientNavigable(props.href, props.target)) {
      return <Component ref={ref} {...props} />;
    }

    return <a ref={ref} {...props} />;
  }
);
