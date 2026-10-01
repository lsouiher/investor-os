import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Interface text lives in locales/{en,fr}.json, not in JSX. A warning while the remaining
    // literals are moved; it becomes an error at the end of Sprint 2 (004-french-language, T047).
    files: ["**/*.tsx"],
    rules: {
      "react/jsx-no-literals": [
        "warn",
        {
          noStrings: true,
          ignoreProps: true,
          // Punctuation, symbols and the brand name read the same in every language
          allowedStrings: [
            "InvestorOS",
            "#", "%", "(", ")", "*", ".", "/", ":", "~", "--",
            "/100", "/ 100",
            "·", "×", "›", "→", "&larr;", "🔒",
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
