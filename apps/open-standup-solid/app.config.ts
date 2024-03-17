import { defineConfig } from "@solidjs/start/config";
import solidSvg, { SolidSVGPluginOptions } from "vite-plugin-solid-svg";
import tsconfigPaths from "vite-tsconfig-paths";

const svgoConfig: SolidSVGPluginOptions = {
  svgo: {
    enabled: true,
    svgoConfig: {
      plugins: [
        "preset-default",
        {
          name: "addClassesToSVGElement",
          params: {
            classNames: ["w-6", "h-6", "fill-base-content"],
          },
        },
      ],
    },
  },
};

export default defineConfig({
  vite: {
    plugins: [solidSvg(svgoConfig), tsconfigPaths()],
  },
  server: {
    preset: "vercel",
  },
});
