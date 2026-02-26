import { defineConfig } from "@react-foundry/cli";

export default defineConfig({
  previews: "src/components/**/*.preview.tsx",
  port: 5173,
  title: "Demo Components",
  theme: {
    colors: {
      dark: { brand: "50% 0.3 270" }, // purple-ish
      light: { brand: "50% 0.3 270" },
    },
  },
});
