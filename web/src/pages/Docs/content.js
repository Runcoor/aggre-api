/*
 * Docs content tree — bilingual (zh/en).
 *
 * Each doc has: title, desc, sections[].
 * Block types:
 *   { type: 'h2', text }
 *   { type: 'h3', text }
 *   { type: 'p', text }
 *   { type: 'list', items: [...] }
 *   { type: 'table', headers: [...], rows: [[...]] }
 *   { type: 'code', lang: 'python'|'node'|'curl'|'json', code }
 *   { type: 'tabs', tabs: [{ label, lang, code }] }
 *   { type: 'callout', kind: 'info'|'warn'|'tip', text }
 *   { type: 'cards', items: [{ title, desc, badge? }] }
 *   { type: 'metrics', items: [{ label, value, sub }] }
 */

const zh = {
  'getting-started': {
    title: '快速开始',
    badge: '入门指南',
    desc: '三分钟接入本网关，复用现有 OpenAI / Anthropic / Gemini 官方 SDK，无需修改任何业务代码。',
    sections: [
      { type: 'h2', text: '前置要求' },
      {
        type: 'list',
        items: [
          '已注册账号并开通开发者权限',
          '已生成至少一个 API Key',
          '本地准备 Python 3.8+ 或 Node.js 18+ 开发环境',
          '熟悉 HTTP 请求与 JSON 数据格式',
        ],
      },
      { type: 'h2', text: '三种接入协议' },
      {
        type: 'p',
        text: '本网关同时兼容三大主流协议，所有协议共享同一个 API Key。你可以根据团队习惯任选其一，也可以在不同业务里混用。',
      },
      {
        type: 'cards',
        items: [
          { title: 'OpenAI 兼容', badge: '推荐', desc: '使用 OpenAI 官方 SDK，兼容 chat completions、embeddings、images 等全部端点。' },
          { title: 'Anthropic 原生', desc: '使用 Anthropic 官方 SDK 直连 Claude，享受 Messages API 完整能力。' },
          { title: 'Gemini 原生', desc: '兼容 Google GenAI SDK，支持 generateContent 与 streamGenerateContent。' },
        ],
      },
      { type: 'h2', text: '第一次调用' },
      { type: 'p', text: '下面是用 Python OpenAI SDK 完成的最短调用示例，三行配置即可跑通。' },
      {
        type: 'tabs',
        tabs: [
          {
            label: 'Python',
            lang: 'python',
            code: `from openai import OpenAI

client = OpenAI(
    api_key="sk-xxx",
    base_url="https://your-domain/v1",
)

resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "你好"}],
)
print(resp.choices[0].message.content)`,
          },
          {
            label: 'Node.js',
            lang: 'javascript',
            code: `import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: 'https://your-domain/v1',
});

const resp = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: '你好' }],
});
console.log(resp.choices[0].message.content);`,
          },
          {
            label: 'cURL',
            lang: 'bash',
            code: `curl https://your-domain/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $API_KEY" \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "你好"}]
  }'`,
          },
        ],
      },
      { type: 'h2', text: '下一步' },
      {
        type: 'cards',
        items: [
          { title: '认证指南', desc: '了解 API Key 的鉴权方式与安全实践。' },
          { title: '模型目录', desc: '查看所有可用模型与定价信息。' },
          { title: '流式响应', desc: '启用 streaming 提升交互体验。' },
          { title: '函数调用', desc: '让模型自主调用你的工具函数。' },
        ],
      },
    ],
  },

  auth: {
    title: '认证指南',
    badge: '基础概念',
    desc: '所有 API 请求都通过 API Key 鉴权。本章介绍三种协议的鉴权方式与生产环境的密钥管理实践。',
    sections: [
      { type: 'h2', text: '获取 API Key' },
      {
        type: 'list',
        items: [
          '登录控制台进入「令牌管理」',
          '点击「创建令牌」按钮',
          '设置令牌名称、有效期、额度上限与允许的模型',
          '复制并保存生成的密钥（仅显示一次）',
        ],
      },
      { type: 'callout', kind: 'warn', text: 'API Key 仅在创建时完整显示一次，请立即保存到密码管理器或环境变量中。丢失后只能重新生成。' },
      { type: 'h2', text: '三种协议的鉴权 Header' },
      {
        type: 'table',
        headers: ['协议', 'Header', '示例'],
        rows: [
          ['OpenAI 兼容', 'Authorization', 'Authorization: Bearer sk-xxx'],
          ['Anthropic 原生', 'x-api-key', 'x-api-key: sk-xxx'],
          ['Gemini 原生', 'x-goog-api-key', 'x-goog-api-key: sk-xxx'],
        ],
      },
      { type: 'h2', text: '使用环境变量' },
      { type: 'p', text: '永远不要把 API Key 硬编码在代码里。推荐使用 .env 文件或操作系统环境变量加载。' },
      {
        type: 'code',
        lang: 'bash',
        code: `# .env
API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
API_BASE_URL=https://your-domain/v1`,
      },
      {
        type: 'code',
        lang: 'python',
        code: `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["API_KEY"],
    base_url=os.environ["API_BASE_URL"],
)`,
      },
      { type: 'h2', text: '安全最佳实践' },
      {
        type: 'list',
        items: [
          '永不将 Key 提交到 Git 仓库（使用 .gitignore 排除 .env）',
          '前端应用不应直接持有 Key，必须通过自己的后端代理',
          '为不同环境（开发 / 预发 / 生产）使用不同的 Key',
          '定期轮换密钥，建议至少每 90 天一次',
          '为每个项目或团队成员独立创建 Key，便于追溯',
          '在控制台中为 Key 设置严格的额度上限与允许的模型范围',
        ],
      },
    ],
  },

  models: {
    title: '模型目录',
    badge: '基础概念',
    desc: '本网关聚合了 100+ 主流大模型，统一通过 OpenAI 协议调用。本章介绍模型命名规范、能力分类与查询方式。',
    sections: [
      { type: 'h2', text: '模型命名规范' },
      { type: 'p', text: '模型 ID 采用 provider/model-name 的格式，方便识别归属。请求时直接将完整 ID 传给 model 字段。' },
      {
        type: 'code',
        lang: 'python',
        code: `# 示例
model="gpt-4o"
model="claude-sonnet-4.5"
model="gemini-2.5-pro"
model="deepseek-chat"`,
      },
      { type: 'h2', text: '按能力分类' },
      {
        type: 'cards',
        items: [
          { title: '通用对话', desc: 'GPT-4o, Claude Sonnet, Gemini Pro — 适合大部分对话与生成场景。' },
          { title: '代码生成', desc: 'Claude Sonnet, DeepSeek Coder, Qwen Coder — 在编程任务上表现最佳。' },
          { title: '推理能力', desc: 'o3, DeepSeek R1, Claude Opus — 复杂推理与长链路任务。' },
          { title: '视觉理解', desc: 'GPT-4o, Claude Sonnet, Gemini Pro — 支持图像输入。' },
          { title: '高性价比', desc: 'GPT-4o-mini, Gemini Flash, Qwen Turbo — 大批量低成本场景。' },
          { title: 'Embeddings', desc: 'text-embedding-3-large, BGE-M3 — 向量检索与 RAG。' },
        ],
      },
      { type: 'h2', text: '查询模型列表' },
      { type: 'p', text: '通过 /v1/models 端点可获取所有可用模型的完整元数据，包括定价、上下文长度、支持的参数等。该端点无需鉴权。' },
      {
        type: 'tabs',
        tabs: [
          {
            label: 'cURL',
            lang: 'bash',
            code: `curl https://your-domain/v1/models`,
          },
          {
            label: 'Python',
            lang: 'python',
            code: `from openai import OpenAI

client = OpenAI(base_url="https://your-domain/v1", api_key="sk-xxx")
models = client.models.list()
for m in models.data:
    print(m.id)`,
          },
        ],
      },
      { type: 'h2', text: '响应字段说明' },
      {
        type: 'table',
        headers: ['字段', '类型', '说明'],
        rows: [
          ['id', 'string', '请求时使用的模型标识符'],
          ['created', 'number', '模型上架时间（Unix 时间戳）'],
          ['context_length', 'number', '最大上下文窗口（token 数）'],
          ['pricing.prompt', 'string', '输入 token 单价（美元 / token）'],
          ['pricing.completion', 'string', '输出 token 单价'],
          ['supported_parameters', 'array', '支持的 OpenAI 参数列表'],
        ],
      },
      { type: 'callout', kind: 'tip', text: '不同模型的分词方式不同，相同输入产生的 token 数量也不同。请使用响应中的 usage 字段获取准确的消耗。' },
    ],
  },

  'guides/streaming': {
    title: '流式响应',
    badge: '进阶指南',
    desc: '通过 SSE（Server-Sent Events）实时接收模型生成的内容，显著降低首字延迟，适合聊天与代码补全等交互场景。',
    sections: [
      { type: 'h2', text: '工作原理' },
      { type: 'p', text: '客户端在请求中设置 stream=true 后，服务器会通过 SSE 协议持续推送内容片段（delta），每个数据块以 data: 前缀开始，最后以 data: [DONE] 结束。OpenAI SDK 已封装好迭代器，开发者只需 for-loop 即可。' },
      { type: 'h2', text: '基础示例' },
      {
        type: 'tabs',
        tabs: [
          {
            label: 'Python',
            lang: 'python',
            code: `from openai import OpenAI

client = OpenAI(base_url="https://your-domain/v1", api_key="sk-xxx")

stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "写一首关于编程的诗"}],
    stream=True,
)

for chunk in stream:
    delta = chunk.choices[0].delta.content
    if delta:
        print(delta, end="", flush=True)`,
          },
          {
            label: 'Node.js',
            lang: 'javascript',
            code: `import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://your-domain/v1',
  apiKey: process.env.API_KEY,
});

const stream = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: '写一首关于编程的诗' }],
  stream: true,
});

for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content;
  if (delta) process.stdout.write(delta);
}`,
          },
          {
            label: 'cURL',
            lang: 'bash',
            code: `curl https://your-domain/v1/chat/completions \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "你好"}],
    "stream": true
  }' --no-buffer`,
          },
        ],
      },
      { type: 'h2', text: 'SSE 数据格式' },
      { type: 'p', text: '每个 data 行都是一个独立的 JSON 对象。重要字段：choices[0].delta.content 是新增的文本片段，choices[0].finish_reason 在最后一个 chunk 才有值。' },
      {
        type: 'code',
        lang: 'json',
        code: `data: {"choices":[{"delta":{"content":"你"}}]}

data: {"choices":[{"delta":{"content":"好"}}]}

data: {"choices":[{"delta":{},"finish_reason":"stop"}]}

data: [DONE]`,
      },
      { type: 'h2', text: '错误处理与重连' },
      { type: 'p', text: '流式连接中断后建议实现指数退避重试。同时务必设置合理的超时（建议 120 秒以上），避免连接长时间挂起。' },
      {
        type: 'code',
        lang: 'python',
        code: `import time, random
from openai import OpenAI, APIError

def stream_with_retry(messages, max_attempts=3):
    for attempt in range(max_attempts):
        try:
            return client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                stream=True,
                timeout=120,
            )
        except APIError as e:
            if attempt == max_attempts - 1:
                raise
            wait = (2 ** attempt) + random.random()
            time.sleep(wait)`,
      },
      { type: 'h2', text: '最佳实践' },
      {
        type: 'list',
        items: [
          '总是设置 timeout 防止挂起',
          '处理可能为 None 的 delta.content',
          '前端使用 EventSource 或 fetch ReadableStream 接收',
          '在收到 [DONE] 之前累积 token，便于持久化',
          '断线后用指数退避策略重试',
        ],
      },
    ],
  },

  'guides/functions': {
    title: '函数调用',
    badge: '进阶指南',
    desc: '让模型根据对话上下文自主决定调用哪些工具函数，实现数据查询、外部 API 调用、Agent 工作流等能力。',
    sections: [
      { type: 'h2', text: '完整流程' },
      {
        type: 'list',
        items: [
          '1. 在 tools 字段中定义可用函数及其参数 schema',
          '2. 模型分析用户意图，决定是否调用工具',
          '3. 模型返回 tool_calls，包含函数名与参数',
          '4. 你的代码执行函数，把结果作为 tool 角色消息追加到对话',
          '5. 再次调用模型，由模型生成最终的自然语言回复',
        ],
      },
      { type: 'h2', text: '定义工具' },
      {
        type: 'code',
        lang: 'python',
        code: `tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "查询指定城市的当前天气",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "城市名称，例如 北京"},
                "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
            },
            "required": ["city"],
        },
    },
}]`,
      },
      { type: 'h2', text: '完整调用循环' },
      {
        type: 'code',
        lang: 'python',
        code: `import json

def get_weather(city, unit="celsius"):
    # 实际调用气象 API
    return {"city": city, "temp": 22, "unit": unit}

messages = [{"role": "user", "content": "北京今天多少度?"}]

# 第一次：让模型决策
resp = client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    tools=tools,
)
msg = resp.choices[0].message
messages.append(msg)

# 执行所有 tool_calls
if msg.tool_calls:
    for call in msg.tool_calls:
        args = json.loads(call.function.arguments)
        result = get_weather(**args)
        messages.append({
            "role": "tool",
            "tool_call_id": call.id,
            "content": json.dumps(result),
        })

    # 第二次：让模型基于工具结果生成回复
    resp = client.chat.completions.create(
        model="gpt-4o",
        messages=messages,
    )
    print(resp.choices[0].message.content)`,
      },
      { type: 'h2', text: 'tool_choice 控制' },
      {
        type: 'table',
        headers: ['取值', '行为'],
        rows: [
          ['"auto"', '默认。由模型自主决定是否调用工具'],
          ['"none"', '禁止调用任何工具，强制返回纯文本'],
          ['"required"', '强制必须调用至少一个工具'],
          ['{"type":"function","function":{"name":"x"}}', '强制调用指定的某个工具'],
        ],
      },
      { type: 'h2', text: '并行工具调用' },
      { type: 'p', text: '模型可能在一次响应中返回多个 tool_calls。生产代码应使用并发执行（asyncio.gather / Promise.all）而非顺序执行，以缩短延迟。' },
      { type: 'callout', kind: 'tip', text: '函数 description 写得越清晰、越具体，模型选择和填参的准确率就越高。建议把示例和边界条件都写进 description。' },
    ],
  },

  'guides/vision': {
    title: '视觉理解',
    badge: '进阶指南',
    desc: '向支持多模态的模型发送图片，实现 OCR、图表解读、UI 截图分析、文档理解等能力。',
    sections: [
      { type: 'h2', text: '支持的模型' },
      {
        type: 'list',
        items: [
          'GPT-4o / GPT-4o-mini —— 综合能力最强',
          'Claude Sonnet / Opus —— 长文档与代码截图',
          'Gemini Pro / Flash —— 多模态推理，支持视频',
          'Qwen-VL —— 中文场景识别',
        ],
      },
      { type: 'h2', text: '通过 URL 传图' },
      {
        type: 'code',
        lang: 'python',
        code: `resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "描述这张图片"},
            {
                "type": "image_url",
                "image_url": {"url": "https://example.com/photo.jpg"},
            },
        ],
    }],
)`,
      },
      { type: 'h2', text: '通过 Base64 传图' },
      { type: 'p', text: '本地文件或截图无法通过 URL 访问时，使用 Base64 编码内嵌到请求中。' },
      {
        type: 'code',
        lang: 'python',
        code: `import base64

with open("screenshot.png", "rb") as f:
    b64 = base64.b64encode(f.read()).decode("utf-8")

resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "这张截图里有什么 bug?"},
            {
                "type": "image_url",
                "image_url": {"url": f"data:image/png;base64,{b64}"},
            },
        ],
    }],
)`,
      },
      { type: 'h2', text: '细节级别 detail' },
      {
        type: 'table',
        headers: ['detail', '说明', '使用场景'],
        rows: [
          ['auto', '默认。由模型自动选择', '通用'],
          ['low', '降采样到 512×512，更快更便宜', '物体识别、分类'],
          ['high', '保留高分辨率，token 消耗较多', 'OCR、文档理解'],
        ],
      },
      { type: 'h2', text: '多图对比' },
      { type: 'p', text: '在 content 数组里放多个 image_url 即可一次性发送多张图，模型会理解它们之间的关系。' },
      { type: 'callout', kind: 'tip', text: '高分辨率截图会消耗大量 token。如果只需要识别物体或场景，使用 detail: "low" 可以节省约 70% 费用。' },
    ],
  },

  'guides/json': {
    title: '结构化输出',
    badge: '进阶指南',
    desc: '强制模型返回符合 JSON Schema 的结构化数据，避免脆弱的字符串解析，适合数据提取、分类、表单填充等场景。',
    sections: [
      { type: 'h2', text: '两种模式' },
      {
        type: 'cards',
        items: [
          { title: 'JSON Mode', badge: '简单', desc: '只保证返回合法 JSON，不约束字段。需要在 system prompt 里包含 "JSON" 关键词。' },
          { title: 'JSON Schema', badge: '严格', desc: '完整定义字段名、类型、必填项，模型严格按 schema 输出。推荐使用。' },
        ],
      },
      { type: 'h2', text: 'JSON Mode 示例' },
      {
        type: 'code',
        lang: 'python',
        code: `resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "你是数据提取助手，输出 JSON。"},
        {"role": "user", "content": "提取: 张三, 25 岁, 工程师"},
    ],
    response_format={"type": "json_object"},
)
import json
data = json.loads(resp.choices[0].message.content)`,
      },
      { type: 'h2', text: 'JSON Schema 示例' },
      {
        type: 'code',
        lang: 'python',
        code: `schema = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "age": {"type": "integer"},
        "occupation": {"type": "string"},
    },
    "required": ["name", "age", "occupation"],
    "additionalProperties": False,
}

resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "张三 25 岁工程师"}],
    response_format={
        "type": "json_schema",
        "json_schema": {"name": "person", "schema": schema, "strict": True},
    },
)`,
      },
      { type: 'h2', text: '常用场景' },
      {
        type: 'list',
        items: [
          '数据提取：从订单、邮件、合同中抽取关键字段',
          '情感分类：用 enum 约束标签为 positive / negative / neutral',
          '表单填充：根据用户描述自动生成结构化数据',
          'Function Calling 的 arguments 也是 JSON Schema 的应用',
        ],
      },
      { type: 'callout', kind: 'warn', text: '不是所有模型都支持 strict JSON Schema。不支持的模型可以在 system prompt 中详细描述期望格式作为补偿，但准确率会下降。' },
    ],
  },

  'guides/errors': {
    title: '错误处理',
    badge: '进阶指南',
    desc: '生产环境必备：理解所有可能的错误状态码、错误响应结构、以及实施稳健的重试策略。',
    sections: [
      { type: 'h2', text: '错误响应结构' },
      { type: 'p', text: '所有错误都返回标准 HTTP 状态码，响应体是统一的 JSON 格式。' },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "error": {
    "code": "invalid_api_key",
    "message": "The API key provided is invalid.",
    "type": "authentication_error"
  }
}`,
      },
      { type: 'h2', text: 'HTTP 状态码速查' },
      {
        type: 'table',
        headers: ['状态码', '类型', '可重试', '处理建议'],
        rows: [
          ['400', 'invalid_request_error', '否', '修改请求参数'],
          ['401', 'authentication_error', '否', '检查 API Key'],
          ['403', 'permission_error', '否', '余额不足或无权访问该模型'],
          ['404', 'not_found_error', '否', '检查 endpoint 与 model id'],
          ['429', 'rate_limit_error', '是', '指数退避后重试'],
          ['500', 'internal_error', '是', '稍后重试'],
          ['502', 'upstream_error', '是', '配置 fallback 模型'],
          ['503', 'service_unavailable', '是', '稍后重试或切换模型'],
        ],
      },
      { type: 'h2', text: '指数退避重试' },
      { type: 'p', text: '对可重试的错误（5xx 与 429），应使用指数退避策略，避免在故障时引发雪崩。等待时间公式: (2^attempt) + random()。' },
      {
        type: 'code',
        lang: 'python',
        code: `import time, random
from openai import APIError, RateLimitError, APIConnectionError

RETRYABLE = (RateLimitError, APIConnectionError)

def call_with_retry(fn, max_attempts=5):
    for attempt in range(max_attempts):
        try:
            return fn()
        except RETRYABLE:
            if attempt == max_attempts - 1:
                raise
            wait = (2 ** attempt) + random.random()
            time.sleep(wait)
        except APIError as e:
            if 500 <= e.status_code < 600:
                if attempt == max_attempts - 1:
                    raise
                time.sleep((2 ** attempt) + random.random())
            else:
                raise  # 4xx 错误直接抛出`,
      },
      { type: 'h2', text: '超时设置' },
      {
        type: 'list',
        items: [
          '常规请求：60 秒',
          '流式请求：120-300 秒（生成长内容时）',
          'Embeddings：30 秒',
          'Image generation：300 秒',
        ],
      },
      { type: 'callout', kind: 'tip', text: '4xx 错误几乎都是客户端 bug，重试无意义。只对 429 和 5xx 实施重试。' },
    ],
  },

  'advanced/routing': {
    title: '供应商路由',
    badge: '高级功能',
    desc: '同一个模型可能由多个底层供应商提供。通过路由策略控制请求分发，平衡稳定性、成本与延迟。',
    sections: [
      { type: 'h2', text: '四种路由策略' },
      {
        type: 'table',
        headers: ['策略', '行为', '适用场景'],
        rows: [
          ['priority', '按优先级顺序选择（默认）', '稳定性优先的生产环境'],
          ['cost', '总是选择最便宜的供应商', '批量任务、离线处理'],
          ['latency', '选择延迟最低的节点', '实时对话、用户交互'],
          ['balanced', '负载均衡分发', '高并发场景'],
        ],
      },
      { type: 'h2', text: '通过参数指定' },
      {
        type: 'tabs',
        tabs: [
          {
            label: 'Python',
            lang: 'python',
            code: `resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "你好"}],
    extra_body={
        "provider": {
            "routing": "cost"
        }
    },
)`,
          },
          {
            label: 'Node.js',
            lang: 'javascript',
            code: `const resp = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: '你好' }],
  // @ts-ignore extra param
  provider: { routing: 'cost' },
});`,
          },
        ],
      },
      { type: 'h2', text: '指定 / 排除供应商' },
      {
        type: 'code',
        lang: 'python',
        code: `extra_body={
    "provider": {
        "allow": ["azure", "aws-bedrock"],     # 仅使用这些供应商
        "deny": ["provider-with-issues"],       # 排除特定供应商
        "routing": "latency"                    # 在允许列表中按延迟排序
    }
}`,
      },
      { type: 'h2', text: '推荐配置' },
      {
        type: 'list',
        items: [
          '在线对话：routing=latency，最小化用户等待',
          '批量数据处理：routing=cost，节省费用',
          '关键业务：routing=priority + 配置 fallback',
          '高 QPS 场景：routing=balanced，避免单点过载',
        ],
      },
    ],
  },

  'advanced/fallback': {
    title: '故障回退',
    badge: '高级功能',
    desc: '当主模型不可用时，自动切换到备选模型，确保服务高可用。生产环境必配。',
    sections: [
      { type: 'h2', text: '工作流程' },
      {
        type: 'list',
        items: [
          '1. 请求发送到 model 字段指定的主模型',
          '2. 主模型返回可重试错误（5xx / 429 / timeout）',
          '3. 网关按 fallback 列表顺序尝试备选模型',
          '4. 返回首个成功的响应（response 中会标记实际使用的模型）',
        ],
      },
      { type: 'h2', text: '配置示例' },
      {
        type: 'code',
        lang: 'python',
        code: `resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "你好"}],
    extra_body={
        "provider": {
            "fallback": [
                "claude-sonnet-4.5",
                "gemini-2.5-flash",
            ]
        }
    },
)`,
      },
      { type: 'h2', text: '触发条件' },
      {
        type: 'table',
        headers: ['情况', '是否回退'],
        rows: [
          ['HTTP 5xx 错误', '✅ 是'],
          ['HTTP 429 限流', '✅ 是'],
          ['请求超时', '✅ 是'],
          ['模型不可用', '✅ 是'],
          ['HTTP 4xx（非 429）', '❌ 否（参数错误）'],
          ['内容安全过滤', '❌ 否'],
        ],
      },
      { type: 'h2', text: '推荐组合' },
      {
        type: 'cards',
        items: [
          { title: '通用对话', desc: 'GPT-4o → Claude Sonnet → Gemini Pro' },
          { title: '代码任务', desc: 'Claude Sonnet → DeepSeek Coder → GPT-4o' },
          { title: '高性价比', desc: 'GPT-4o-mini → Gemini Flash → Qwen Turbo' },
          { title: '中文场景', desc: 'Qwen Max → Doubao Pro → DeepSeek Chat' },
        ],
      },
      { type: 'callout', kind: 'tip', text: '跨厂商配置 fallback 比同厂商更可靠（避免单一服务商整体故障）。建议每条链路至少包含 2-3 个不同厂商的模型。' },
    ],
  },

  'advanced/cache': {
    title: '提示缓存',
    badge: '高级功能',
    desc: '当多次请求共享相同的 prompt 前缀（system prompt、文档上下文）时，启用缓存可降低 50%-90% 的输入费用。',
    sections: [
      { type: 'h2', text: '工作原理' },
      {
        type: 'list',
        items: [
          '首次请求：完整处理并把 prompt 前缀写入缓存',
          '后续请求：检测到相同前缀，直接命中缓存',
          '命中部分按缓存价计费（约为常规价的 10-50%）',
          '默认缓存 TTL 为 5-10 分钟，部分厂商支持 1 小时',
        ],
      },
      { type: 'h2', text: '支持的厂商' },
      {
        type: 'table',
        headers: ['厂商', '缓存方式', '节省幅度'],
        rows: [
          ['Anthropic Claude', '显式 cache_control', '~90%'],
          ['OpenAI GPT-4o', '自动缓存', '~50%'],
          ['Google Gemini', 'Context Caching', '50-75%'],
          ['国产模型', '平台侧缓存', '视厂商而定'],
        ],
      },
      { type: 'h2', text: 'OpenAI 协议（自动）' },
      { type: 'p', text: '使用 OpenAI 协议时缓存自动启用。只需把固定的 system prompt 或文档放在 messages 开头，相同前缀就会自动命中。' },
      {
        type: 'code',
        lang: 'python',
        code: `# 第一次调用（写入缓存）
client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": LONG_DOCUMENT},  # 共享前缀
        {"role": "user", "content": "总结一下"},
    ],
)

# 第二次调用（命中缓存，前缀部分按缓存价计费）
client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": LONG_DOCUMENT},  # 同样的前缀
        {"role": "user", "content": "找出关键人物"},
    ],
)`,
      },
      { type: 'h2', text: 'Anthropic 协议（显式）' },
      {
        type: 'code',
        lang: 'python',
        code: `messages = [{
    "role": "user",
    "content": [
        {
            "type": "text",
            "text": LONG_DOCUMENT,
            "cache_control": {"type": "ephemeral"},
        },
        {
            "type": "text",
            "text": "请基于上面的文档回答: ...",
        },
    ],
}]`,
      },
      { type: 'h2', text: '最佳实践' },
      {
        type: 'list',
        items: [
          '把不变的内容放在 messages 开头，变化的放后面',
          '系统提示、知识库、few-shot 示例都是缓存的理想内容',
          '通过 response.usage.cache_read_input_tokens 字段查看命中情况',
          'Prompt 至少 1024 tokens 才能触发缓存（不同模型有差异）',
        ],
      },
    ],
  },

  'observability/dashboard': {
    title: '控制台总览',
    badge: '可观测性',
    desc: '控制台是查看用量、调试请求、管理 API Key 的统一入口。本章介绍各模块功能。',
    sections: [
      { type: 'h2', text: '主要模块' },
      {
        type: 'cards',
        items: [
          { title: '数据看板', desc: '实时显示请求数、Token 消耗、费用、平均延迟等核心指标。' },
          { title: '令牌管理', desc: '创建、停用、删除 API Key，配置额度上限与允许的模型。' },
          { title: '使用日志', desc: '逐条查看每次请求的时间、模型、状态、用量、费用。' },
          { title: '钱包管理', desc: '充值、查看余额变动、导出账单。' },
          { title: '渠道管理', desc: '管理员配置上游模型供应商与路由策略。' },
          { title: '系统设置', desc: '管理员配置全局策略、用户权限、计费规则。' },
        ],
      },
      { type: 'h2', text: '数据看板核心指标' },
      {
        type: 'metrics',
        items: [
          { label: '总请求数', value: '—', sub: '当前周期 API 调用总数' },
          { label: '总 Token', value: '—', sub: 'prompt + completion' },
          { label: '总费用', value: '¥—', sub: '当前周期累计' },
          { label: '成功率', value: '—%', sub: '2xx / 总请求' },
        ],
      },
      { type: 'h2', text: '常用操作' },
      {
        type: 'list',
        items: [
          '在「令牌管理」中为每个项目独立创建 Key',
          '在「使用日志」按 Key、模型、时间筛选异常请求',
          '在「数据看板」按周 / 月查看用量趋势',
          '在「钱包管理」配置低余额告警',
        ],
      },
      { type: 'callout', kind: 'tip', text: '数据看板的统计为近实时更新，通常延迟 1 分钟以内。如果发现数据未更新，刷新页面即可。' },
    ],
  },

  'observability/usage': {
    title: '用量追踪',
    badge: '可观测性',
    desc: '通过日志与 API 双重视角追踪每一次调用的成本、延迟与 Token 消耗。',
    sections: [
      { type: 'h2', text: '日志字段说明' },
      {
        type: 'table',
        headers: ['字段', '说明'],
        rows: [
          ['时间', '请求接收时间'],
          ['用户', '调用方账号'],
          ['令牌名', '使用的 API Key 名称'],
          ['模型', '请求的模型 ID'],
          ['类型', 'chat / embedding / image / audio'],
          ['提示 Token', '输入消耗的 token 数'],
          ['补全 Token', '输出消耗的 token 数'],
          ['费用', '本次调用扣费金额'],
          ['延迟', '端到端响应时间'],
        ],
      },
      { type: 'h2', text: '从 API 响应获取用量' },
      { type: 'p', text: '每个 API 响应中都包含 usage 字段，无需查询日志即可知道本次调用的 token 消耗。' },
      {
        type: 'code',
        lang: 'python',
        code: `resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "你好"}],
)

print(resp.usage)
# CompletionUsage(
#     prompt_tokens=8,
#     completion_tokens=12,
#     total_tokens=20,
#     prompt_tokens_details={"cached_tokens": 0}
# )`,
      },
      { type: 'h2', text: '多维度分析' },
      {
        type: 'list',
        items: [
          '按模型：找出消耗最大的模型，评估是否切换更便宜的替代品',
          '按 API Key：识别异常高频调用的项目或用户',
          '按时段：发现峰值时段，调整速率限制',
          '按错误码：监控 4xx/5xx 比例，提前发现质量问题',
        ],
      },
      { type: 'callout', kind: 'tip', text: '为不同业务（爬虫、聊天、批处理）使用不同的 API Key，可以在日志里清晰地分摊成本。' },
    ],
  },

  'observability/billing': {
    title: '计费说明',
    badge: '可观测性',
    desc: '本网关采用纯按量付费，没有月费、订阅与最低消费。本章解释费用是如何计算的。',
    sections: [
      { type: 'h2', text: '计费模式' },
      {
        type: 'list',
        items: [
          '按实际 Token 消耗扣费，请求成功后实时结算',
          '没有月费、套餐或最低消费',
          '充值余额永不过期',
          '不同模型单价差异较大，详见模型目录',
        ],
      },
      { type: 'h2', text: '费用项目' },
      {
        type: 'table',
        headers: ['项目', '计费方式'],
        rows: [
          ['输入 Token', 'prompt 消耗的 token 数 × 输入单价'],
          ['输出 Token', 'completion 消耗的 token 数 × 输出单价'],
          ['缓存读取', '命中缓存的 token × 缓存读取单价（更便宜）'],
          ['缓存写入', '首次写入缓存的 token × 缓存写入单价'],
          ['图像生成', '按生成图片张数 × 单价'],
          ['Embeddings', '按输入 token 数 × 单价'],
          ['音频识别', '按音频时长（秒） × 单价'],
        ],
      },
      { type: 'h2', text: '实时查看费用' },
      {
        type: 'list',
        items: [
          '控制台 → 数据看板：当日 / 当月累计费用',
          '控制台 → 使用日志：单条请求的具体扣费',
          'API response.usage：每次请求的 token 消耗',
        ],
      },
      { type: 'h2', text: '降本最佳实践' },
      {
        type: 'cards',
        items: [
          { title: '选对模型', desc: '简单任务用 mini / flash 系列，复杂任务才用 opus / o3 系列。' },
          { title: '启用缓存', desc: '长 system prompt、固定文档场景启用 prompt caching，省 50-90%。' },
          { title: '设置 max_tokens', desc: '避免模型啰嗦输出，限制 max_tokens 控制单次成本。' },
          { title: '合并请求', desc: '把多个短请求合并成一个，减少 system prompt 重复。' },
        ],
      },
      { type: 'callout', kind: 'info', text: '所有模型的实时定价可在「模型管理」或 /v1/models 端点查询，价格以厂商最新公布为准。' },
    ],
  },

  // ============================================================
  // API Reference (zh)
  // ============================================================

  api: {
    title: 'API 参考概览',
    badge: 'API 参考',
    desc: '本网关同时提供 OpenAI 兼容、Anthropic 原生、Gemini 原生三套接口。本章列出所有可用端点，方便快速定位。',
    sections: [
      { type: 'h2', text: '接入地址' },
      {
        type: 'table',
        headers: ['协议', 'Base URL', '认证 Header'],
        rows: [
          ['OpenAI 兼容', 'https://your-domain/v1', 'Authorization: Bearer sk-xxx'],
          ['Anthropic 原生', 'https://your-domain/anthropic', 'x-api-key: sk-xxx'],
          ['Gemini 原生', 'https://your-domain/gemini', 'x-goog-api-key: sk-xxx'],
        ],
      },
      { type: 'h2', text: '端点一览' },
      {
        type: 'cards',
        items: [
          { title: 'OpenAI 兼容', badge: '推荐', desc: 'Chat Completions、Responses、Embeddings、Images、Models 等 6 个端点。' },
          { title: 'Anthropic 原生', desc: 'Messages、Models、Models Count，原生 Claude 体验。' },
          { title: 'Gemini 原生', desc: 'generateContent、Models、Models Count，原生 Google GenAI 体验。' },
        ],
      },
      { type: 'h2', text: '通用错误码' },
      {
        type: 'table',
        headers: ['状态码', '类型', '说明'],
        rows: [
          ['200', 'success', '成功'],
          ['400', 'invalid_request_error', '参数错误'],
          ['401', 'authentication_error', 'API Key 无效'],
          ['403', 'permission_error', '余额不足或无权限'],
          ['404', 'not_found_error', '资源不存在'],
          ['429', 'rate_limit_error', '触发限流'],
          ['500', 'internal_error', '服务器异常'],
          ['502', 'upstream_error', '上游模型错误'],
        ],
      },
      { type: 'h2', text: '扩展参数' },
      { type: 'p', text: '所有端点都支持通过 provider 字段配置路由策略与故障回退，详见「高级功能」章节。' },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "model": "gpt-4o",
  "messages": [...],
  "provider": {
    "routing": "latency",
    "fallback": ["claude-sonnet-4.5"]
  }
}`,
      },
    ],
  },

  'api/chat': {
    title: 'Chat Completions',
    badge: 'OpenAI API',
    desc: '最常用的对话端点，兼容 OpenAI v1 协议，支持流式、工具调用、多模态输入与结构化输出。',
    sections: [
      { type: 'h2', text: '端点' },
      { type: 'code', lang: 'http', code: 'POST https://your-domain/v1/chat/completions' },
      { type: 'h2', text: '请求参数' },
      {
        type: 'table',
        headers: ['参数', '类型', '必填', '说明'],
        rows: [
          ['model', 'string', '是', '模型 ID，例如 gpt-4o'],
          ['messages', 'array', '是', '对话消息数组（role + content）'],
          ['stream', 'boolean', '否', '是否启用 SSE 流式响应'],
          ['temperature', 'number', '否', '采样温度，范围 0-2，默认 1'],
          ['top_p', 'number', '否', '核采样阈值，与 temperature 二选一'],
          ['max_tokens', 'integer', '否', '最大生成 token 数'],
          ['frequency_penalty', 'number', '否', '频率惩罚 -2 到 2'],
          ['presence_penalty', 'number', '否', '存在惩罚 -2 到 2'],
          ['tools', 'array', '否', '函数调用工具定义'],
          ['tool_choice', 'string|object', '否', '工具选择策略'],
          ['response_format', 'object', '否', '结构化输出（JSON Mode / JSON Schema）'],
          ['stop', 'string|array', '否', '停止序列'],
          ['seed', 'integer', '否', '随机种子，用于可复现性'],
          ['user', 'string', '否', '终端用户标识，用于追踪'],
          ['provider', 'object', '否', '路由与回退扩展参数'],
        ],
      },
      { type: 'h2', text: 'messages 结构' },
      {
        type: 'code',
        lang: 'json',
        code: `[
  { "role": "system", "content": "你是一个助手" },
  { "role": "user", "content": "你好" },
  { "role": "assistant", "content": "你好，有什么可以帮你的?" }
]`,
      },
      { type: 'p', text: 'role 取值: system / user / assistant / tool。content 既可以是字符串，也可以是数组（多模态）。' },
      { type: 'h2', text: '响应结构' },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1735000000,
  "model": "gpt-4o",
  "choices": [{
    "index": 0,
    "message": { "role": "assistant", "content": "你好" },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 8,
    "completion_tokens": 5,
    "total_tokens": 13
  }
}`,
      },
      { type: 'h2', text: '完整调用示例' },
      {
        type: 'tabs',
        tabs: [
          { label: 'Python', lang: 'python', code: `from openai import OpenAI

client = OpenAI(base_url="https://your-domain/v1", api_key="sk-xxx")
resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "解释什么是 API 网关"}],
    temperature=0.7,
)
print(resp.choices[0].message.content)` },
          { label: 'cURL', lang: 'bash', code: `curl https://your-domain/v1/chat/completions \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "你好"}]
  }'` },
        ],
      },
      { type: 'callout', kind: 'tip', text: '需要更精细的工具调用流程？建议使用 Responses API（下一篇），它原生支持事件流与缓存优化。' },
    ],
  },

  'api/responses': {
    title: 'Responses API',
    badge: 'OpenAI API',
    desc: 'OpenAI 推出的新一代生成端点。相比 Chat Completions，它原生支持工具调用流程、结构化事件流与系统提示缓存。新项目推荐使用。',
    sections: [
      { type: 'h2', text: '端点' },
      { type: 'code', lang: 'http', code: 'POST https://your-domain/v1/responses' },
      { type: 'h2', text: '与 Chat Completions 的差异' },
      {
        type: 'cards',
        items: [
          { title: '指令分离', badge: '缓存友好', desc: 'instructions 字段独立于 input，会自动作为缓存前缀复用，节省最高 50% 输入费用。' },
          { title: '结构化输出', desc: 'output 是 item 数组，每个 item 是 message 或 tool_call，无需手动解析 choices。' },
          { title: '细粒度事件流', desc: 'streaming 时按 response.created / response.output_text.delta / response.completed 分类推送事件。' },
        ],
      },
      { type: 'h2', text: '请求参数' },
      {
        type: 'table',
        headers: ['参数', '类型', '必填', '说明'],
        rows: [
          ['model', 'string', '是', '模型 ID'],
          ['input', 'string|array', '是', '用户输入（字符串或结构化消息数组）'],
          ['instructions', 'string', '否', '系统指令，会被独立缓存'],
          ['stream', 'boolean', '否', '启用 SSE 事件流'],
          ['max_output_tokens', 'integer', '否', '最大生成 token 数'],
          ['temperature', 'number', '否', '采样温度 0-2'],
          ['top_p', 'number', '否', '核采样阈值'],
          ['tools', 'array', '否', '函数调用定义'],
          ['tool_choice', 'string|object', '否', '工具选择策略'],
          ['truncation', 'string', '否', '上下文截断策略'],
          ['store', 'boolean', '否', '是否在服务端持久化响应'],
          ['metadata', 'object', '否', '自定义元数据'],
          ['provider', 'object', '否', '路由与回退扩展参数'],
        ],
      },
      { type: 'h2', text: '响应结构' },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "id": "resp_abc123",
  "object": "response",
  "created_at": 1735000000,
  "model": "gpt-4o",
  "status": "completed",
  "output": [
    {
      "type": "message",
      "role": "assistant",
      "content": [{ "type": "output_text", "text": "你好" }]
    }
  ],
  "usage": {
    "input_tokens": 25,
    "output_tokens": 150,
    "total_tokens": 175
  }
}`,
      },
      { type: 'h2', text: '调用示例' },
      {
        type: 'code',
        lang: 'python',
        code: `import requests

resp = requests.post(
    "https://your-domain/v1/responses",
    headers={"Authorization": "Bearer sk-xxx"},
    json={
        "model": "gpt-4o",
        "instructions": "你是一个简洁的助手",
        "input": "用一句话解释什么是大语言模型",
    },
)
print(resp.json()["output"][0]["content"][0]["text"])`,
      },
    ],
  },

  'api/embeddings': {
    title: 'Embeddings',
    badge: 'OpenAI API',
    desc: '把文本转换为高维向量，用于语义搜索、聚类、推荐、RAG 等场景。',
    sections: [
      { type: 'h2', text: '端点' },
      { type: 'code', lang: 'http', code: 'POST https://your-domain/v1/embeddings' },
      { type: 'h2', text: '请求参数' },
      {
        type: 'table',
        headers: ['参数', '类型', '必填', '说明'],
        rows: [
          ['model', 'string', '是', '向量模型 ID，例如 text-embedding-3-small'],
          ['input', 'string|array', '是', '单条文本或文本数组（批量）'],
          ['encoding_format', 'string', '否', '输出格式: float（默认）或 base64'],
          ['dimensions', 'integer', '否', '输出向量维度，仅部分模型支持'],
          ['user', 'string', '否', '终端用户标识'],
        ],
      },
      { type: 'h2', text: '响应结构' },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "index": 0,
      "embedding": [0.0023, -0.0091, 0.0156, /* ... 1536 维 */]
    }
  ],
  "model": "text-embedding-3-small",
  "usage": {
    "prompt_tokens": 8,
    "total_tokens": 8
  }
}`,
      },
      { type: 'h2', text: '常用模型' },
      {
        type: 'table',
        headers: ['模型', '维度', '说明'],
        rows: [
          ['text-embedding-3-small', '1536', '高性价比，通用场景'],
          ['text-embedding-3-large', '3072', '最高精度'],
          ['bge-m3', '1024', '中文优化、多语言'],
        ],
      },
      { type: 'h2', text: '调用示例' },
      {
        type: 'code',
        lang: 'python',
        code: `from openai import OpenAI

client = OpenAI(base_url="https://your-domain/v1", api_key="sk-xxx")
resp = client.embeddings.create(
    model="text-embedding-3-small",
    input="本网关是一个统一的 LLM API 入口",
)
vector = resp.data[0].embedding
print(f"向量维度: {len(vector)}")`,
      },
      { type: 'callout', kind: 'tip', text: '批量调用时把多条文本一次性放进 input 数组，可以显著降低单条延迟与费用。' },
    ],
  },

  'api/models': {
    title: 'Models 列表',
    badge: 'OpenAI API',
    desc: '查询所有可用模型及其元数据（上下文长度、定价、支持的参数）。该端点无需鉴权。',
    sections: [
      { type: 'h2', text: '端点' },
      { type: 'code', lang: 'http', code: `GET https://your-domain/v1/models
GET https://your-domain/v1/models/{provider}` },
      { type: 'h2', text: '路径参数（可选）' },
      {
        type: 'table',
        headers: ['参数', '说明', '示例'],
        rows: [
          ['provider', '按厂商过滤', 'openai / anthropic / google / qwen'],
        ],
      },
      { type: 'h2', text: '响应结构' },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "object": "list",
  "data": [
    {
      "id": "gpt-4o",
      "object": "model",
      "created": 1735000000,
      "owned_by": "openai",
      "context_length": 128000,
      "architecture": {
        "input_modalities": ["text", "image"],
        "output_modalities": ["text"],
        "tokenizer": "GPT"
      },
      "pricing": {
        "prompt": "0.0000025",
        "completion": "0.00001"
      },
      "supported_parameters": [
        "temperature", "top_p", "max_tokens",
        "tools", "response_format"
      ]
    }
  ]
}`,
      },
      { type: 'h2', text: '调用示例' },
      {
        type: 'tabs',
        tabs: [
          { label: 'cURL', lang: 'bash', code: 'curl https://your-domain/v1/models' },
          { label: 'Python', lang: 'python', code: `from openai import OpenAI

client = OpenAI(base_url="https://your-domain/v1", api_key="sk-xxx")
for m in client.models.list().data:
    print(m.id, m.context_length)` },
        ],
      },
    ],
  },

  'api/models-count': {
    title: 'Models Count',
    badge: 'OpenAI API',
    desc: '快速获取通过 OpenAI 协议可用的模型总数，无需拉取完整列表，适合监控与首页展示。',
    sections: [
      { type: 'h2', text: '端点' },
      { type: 'code', lang: 'http', code: 'GET https://your-domain/v1/models/count' },
      { type: 'h2', text: '响应结构' },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "data": {
    "count": 87
  }
}`,
      },
      {
        type: 'table',
        headers: ['字段', '类型', '说明'],
        rows: [['data.count', 'number', '当前可用模型总数']],
      },
      { type: 'h2', text: '调用示例' },
      { type: 'code', lang: 'bash', code: 'curl https://your-domain/v1/models/count' },
    ],
  },

  'api/images': {
    title: 'Images（图像生成）',
    badge: 'OpenAI API',
    desc: '根据文本描述生成图片，兼容 OpenAI Images API，支持 DALL-E、Stable Diffusion 等多种模型。',
    sections: [
      { type: 'h2', text: '端点' },
      { type: 'code', lang: 'http', code: 'POST https://your-domain/v1/images/generations' },
      { type: 'h2', text: '请求参数' },
      {
        type: 'table',
        headers: ['参数', '类型', '必填', '说明'],
        rows: [
          ['model', 'string', '是', '图像模型 ID，例如 dall-e-3'],
          ['prompt', 'string', '是', '图像描述文本'],
          ['n', 'integer', '否', '生成数量，默认 1'],
          ['size', 'string', '否', '尺寸，例如 1024x1024 / 1792x1024'],
          ['quality', 'string', '否', 'standard 或 hd'],
          ['style', 'string', '否', 'vivid 或 natural'],
          ['response_format', 'string', '否', 'url 或 b64_json'],
        ],
      },
      { type: 'h2', text: '响应结构' },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "created": 1735000000,
  "data": [
    {
      "url": "https://cdn.example.com/img/abc.png",
      "revised_prompt": "..."
    }
  ]
}`,
      },
      { type: 'h2', text: '调用示例' },
      {
        type: 'code',
        lang: 'bash',
        code: `curl https://your-domain/v1/images/generations \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "dall-e-3",
    "prompt": "一只戴墨镜的小狐狸在冲浪，赛博朋克风格",
    "n": 1,
    "size": "1024x1024"
  }'`,
      },
      { type: 'callout', kind: 'info', text: '图像模型按张数计费，不同模型与尺寸价格不同，详见「模型管理」。' },
    ],
  },

  'api/anthropic/messages': {
    title: 'Messages',
    badge: 'Anthropic API',
    desc: 'Claude 原生 Messages API，相比 OpenAI 协议保留了 Claude 的全部独有能力（缓存、Extended Thinking、Citations 等）。',
    sections: [
      { type: 'h2', text: '端点' },
      { type: 'code', lang: 'http', code: 'POST https://your-domain/anthropic/v1/messages' },
      { type: 'h2', text: '认证 Header' },
      {
        type: 'code',
        lang: 'http',
        code: `x-api-key: sk-xxx
anthropic-version: 2023-06-01`,
      },
      { type: 'h2', text: '请求参数' },
      {
        type: 'table',
        headers: ['参数', '类型', '必填', '说明'],
        rows: [
          ['model', 'string', '是', 'Claude 模型 ID，例如 claude-sonnet-4.5'],
          ['max_tokens', 'integer', '是', '最大生成 token 数（必填）'],
          ['messages', 'array', '是', '对话消息数组'],
          ['system', 'string|array', '否', '系统提示词，可启用 cache_control'],
          ['temperature', 'number', '否', '采样温度 0-1'],
          ['top_p', 'number', '否', '核采样阈值'],
          ['top_k', 'integer', '否', 'Top-K 采样'],
          ['stream', 'boolean', '否', '启用流式响应'],
          ['stop_sequences', 'array', '否', '停止序列'],
          ['tools', 'array', '否', '工具定义（input_schema 格式）'],
          ['tool_choice', 'object', '否', '工具选择策略'],
        ],
      },
      { type: 'h2', text: '响应结构' },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "id": "msg_abc123",
  "type": "message",
  "role": "assistant",
  "model": "claude-sonnet-4.5",
  "content": [
    { "type": "text", "text": "你好" }
  ],
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 10,
    "output_tokens": 5,
    "cache_creation_input_tokens": 0,
    "cache_read_input_tokens": 0
  }
}`,
      },
      { type: 'h2', text: '调用示例' },
      {
        type: 'code',
        lang: 'python',
        code: `import anthropic

