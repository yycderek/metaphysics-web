# liuren-web · 大六壬学习平台

大六壬起课引擎的 Web 可视化版。深色玄学风（墨底 · 朱砂 · 金），Next.js 16 + Tailwind 4 + framer-motion。

## 功能

- 🔮 **起课工具**（`/`）：选日柱 / 时支 / 月将，一键起课，输出天地盘圆盘、四课、三传链、天将六亲细断
- 🎓 **六步学习**（`/demo`）：定地盘 → 安天盘 → 排四课 → 九宗门 → 得三传 → 布天将，逐步动画演示
- 🦉 **AI 断课**（起课结果下方）：基于引擎精确起好的课式，由 deepseek-v4-flash 流式断课——总断→分述→建议；支持快捷提问（事业/感情/财运）、自由追问、思考过程折叠、课式变化自动清空对话
- 📱 响应式：移动端单列，桌面双栏

## AI 断课

- **铁律**：前端 TS 引擎先精确起课（KeShi JSON），AI 只负责解读，绝不自行起课——避免市面"AI 算命"起错课的毛病
- 流式 SSE：`/api/divine` 透传 AI 聊天补全，思考过程（`reasoning_content`）与正文（`content`）分开展示
- 断课原则内置：课名 → 三传 → 天将 → 六亲 → 旺衰 → 旬空逐层分析，追问只答追问
- **可替换 AI API**：断课面板 ⚙️ 设置支持任意 OpenAI 兼容服务（DeepSeek/通义/豆包/Kimi/智谱/硅基流动/Ollama/vLLM），配置 baseUrl / apiKey / model / temperature，localStorage 持久化；留空回退服务端默认（环境变量 `DEEPSEEK_API_KEY` / `DEEPSEEK_BASE_URL` / `DEEPSEEK_MODEL`，本地开发自动读 `~/.hermes/.env`）

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
| AI 断课 | `src/lib/prompt.ts` + `src/app/api/divine/route.ts` + `src/components/AiDuanke.tsx` | 断课提示词模板 / deepseek SSE 代理 / 对话面板 |
| 组件 | `src/components/*.tsx` | 天盘圆盘 SVG、四课卡、三传链、表单、步骤演示 |
| 页面 | `src/app/*` | 起课工具页 + 学习演示页 |

## 黄金课例

庚子日 · 午时 · 亥将 → **重审课**，三传 **巳→戌→卯**
（初传勾陈·官鬼 / 中传玄武·父母 / 末传朱雀·妻财），贵人丑·阳贵，旬空辰巳。

## 关联项目

- [liuren-py](https://github.com/yycderek/liuren-py)：起课引擎（Python），本项目的算法来源
