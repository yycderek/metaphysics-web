import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  eslintConfigPrettier,
  {
    ignores: [".next/**", "out/**", "node_modules/**", "next-env.d.ts", "*.tsbuildinfo"],
    rules: {
      // 本应用大量使用「挂载 effect 中读取 localStorage/DOM 后 setState」的 hydration 同步模式
      // （主题首帧恢复、远程算法服务持久化恢复），这是 React 官方推荐的外部系统同步方式，
      // 该新规则在此场景频繁误报，故关闭。
      "react-hooks/set-state-in-effect": "off",
      // 统一约定：用 `_` 前缀标记故意的未使用参数/变量（如算法方法签名、fetch mock）。
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];

export default eslintConfig;
