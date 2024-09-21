// import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import solid from "eslint-plugin-solid/configs/typescript";
import { base } from "../../eslint.config.mjs";
import globals from "globals";

export default tseslint.config(
  ...base,
  { files: ["**/*.cjs"], languageOptions: { globals: globals.node } },
  { ignores: [".vercel/**", ".vinxi/**", "postcss.config.cjs"] },
  {
    ...solid,
    languageOptions: {
      parser: tseslint.parser,
    },
  },
);