client = anthropic.Anthropic(
    base_url="https://your-domain/anthropic",
    api_key="sk-xxx",
)

msg = client.messages.create(
    model="claude-sonnet-4.5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "你好"}],
)
print(msg.content[0].text)`,
      },
      { type: 'callout', kind: 'tip', text: '使用原生 Messages API 时可以充分利用 Claude 的 Prompt Caching，相同 system 前缀可节省最高 90% 输入费用。' },
    ],
  },

  'api/anthropic/models': {
    title: 'Models 列表',
    badge: 'Anthropic API',
    desc: '查询通过 Anthropic 协议可用的模型，响应格式遵循 Anthropic 官方规范。',
    sections: [
      { type: 'h2', text: '端点' },
      { type: 'code', lang: 'http', code: `GET https://your-domain/anthropic/v1/models
GET https://your-domain/anthropic/v1/models/{provider}
GET https://your-domain/anthropic/v1/models/{provider}/{model_id}` },
      { type: 'p', text: '该端点公开访问，无需 API Key。' },
      { type: 'h2', text: '响应结构' },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "data": [
    {
      "type": "model",
      "id": "claude-sonnet-4.5",
      "display_name": "Claude Sonnet 4.5",
      "created_at": "2026-01-21T16:09:13Z",
      "context_length": 200000,
      "pricing": {
        "prompt": "0.000003",
        "completion": "0.000015"
      }
    }
  ]
}`,
      },
      { type: 'h2', text: '调用示例' },
      {
        type: 'code',
        lang: 'bash',
        code: 'curl https://your-domain/anthropic/v1/models',
      },
    ],
  },

  'api/anthropic/models-count': {
    title: 'Models Count',
    badge: 'Anthropic API',
    desc: '获取 Anthropic 协议可用的模型总数。',
    sections: [
      { type: 'h2', text: '端点' },
      { type: 'code', lang: 'http', code: 'GET https://your-domain/anthropic/v1/models/count' },
      { type: 'h2', text: '响应结构' },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "data": {
    "count": 12
  }
}`,
      },
      { type: 'h2', text: '调用示例' },
      { type: 'code', lang: 'bash', code: 'curl https://your-domain/anthropic/v1/models/count' },
    ],
  },

  'api/gemini/generate': {
    title: 'generateContent',
    badge: 'Gemini API',
    desc: 'Gemini 原生生成端点，兼容 Google GenAI SDK，支持文本、多模态、视频输入。',
    sections: [
      { type: 'h2', text: '端点' },
      {
        type: 'code',
        lang: 'http',
        code: `POST https://your-domain/gemini/v1beta/models/{model}:generateContent
POST https://your-domain/gemini/v1beta/models/{model}:streamGenerateContent`,
      },
      { type: 'p', text: '流式响应使用 :streamGenerateContent 后缀的端点。' },
      { type: 'h2', text: '认证' },
      { type: 'code', lang: 'http', code: 'x-goog-api-key: sk-xxx' },
      { type: 'h2', text: '请求体结构' },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "contents": [
    {
      "role": "user",
      "parts": [
        { "text": "你好，介绍一下你自己" }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 1024,
    "topP": 0.95
  }
}`,
      },
      { type: 'h2', text: '多模态输入' },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "contents": [{
    "role": "user",
    "parts": [
      { "text": "描述这张图片" },
      {
        "inline_data": {
          "mime_type": "image/jpeg",
          "data": "<base64-encoded-image>"
        }
      }
    ]
  }]
}`,
      },
      { type: 'h2', text: '响应结构' },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "candidates": [{
    "content": {
      "role": "model",
      "parts": [{ "text": "..." }]
    },
    "finishReason": "STOP"
  }],
  "usageMetadata": {
    "promptTokenCount": 8,
    "candidatesTokenCount": 50,
    "totalTokenCount": 58
  }
}`,
      },
      { type: 'h2', text: '调用示例' },
      {
        type: 'code',
        lang: 'python',
        code: `from google import genai

client = genai.Client(
    api_key="sk-xxx",
    http_options={"base_url": "https://your-domain/gemini"},
)

resp = client.models.generate_content(
    model="gemini-2.5-pro",
    contents="解释量子纠缠",
)
print(resp.text)`,
      },
    ],
  },

  'api/gemini/models': {
    title: 'Models 列表',
    badge: 'Gemini API',
    desc: '查询通过 Gemini 协议可用的模型，响应格式遵循 Google GenAI 规范（camelCase）。',
    sections: [
      { type: 'h2', text: '端点' },
      {
        type: 'code',
        lang: 'http',
        code: `GET https://your-domain/gemini/v1beta/models
GET https://your-domain/gemini/v1beta/models/{provider}
GET https://your-domain/gemini/v1beta/models/{provider}/{model_id}`,
      },
      { type: 'h2', text: '响应结构' },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "models": [
    {
      "name": "models/gemini-2.5-pro",
      "displayName": "Gemini 2.5 Pro",
      "inputTokenLimit": 1048576,
      "outputTokenLimit": 65536,
      "supportedGenerationMethods": [
        "generateContent",
        "streamGenerateContent",
        "countTokens"
      ]
    }
  ]
}`,
      },
      { type: 'callout', kind: 'info', text: '注意：Gemini 协议的字段是 camelCase（inputTokenLimit），与 OpenAI 协议的 snake_case 不同。' },
      { type: 'h2', text: '调用示例' },
      { type: 'code', lang: 'bash', code: 'curl https://your-domain/gemini/v1beta/models' },
    ],
  },

  'api/gemini/models-count': {
    title: 'Models Count',
    badge: 'Gemini API',
    desc: '获取 Gemini 协议可用的模型总数。',
    sections: [
      { type: 'h2', text: '端点' },
      { type: 'code', lang: 'http', code: 'GET https://your-domain/gemini/v1beta/models/count' },
      { type: 'h2', text: '响应结构' },
      {
        type: 'code',
        lang: 'json',
        code: `{
  "data": {
    "count": 8
  }
}`,
      },
      { type: 'h2', text: '调用示例' },
      { type: 'code', lang: 'bash', code: 'curl https://your-domain/gemini/v1beta/models/count' },
    ],
  },
};

// English version — abbreviated for brevity. Same structure & section order.
const en = {
  'getting-started': {
    title: 'Quick Start',
    badge: 'Getting Started',
    desc: 'Get up and running in three minutes — reuse your existing OpenAI / Anthropic / Gemini SDK with zero code changes.',
    sections: [
      { type: 'h2', text: 'Prerequisites' },
      { type: 'list', items: ['Registered account with developer access', 'At least one API key generated', 'Python 3.8+ or Node.js 18+ environment', 'Familiarity with HTTP and JSON'] },
      { type: 'h2', text: 'Three Protocols' },
      { type: 'p', text: 'This gateway is compatible with three major protocols, all sharing the same API key. Pick whichever your team prefers — you can even mix them across services.' },
      { type: 'cards', items: [
        { title: 'OpenAI Compatible', badge: 'Recommended', desc: 'Use the official OpenAI SDK for chat completions, embeddings, images, and more.' },
        { title: 'Anthropic Native', desc: 'Connect directly to Claude via Anthropic SDK, with full Messages API support.' },
        { title: 'Gemini Native', desc: 'Compatible with Google GenAI SDK including generateContent and streamGenerateContent.' },
      ] },
      { type: 'h2', text: 'Your First Call' },
      { type: 'p', text: 'Below is the shortest possible call using the Python OpenAI SDK — just three lines of config.' },
      { type: 'tabs', tabs: [
        { label: 'Python', lang: 'python', code: `from openai import OpenAI

