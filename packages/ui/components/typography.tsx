import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@poynt/ui";

const sizeVariants = {
  h1: "text-heading-one-mobile md:text-heading-one-desktop",
  h2: "text-heading-two-mobile md:text-heading-two-desktop",
  h3: "text-heading-three-mobile md:text-heading-three-desktop",
  h4: "text-heading-four-mobile md:text-heading-four-desktop",
  "h4-fixed": "text-heading-four-desktop md:text-heading-four-desktop",
  "h3-special":
    "text-heading-three-special-mobile md:text-heading-three-special-desktop",
  "body-heading": "text-body-heading-mobile md:text-body-heading-desktop",
  body: "text-body-mobile md:text-body-desktop",
  "body-small": "text-body-small-mobile md:text-body-small-desktop",
  "body-detail": "text-body-detail-mobile md:text-body-detail-desktop",
  "h1-fixed": "text-heading-one-desktop md:text-heading-one-desktop",
  "h2-fixed": "text-heading-two-desktop md:text-heading-two-desktop",
  "h3-fixed": "text-heading-three-desktop md:text-heading-three-desktop",
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
  danger: "text-destructive",
  success: "text-green-600",
} as const;

const weightVariants = {
  light: "font-light",
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
  extrabold: "font-extrabold",
} as const;

const clampLines = {
  none: "",
  sm: "overflow-hidden overflow-ellipsis line-clamp-3",
  md: "overflow-hidden overflow-ellipsis line-clamp-6",
  lg: "overflow-hidden overflow-ellipsis line-clamp-12",
};

const headingVariants = cva("scroll-m-20 text-balance font-heading", {
  variants: {
    variant: {
      h1: "text-heading-one-mobile md:text-heading-one-desktop font-bold text-primary",
      h2: "text-heading-two-mobile md:text-heading-two-desktop font-bold text-primary first:mt-0",
      h3: "text-heading-three-mobile md:text-heading-three-desktop font-semibold",
      h4: "text-heading-four-mobile md:text-heading-four-desktop font-sans font-semibold",
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
  color = "primary",
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
      true: "font-bold",
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
    type?: "p" | "span" | "div";
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
  type = "p",
  variant,
  size,
  color = "foreground",
  weight,
  asChild = false,
  bold,
  customStyles,
  clamp,
  className: _className,
  ...props
}: TextProps) {
  const Comp = asChild ? Slot : type;

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
