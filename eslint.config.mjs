// @ts-check

import prettierRecommended from "eslint-plugin-prettier/recommended";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import tseslint from "typescript-eslint";

import eslint from "@eslint/js";

export default tseslint.config(
  {
    // config with just ignores is the replacement for `.eslintignore`
    ignores: ["build/**", "**/dist/**"]
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  prettierRecommended,
  {
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "unused-imports": unusedImports,
      "simple-import-sort": simpleImportSort
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        parserOptions: {
          projectService: true,
          allowDefaultProject: ["./src/**/*.ts", "./*.mjs"]
        }
      }
    },
    rules: {
      "no-console": 1,
      "prettier/prettier": ["error"],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/consistent-type-imports": "error",
      "import/order": "off",
      "import/extensions": "off",
      "import/prefer-default-export": "off",
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": ["warn"],
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^\\w"],
            ["^@?\\w"],
            ["^@/(utils|config|etc)"],
            ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
            ["^\\./(?=.*/)(?!/?$)", "^\\./?$"]
          ]
        }
      ],
      "simple-import-sort/exports": "error"
    }
  }
);
