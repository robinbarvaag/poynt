import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@poynt/ui";

const sizeVariants = {
  h1: "text-h1-mobile md:text-h1-desktop",
  h2: "text-h2-mobile md:text-h2-desktop",
  h3: "text-h3-mobile md:text-h3-desktop",
  h4: "text-h4-mobile md:text-h4-desktop",
  "h4-fixed": "text-h4-desktop md:text-h4-desktop",
  "h3-special": "text-h3-special-mobile md:text-h3-special-desktop",
  "body-heading": "text-body-heading-mobile md:text-body-heading-desktop",
  body: "text-body-mobile md:text-body-desktop",
  "body-small": "text-body-small-mobile md:text-body-small-desktop",
  "body-detail": "text-body-detail-mobile md:text-body-detail-desktop",
  // Fixed (alltid desktop-størrelse)
  "h1-fixed": "text-h1-desktop md:text-h1-desktop",
  "h2-fixed": "text-h2-desktop md:text-h2-desktop",
  "h3-fixed": "text-h3-desktop md:text-h3-desktop",
  "body-heading-fixed":
    "text-body-heading-desktop md:text-body-heading-desktop",
  "body-fixed": "text-body-desktop md:text-body-desktop",
  "body-small-fixed": "text-body-small-desktop md:text-body-small-desktop",
  "body-detail-fixed": "text-body-detail-desktop md:text-body-detail-desktop",
  input: "text-body-small-mobile md:text-body-small-desktop",
  "input-fixed": "text-body-small-desktop md:text-body-small-desktop",
} as const;

const colorVariants = {
  inherit: "",
  primary: "text-primary",
  foreground: "text-foreground",
  muted: "text-muted-foreground",
  white: "text-white",
  danger: "text-bate-red",
  success: "text-green-600",
} as const;

const weightVariants = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-clanot-bold",
  black: "font-clanot-black",
  ultra: "font-clanot-ultra",
} as const;

const clampLines = {
  none: "",
  sm: "overflow-hidden overflow-ellipsis line-clamp-3",
  md: "overflow-hidden overflow-ellipsis line-clamp-6",
  lg: "overflow-hidden overflow-ellipsis line-clamp-12",
};

const headingVariants = cva("scroll-m-20 text-balance", {
  variants: {
    variant: {
      h1: "text-h1-mobile md:text-h1-desktop leading font-clanot-ultra text-primary [body.medlemsfordeler-page_&]:text-white",
      h2: "text-h2-mobile md:text-h2-desktop font-clanot-ultra text-primary first:mt-0 [body.medlemsfordeler-page_&]:text-white",
      h3: "text-h3-mobile md:text-h3-desktop font-clanot-black",
      h4: "text-h3 font-semibold",
    },
    size: sizeVariants,
    color: colorVariants,
    weight: weightVariants,
  },
  defaultVariants: {
    variant: "h1",
  },
});

type HeadingProps = Omit<React.ComponentProps<"h1">, "className"> &
  VariantProps<typeof headingVariants> & {
    asChild?: boolean;
    /**
     * Bruk `customStyles` kun når du trenger å gå utenfor design-systemet.
     * Foretrekk `size`, `color` og `weight` props for vanlige justeringer.
     */
    customStyles?: string;
    /**
     * @deprecated Bruk `customStyles` i stedet for `className`
     */
    className?: never;
  };

function Heading({
  variant,
  size,
  color,
  weight,
  asChild = false,
  customStyles,
  ...props
}: HeadingProps) {
  const Comp = asChild ? Slot : variant || "h1";

  return (
    <Comp
      data-slot="heading"
      className={cn(
        headingVariants({ variant, size, color, weight }),
        customStyles
      )}
      {...props}
    />
  );
}

const textVariants = cva("", {
  variants: {
    variant: {
      p: "leading-7",
      lead: "text-xl text-muted-foreground",
      large:
        "text-md font-semibold text-body-small-mobile md:text-body-small-desktop",
      small: "text-sm font-medium leading-none",
      muted: "text-sm text-muted-foreground",
    },
    size: sizeVariants,
    color: colorVariants,
    weight: weightVariants,
    clamp: clampLines,
    bold: {
      true: "font-clanot-bold",
    },
  },
  defaultVariants: {
    variant: "p",
    size: "body-small",
    bold: false,
  },
});

