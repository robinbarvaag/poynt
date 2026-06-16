import type { Decorator, Preview } from "@storybook/react-vite";
import "./styles.css";

const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as string) ?? "light";
  return (
    <div
      className={theme === "dark" ? "dark" : ""}
      style={{
        background: "var(--background)",
        color: "var(--foreground)",
        fontFamily: "var(--font-sans)",
        padding: "2.5rem",
        minHeight: "100vh",
      }}
    >
      <Story />
    </div>
  );
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Lyst eller mørkt tema",
      defaultValue: "light",
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
  decorators: [withTheme],
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    a11y: { test: "todo" },
  },
};

export default preview;
