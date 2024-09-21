import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export const base = tseslint.config(
  {
    ignores: ["**/.eslintrc.*", "**/tailwind.config.js"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
);

export default tseslint.config(...base, {
  ignores: ["apps/open-standup-solid"],
});