client = OpenAI(
    api_key="sk-xxx",
    base_url="https://your-domain/v1",
)

resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello"}],
)
print(resp.choices[0].message.content)` },
        { label: 'Node.js', lang: 'javascript', code: `import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: 'https://your-domain/v1',
});

const resp = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }],
});
console.log(resp.choices[0].message.content);` },
        { label: 'cURL', lang: 'bash', code: `curl https://your-domain/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $API_KEY" \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello"}]
  }'` },
      ] },
      { type: 'h2', text: 'Next Steps' },
      { type: 'cards', items: [
        { title: 'Authentication', desc: 'Learn about API key auth and security practices.' },
        { title: 'Models', desc: 'Browse all available models and pricing.' },
        { title: 'Streaming', desc: 'Enable streaming for better UX.' },
        { title: 'Function Calling', desc: 'Let models call your tools autonomously.' },
      ] },
    ],
  },
  auth: {
    title: 'Authentication',
    badge: 'Basics',
    desc: 'All API requests are authenticated via API keys. This chapter covers auth headers for the three protocols and key management best practices.',
    sections: [
      { type: 'h2', text: 'Get an API Key' },
      { type: 'list', items: ['Log in and open Token Management', 'Click Create Token', 'Set name, expiry, quota, allowed models', 'Copy and save the key (shown only once)'] },
      { type: 'callout', kind: 'warn', text: 'API keys are shown in full only at creation time. Save it immediately to a password manager or environment variable.' },
      { type: 'h2', text: 'Auth Headers per Protocol' },
      { type: 'table', headers: ['Protocol', 'Header', 'Example'], rows: [
        ['OpenAI Compatible', 'Authorization', 'Authorization: Bearer sk-xxx'],
        ['Anthropic Native', 'x-api-key', 'x-api-key: sk-xxx'],
        ['Gemini Native', 'x-goog-api-key', 'x-goog-api-key: sk-xxx'],
      ] },
      { type: 'h2', text: 'Use Environment Variables' },
      { type: 'p', text: 'Never hardcode API keys. Load them from .env files or OS environment variables.' },
      { type: 'code', lang: 'bash', code: `# .env
API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
API_BASE_URL=https://your-domain/v1` },
      { type: 'code', lang: 'python', code: `import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["API_KEY"],
    base_url=os.environ["API_BASE_URL"],
)` },
      { type: 'h2', text: 'Security Best Practices' },
      { type: 'list', items: [
        'Never commit keys to git (use .gitignore for .env)',
        'Frontend apps must not hold keys directly — proxy via your backend',
        'Use separate keys for dev / staging / production',
        'Rotate keys at least every 90 days',
        'Create per-project or per-user keys for traceability',
        'Set strict quota and allowed-model limits in the console',
      ] },
    ],
  },
  models: {
    title: 'Models',
    badge: 'Basics',
    desc: 'This gateway aggregates 100+ leading LLMs behind a unified OpenAI-compatible API. Learn naming conventions, capability tiers, and how to query the catalog.',
    sections: [
      { type: 'h2', text: 'Naming Convention' },
      { type: 'p', text: 'Model IDs follow the provider/model-name format. Pass the full ID to the model field in requests.' },
      { type: 'code', lang: 'python', code: `model="gpt-4o"
model="claude-sonnet-4.5"
model="gemini-2.5-pro"
model="deepseek-chat"` },
      { type: 'h2', text: 'By Capability' },
      { type: 'cards', items: [
        { title: 'General Chat', desc: 'GPT-4o, Claude Sonnet, Gemini Pro — for most generation and dialog tasks.' },
        { title: 'Code Generation', desc: 'Claude Sonnet, DeepSeek Coder, Qwen Coder — best for programming.' },
        { title: 'Reasoning', desc: 'o3, DeepSeek R1, Claude Opus — complex multi-step reasoning.' },
        { title: 'Vision', desc: 'GPT-4o, Claude Sonnet, Gemini Pro — image input support.' },
        { title: 'Cost-Effective', desc: 'GPT-4o-mini, Gemini Flash, Qwen Turbo — for high-volume.' },
        { title: 'Embeddings', desc: 'text-embedding-3-large, BGE-M3 — for vector search and RAG.' },
      ] },
      { type: 'h2', text: 'List Available Models' },
      { type: 'p', text: 'GET /v1/models returns full metadata for all available models — pricing, context length, supported parameters. No auth required.' },
      { type: 'tabs', tabs: [
        { label: 'cURL', lang: 'bash', code: 'curl https://your-domain/v1/models' },
        { label: 'Python', lang: 'python', code: `from openai import OpenAI

client = OpenAI(base_url="https://your-domain/v1", api_key="sk-xxx")
for m in client.models.list().data:
    print(m.id)` },
      ] },
      { type: 'h2', text: 'Response Fields' },
      { type: 'table', headers: ['Field', 'Type', 'Description'], rows: [
        ['id', 'string', 'Model identifier used in requests'],
        ['created', 'number', 'Unix timestamp when added'],
        ['context_length', 'number', 'Max context window in tokens'],
        ['pricing.prompt', 'string', 'Input token unit price (USD/token)'],
        ['pricing.completion', 'string', 'Output token unit price'],
        ['supported_parameters', 'array', 'OpenAI params supported'],
      ] },
      { type: 'callout', kind: 'tip', text: 'Different models tokenize text differently — same input yields different token counts. Always read the actual usage from the response.' },
    ],
  },
  'guides/streaming': {
    title: 'Streaming',
    badge: 'Guides',
    desc: 'Receive model output progressively via SSE. Dramatically reduces time-to-first-token, ideal for chat and code completion.',
    sections: [
      { type: 'h2', text: 'How It Works' },
      { type: 'p', text: 'Set stream=true and the server pushes content deltas via Server-Sent Events. Each chunk is a data: line ending with data: [DONE]. The OpenAI SDK wraps this in an iterator — just for-loop it.' },
      { type: 'h2', text: 'Basic Example' },
      { type: 'tabs', tabs: [
        { label: 'Python', lang: 'python', code: `stream = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Write a poem about coding"}],
    stream=True,
)

for chunk in stream:
    delta = chunk.choices[0].delta.content
    if delta:
        print(delta, end="", flush=True)` },
        { label: 'Node.js', lang: 'javascript', code: `const stream = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Write a poem about coding' }],
  stream: true,
});

for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content;
  if (delta) process.stdout.write(delta);
}` },
      ] },
      { type: 'h2', text: 'SSE Format' },
      { type: 'code', lang: 'json', code: `data: {"choices":[{"delta":{"content":"He"}}]}

data: {"choices":[{"delta":{"content":"llo"}}]}

data: {"choices":[{"delta":{},"finish_reason":"stop"}]}

data: [DONE]` },
      { type: 'h2', text: 'Best Practices' },
      { type: 'list', items: [
        'Always set timeout to prevent hangs',
        'Handle delta.content possibly being None',
        'Use EventSource or fetch ReadableStream on the frontend',
        'Accumulate tokens until [DONE] for persistence',
        'Retry with exponential backoff on disconnects',
      ] },
    ],
  },
  'guides/functions': {
    title: 'Function Calling',
    badge: 'Guides',
    desc: 'Let the model autonomously decide which tool functions to call based on conversation context. Enables data lookups, API calls, and agent workflows.',
    sections: [
      { type: 'h2', text: 'Full Loop' },
      { type: 'list', items: [
        '1. Define available functions in the tools field with parameter schemas',
        '2. Model decides whether to call any tool',
        '3. Model returns tool_calls with function name and arguments',
        '4. Your code executes the function and appends result as a tool-role message',
        '5. Call the model again to get the final natural-language reply',
      ] },
      { type: 'h2', text: 'Define Tools' },
      { type: 'code', lang: 'python', code: `tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Get current weather for a city",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {"type": "string"},
                "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]},
            },
            "required": ["city"],
        },
    },
}]` },
      { type: 'h2', text: 'tool_choice Options' },
      { type: 'table', headers: ['Value', 'Behavior'], rows: [
        ['"auto"', 'Default. Model decides whether to call tools.'],
        ['"none"', 'Forbid tool calls, force plain text.'],
        ['"required"', 'Force at least one tool call.'],
        ['{"type":"function","function":{"name":"x"}}', 'Force calling a specific tool.'],
      ] },
      { type: 'callout', kind: 'tip', text: 'The clearer your function description, the more accurately the model picks tools and fills arguments. Include examples and edge cases in the description.' },
    ],
  },
  'guides/vision': {
    title: 'Vision',
    badge: 'Guides',
    desc: 'Send images to multimodal models for OCR, chart interpretation, UI screenshot analysis, and document understanding.',
    sections: [
      { type: 'h2', text: 'Supported Models' },
      { type: 'list', items: [
        'GPT-4o / GPT-4o-mini — strongest all-around',
        'Claude Sonnet / Opus — long documents and code screenshots',
        'Gemini Pro / Flash — multimodal reasoning, video support',
        'Qwen-VL — Chinese scene recognition',
      ] },
      { type: 'h2', text: 'Image via URL' },
      { type: 'code', lang: 'python', code: `resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "Describe this image"},
            {"type": "image_url", "image_url": {"url": "https://example.com/photo.jpg"}},
        ],
    }],
)` },
      { type: 'h2', text: 'Image via Base64' },
      { type: 'code', lang: 'python', code: `import base64

with open("screenshot.png", "rb") as f:
    b64 = base64.b64encode(f.read()).decode("utf-8")

resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[{
        "role": "user",
        "content": [
            {"type": "text", "text": "What bug is in this screenshot?"},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}},
        ],
    }],
)` },
      { type: 'h2', text: 'Detail Level' },
      { type: 'table', headers: ['detail', 'Description', 'Use Case'], rows: [
        ['auto', 'Default — model picks', 'General'],
        ['low', 'Downsample to 512×512, faster and cheaper', 'Object recognition'],
        ['high', 'Preserve resolution, more tokens', 'OCR, documents'],
      ] },
    ],
  },
  'guides/json': {
    title: 'Structured Output',
    badge: 'Guides',
    desc: 'Force the model to return JSON matching a schema. Eliminates fragile string parsing for data extraction, classification, and form filling.',
    sections: [
      { type: 'h2', text: 'Two Modes' },
      { type: 'cards', items: [
        { title: 'JSON Mode', badge: 'Simple', desc: 'Guarantees valid JSON output. Requires "JSON" in the system prompt.' },
        { title: 'JSON Schema', badge: 'Strict', desc: 'Define field names, types, required fields. Recommended.' },
      ] },
      { type: 'h2', text: 'JSON Schema Example' },
      { type: 'code', lang: 'python', code: `schema = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "age": {"type": "integer"},
    },
    "required": ["name", "age"],
    "additionalProperties": False,
}

resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "John is 25"}],
    response_format={
        "type": "json_schema",
        "json_schema": {"name": "person", "schema": schema, "strict": True},
    },
)` },
      { type: 'callout', kind: 'warn', text: 'Not all models support strict JSON Schema. Models without it can be guided via prompt instructions but with lower accuracy.' },
    ],
  },
  'guides/errors': {
    title: 'Error Handling',
    badge: 'Guides',
    desc: 'Production essentials: every possible error code, response shape, and a robust retry strategy.',
    sections: [
      { type: 'h2', text: 'Error Response Shape' },
      { type: 'code', lang: 'json', code: `{
  "error": {
    "code": "invalid_api_key",
    "message": "The API key provided is invalid.",
    "type": "authentication_error"
  }
}` },
      { type: 'h2', text: 'HTTP Status Codes' },
      { type: 'table', headers: ['Code', 'Type', 'Retryable', 'Action'], rows: [
        ['400', 'invalid_request_error', 'No', 'Fix request parameters'],
        ['401', 'authentication_error', 'No', 'Verify API key'],
        ['403', 'permission_error', 'No', 'Insufficient balance or unauthorized'],
        ['404', 'not_found_error', 'No', 'Check endpoint and model id'],
        ['429', 'rate_limit_error', 'Yes', 'Exponential backoff'],
        ['500', 'internal_error', 'Yes', 'Retry later'],
        ['502', 'upstream_error', 'Yes', 'Configure fallback'],
        ['503', 'service_unavailable', 'Yes', 'Retry or switch'],
      ] },
      { type: 'callout', kind: 'tip', text: '4xx errors are almost always client bugs — retrying is pointless. Only retry 429 and 5xx.' },
    ],
  },
  'advanced/routing': {
    title: 'Provider Routing',
    badge: 'Advanced',
    desc: 'A model can be served by multiple providers. Routing strategies balance stability, cost, and latency.',
    sections: [
      { type: 'h2', text: 'Four Strategies' },
      { type: 'table', headers: ['Strategy', 'Behavior', 'Use Case'], rows: [
        ['priority', 'Order by priority (default)', 'Stable production'],
        ['cost', 'Cheapest first', 'Batch / offline'],
        ['latency', 'Lowest latency first', 'Real-time chat'],
        ['balanced', 'Load balanced', 'High concurrency'],
      ] },
      { type: 'h2', text: 'Configuration' },
      { type: 'code', lang: 'python', code: `resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "hi"}],
    extra_body={"provider": {"routing": "cost"}},
)` },
    ],
  },
  'advanced/fallback': {
    title: 'Fallback',
    badge: 'Advanced',
    desc: 'When the primary model fails, automatically switch to backup models. Essential for production reliability.',
    sections: [
      { type: 'h2', text: 'How It Works' },
      { type: 'list', items: [
        '1. Request goes to the primary model in the model field',
        '2. Primary returns a retryable error (5xx / 429 / timeout)',
        '3. Gateway tries fallback models in order',
        '4. Returns the first successful response',
      ] },
      { type: 'h2', text: 'Configuration' },
      { type: 'code', lang: 'python', code: `resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "hi"}],
    extra_body={
        "provider": {
            "fallback": ["claude-sonnet-4.5", "gemini-2.5-flash"]
        }
    },
)` },
      { type: 'callout', kind: 'tip', text: 'Cross-vendor fallback chains are more reliable than single-vendor (avoids correlated failures). Use 2-3 different vendors per chain.' },
    ],
  },
  'advanced/cache': {
    title: 'Prompt Caching',
    badge: 'Advanced',
    desc: 'When multiple requests share a common prompt prefix, caching reduces input cost by 50-90%.',
    sections: [
      { type: 'h2', text: 'How It Works' },
      { type: 'list', items: [
        'First request: process prompt fully and cache the prefix',
        'Subsequent requests: matched prefix is read from cache',
        'Cache hits are billed at ~10-50% of regular price',
        'Default TTL is 5-10 minutes; some vendors support 1 hour',
      ] },
      { type: 'h2', text: 'OpenAI Protocol (automatic)' },
      { type: 'code', lang: 'python', code: `# First call (writes cache)
client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": LONG_DOCUMENT},
        {"role": "user", "content": "Summarize"},
    ],
)

# Second call (cache hit)
client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": LONG_DOCUMENT},
        {"role": "user", "content": "Find key people"},
    ],
)` },
    ],
  },
  'observability/dashboard': {
    title: 'Console Overview',
    badge: 'Observability',
    desc: 'The console is the unified entry point for usage, debugging, and key management.',
    sections: [
      { type: 'h2', text: 'Modules' },
      { type: 'cards', items: [
        { title: 'Dashboard', desc: 'Live request count, token consumption, cost, latency.' },
        { title: 'Tokens', desc: 'Create, disable, delete API keys with quotas and model limits.' },
        { title: 'Logs', desc: 'Per-request time, model, status, usage, cost.' },
        { title: 'Wallet', desc: 'Top up, view balance changes, export bills.' },
        { title: 'Channels', desc: 'Admin: configure upstream providers.' },
        { title: 'Settings', desc: 'Admin: global policies, permissions, billing rules.' },
      ] },
    ],
  },
  'observability/usage': {
    title: 'Usage Tracking',
    badge: 'Observability',
    desc: 'Track every request via logs and the API response usage field.',
    sections: [
      { type: 'h2', text: 'From API Response' },
      { type: 'code', lang: 'python', code: `resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "hi"}],
)
print(resp.usage)
# CompletionUsage(prompt_tokens=8, completion_tokens=12, total_tokens=20)` },
    ],
  },
  'observability/billing': {
    title: 'Billing',
    badge: 'Observability',
    desc: 'Pure pay-as-you-go billing. No subscriptions, no minimums.',
    sections: [
      { type: 'h2', text: 'Cost Items' },
      { type: 'table', headers: ['Item', 'Billing'], rows: [
        ['Input tokens', 'prompt tokens × input rate'],
        ['Output tokens', 'completion tokens × output rate'],
        ['Cache read', 'cached tokens × cache rate (cheaper)'],
        ['Image gen', 'per image × rate'],
        ['Embeddings', 'per token × rate'],
      ] },
      { type: 'h2', text: 'Cost Optimization' },
      { type: 'cards', items: [
        { title: 'Right-size models', desc: 'Use mini/flash for simple tasks, opus/o3 only when needed.' },
        { title: 'Enable caching', desc: 'Save 50-90% on repeated prompts with prompt caching.' },
        { title: 'Set max_tokens', desc: 'Limit output length to control per-call cost.' },
        { title: 'Batch requests', desc: 'Combine short calls to amortize system prompt overhead.' },
      ] },
    ],
  },

  // ============================================================
  // API Reference (en)
  // ============================================================

  api: {
    title: 'API Reference Overview',
    badge: 'API Reference',
    desc: 'This gateway exposes three protocol surfaces: OpenAI-compatible, Anthropic-native, and Gemini-native. This page lists every available endpoint for quick navigation.',
    sections: [
      { type: 'h2', text: 'Base URLs' },
      { type: 'table', headers: ['Protocol', 'Base URL', 'Auth Header'], rows: [
        ['OpenAI Compatible', 'https://your-domain/v1', 'Authorization: Bearer sk-xxx'],
        ['Anthropic Native', 'https://your-domain/anthropic', 'x-api-key: sk-xxx'],
        ['Gemini Native', 'https://your-domain/gemini', 'x-goog-api-key: sk-xxx'],
      ] },
      { type: 'h2', text: 'Endpoint Catalog' },
      { type: 'cards', items: [
        { title: 'OpenAI Compatible', badge: 'Recommended', desc: 'Chat Completions, Responses, Embeddings, Images, Models — 6 endpoints.' },
        { title: 'Anthropic Native', desc: 'Messages, Models, Models Count for native Claude experience.' },
        { title: 'Gemini Native', desc: 'generateContent, Models, Models Count for native Google GenAI.' },
      ] },
      { type: 'h2', text: 'Common Error Codes' },
      { type: 'table', headers: ['Code', 'Type', 'Description'], rows: [
        ['200', 'success', 'OK'],
        ['400', 'invalid_request_error', 'Bad parameters'],
        ['401', 'authentication_error', 'Invalid API key'],
        ['403', 'permission_error', 'No balance or unauthorized'],
        ['404', 'not_found_error', 'Resource not found'],
        ['429', 'rate_limit_error', 'Rate limited'],
        ['500', 'internal_error', 'Server error'],
        ['502', 'upstream_error', 'Upstream provider failed'],
      ] },
      { type: 'h2', text: 'Extension Parameters' },
      { type: 'p', text: 'All endpoints accept a provider field for routing strategy and fallback configuration. See the Advanced section for details.' },
    ],
  },

  'api/chat': {
    title: 'Chat Completions',
    badge: 'OpenAI API',
    desc: 'The most-used conversation endpoint, fully OpenAI v1 compatible. Supports streaming, tool calls, multimodal input, and structured output.',
    sections: [
      { type: 'h2', text: 'Endpoint' },
      { type: 'code', lang: 'http', code: 'POST https://your-domain/v1/chat/completions' },
      { type: 'h2', text: 'Request Parameters' },
      { type: 'table', headers: ['Parameter', 'Type', 'Required', 'Description'], rows: [
        ['model', 'string', 'Yes', 'Model id, e.g. gpt-4o'],
        ['messages', 'array', 'Yes', 'Conversation messages (role + content)'],
        ['stream', 'boolean', 'No', 'Enable SSE streaming'],
        ['temperature', 'number', 'No', 'Sampling temperature 0-2'],
        ['top_p', 'number', 'No', 'Nucleus sampling threshold'],
        ['max_tokens', 'integer', 'No', 'Max tokens to generate'],
        ['tools', 'array', 'No', 'Function calling definitions'],
        ['tool_choice', 'string|object', 'No', 'Tool selection strategy'],
        ['response_format', 'object', 'No', 'JSON Mode / JSON Schema'],
        ['provider', 'object', 'No', 'Routing & fallback extensions'],
      ] },
      { type: 'h2', text: 'Response' },
      { type: 'code', lang: 'json', code: `{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "model": "gpt-4o",
  "choices": [{
    "message": { "role": "assistant", "content": "Hello" },
    "finish_reason": "stop"
  }],
  "usage": { "prompt_tokens": 8, "completion_tokens": 5, "total_tokens": 13 }
}` },
    ],
  },

  'api/responses': {
    title: 'Responses API',
    badge: 'OpenAI API',
    desc: "OpenAI's next-generation generation endpoint. Compared to Chat Completions, it natively supports tool-call flows, structured event streams, and system-prompt caching. Recommended for new projects.",
    sections: [
      { type: 'h2', text: 'Endpoint' },
      { type: 'code', lang: 'http', code: 'POST https://your-domain/v1/responses' },
      { type: 'h2', text: 'Why Responses?' },
      { type: 'cards', items: [
        { title: 'Instruction Caching', badge: 'Cache-friendly', desc: 'instructions field is separate from input and is automatically reused as a cache prefix, saving up to 50% on input tokens.' },
        { title: 'Structured Output', desc: 'output is an item array — each item is either a message or tool_call, no need to parse choices manually.' },
        { title: 'Granular Events', desc: 'When streaming, events are categorized as response.created / response.output_text.delta / response.completed.' },
      ] },
      { type: 'h2', text: 'Request Parameters' },
      { type: 'table', headers: ['Parameter', 'Type', 'Required', 'Description'], rows: [
        ['model', 'string', 'Yes', 'Model id'],
        ['input', 'string|array', 'Yes', 'User input (string or structured array)'],
        ['instructions', 'string', 'No', 'System instructions, cached independently'],
        ['stream', 'boolean', 'No', 'Enable SSE event stream'],
        ['max_output_tokens', 'integer', 'No', 'Max tokens to generate'],
        ['tools', 'array', 'No', 'Tool definitions'],
        ['provider', 'object', 'No', 'Routing & fallback'],
      ] },
    ],
  },

  'api/embeddings': {
    title: 'Embeddings',
    badge: 'OpenAI API',
    desc: 'Convert text into high-dimensional vectors for semantic search, clustering, recommendations, and RAG.',
    sections: [
      { type: 'h2', text: 'Endpoint' },
      { type: 'code', lang: 'http', code: 'POST https://your-domain/v1/embeddings' },
      { type: 'h2', text: 'Parameters' },
      { type: 'table', headers: ['Parameter', 'Type', 'Required', 'Description'], rows: [
        ['model', 'string', 'Yes', 'Embedding model id'],
        ['input', 'string|array', 'Yes', 'Text or array of texts (batch)'],
        ['encoding_format', 'string', 'No', 'float (default) or base64'],
        ['dimensions', 'integer', 'No', 'Output vector dimension (model-dependent)'],
      ] },
      { type: 'h2', text: 'Common Models' },
      { type: 'table', headers: ['Model', 'Dimensions', 'Notes'], rows: [
        ['text-embedding-3-small', '1536', 'Cost-effective'],
        ['text-embedding-3-large', '3072', 'Highest accuracy'],
        ['bge-m3', '1024', 'Multilingual'],
      ] },
    ],
  },

  'api/models': {
    title: 'Models List',
    badge: 'OpenAI API',
    desc: 'List all available models with metadata (context length, pricing, supported parameters). No auth required.',
    sections: [
      { type: 'h2', text: 'Endpoint' },
      { type: 'code', lang: 'http', code: `GET https://your-domain/v1/models
GET https://your-domain/v1/models/{provider}` },
      { type: 'h2', text: 'Response' },
      { type: 'code', lang: 'json', code: `{
  "object": "list",
  "data": [{
    "id": "gpt-4o",
    "object": "model",
    "owned_by": "openai",
    "context_length": 128000,
    "pricing": {
      "prompt": "0.0000025",
      "completion": "0.00001"
    }
  }]
}` },
    ],
  },

  'api/models-count': {
    title: 'Models Count',
    badge: 'OpenAI API',
    desc: 'Lightweight endpoint that returns just the count of available models — for monitoring and UI display.',
    sections: [
      { type: 'h2', text: 'Endpoint' },
      { type: 'code', lang: 'http', code: 'GET https://your-domain/v1/models/count' },
      { type: 'h2', text: 'Response' },
      { type: 'code', lang: 'json', code: `{ "data": { "count": 87 } }` },
    ],
  },

  'api/images': {
    title: 'Images',
    badge: 'OpenAI API',
    desc: 'Generate images from text prompts. Compatible with the OpenAI Images API and supports DALL-E, Stable Diffusion, and more.',
    sections: [
      { type: 'h2', text: 'Endpoint' },
      { type: 'code', lang: 'http', code: 'POST https://your-domain/v1/images/generations' },
      { type: 'h2', text: 'Parameters' },
      { type: 'table', headers: ['Parameter', 'Type', 'Required', 'Description'], rows: [
        ['model', 'string', 'Yes', 'Image model id, e.g. dall-e-3'],
        ['prompt', 'string', 'Yes', 'Image description text'],
        ['n', 'integer', 'No', 'Number of images, default 1'],
        ['size', 'string', 'No', '1024x1024 / 1792x1024 / etc.'],
        ['quality', 'string', 'No', 'standard or hd'],
        ['response_format', 'string', 'No', 'url or b64_json'],
      ] },
    ],
  },

  'api/anthropic/messages': {
    title: 'Messages',
    badge: 'Anthropic API',
    desc: "Native Claude Messages API. Preserves all of Claude's exclusive capabilities (caching, Extended Thinking, Citations) without protocol translation overhead.",
    sections: [
      { type: 'h2', text: 'Endpoint' },
      { type: 'code', lang: 'http', code: 'POST https://your-domain/anthropic/v1/messages' },
      { type: 'h2', text: 'Headers' },
      { type: 'code', lang: 'http', code: `x-api-key: sk-xxx
anthropic-version: 2023-06-01` },
      { type: 'h2', text: 'Parameters' },
      { type: 'table', headers: ['Parameter', 'Type', 'Required', 'Description'], rows: [
        ['model', 'string', 'Yes', 'Claude model id'],
        ['max_tokens', 'integer', 'Yes', 'Max tokens to generate (required)'],
        ['messages', 'array', 'Yes', 'Conversation messages'],
        ['system', 'string|array', 'No', 'System prompt (supports cache_control)'],
        ['temperature', 'number', 'No', '0-1'],
        ['stream', 'boolean', 'No', 'Enable streaming'],
        ['tools', 'array', 'No', 'Tool definitions (input_schema format)'],
      ] },
      { type: 'callout', kind: 'tip', text: 'Native Messages API unlocks Anthropic Prompt Caching — identical system prefixes save up to 90% input cost.' },
    ],
  },

  'api/anthropic/models': {
    title: 'Models List',
    badge: 'Anthropic API',
    desc: 'List models available via the Anthropic protocol. Response shape follows Anthropic conventions.',
    sections: [
      { type: 'h2', text: 'Endpoint' },
      { type: 'code', lang: 'http', code: `GET https://your-domain/anthropic/v1/models
GET https://your-domain/anthropic/v1/models/{provider}
GET https://your-domain/anthropic/v1/models/{provider}/{model_id}` },
      { type: 'p', text: 'Public endpoint, no API key required.' },
    ],
  },

  'api/anthropic/models-count': {
    title: 'Models Count',
    badge: 'Anthropic API',
    desc: 'Total count of models available via the Anthropic protocol.',
    sections: [
      { type: 'h2', text: 'Endpoint' },
      { type: 'code', lang: 'http', code: 'GET https://your-domain/anthropic/v1/models/count' },
      { type: 'h2', text: 'Response' },
      { type: 'code', lang: 'json', code: `{ "data": { "count": 12 } }` },
    ],
  },

  'api/gemini/generate': {
    title: 'generateContent',
    badge: 'Gemini API',
    desc: 'Native Gemini generation endpoint, compatible with the Google GenAI SDK. Supports text, multimodal, and video input.',
    sections: [
      { type: 'h2', text: 'Endpoint' },
      { type: 'code', lang: 'http', code: `POST https://your-domain/gemini/v1beta/models/{model}:generateContent
POST https://your-domain/gemini/v1beta/models/{model}:streamGenerateContent` },
      { type: 'h2', text: 'Auth' },
      { type: 'code', lang: 'http', code: 'x-goog-api-key: sk-xxx' },
      { type: 'h2', text: 'Request Body' },
      { type: 'code', lang: 'json', code: `{
  "contents": [
    {
      "role": "user",
      "parts": [{ "text": "Hello, introduce yourself" }]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 1024
  }
}` },
    ],
  },

  'api/gemini/models': {
    title: 'Models List',
    badge: 'Gemini API',
    desc: 'List models available via the Gemini protocol. Response follows the Google GenAI camelCase convention.',
    sections: [
      { type: 'h2', text: 'Endpoint' },
      { type: 'code', lang: 'http', code: `GET https://your-domain/gemini/v1beta/models
GET https://your-domain/gemini/v1beta/models/{provider}` },
      { type: 'callout', kind: 'info', text: 'Note: Gemini fields use camelCase (inputTokenLimit), unlike the snake_case used by OpenAI.' },
    ],
  },

  'api/gemini/models-count': {
    title: 'Models Count',
    badge: 'Gemini API',
    desc: 'Total count of models available via the Gemini protocol.',
    sections: [
      { type: 'h2', text: 'Endpoint' },
      { type: 'code', lang: 'http', code: 'GET https://your-domain/gemini/v1beta/models/count' },
      { type: 'h2', text: 'Response' },
      { type: 'code', lang: 'json', code: `{ "data": { "count": 8 } }` },
    ],
  },
};

