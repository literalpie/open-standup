import vercel from "solid-start-vercel";
import solid from "solid-start/vite";
import { defineConfig } from "vite";
import solidSvg, { SolidSVGPluginOptions } from "vite-plugin-solid-svg";

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
  plugins: [solid({ adapter: vercel({ edge: false }) }), solidSvg(svgoConfig)],
});
