# 算法插件开发指南（liuren-web 阶段4）

平台支持两种方式接入自定义算法：**本地插件**（TypeScript，随前端打包）和**远程算法服务**（任意语言 HTTP 端点）。两种方式实现同一个 `AlgorithmAdapter` 接口，接入后起课表单的「算法」下拉自动出现，推导模式自动渲染（未知步骤回退通用 JSON 树）。

## 接口定义（src/lib/algorithms/types.ts）

```ts
interface AlgorithmInput { [key: string]: string | number | undefined }

interface StepResult {
  key: string;   // 步骤唯一标识，如 'yue' / 'tian'
  title: string; // 展示标题，如 '一、大安起月'
  desc: string;  // 步骤说明
  data: unknown; // 步骤中间数据（推导模式展示；无专属视图时渲染为 JSON 树）
}

interface DivinationResult {
  algorithmId: string;   // 唯一 id，如 'xiaoliuren'
  algorithmName: string; // 展示名
  input: AlgorithmInput; // 实际生效的输入
  steps: StepResult[];   // 推导过程（可为空数组）
  raw: unknown;          // 算法特有结果（结果模式展示；大六壬 = KeShi）
}

interface AlgorithmAdapter {
  id: string;
  name: string;
  description: string;
  parseInput?(input: AlgorithmInput): AlgorithmInput | null; // 校验，不合法返回 null
  build(input: AlgorithmInput): DivinationResult | Promise<DivinationResult>;
}
```

完成后调用 `registerAdapter(adapter)`（见 `src/lib/algorithms/registry.ts`）。

## 方式一：本地插件

1. 在 `src/plugins/` 下新建适配器文件（参考 `src/plugins/examples/xiaoliuren.ts`，一个完整可运行的小六壬实现）
2. 在 `src/plugins/index.ts` 中 import 并 `registerAdapter(yourAdapter)`
3. 保存后刷新页面，「算法」下拉即出现

局限：代码随前端打包执行，适合轻量规则；不想暴露源码或计算量大时用方式二。

## 方式二：远程算法服务（推荐）

页面「🔌 远程算法服务」面板配置名称 + URL 即可，无需改代码。协议：

```
POST <your-url>
Content-Type: application/json
Body: { "input": <AlgorithmInput 对象> }

200 OK
{ "algorithmId": "xiaoliuren", "algorithmName": "小六壬",
  "input": {...}, "steps": [...], "raw": {...} }
```

- `steps` 可省略为空数组 `[]`（平台显示"该算法无推导过程"）
- 超时 15 秒；非 200 / 非 JSON / 结构不合法会给出明确错误
- CORS：如浏览器直连远程服务需允许跨域（加 `Access-Control-Allow-Origin: *`）；生产环境建议由服务端代理

### Python 示例（标准库，零依赖）

```python
#!/usr/bin/env python3
# 小六壬远程算法服务示例：python3 xiaoliuren_server.py  然后页面配置 http://127.0.0.1:8000
import json
from http.server import BaseHTTPRequestHandler, HTTPServer

PALMS = ["大安", "留连", "速喜", "赤口", "小吉", "空亡"]
MEANING = {"大安": "平安顺遂", "留连": "事难成宜缓", "速喜": "喜事临门", "赤口": "口舌是非", "小吉": "凡事和合", "空亡": "谋事落空"}
AUSPICIOUS = {"大安": "吉", "留连": "凶", "速喜": "吉", "赤口": "凶", "小吉": "吉", "空亡": "凶"}

def count_from(start, count):
    return (start + count - 1) % 6

def divine(inp):
    month, day, hour = int(inp["month"]), int(inp["day"]), int(inp["hour"])
    yue = count_from(0, month)
    ri = count_from(yue, day)
    shi = count_from(ri, hour)
    palm = PALMS[shi]
    return {
        "algorithmId": "xiaoliuren",
        "algorithmName": "小六壬",
        "input": {"month": month, "day": day, "hour": hour},
        "steps": [
            {"key": "yue", "title": "一、大安起月", "desc": f"顺数 {month} 个月，落{PALMS[yue]}。", "data": {"from": "大安", "count": month, "landed": PALMS[yue]}},
            {"key": "ri", "title": "二、月上起日", "desc": f"顺数 {day} 天，落{PALMS[ri]}。", "data": {"from": PALMS[yue], "count": day, "landed": PALMS[ri]}},
            {"key": "shi", "title": "三、日上起时", "desc": f"顺数 {hour} 个时辰，落{palm}。", "data": {"from": PALMS[ri], "count": hour, "landed": palm}},
        ],
        "raw": {"palm": palm, "auspicious": AUSPICIOUS[palm], "meaning": MEANING[palm]},
    }

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length) or b"{}")
        try:
            result = divine(body.get("input") or {})
            payload = json.dumps(result, ensure_ascii=False).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        except Exception as e:
            payload = json.dumps({"error": str(e)}, ensure_ascii=False).encode()
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, *args):
        pass

if __name__ == "__main__":
    print("小六壬服务已启动: http://127.0.0.1:8000")
    HTTPServer(("127.0.0.1", 8000), Handler).serve_forever()
```

## 验证

- 本地插件：`npx vitest run src/lib/plugins.test.ts`（若为插件加了测试）
- 远程服务：配置后起一课，观察「推导过程」模式；或直接 `curl -X POST http://127.0.0.1:8000 -H 'Content-Type: application/json' -d '{"input":{"month":3,"day":18,"hour":7}}'`
- 注意：大六壬展示视图（天盘圆盘/四课/三传）是专属的，新算法默认走通用 JSON 树；想加专属视图，在 `src/lib/algorithms/stepViews.ts` 扩展分发并参考 `src/components/StepRenderer.tsx` 的 `DaliurenStepView`
