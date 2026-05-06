import { FlatCompat } from "@eslint/eslintrc";
import path from "path";
import { fileURLToPath } from "url";
import cssModules from "eslint-plugin-css-modules";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [".next/**", "node_modules/**"]
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "css-modules": cssModules
    },
    rules: {
      ...cssModules.configs.recommended.rules,
      "css-modules/no-unused-class": "warn",
      "css-modules/no-undef-class": "error"
    }
  }
];

export default config;
