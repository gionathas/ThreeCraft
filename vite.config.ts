import { defineConfig } from "vite";
import circleDependency from "vite-plugin-circular-dependency";

export default defineConfig({
  plugins: [circleDependency({})],
});
