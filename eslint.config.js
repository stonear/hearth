import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import ts from "typescript-eslint";

export default [
  { ignores: [".svelte-kit/**", "build/**", "node_modules/**", "coverage/**"] },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  {
    files: ["**/*.{js,cjs,mjs,ts,svelte}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.serviceworker,
      },
    },
  },
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parserOptions: { parser: ts.parser, extraFileExtensions: [".svelte"] },
    },
  },
  prettier,
];
