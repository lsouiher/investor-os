import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Interface text lives in locales/{en,fr}.json, not in JSX (004-french-language, FR-1.13)
    files: ["**/*.tsx"],
    rules: {
      "react/jsx-no-literals": [
        "error",
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
  {
    // The terms are one page of legal prose, English only until the French version is written
    // as its own component (004-french-language, T072). Remove this exemption then.
    files: ["app/terms/page.tsx"],
    rules: { "react/jsx-no-literals": "off" },
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
