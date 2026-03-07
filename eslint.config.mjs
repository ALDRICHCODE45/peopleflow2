import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Guard against re-introducing magic error strings
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: [
      "**/constants/error-messages.ts",
      "**/route-permission-guard.ts",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value='No autenticado']",
          message:
            "Use ServerErrors.notAuthenticated from @core/shared/constants/error-messages instead of magic strings.",
        },
        {
          selector: "Literal[value='No hay tenant activo']",
          message:
            "Use ServerErrors.noActiveTenant from @core/shared/constants/error-messages instead of magic strings.",
        },
      ],
    },
  },
]);

export default eslintConfig;
