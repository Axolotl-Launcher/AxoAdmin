import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

// components/ui 是 shadcn 生成的 primitive，重新生成时会被覆盖，
// 因此不对它们套用项目自己的严格规则（chart.tsx 中有两处 any）。
const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["components/ui/**/*.{ts,tsx}"],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
];

export default eslintConfig;