// Doc tree (sidebar structure)
export const docTree = (lang) => {
  const t = lang === 'en'
    ? {
      group_guides: 'Guides',
      group_advanced: 'Advanced',
      group_observability: 'Observability',
      group_openai: 'OpenAI API',
      group_anthropic: 'Anthropic API',
      group_gemini: 'Gemini API',
    }
    : {
      group_guides: '进阶指南',
      group_advanced: '高级功能',
      group_observability: '可观测性',
      group_openai: 'OpenAI 协议',
      group_anthropic: 'Anthropic 协议',
      group_gemini: 'Gemini 协议',
    };
  return [
    { type: 'item', slug: 'getting-started' },
    { type: 'item', slug: 'auth' },
    { type: 'item', slug: 'models' },
    { type: 'group', label: t.group_guides, items: [
      { slug: 'guides/streaming' },
      { slug: 'guides/functions' },
      { slug: 'guides/vision' },
      { slug: 'guides/json' },
      { slug: 'guides/errors' },
    ] },
    { type: 'group', label: t.group_advanced, items: [
      { slug: 'advanced/routing' },
      { slug: 'advanced/fallback' },
      { slug: 'advanced/cache' },
    ] },
    { type: 'group', label: t.group_observability, items: [
      { slug: 'observability/dashboard' },
      { slug: 'observability/usage' },
      { slug: 'observability/billing' },
    ] },
    { type: 'item', slug: 'api' },
    { type: 'group', label: t.group_openai, items: [
      { slug: 'api/chat' },
      { slug: 'api/responses' },
      { slug: 'api/embeddings' },
      { slug: 'api/models' },
      { slug: 'api/models-count' },
      { slug: 'api/images' },
    ] },
    { type: 'group', label: t.group_anthropic, items: [
      { slug: 'api/anthropic/messages' },
      { slug: 'api/anthropic/models' },
      { slug: 'api/anthropic/models-count' },
    ] },
    { type: 'group', label: t.group_gemini, items: [
      { slug: 'api/gemini/generate' },
      { slug: 'api/gemini/models' },
      { slug: 'api/gemini/models-count' },
    ] },
  ];
};

