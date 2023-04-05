import { defineConfig } from "vite";
import circleDependency from "vite-plugin-circular-dependency";

export default defineConfig({
  assetsInclude: ["**/*.ogg"],
  build: {
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        assetFileNames: "assets/[name].[ext]",
      },
    },
  },
  plugins: [circleDependency({})],
});
