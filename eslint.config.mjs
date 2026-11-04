import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Physical-direction Tailwind classes break right-to-left layouts; use logical ones
// (ms-/me-/ps-/pe-/start-/end-/text-start/text-end/rounded-s/rounded-e/border-s/border-e).
const PHYSICAL_CLASS =
  "/(^|[\\s:\"'`])-?(m[lr]|p[lr]|left|right|scroll-m[lr]|scroll-p[lr]|rounded-[lr]|rounded-[tb][lr]|border-[lr])-|(^|[\\s:\"'`])text-(left|right)($|[\\s\"'`])/";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["app/**/*.tsx", "components/**/*.tsx", "modules/**/*.tsx"],
    rules: {
      // All UI text comes from locales/ (spec §3). Strings inside {braces} are allowed for
      // non-text values such as class names; visible text must use t().
      "react/jsx-no-literals": ["error", { noStrings: false, allowedStrings: ["·", "%", "/", "—", ":"], ignoreProps: true }],
      "no-restricted-syntax": [
        "error",
        { selector: `Literal[value=${PHYSICAL_CLASS}]`, message: "Use logical direction classes (ms-/me-/ps-/pe-/start-/end-/text-start/text-end) so RTL works." },
        { selector: `TemplateElement[value.raw=${PHYSICAL_CLASS}]`, message: "Use logical direction classes (ms-/me-/ps-/pe-/start-/end-/text-start/text-end) so RTL works." },
      ],
    },
  },
  {
    // Upstream shadcn/ui primitives keep Radix's physical side animations (data-[side=left] etc.).
    files: ["components/ui/**/*.tsx"],
    rules: { "no-restricted-syntax": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Brand handoff source and HTML references, not app code.
    "Satis Branding/**",
  ]),
]);

export default eslintConfig;