/**
 * 递归将 doc 对象中所有字符串里的 "your-domain" 替换为当前站点的 origin。
 * baseUrl 传入 window.location.origin（如 "https://api.example.com"）。
 * content.js 中统一使用占位符 "your-domain"，无需在每处硬编码真实域名。
 */
const DOMAIN_PLACEHOLDER = 'your-domain';

const replaceDomain = (value, origin) => {
  if (typeof value === 'string') {
    // 将 "https://your-domain" 整体替换为 origin，兼顾带协议和不带协议的写法
    return value
      .replace(/https:\/\/your-domain/g, origin)
      .replace(/your-domain/g, origin.replace(/^https?:\/\//, ''));
  }
  if (Array.isArray(value)) return value.map((v) => replaceDomain(v, origin));
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value)) out[k] = replaceDomain(value[k], origin);
    return out;
  }
  return value;
};

export const getDoc = (slug, lang, baseUrl) => {
  const dict = lang === 'en' ? en : zh;
  const doc = dict[slug] || null;
  if (!doc || !baseUrl) return doc;
  return replaceDomain(doc, baseUrl);
};

export const allSlugsFlat = [
  'getting-started', 'auth', 'models',
  'guides/streaming', 'guides/functions', 'guides/vision', 'guides/json', 'guides/errors',
  'advanced/routing', 'advanced/fallback', 'advanced/cache',
  'observability/dashboard', 'observability/usage', 'observability/billing',
  'api',
  'api/chat', 'api/responses', 'api/embeddings', 'api/models', 'api/models-count', 'api/images',
  'api/anthropic/messages', 'api/anthropic/models', 'api/anthropic/models-count',
  'api/gemini/generate', 'api/gemini/models', 'api/gemini/models-count',
];
