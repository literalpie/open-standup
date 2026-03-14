import { defineConfig } from "vite";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";
import solidSvg, { SolidSVGPluginOptions } from "vite-plugin-solid-svg";
import tsconfigPaths from "vite-tsconfig-paths";
import { solidStart } from "@solidjs/start/config";

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
  plugins: [
    solidStart(),
    nitro(),
    tailwindcss(),
    solidSvg(svgoConfig),
    tsconfigPaths(),
  ],
});
