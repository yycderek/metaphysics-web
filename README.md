# metaphysics-web · 玄学占卜

一个多算法占卜网页应用，内置大六壬、小六壬、六爻、梅花易数四种起课方式。AI 负责选算法、调用引擎算课，再把推导过程和术语讲明白。界面是中式「青花 · 玄」风格，亮色和暗色都有。

## 怎么开始

```bash
npm install
npm run dev     # 打开 http://localhost:3000
```

## 怎么用

### 智能占卜

在对话框里说清楚想问的事就行：

- `看看我最近事业运势`
- `用梅花易数看明天出行，报数 3 和 7`
- `分别用当前时刻和午时各起一卦，对比一下`

AI 会自己挑算法、调用引擎起课，然后解卦。信息不够它会先问；也可以要求换时辰或参数再占一次，做对比。

- 选算法：输入框旁可以指定大六壬 / 小六壬 / 六爻 / 梅花，默认自动。
- 简略 / 详细：简略只看课盘和结论，详细会给出推导过程和逐步解读。
- 分享 / 应验：一键生成分享图；标记「应验 / 未应验」会累积你的准确率。

### 自定义你的 AI

右上角「自定义 AI API」可以填 Base URL、Model、API Key 和 Temperature，接任意 OpenAI 兼容服务（DeepSeek、通义、豆包、Kimi、智谱、Ollama 等）。留空就用服务端默认。

### 手动精确起课

点「高级用法」手动指定算法和参数：大六壬选日干 / 日支 / 时支 / 月将，小六壬填月 / 日 / 时，六爻摇卦，梅花报数。可以查看天地盘、四课、三传，回放推导，再用 AI 解读当前课盘。底部还有断课评测面板，用内置黄金题库给不同模型跑分对比。

### 侧边栏

- 术语速查：官鬼、天将、旬空这些术语即点即查，结果里也能悬停看释义。
- 历史回看：以前的占卜存在本浏览器，可以回看和删除。
- 应验复盘：按事类和算法看你的应验率和可靠性。

### 主题

右上角切换亮色 / 暗色。

## 配置与环境变量

AI 配置的优先级：前端面板自定义 > 环境变量 > 内置默认（DeepSeek，`https://api.deepseek.com`，模型 `deepseek-v4-flash`）。

- `AI_API_KEY` / `AI_BASE_URL` / `AI_MODEL`：服务端 AI 配置（兼容旧名 `DEEPSEEK_API_KEY` / `DEEPSEEK_BASE_URL` / `DEEPSEEK_MODEL`）。
- `~/.hermes/.env`：API key 的兜底来源。两个环境变量都没设时，服务端会读这个文件里的 `AI_API_KEY` / `DEEPSEEK_API_KEY`（仅 key，不含 baseUrl/model），方便本机开发免配环境变量。
- `ALLOW_BASE_URLS`：前端自定义 Base URL 的允许名单，逗号分隔（如 `https://api.deepseek.com,https://api.moonshot.cn`），按 origin 严格匹配。未配置时仅放行内置默认的 DeepSeek 地址；一旦配置，默认地址不再隐式放行，需要时得一并列进名单。不在名单内的自定义 Base URL 会被接口拒绝（403）。
- `APP_API_KEY`：配置后所有 AI 接口要求请求头 `x-api-key` 与之匹配，否则 401。

安全约定：前端一旦自定义 Base URL，服务端不会用环境变量里的 key 兜底（防 SSRF 携带服务端凭证），必须由用户自带 API Key。

## 开发脚本（贡献者）

```bash
npm run dev          # 本地运行
npm test             # vitest 测试（181 项）
npm run typecheck    # 类型检查
npm run lint         # ESLint
npm run format       # Prettier
npm run build        # 生产构建
```

质量门禁：tsc + eslint + prettier --check + vitest + next build 全部通过。
