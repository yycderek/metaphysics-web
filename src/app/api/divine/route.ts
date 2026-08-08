// API route：断课 → deepseek chat completions（SSE 流式）
// 铁律：前端已用 TS 引擎起好课（KeShi JSON 随请求传入），本路由只负责解读，不自行起课
import { NextRequest } from 'next/server'
import { readFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { buildDivineMessages } from '@/lib/prompt'
import type { KeShi } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}

interface DivineRequestBody {
  ks: KeShi
  question: string
  season: '春' | '夏' | '秋' | '冬' | '四季'
  history?: ChatMsg[] // 追问历史（不含本轮）
}

/** 读取 deepseek key：环境变量 → ~/.hermes/.env → ~/.hermes/config.yaml */
function getApiKey(): string {
  if (process.env.DEEPSEEK_API_KEY) return process.env.DEEPSEEK_API_KEY
  try {
    // ~/.hermes/.env（API keys only）
    const envPath = join(homedir(), '.hermes', '.env')
    if (existsSync(envPath)) {
      const content = readFileSync(envPath, 'utf-8')
      const m = content.match(/^DEEPSEEK_API_KEY\s*=\s*["']?([^"'\n]+)/m)
      if (m) return m[1].trim()
    }
    // config.yaml 兜底
    const cfgPath = join(homedir(), '.hermes', 'config.yaml')
    if (existsSync(cfgPath)) {
      const yaml = readFileSync(cfgPath, 'utf-8')
      const m = yaml.match(/api_key:\s*([A-Za-z0-9_\-]+)/)
      if (m) return m[1]
    }
  } catch {
    /* ignore */
  }
  throw new Error('DEEPSEEK_API_KEY 未配置（环境变量 / ~/.hermes/.env / config.yaml）')
}

const DEEPSEEK_BASE = process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com'
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL ?? 'deepseek-v4-flash'

export async function POST(req: NextRequest) {
  let body: DivineRequestBody
  try {
    body = (await req.json()) as DivineRequestBody
  } catch {
    return Response.json({ error: '请求体不是合法 JSON' }, { status: 400 })
  }

  const { ks, question, season, history } = body
  if (!ks?.sanchuan?.length || !question?.trim()) {
    return Response.json({ error: '缺少课式或问题' }, { status: 400 })
  }
  if (!['春', '夏', '秋', '冬', '四季'].includes(season)) {
    return Response.json({ error: '季节参数非法' }, { status: 400 })
  }

  let apiKey: string
  try {
    apiKey = getApiKey()
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 })
  }

  const base = buildDivineMessages(ks, { question, season })
  const historyMsgs: ChatMsg[] = (history ?? []).slice(-8) // 最多保留最近 8 轮追问
  const messages = [
    ...base.slice(0, 1), // system
    ...historyMsgs.map((h) => ({ role: h.role, content: h.content })),
    ...base.slice(1), // 课式上下文 + 本轮问题
  ]

  try {
    const upstream = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 8192,
      }),
    })

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '')
      return Response.json(
        { error: `deepseek 上游错误 ${upstream.status}: ${errText.slice(0, 200)}` },
        { status: 502 },
      )
    }

    // 透传 SSE 流
    const reader = upstream.body?.getReader()
    if (!reader) {
      return Response.json({ error: '上游无响应体' }, { status: 502 })
    }

    const stream = new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            controller.enqueue(decoder.decode(value, { stream: true }))
          }
        } catch (e) {
          controller.error(e)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (e) {
    return Response.json({ error: `请求 deepseek 失败: ${(e as Error).message}` }, { status: 502 })
  }
}
