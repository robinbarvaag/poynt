import type { Decorator, Preview } from "@storybook/react-vite";
import { useEffect } from "react";
import "./styles.css";

// Tema settes som klasse på <html> (ikke en wrapper-div). En wrapper med fast
// høyde/padding kolliderer med per-story `layout`-parameteren (gjorde at
// `layout: centered`-stories krympet til en smal stripe). Bakgrunn/farge kommer
// fra body i styles.css og følger .dark-klassen.
const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as string) ?? "light";
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  return <Story />;
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Lyst eller mørkt tema",
      toolbar: {
        title: "Tema",
        icon: "paintbrush",
        items: [
          { value: "light", title: "Lyst", icon: "sun" },
          { value: "dark", title: "Mørkt", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "light" },
  decorators: [withTheme],
  parameters: {
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    a11y: { test: "todo" },
  },
};

export default preview;
