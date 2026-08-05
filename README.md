# liuren-web · 大六壬学习平台

大六壬起课引擎的 Web 可视化版。深色玄学风（墨底 · 朱砂 · 金），Next.js 16 + Tailwind 4 + framer-motion。

## 功能

- 🔮 **起课工具**（`/`）：选日柱 / 时支 / 月将，一键起课，输出天地盘圆盘、四课、三传链、天将六亲细断
- 🎓 **六步学习**（`/demo`）：定地盘 → 安天盘 → 排四课 → 九宗门 → 得三传 → 布天将，逐步动画演示
- 📱 响应式：移动端单列，桌面双栏

## 开发

```bash
npm install
npm run dev       # http://localhost:3000
npm test          # vitest 黄金课例（13 项）
npm run build     # 生产构建
```

## 架构

| 层 | 文件 | 说明 |
|---|---|---|
| 数据 | `src/lib/data.json` | 由 liuren-py `scripts/export_data.py` 导出，勿手改 |
| 算法 | `src/lib/*.ts` | 天地盘 / 四课 / 九宗门 / 天将 / 六亲，与 liuren-py 同源 |
| 组件 | `src/components/*.tsx` | 天盘圆盘 SVG、四课卡、三传链、表单、步骤演示 |
| 页面 | `src/app/*` | 起课工具页 + 学习演示页 |

## 黄金课例

庚子日 · 午时 · 亥将 → **重审课**，三传 **巳→戌→卯**
（初传勾陈·官鬼 / 中传玄武·父母 / 末传朱雀·妻财），贵人丑·阳贵，旬空辰巳。

## 关联项目

- [liuren-py](https://github.com/yycderek/liuren-py)：起课引擎（Python），本项目的算法来源
