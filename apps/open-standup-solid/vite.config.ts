import vercel from "solid-start-vercel";
import solid from "solid-start/vite";
import { defineConfig } from "vite";

export default defineConfig({
  envPrefix: "VITE_",
  plugins: [solid({ adapter: vercel({ edge: false }) })],
});

// change
