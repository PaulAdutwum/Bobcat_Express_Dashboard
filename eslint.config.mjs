import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Define the ESLint configuration properly
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

// Add custom rules
eslintConfig.push({
  rules: {
    "@typescript-eslint/no-unused-vars": "warn",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/prefer-as-const": "off",
    "no-console": "off",
  },
  eslint: {
    ignoreDuringBuilds: true, // Make sure builds don't fail due to ESLint errors
  },
});

export default eslintConfig;