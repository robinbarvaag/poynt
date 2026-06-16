import type { StorybookConfig } from "@storybook/react-vite";
import tailwindcss from "@tailwindcss/vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.mdx", "../stories/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (cfg) => {
    cfg.plugins = cfg.plugins ?? [];
    cfg.plugins.push(tailwindcss());
    // Tving én React-instans. Uten dette kan workspace-pakker dra inn en
    // annen React-kopi → "Cannot read properties of null (reading 'useRef')"
    // i Radix-komponenter (accordion m.fl.).
    cfg.resolve = cfg.resolve ?? {};
    cfg.resolve.dedupe = [...(cfg.resolve.dedupe ?? []), "react", "react-dom"];
    return cfg;
  },
};

export default config;
