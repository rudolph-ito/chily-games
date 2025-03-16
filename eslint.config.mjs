import { globalIgnores } from "eslint/config";
import eslint from "@eslint/js";
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    importPlugin.flatConfigs.typescript,
    eslintConfigPrettier,
    {
        languageOptions: {
            ecmaVersion: 5,
            sourceType: "commonjs",

            parserOptions: {
                project: "./tsconfig.json",
            },
        },

        rules: {
            "@typescript-eslint/no-empty-function": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-inferrable-types": "off",

            "@typescript-eslint/no-unused-vars": ["error", {
                argsIgnorePattern: "^_",
            }],
        },
    },
    globalIgnores(["api/dist/**/*", "frontend/.angular/**/*"])
);