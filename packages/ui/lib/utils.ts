import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

export { cva, type VariantProps } from "class-variance-authority";

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "heading-one-desktop",
            "heading-one-mobile",
            "heading-two-desktop",
            "heading-two-mobile",
            "heading-three-desktop",
            "heading-three-mobile",
            "heading-four-desktop",
            "heading-four-mobile",
            "heading-three-special-desktop",
            "heading-three-special-mobile",
            "body-heading-desktop",
            "body-heading-mobile",
            "body-desktop",
            "body-mobile",
            "body-small-desktop",
            "body-small-mobile",
            "body-detail-desktop",
            "body-detail-mobile",
            "font-heading",
            "font-bold"
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