type TextProps = Omit<React.ComponentProps<"p">, "className"> &
  VariantProps<typeof textVariants> & {
    asChild?: boolean;
    /**
     * Bruk `customStyles` kun når du trenger å gå utenfor design-systemet.
     * Foretrekk `size`, `color` og `weight` props for vanlige justeringer.
     */
    customStyles?: string;
    /**
     * @deprecated Bruk `customStyles` i stedet for `className`
     */
    className?: never;
  };

function Text({
  variant,
  size,
  color,
  weight,
  asChild = false,
  bold,
  customStyles,
  clamp,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  className: _className,
  ...props
}: TextProps) {
  const Comp = asChild ? Slot : "p";

  return (
    <Comp
      data-slot="text"
      className={cn(
        textVariants({ variant, size, color, clamp, weight, bold }),
        customStyles
      )}
      {...props}
    />
  );
}

const labelVariants = cva("", {
  variants: {
    size: sizeVariants,
    color: colorVariants,
    weight: weightVariants,
  },
});

type LabelProps = React.ComponentProps<"label"> &
  VariantProps<typeof labelVariants> & {
    asChild?: boolean;
    customStyles?: string;
  };

function Label({
  size,
  color,
  weight,
  asChild = false,
  customStyles,
  ...props
}: LabelProps) {
  const Comp = asChild ? Slot : "label";
  return (
    <Comp
      data-slot="label"
      className={cn(labelVariants({ size, color, weight }), customStyles)}
      {...props}
    />
  );
}

const blockquoteVariants = cva(
  "mt-6 border-l-2 pl-6 italic text-muted-foreground"
);

type BlockquoteProps = React.ComponentProps<"blockquote"> & {
  asChild?: boolean;
  /**
   * Bruk `customStyles` kun når du trenger å gå utenfor design-systemet.
   */
  customStyles?: string;
};

function Blockquote({
  asChild = false,
  customStyles,
  ...props
}: BlockquoteProps) {
  const Comp = asChild ? Slot : "blockquote";

  return (
    <Comp
      data-slot="blockquote"
      className={cn(blockquoteVariants(), customStyles)}
      {...props}
    />
  );
}

const codeVariants = cva(
  "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold"
);

type CodeProps = React.ComponentProps<"code"> & {
  asChild?: boolean;
  /**
   * Bruk `customStyles` kun når du trenger å gå utenfor design-systemet.
   */
  customStyles?: string;
};

function Code({ asChild = false, customStyles, ...props }: CodeProps) {
  const Comp = asChild ? Slot : "code";

  return (
    <Comp
      data-slot="code"
      className={cn(codeVariants(), customStyles)}
      {...props}
    />
  );
}

const listVariants = cva("my-2 ml-6 [&>li]:mt-2", {
  variants: {
    size: sizeVariants,
    variant: {
      unordered: "list-disc",
      ordered: "list-decimal",
    },
  },
  defaultVariants: {
    variant: "unordered",
  },
});

type ListProps = React.HTMLAttributes<HTMLUListElement | HTMLOListElement> &
  VariantProps<typeof listVariants> & {
    asChild?: boolean;
    /**
     * Bruk `customStyles` kun når du trenger å gå utenfor design-systemet.
     */
    customStyles?: string;
  };

function List({
  variant,
  size,
  asChild = false,
  customStyles,
  ...props
}: ListProps) {
  const Comp = asChild ? Slot : variant === "ordered" ? "ol" : "ul";

  return (
    <Comp
      data-slot="list"
      className={cn(listVariants({ variant, size }), customStyles)}
      {...props}
    />
  );
}

export {
  Heading,
  headingVariants,
  Text,
  textVariants,
  Label,
  labelVariants,
  Blockquote,
  blockquoteVariants,
  Code,
  codeVariants,
  List,
  listVariants,
  sizeVariants,
  colorVariants,
  weightVariants,
};
