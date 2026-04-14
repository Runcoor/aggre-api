/**
 * Guide content for all tutorial categories.
 *
 * Each tool has:
 *   - id, name, desc, url
 *   - steps: array of { zh, en } — numbered instructions (DETAILED for beginners)
 *   - code: { lang, filename, content } — copy-able snippet
 *   - tip: { zh, en } — helpful hint
 *   - videos: [{ url, title: {zh,en}, platform: 'bilibili'|'youtube', author }]
 *   - externalLinks: [{ url, title: {zh,en} }]
 *
 * Placeholders: {{BASE_URL}}, {{API_KEY}}
 */

const GUIDE_CONTENT = {
  /* ================================================================
   * 1. AI 编程助手
   * ================================================================ */
  'coding-assistants': {
    title: { zh: 'AI 编程助手', en: 'AI Coding Assistants' },
    desc: {
      zh: '将 API 接入 AI 编程助手，让 AI 帮你写代码、改 Bug、做代码审查。以下教程会手把手教你配置每一个工具。',
      en: 'Connect your API to AI coding assistants. These step-by-step tutorials will walk you through configuring each tool.',
    },
    tools: [
      {
        id: 'claude-code',
        name: 'Claude Code',
        desc: {
          zh: 'Anthropic 官方命令行 AI 编程助手，直接在终端中与 AI 协作编程。适合有一定终端使用经验的开发者。',
          en: "Anthropic's official CLI AI coding assistant. Works directly in your terminal.",
        },
        url: 'https://docs.anthropic.com/en/docs/claude-code/overview',
        nodejsRequired: true,
        steps: [
          {
            zh: '在终端输入以下命令安装 Claude Code（可能需要几分钟）：\nnpm install -g @anthropic-ai/claude-code\n安装完成后输入 claude --version 确认安装成功。',
            en: 'Install Claude Code by running this command (may take a few minutes):\nnpm install -g @anthropic-ai/claude-code\nAfter installation, type claude --version to confirm it worked.',
          },
          {
            zh: '现在需要告诉 Claude Code 使用你的 API。打开你的 Shell 配置文件：\n- Mac/Linux 用户：在终端输入 nano ~/.zshrc（或 nano ~/.bashrc）\n- Windows 用户：在 PowerShell 输入 notepad $PROFILE\n在文件末尾添加下方代码框中的两行，然后保存退出。',
            en: 'Now tell Claude Code to use your API. Open your shell config file:\n- Mac/Linux: type nano ~/.zshrc (or nano ~/.bashrc) in terminal\n- Windows: type notepad $PROFILE in PowerShell\nAdd the two lines from the code box below at the end of the file, save and exit.',
          },
          {
            zh: '让配置生效：\n- Mac/Linux：终端输入 source ~/.zshrc（或 source ~/.bashrc）\n- Windows：关闭并重新打开 PowerShell',
            en: 'Apply the config:\n- Mac/Linux: type source ~/.zshrc (or source ~/.bashrc)\n- Windows: close and reopen PowerShell',
          },
          {
            zh: '在你的项目目录中输入 claude 回车，即可启动 Claude Code。它会自动使用你配置的 API 地址和密钥。你可以用自然语言告诉它你想做什么，比如"帮我写一个登录页面"。',
            en: 'Navigate to your project directory and type claude to start. It will automatically use your configured API. Tell it what you want in natural language, like "help me build a login page".',
          },
        ],
        code: {
          lang: 'bash',
          filename: '.zshrc / .bashrc / PowerShell $PROFILE',
          content: `export ANTHROPIC_BASE_URL="{{BASE_URL}}"
export ANTHROPIC_AUTH_TOKEN="{{API_KEY}}"`,
        },
        tip: {
          zh: '如果你不确定自己用的是 bash 还是 zsh，在 Mac 终端输入 echo $SHELL 查看。macOS Catalina 及以上默认是 zsh。',
          en: 'Not sure if you use bash or zsh? Type echo $SHELL in Mac terminal. macOS Catalina+ defaults to zsh.',
        },
        videos: [
          { url: 'https://www.bilibili.com/video/BV1Pr6dBPEET/', title: { zh: '7分钟搞定 Claude Code 安装和多模型配置', en: 'Claude Code Setup & Multi-model Config in 7 Min' }, platform: 'bilibili', author: '零点未来' },
        ],
        externalLinks: [
          { url: 'https://docs.anthropic.com/en/docs/claude-code/overview', title: { zh: 'Claude Code 官方文档', en: 'Claude Code Official Docs' } },
        ],
      },
      {
        id: 'cursor',
        name: 'Cursor',
        desc: {
          zh: '基于 VS Code 的 AI 编程 IDE，内置 AI 代码补全、聊天、代码修改功能。安装后即可像 VS Code 一样使用，但多了强大的 AI 能力。',
          en: 'VS Code-based AI IDE with built-in AI code completion, chat, and code editing. Works like VS Code but with powerful AI features.',
        },
        url: 'https://cursor.com',
        steps: [
          {
            zh: '打开浏览器访问 https://cursor.com，点击页面上的 "Download" 按钮，下载适合你系统的安装包（Windows/Mac/Linux），然后双击安装。安装过程和安装普通软件一样，一路点下一步就行。',
            en: 'Open https://cursor.com in your browser, click "Download", get the installer for your OS (Windows/Mac/Linux), and double-click to install. Just click Next through the installer like any other app.',
          },
          {
            zh: '打开 Cursor。如果你之前用过 VS Code，Cursor 会问你是否导入 VS Code 的设置和扩展，建议选"是"。',
            en: 'Open Cursor. If you used VS Code before, Cursor will ask to import your settings and extensions — choose Yes.',
          },
          {
            zh: '点击左下角的齿轮图标（⚙️）打开设置，或者使用快捷键 Ctrl+,（Mac 是 Cmd+,）。在设置页面上方的搜索框中搜索 "OpenAI"。',
            en: 'Click the gear icon (⚙️) at the bottom-left to open Settings, or use Ctrl+, (Cmd+, on Mac). Search "OpenAI" in the search box at the top.',
          },
          {
            zh: '找到 "Models" 设置项，点击进入。你会看到一个 "OpenAI API Key" 输入框 —— 把你的 API Key 粘贴进去。',
            en: 'Find "Models" settings and click in. You\'ll see an "OpenAI API Key" input field — paste your API Key there.',
          },
          {
            zh: '勾选 "Override OpenAI Base URL" 选项，在出现的输入框中填入你的 API 地址（见下方代码框）。注意地址末尾要加上 /v1。',
            en: 'Check "Override OpenAI Base URL", and enter your API address in the field that appears (see code box below). Make sure to add /v1 at the end.',
          },
          {
            zh: '点击 "Save" 保存。现在你可以在 Cursor 中使用 AI 功能了：\n- 按 Ctrl+K（Mac: Cmd+K）在代码中让 AI 帮你编辑\n- 按 Ctrl+L（Mac: Cmd+L）打开 AI 聊天窗口提问\n- 在代码中按 Tab 接受 AI 的自动补全建议',
            en: 'Click "Save". Now you can use AI in Cursor:\n- Press Ctrl+K (Cmd+K on Mac) to let AI edit your code\n- Press Ctrl+L (Cmd+L on Mac) to open AI chat\n- Press Tab in code to accept AI auto-completion',
          },
        ],
        code: {
          lang: 'text',
          filename: 'Cursor Settings → Models',
          content: `OpenAI API Key:           {{API_KEY}}

✅ Override OpenAI Base URL
Base URL:                 {{BASE_URL}}/v1`,
        },
        tip: {
          zh: 'Cursor 默认使用的模型可能会消耗较多额度。你可以在设置中切换为更经济的模型（如 gpt-4o-mini），日常编码足够用了。',
          en: 'Cursor defaults may use more credits. You can switch to a cheaper model (like gpt-4o-mini) in settings — enough for daily coding.',
        },
        videos: [
          { url: 'https://www.bilibili.com/video/BV1aDMezREUj/', title: { zh: 'Cursor 使用教程，2小时玩转 Cursor', en: 'Cursor Tutorial — Master Cursor in 2 Hours' }, platform: 'bilibili', author: '尚硅谷' },
        ],
        externalLinks: [
          { url: 'https://docs.cursor.com', title: { zh: 'Cursor 官方文档', en: 'Cursor Official Docs' } },
        ],
      },
      {
        id: 'cline',
        name: 'Cline',
        desc: {
          zh: 'VS Code 扩展，AI 自动编程助手。它可以自主编写、修改文件，甚至运行终端命令。你只需要用自然语言描述任务。',
          en: 'VS Code extension — an autonomous AI assistant that writes, edits files, and runs terminal commands. Just describe your task.',
        },
        url: 'https://github.com/cline/cline',
        steps: [
          {
            zh: '打开 VS Code（如果没有安装，去 https://code.visualstudio.com 下载）。',
            en: 'Open VS Code (download from https://code.visualstudio.com if not installed).',
          },
          {
            zh: '点击左侧边栏的扩展图标（四个方块的图标），在搜索框中输入 "Cline"，找到 Cline 扩展，点击 "Install" 安装。安装完成后左侧边栏会出现 Cline 的图标。',
            en: 'Click the Extensions icon on the left sidebar (four squares), search "Cline", find the extension, and click "Install". After installation, a Cline icon appears on the sidebar.',
          },
          {
            zh: '点击左侧的 Cline 图标打开面板。第一次打开会让你配置 API。在 "API Provider" 下拉菜单中选择 "OpenAI Compatible"。',
            en: 'Click the Cline icon on the left to open the panel. On first open, it will ask you to configure the API. Select "OpenAI Compatible" from the "API Provider" dropdown.',
          },
          {
            zh: '在 "Base URL" 输入框中填入你的 API 地址（见下方代码框），注意末尾要有 /v1。在 "API Key" 输入框中粘贴你的密钥。',
            en: 'Enter your API address in "Base URL" (see code box below) — include /v1 at the end. Paste your key in the "API Key" field.',
          },
          {
            zh: '在 "Model ID" 输入框中，输入你想使用的模型名称，例如 claude-sonnet-4-20250514 或 gpt-4o。然后点击 "Save" 或 "Let\'s go" 按钮。',
            en: 'In the "Model ID" field, type the model you want, e.g., claude-sonnet-4-20250514 or gpt-4o. Click "Save" or "Let\'s go".',
          },
          {
            zh: '配置完成！现在你可以在 Cline 聊天框中用自然语言告诉 AI 你想做什么，比如：\n- "帮我创建一个 React 登录组件"\n- "修复这个文件中的 bug"\n- "给这段代码添加单元测试"\nCline 会自动创建和修改文件，你只需要确认即可。',
            en: 'Done! Now type in the Cline chat what you want AI to do:\n- "Create a React login component"\n- "Fix the bug in this file"\n- "Add unit tests for this code"\nCline will create and edit files — just approve the changes.',
          },
        ],
        code: {
          lang: 'text',
          filename: 'Cline Extension Settings',
          content: `API Provider:   OpenAI Compatible
Base URL:       {{BASE_URL}}/v1
API Key:        {{API_KEY}}
Model ID:       claude-sonnet-4-20250514`,
        },
        tip: {
          zh: 'Cline 在执行操作前会先向你展示它准备做什么（创建文件、修改代码、运行命令等），你可以逐步确认或拒绝，不用担心它乱改你的代码。',
          en: "Cline shows you what it plans to do before each action (create files, edit code, run commands). You approve or reject each step, so it won't mess up your code.",
        },
        videos: [
          { url: 'https://www.bilibili.com/video/BV1vDc2eEE8D/', title: { zh: 'DeepSeek+VSCode+Cline 零成本打造AI编辑器', en: 'DeepSeek+VSCode+Cline — Free AI Editor Setup' }, platform: 'bilibili' },
        ],
        externalLinks: [
          { url: 'https://github.com/cline/cline#readme', title: { zh: 'Cline GitHub 说明文档', en: 'Cline GitHub README' } },
        ],
      },
      {
        id: 'codex-cli',
        name: 'Codex CLI (OpenAI)',
        desc: {
          zh: 'OpenAI 官方命令行编程助手，在终端中与 AI 协作。和 Claude Code 类似，但使用 OpenAI 系列模型。',
          en: "OpenAI's official CLI assistant for terminal-based AI collaboration. Similar to Claude Code but uses OpenAI models.",
        },
        url: 'https://github.com/openai/codex',
        nodejsRequired: true,
        steps: [
          {
            zh: '在终端输入以下命令安装：npm install -g @openai/codex\n等待安装完成，输入 codex --version 确认。',
            en: 'Install by running: npm install -g @openai/codex\nWait for installation, type codex --version to confirm.',
          },
          {
            zh: '打开你的 Shell 配置文件（Mac: nano ~/.zshrc，Linux: nano ~/.bashrc，Windows: notepad $PROFILE），在末尾添加下方代码框中的两行环境变量，保存退出。',
            en: 'Open your shell config (Mac: nano ~/.zshrc, Linux: nano ~/.bashrc, Windows: notepad $PROFILE), add the two env vars from the code box below at the end, save and exit.',
          },
          {
            zh: '重新加载配置（Mac/Linux: source ~/.zshrc，Windows: 重启 PowerShell），然后在你的项目目录中输入 codex 启动。',
            en: 'Reload config (Mac/Linux: source ~/.zshrc, Windows: restart PowerShell), then type codex in your project directory to start.',
          },
        ],
        code: {
          lang: 'bash',
          filename: '.zshrc / .bashrc / PowerShell $PROFILE',
          content: `export OPENAI_BASE_URL="{{BASE_URL}}/v1"
export OPENAI_API_KEY="{{API_KEY}}"`,
        },
        videos: [
          { url: 'https://youtu.be/MuhMSkQVpio', title: { zh: 'OpenAI Codex CLI 使用教程', en: 'OpenAI Codex CLI Tutorial' }, platform: 'youtube' },
        ],
        externalLinks: [
          { url: 'https://www.datacamp.com/tutorial/open-ai-codex-cli-tutorial', title: { zh: 'DataCamp: Codex CLI 完整教程', en: 'DataCamp: Codex CLI Tutorial' } },
          { url: 'https://developers.openai.com/codex/quickstart', title: { zh: 'Codex CLI 官方快速开始', en: 'Codex CLI Official Quickstart' } },
        ],
      },
      {
        id: 'opencode',
        name: 'OpenCode',
        desc: {
          zh: '开源终端 AI 编程助手，轻量快速。支持通过配置文件或环境变量接入自定义 API。',
          en: 'Open-source terminal AI coding assistant — lightweight and fast. Supports custom API via config or env vars.',
        },
        url: 'https://github.com/opencode-ai/opencode',
        steps: [
          {
            zh: '参考 GitHub 仓库的安装说明安装 OpenCode（不同系统安装方式不同）。',
            en: 'Follow the GitHub repo installation instructions (varies by OS).',
          },
          {
            zh: '方式一（推荐）：创建配置文件。在终端运行：mkdir -p ~/.config/opencode，然后创建 config.json 文件，内容见下方代码框。',
            en: 'Option 1 (recommended): Create a config file. Run: mkdir -p ~/.config/opencode, then create config.json with the content below.',
          },
          {
            zh: '方式二：使用环境变量。和 Codex CLI 一样，在 Shell 配置文件中添加 OPENAI_BASE_URL 和 OPENAI_API_KEY。',
            en: 'Option 2: Use environment variables. Same as Codex CLI — add OPENAI_BASE_URL and OPENAI_API_KEY to your shell config.',
          },
          {
            zh: '在项目目录中运行 opencode 启动。用自然语言描述你的编程任务即可。',
            en: 'Run opencode in your project directory. Describe your task in natural language.',
          },
        ],
        code: {
          lang: 'json',
          filename: '~/.config/opencode/config.json',
          content: `{
  "providers": {
    "my-api": {
      "apiKey": "{{API_KEY}}",
      "baseURL": "{{BASE_URL}}/v1"
    }
  }
}`,
        },
        videos: [
          { url: 'https://youtu.be/-utre-F_AIU', title: { zh: 'OpenCode 使用教程', en: 'OpenCode Tutorial' }, platform: 'youtube' },
        ],
        externalLinks: [
          { url: 'https://github.com/opencode-ai/opencode#readme', title: { zh: 'OpenCode GitHub 说明', en: 'OpenCode GitHub README' } },
        ],
      },
      {
        id: 'continue',
        name: 'Continue',
        desc: {
          zh: 'VS Code 和 JetBrains（IntelliJ IDEA、PyCharm 等）的开源 AI 编程扩展，支持代码补全和对话。',
          en: 'Open-source AI coding extension for VS Code and JetBrains (IntelliJ, PyCharm, etc.) — supports completion and chat.',
        },
        url: 'https://continue.dev',
        steps: [
          {
            zh: '在 VS Code 扩展商店搜索 "Continue" 并安装。JetBrains 用户在 Marketplace 搜索安装。',
            en: 'Search "Continue" in VS Code extensions and install. JetBrains users install from Marketplace.',
          },
          {
            zh: '安装后左侧边栏出现 Continue 图标，点击打开。首次会引导你配置。',
            en: 'After install, a Continue icon appears on the sidebar. Click to open — it will guide you through setup.',
          },
          {
            zh: '点击设置图标，选择 "Add Model"，Provider 选择 "OpenAI Compatible"。',
            en: 'Click the settings icon, choose "Add Model", set Provider to "OpenAI Compatible".',
          },
          {
            zh: '填入 API Key 和 Base URL（见下方代码框），模型名填入你想用的模型。点击保存。',
            en: 'Enter API Key and Base URL (see code box), model name for your preferred model. Click save.',
          },
          {
            zh: '配置完成！现在可以：\n- 在 Continue 面板中聊天提问\n- 选中代码后按 Ctrl+L（Cmd+L）让 AI 解释或修改\n- 编写代码时接受 AI 的自动补全',
            en: "Done! Now you can:\n- Chat in the Continue panel\n- Select code and press Ctrl+L (Cmd+L) for AI explanation\n- Accept AI auto-completions while coding",
          },
        ],
        code: {
          lang: 'json',
          filename: '~/.continue/config.json',
          content: `{
  "models": [
    {
      "title": "My API",
      "provider": "openai",
      "model": "claude-sonnet-4-20250514",
      "apiBase": "{{BASE_URL}}/v1",
      "apiKey": "{{API_KEY}}"
    }
  ]
}`,
        },
        videos: [
          { url: 'https://youtu.be/8tzlmScz5dY', title: { zh: 'Continue 使用教程', en: 'Continue Tutorial' }, platform: 'youtube' },
        ],
        externalLinks: [
          { url: 'https://docs.continue.dev/ide-extensions/quick-start', title: { zh: 'Continue 官方快速开始教程', en: 'Continue Official Quick Start' } },
          { url: 'https://docs.continue.dev', title: { zh: 'Continue 官方文档', en: 'Continue Official Docs' } },
        ],
      },
      {
        id: 'windsurf',
        name: 'Windsurf',
        desc: {
          zh: '基于 VS Code 的 AI IDE（前身 Codeium），界面和 VS Code 几乎一样，但内置了更流畅的 AI 编程体验。',
          en: 'VS Code-based AI IDE (formerly Codeium) — looks like VS Code but with smoother built-in AI experience.',
        },
        url: 'https://windsurf.com',
        steps: [
          {
            zh: '访问 https://windsurf.com 下载安装。安装过程和普通软件一样。如果你用过 VS Code，上手零成本。',
            en: 'Go to https://windsurf.com to download and install. If you\'ve used VS Code, the transition is seamless.',
          },
          {
            zh: '打开 Windsurf，点击右上角的设置图标，找到 AI → External Models 配置项。',
            en: 'Open Windsurf, click the settings icon at top-right, find AI → External Models.',
          },
          {
            zh: '添加一个新的模型配置：Type 选 "OpenAI Compatible"，填入 API Key 和 Base URL（见下方代码框）。',
            en: 'Add a new model: set Type to "OpenAI Compatible", enter API Key and Base URL (see code box).',
          },
          {
            zh: '保存后就可以使用了。在编辑器中按 Ctrl+I（Mac: Cmd+I）唤起 AI 对话，或直接享受代码自动补全。',
            en: 'Save and you\'re ready. Press Ctrl+I (Cmd+I on Mac) for AI chat, or enjoy auto-completions while coding.',
          },
        ],
        code: {
          lang: 'text',
          filename: 'Windsurf → Settings → AI → External Models',
          content: `Type:       OpenAI Compatible
API Key:    {{API_KEY}}
Base URL:   {{BASE_URL}}/v1`,
        },
        videos: [
          { url: 'https://www.bilibili.com/video/BV1gLYozLEqq/', title: { zh: 'Windsurf 保姆级入门与实战', en: 'Windsurf Beginner Guide & Practice' }, platform: 'bilibili', author: 'AI随风随风' },
        ],
        externalLinks: [
          { url: 'https://windsurf.com', title: { zh: 'Windsurf 官网', en: 'Windsurf Website' } },
        ],
      },
      {
        id: 'cherry-studio',
        name: 'Cherry Studio',
        desc: {
          zh: '跨平台桌面 AI 客户端（Windows/Mac/Linux），中文界面友好，支持多模型切换。既可以当聊天工具也可以辅助编程。',
          en: 'Cross-platform desktop AI client (Windows/Mac/Linux), Chinese-friendly, multi-model support.',
        },
        url: 'https://cherry-ai.com',
        steps: [
          {
            zh: '访问 https://cherry-ai.com 下载安装。支持 Windows、Mac 和 Linux。',
            en: 'Go to https://cherry-ai.com to download and install. Supports Windows, Mac, and Linux.',
          },
          {
            zh: '打开 Cherry Studio，进入设置（齿轮图标）→ 模型服务 → 点击"添加"按钮。',
            en: 'Open Cherry Studio, go to Settings (gear icon) → Model Service → click "Add".',
          },
          {
            zh: '服务类型选择 "OpenAI 兼容"，在 API 地址中填入你的地址（见下方代码框），填入 API Key。',
            en: 'Set service type to "OpenAI Compatible", enter your API address (see code box), and API Key.',
          },
          {
            zh: '点击"获取模型列表"按钮，会自动拉取可用模型。勾选你需要的模型，保存。',
            en: 'Click "Fetch Model List" to auto-load available models. Select the ones you need and save.',
          },
          {
            zh: '返回对话界面，在顶部选择刚才配置的服务和模型，就可以开始对话了。',
            en: 'Go back to chat, select your configured service and model at the top, and start chatting.',
          },
        ],
        code: {
          lang: 'text',
          filename: 'Cherry Studio → Settings → Model Service',
          content: `Service Type:   OpenAI Compatible
API URL:        {{BASE_URL}}
API Key:        {{API_KEY}}`,
        },
        videos: [
          { url: 'https://www.bilibili.com/video/BV1mwAZeBEco/', title: { zh: 'Cherry Studio 一键连接所有AI模型（安装使用指南）', en: 'Cherry Studio — Connect All AI Models (Setup Guide)' }, platform: 'bilibili', author: '_Smzh_' },
        ],
        externalLinks: [
          { url: 'https://cherry-ai.com', title: { zh: 'Cherry Studio 官网', en: 'Cherry Studio Website' } },
        ],
      },
    ],
  },

  /* ================================================================
   * 2. AI 对话客户端
   * ================================================================ */
  'chat-clients': {
    title: { zh: 'AI 对话客户端', en: 'AI Chat Clients' },
    desc: {
      zh: '通过第三方客户端与 AI 对话。这些客户端提供比官方更美观的界面、更多自定义选项、历史记录管理等功能。',
      en: 'Chat with AI through third-party clients offering better UI, customization, and chat history management.',
    },
    tools: [
      {
        id: 'chatgpt-next-web',
        name: 'ChatGPT Next Web (NextChat)',
        desc: {
          zh: '最流行的开源 ChatGPT 客户端。可以直接在浏览器中使用，也可以自己部署。界面简洁美观，支持 Markdown 渲染。',
          en: 'Most popular open-source ChatGPT client. Use directly in browser or self-deploy. Clean UI with Markdown support.',
        },
        url: 'https://github.com/ChatGPTNextWeb/ChatGPT-Next-Web',
        steps: [
          {
            zh: '最简单的方式：直接使用公共部署版本。打开浏览器访问 https://app.nextchat.dev（或搜索 "NextChat 在线版"）。',
            en: 'Easiest way: use a public deployment. Open https://app.nextchat.dev in your browser (or search "NextChat online").',
          },
          {
            zh: '进入后点击左下角的"设置"（⚙️ 齿轮图标）。',
            en: 'Click "Settings" (⚙️ gear icon) at the bottom-left.',
          },
          {
            zh: '向下滚动找到"接口地址"（或 "API Endpoint"），把默认的地址替换为你的 API 地址（见下方代码框）。注意：不需要加 /v1，它会自动添加。',
            en: 'Scroll down to "API Endpoint" and replace the default with your API address (see code box). Note: do NOT add /v1 — it\'s added automatically.',
          },
          {
            zh: '在"API Key"输入框中粘贴你的密钥。',
            en: 'Paste your key in the "API Key" field.',
          },
          {
            zh: '回到聊天界面，在模型选择下拉菜单中选择你想用的模型（如 gpt-4o、claude-sonnet-4-20250514 等），开始对话！',
            en: 'Go back to chat, select your model from the dropdown (gpt-4o, claude-sonnet-4-20250514, etc.), and start chatting!',
          },
        ],
        code: {
          lang: 'text',
          filename: 'NextChat Settings',
          content: `接口地址 (API Endpoint):   {{BASE_URL}}
API Key:                   {{API_KEY}}`,
        },
        tip: {
          zh: '如果你想自己部署一个私有版本，可以用 Vercel 一键部署（GitHub 仓库里有一键部署按钮），完全免费。',
          en: 'Want your own private deployment? Use Vercel one-click deploy (button in the GitHub repo) — completely free.',
        },
        videos: [
          { url: 'https://www.bilibili.com/video/BV1qx4y117XX/', title: { zh: 'NextChat 部署个人ChatGPT，多端随时访问', en: 'Deploy Your Own ChatGPT with NextChat' }, platform: 'bilibili', author: 'plfish-漂亮鱼' },
        ],
        externalLinks: [
          { url: 'https://github.com/ChatGPTNextWeb/ChatGPT-Next-Web#readme', title: { zh: 'NextChat GitHub 说明', en: 'NextChat GitHub README' } },
        ],
      },
      {
        id: 'lobechat',
        name: 'LobeChat',
        desc: {
          zh: '现代化的开源 AI 聊天框架，支持插件系统、知识库、多模型对话、TTS 语音等高级功能。界面非常精美。',
          en: 'Modern open-source AI chat framework with plugins, knowledge base, multi-model, TTS, and beautiful UI.',
        },
        url: 'https://github.com/lobehub/lobe-chat',
        steps: [
          {
            zh: '访问 LobeChat 在线版：https://chat-preview.lobehub.com（或自己部署）。',
            en: 'Visit LobeChat online: https://chat-preview.lobehub.com (or self-deploy).',
          },
          {
            zh: '点击左下角的头像 → 设置 → 找到"语言模型"设置。',
            en: 'Click your avatar at bottom-left → Settings → find "Language Model" settings.',
          },
          {
            zh: '选择 "OpenAI" 一栏，打开"自定义 API 端点"开关。在"API 代理地址"中填入你的 API 地址（见下方代码框，末尾加 /v1）。',
            en: 'Select "OpenAI", enable "Custom API Endpoint". Enter your API address in the proxy URL field (see code box, add /v1).',
          },
          {
            zh: '在 "API Key" 中粘贴你的密钥，点击保存。你可以点击"检查"按钮验证连接是否成功。',
            en: 'Paste your key in "API Key", save. You can click "Check" to verify the connection.',
          },
          {
            zh: '返回聊天界面，点击模型名称可以切换不同模型。LobeChat 还支持上传文件、图片对话、TTS 等功能。',
            en: 'Go back to chat, click the model name to switch models. LobeChat also supports file uploads, image chat, TTS, etc.',
          },
        ],
        code: {
          lang: 'text',
          filename: 'LobeChat → Settings → Language Model → OpenAI',
          content: `API Proxy URL:   {{BASE_URL}}/v1
API Key:         {{API_KEY}}`,
        },
        videos: [
          { url: 'https://www.bilibili.com/video/BV14AxFewEgk/', title: { zh: 'LobeChat 数据库版本地部署指南（2026）', en: 'LobeChat Database Version Local Deploy Guide (2026)' }, platform: 'bilibili', author: 'AI应用_陆道峰' },
        ],
        externalLinks: [
          { url: 'https://lobehub.com/docs', title: { zh: 'LobeChat 官方文档', en: 'LobeChat Docs' } },
        ],
      },
      {
        id: 'open-webui',
        name: 'Open WebUI',
        desc: {
          zh: '功能丰富的开源 AI 聊天界面，支持多用户、文件上传、RAG 知识库、模型管理等。需要用 Docker 部署。',
          en: 'Feature-rich open-source AI chat UI with multi-user, file upload, RAG, model management. Requires Docker.',
        },
        url: 'https://github.com/open-webui/open-webui',
        steps: [
          {
            zh: '确保你的电脑或服务器已安装 Docker（如果没有，参考"准备工作"中的指引安装）。',
            en: 'Make sure Docker is installed on your computer or server (see "Getting Ready" guide if not).',
          },
          {
            zh: '在终端运行以下命令启动 Open WebUI（见下方代码框）。把其中的 API 地址和 Key 替换为你自己的。首次运行会下载镜像，可能需要几分钟。',
            en: 'Run the command below in your terminal (see code box). Replace the API address and Key with yours. First run downloads the image — may take a few minutes.',
          },
          {
            zh: '启动完成后，打开浏览器访问 http://localhost:3000。首次访问需要注册一个管理员账号。',
            en: 'After startup, open http://localhost:3000 in your browser. Register an admin account on first visit.',
          },
          {
            zh: '登录后，你的模型列表应该已经自动加载了。选择一个模型就可以开始聊天。如果模型列表为空，去 Admin → Settings → Connections 检查 API 配置。',
            en: 'After login, your model list should auto-load. Select a model to start chatting. If empty, check Admin → Settings → Connections.',
          },
        ],
        code: {
          lang: 'bash',
          filename: 'Terminal — Docker 部署命令',
          content: `docker run -d -p 3000:8080 \\
  -e OPENAI_API_BASE_URL={{BASE_URL}}/v1 \\
  -e OPENAI_API_KEY={{API_KEY}} \\
  -v open-webui:/app/backend/data \\
  --name open-webui \\
  ghcr.io/open-webui/open-webui:main`,
        },
        tip: {
          zh: 'Open WebUI 的数据存储在 Docker volume 中，重启容器不会丢失聊天记录。如果想更新版本，先 docker pull 新镜像，再重建容器。',
          en: 'Open WebUI stores data in a Docker volume — restarting won\'t lose chat history. To update, pull the new image and recreate.',
        },
        videos: [
          { url: 'https://www.bilibili.com/video/BV1ux4y1Q7zN/', title: { zh: 'Ollama + Open WebUI 搭建本地大模型交互界面', en: 'Ollama + Open WebUI Local LLM Setup' }, platform: 'bilibili', author: '漆妮妮' },
        ],
        externalLinks: [
          { url: 'https://docs.openwebui.com', title: { zh: 'Open WebUI 官方文档', en: 'Open WebUI Docs' } },
        ],
      },
      {
        id: 'chatbox',
        name: 'Chatbox',
        desc: {
          zh: '跨平台桌面 AI 客户端（Windows/Mac/Linux），界面简洁，不需要部署，下载安装就能用。',
          en: 'Cross-platform desktop AI client (Windows/Mac/Linux). No deployment needed — download, install, and use.',
        },
        url: 'https://chatboxai.app',
        steps: [
          {
            zh: '访问 https://chatboxai.app 下载安装包。支持 Windows、Mac 和 Linux。安装过程和普通软件一样。',
            en: 'Go to https://chatboxai.app and download. Supports Windows, Mac, Linux. Standard installation.',
          },
          {
            zh: '打开 Chatbox，它会弹出设置引导。在 "AI Provider" 中选择 "OpenAI API Compatible"。',
            en: 'Open Chatbox — it shows a setup wizard. Choose "OpenAI API Compatible" as AI Provider.',
          },
          {
            zh: '在 "API Host" 中填入你的 API 地址（见下方代码框），在 "API Key" 中粘贴密钥。',
            en: 'Enter your API address in "API Host" (see code box), paste your key in "API Key".',
          },
          {
            zh: '点击 "Save"。回到主界面，选择一个模型就可以开始聊天了。Chatbox 支持 Markdown、代码高亮、历史搜索等功能。',
            en: 'Click "Save". On the main screen, select a model and start chatting. Chatbox supports Markdown, code highlighting, and history search.',
          },
        ],
        code: {
          lang: 'text',
          filename: 'Chatbox Settings',
          content: `AI Provider:   OpenAI API Compatible
API Host:      {{BASE_URL}}/v1
API Key:       {{API_KEY}}`,
        },
        videos: [
          { url: 'https://youtu.be/oIOkRNuADoA', title: { zh: 'Chatbox AI 使用教程', en: 'Chatbox AI Tutorial' }, platform: 'youtube' },
        ],
        externalLinks: [
          { url: 'https://chatboxai.app', title: { zh: 'Chatbox 官网', en: 'Chatbox Website' } },
        ],
      },
    ],
  },

  /* ================================================================
   * 3. 代码调用
   * ================================================================ */
  'code-integration': {
    title: { zh: '代码调用', en: 'Code Integration' },
    desc: {
      zh: '在你自己的程序中调用 AI 模型。支持 Python、Node.js、以及任何能发 HTTP 请求的语言。',
      en: 'Call AI models from your own code. Supports Python, Node.js, and any language that can make HTTP requests.',
    },
    tools: [
      {
        id: 'python-sdk',
        name: 'Python (OpenAI SDK)',
        desc: {
          zh: '使用 Python 的 OpenAI 官方 SDK 调用 API。这是最常见的集成方式，几行代码就能跑起来。',
          en: 'Use the official OpenAI Python SDK. The most common integration — just a few lines of code to get started.',
        },
        url: 'https://github.com/openai/openai-python',
        steps: [
          {
            zh: '确保已安装 Python 3.7+。在终端输入 python --version 检查（Windows 可能是 python3 --version）。没有的话去 https://www.python.org/downloads/ 安装。',
            en: 'Make sure Python 3.7+ is installed. Type python --version in terminal (try python3 on Windows). Install from https://www.python.org/downloads/ if needed.',
          },
          {
            zh: '安装 OpenAI SDK。在终端输入：pip install openai\n（如果提示权限不足，用 pip install --user openai）',
            en: 'Install the OpenAI SDK: pip install openai\n(If permission denied, use pip install --user openai)',
          },
          {
            zh: '创建一个文件，比如叫 test.py。用任何文本编辑器打开（VS Code、记事本都行），把下方代码框的内容粘贴进去。',
            en: 'Create a file, e.g., test.py. Open it in any text editor (VS Code, Notepad, etc.), paste the code from below.',
          },
          {
            zh: '把代码中的 {{API_KEY}} 替换为你自己的 API Key（在网站控制台 → 令牌管理中创建）。',
            en: 'Replace {{API_KEY}} in the code with your actual API Key (create one in Console → Token Management).',
          },
          {
            zh: '在终端进入文件所在目录，运行：python test.py\n如果一切正常，你会看到 AI 的回复输出在终端中。恭喜，你已经成功调用了 AI API！',
            en: 'In terminal, navigate to the file directory and run: python test.py\nIf everything works, you\'ll see the AI response. Congrats — you\'ve successfully called the AI API!',
          },
        ],
        code: {
          lang: 'python',
          filename: 'test.py',
          content: `from openai import OpenAI

# 创建客户端，填入你的 API 地址和密钥
client = OpenAI(
    base_url="{{BASE_URL}}/v1",
    api_key="{{API_KEY}}",  # 替换为你的 API Key
)

# 发送一条消息给 AI
response = client.chat.completions.create(
    model="gpt-4o",  # 可以换成其他模型，如 claude-sonnet-4-20250514
    messages=[
        {"role": "user", "content": "你好！请用一句话介绍你自己。"}
    ],
)

# 打印 AI 的回复
print(response.choices[0].message.content)`,
        },
        tip: {
          zh: '如果遇到 "ModuleNotFoundError: No module named openai"，说明 SDK 没装成功，尝试 pip3 install openai 或 python -m pip install openai。',
          en: 'If you get "ModuleNotFoundError: No module named openai", the SDK wasn\'t installed. Try pip3 install openai or python -m pip install openai.',
        },
        videos: [
          { url: 'https://youtu.be/DsOnUiXcQk0', title: { zh: 'Python OpenAI API 调用教程', en: 'Python OpenAI API Tutorial' }, platform: 'youtube' },
        ],
        externalLinks: [
          { url: 'https://realpython.com/openai-api-python/', title: { zh: 'Real Python: OpenAI API Python 教程', en: 'Real Python: OpenAI API Python Tutorial' } },
          { url: 'https://www.datacamp.com/tutorial/using-gpt-models-via-the-openai-api-in-python', title: { zh: 'DataCamp: Python 调用 OpenAI API 教程', en: 'DataCamp: Using GPT Models via OpenAI API in Python' } },
          { url: 'https://platform.openai.com/docs/api-reference', title: { zh: 'OpenAI API 参考文档', en: 'OpenAI API Reference' } },
        ],
      },
      {
        id: 'nodejs-sdk',
        name: 'Node.js (OpenAI SDK)',
        desc: {
          zh: '使用 Node.js 的 OpenAI 官方 SDK 调用 API。适合前端开发者和 Node.js 项目。',
          en: 'Use the official OpenAI Node.js SDK. Great for frontend developers and Node.js projects.',
        },
        url: 'https://github.com/openai/openai-node',
        nodejsRequired: true,
        steps: [
          {
            zh: '创建一个新目录，初始化项目并安装 SDK：\nmkdir my-ai-test && cd my-ai-test\nnpm init -y\nnpm install openai',
            en: 'Create a new directory, init project and install SDK:\nmkdir my-ai-test && cd my-ai-test\nnpm init -y\nnpm install openai',
          },
          {
            zh: '创建 test.js 文件，粘贴下方代码，把 API Key 替换为你自己的。',
            en: 'Create test.js, paste the code below, replace the API Key with yours.',
          },
          {
            zh: '运行：node test.js\n如果看到 AI 的回复，说明配置成功！',
            en: 'Run: node test.js\nIf you see the AI response, the setup is successful!',
          },
        ],
        code: {
          lang: 'javascript',
          filename: 'test.js',
          content: `import OpenAI from 'openai';

// 创建客户端
const client = new OpenAI({
  baseURL: '{{BASE_URL}}/v1',
  apiKey: '{{API_KEY}}',  // 替换为你的 API Key
});

// 发送请求
const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: '你好！请用一句话介绍你自己。' }],
});

console.log(response.choices[0].message.content);`,
        },
        tip: {
          zh: '如果提示 "Cannot use import statement outside a module"，在 package.json 中添加 "type": "module" 这一行。',
          en: 'If you get "Cannot use import statement outside a module", add "type": "module" to package.json.',
        },
        videos: [
          { url: 'https://youtu.be/GCuxCPpL2zQ', title: { zh: 'Node.js OpenAI API 调用教程', en: 'Node.js OpenAI API Tutorial' }, platform: 'youtube' },
        ],
        externalLinks: [
          { url: 'https://github.com/openai/openai-node', title: { zh: 'OpenAI Node.js SDK GitHub', en: 'OpenAI Node.js SDK GitHub' } },
        ],
      },
      {
        id: 'curl',
        name: 'cURL / HTTP API',
        desc: {
          zh: '直接发 HTTP 请求调用，不需要安装任何 SDK。适用于所有编程语言，也可以在终端中直接测试。',
          en: 'Call via HTTP directly — no SDK needed. Works with any language, and you can test right in the terminal.',
        },
        url: null,
        steps: [
          {
            zh: '打开终端（Windows 用 PowerShell 或 Git Bash，Mac/Linux 用 Terminal）。',
            en: 'Open terminal (PowerShell or Git Bash on Windows, Terminal on Mac/Linux).',
          },
          {
            zh: '复制下方代码框中的命令，把 API Key 替换为你自己的，粘贴到终端中按回车。',
            en: 'Copy the command from the code box below, replace the API Key with yours, paste into terminal and press Enter.',
          },
          {
            zh: '几秒后你会看到 JSON 格式的响应。其中 choices[0].message.content 就是 AI 的回复内容。',
            en: 'After a few seconds, you\'ll see a JSON response. choices[0].message.content is the AI\'s reply.',
          },
          {
            zh: '这个请求格式就是 OpenAI 的标准 Chat Completions API。你可以用任何语言（Go、Java、PHP、Rust 等）发起同样格式的 HTTP 请求来调用 AI。',
            en: 'This follows the standard OpenAI Chat Completions API format. You can make the same HTTP request from any language (Go, Java, PHP, Rust, etc.).',
          },
        ],
        code: {
          lang: 'bash',
          filename: 'Terminal',
          content: `curl {{BASE_URL}}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "Hello! Introduce yourself in one sentence."}
    ]
  }'`,
        },
        videos: [],
        externalLinks: [
          { url: 'https://platform.openai.com/docs/api-reference', title: { zh: 'OpenAI API 参考文档', en: 'OpenAI API Reference' } },
        ],
      },
    ],
  },

  /* ================================================================
   * 4. 图片生成
   * ================================================================ */
  'image-generation': {
    title: { zh: '图片生成', en: 'Image Generation' },
    desc: {
      zh: '通过 API 用 AI 生成图片。描述你想要的画面，AI 会帮你画出来。',
      en: 'Generate images with AI via API. Describe what you want, and AI creates it.',
    },
    tools: [
      {
        id: 'dalle',
        name: 'DALL-E 3',
        desc: {
          zh: 'OpenAI 的图片生成模型。你用文字描述画面，它生成高质量图片。通过标准 API 调用，非常简单。',
          en: "OpenAI's image generation model. Describe the image in text, get high-quality output. Simple API call.",
        },
        url: 'https://platform.openai.com/docs/guides/images',
        steps: [
          {
            zh: '确保已安装 Python 和 OpenAI SDK（参考"代码调用"中 Python 的安装步骤）。',
            en: 'Make sure Python and OpenAI SDK are installed (see the Python setup in "Code Integration").',
          },
          {
            zh: '创建一个文件 generate_image.py，把下方代码粘贴进去，替换 API Key。',
            en: 'Create generate_image.py, paste the code below, replace API Key.',
          },
          {
            zh: '修改 prompt 参数为你想生成的图片描述。描述越详细，生成效果越好。例如："一只穿着宇航服的柴犬在月球上散步，数字艺术风格"。',
            en: 'Modify the prompt parameter to describe your image. More detail = better results. E.g., "A Shiba Inu in a spacesuit walking on the moon, digital art style".',
          },
          {
            zh: '运行 python generate_image.py，程序会输出一个图片 URL。在浏览器中打开这个 URL 就能看到生成的图片。你也可以右键保存图片。',
            en: 'Run python generate_image.py — it outputs an image URL. Open it in your browser to see the result. Right-click to save.',
          },
        ],
        code: {
          lang: 'python',
          filename: 'generate_image.py',
          content: `from openai import OpenAI

client = OpenAI(
    base_url="{{BASE_URL}}/v1",
    api_key="{{API_KEY}}",
)

response = client.images.generate(
    model="dall-e-3",
    prompt="一只穿着宇航服的柴犬在月球上散步，数字艺术风格，4K 高清",
    size="1024x1024",   # 可选: 1024x1024, 1024x1792, 1792x1024
    quality="standard", # 可选: standard, hd
    n=1,                # 生成数量
)

print("图片地址:", response.data[0].url)`,
        },
        tip: {
          zh: 'DALL-E 3 支持三种尺寸：1024x1024（正方形）、1024x1792（竖版）、1792x1024（横版）。quality 设为 "hd" 会更精细但更贵。',
          en: 'DALL-E 3 supports three sizes: 1024x1024 (square), 1024x1792 (portrait), 1792x1024 (landscape). "hd" quality is finer but costs more.',
        },
        videos: [],
        externalLinks: [
          { url: 'https://realpython.com/generate-images-with-dalle-openai-api/', title: { zh: 'Real Python: DALL-E API 图片生成教程', en: 'Real Python: Generate Images with DALL-E API' } },
          { url: 'https://www.datacamp.com/tutorial/a-comprehensive-guide-to-the-dall-e-3-api', title: { zh: 'DataCamp: DALL-E 3 API 完整指南', en: 'DataCamp: Comprehensive Guide to DALL-E 3 API' } },
        ],
      },
      {
        id: 'midjourney',
        name: 'Midjourney',
        desc: {
          zh: 'AI 艺术图片生成，以独特的艺术风格著称。通过异步任务 API 调用：提交任务 → 等待 → 获取结果。',
          en: 'AI art generation known for unique artistic style. Uses async API: submit task → wait → get result.',
        },
        url: null,
        steps: [
          {
            zh: 'Midjourney 不是即时返回结果的，而是异步任务模式。你先提交一个生图请求，系统返回一个任务 ID，然后你用这个 ID 去查询进度。',
            en: "Midjourney isn't instant — it uses async tasks. Submit a request, get a task ID, then query progress with that ID.",
          },
          {
            zh: '在终端运行下方第一个 curl 命令提交任务（替换你的 API Key）。记下返回 JSON 中的 task_id 值。',
            en: 'Run the first curl command below to submit a task (replace API Key). Note the task_id in the response.',
          },
          {
            zh: '等待约 30-120 秒，然后运行第二个 curl 命令查询结果（把 TASK_ID 替换为你拿到的实际 ID）。当状态变为 SUCCESS 时，image_url 就是生成的图片地址。',
            en: 'Wait 30-120 seconds, then run the second curl command (replace TASK_ID with your actual ID). When status is SUCCESS, image_url is your result.',
          },
        ],
        code: {
          lang: 'bash',
          filename: 'Terminal — 提交任务 & 查询结果',
          content: `# 第一步：提交生图任务
curl -X POST {{BASE_URL}}/mj/submit/imagine \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -d '{"prompt": "a cat astronaut floating in space, cinematic lighting --ar 16:9"}'

# 第二步：查询任务结果（把 TASK_ID 换成实际的任务 ID）
curl {{BASE_URL}}/mj/task/TASK_ID/fetch \\
  -H "Authorization: Bearer {{API_KEY}}"`,
        },
        tip: {
          zh: '在 prompt 末尾加 --ar 16:9 可以指定宽高比。其他常用参数：--v 6（版本6）、--q 2（高质量）、--style raw（更写实）。',
          en: 'Add --ar 16:9 at the end of prompt for aspect ratio. Other params: --v 6 (version 6), --q 2 (high quality), --style raw (more realistic).',
        },
        videos: [],
        externalLinks: [
          { url: 'https://docs.midjourney.com/', title: { zh: 'Midjourney 官方文档', en: 'Midjourney Official Docs' } },
        ],
      },
    ],
  },

  /* ================================================================
   * 5. 音乐生成
   * ================================================================ */
  'music-generation': {
    title: { zh: '音乐生成', en: 'Music Generation' },
    desc: {
      zh: '使用 AI 创作原创音乐和歌曲，包括人声和伴奏。',
      en: 'Create original music and songs with AI, including vocals and instrumentals.',
    },
    tools: [
      {
        id: 'suno',
        name: 'Suno',
        desc: {
          zh: 'AI 音乐创作平台，输入描述或歌词就能生成完整的歌曲（含人声和伴奏）。和 Midjourney 一样使用异步任务模式。',
          en: 'AI music platform — input a description or lyrics to generate complete songs (vocals + instrumentals). Uses async task mode like Midjourney.',
        },
        url: 'https://suno.com',
        steps: [
          {
            zh: '和 Midjourney 类似，Suno 也是异步任务模式：提交 → 等待 → 获取音频文件。',
            en: 'Like Midjourney, Suno uses async tasks: submit → wait → get audio file.',
          },
          {
            zh: '运行下方 curl 命令提交音乐生成任务。在 prompt 中描述你想要的风格、主题和情绪。',
            en: 'Run the curl command below to submit a music task. Describe the style, theme, and mood in prompt.',
          },
          {
            zh: '记下返回的 task_id，等待 1-3 分钟后用同样的方式查询任务结果（参考 Midjourney 的查询方式）。完成后会得到音频文件的 URL。',
            en: 'Note the task_id, wait 1-3 minutes, then query the result (same method as Midjourney). You\'ll get an audio file URL.',
          },
        ],
        code: {
          lang: 'bash',
          filename: 'Terminal — 提交 Suno 音乐生成任务',
          content: `curl -X POST {{BASE_URL}}/suno/submit/music \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -d '{
    "prompt": "A cheerful pop song about summer vacation, upbeat tempo, female vocal",
    "make_instrumental": false,
    "wait_audio": false
  }'`,
        },
        tip: {
          zh: '设置 "make_instrumental": true 可以只生成纯伴奏（无人声），适合做背景音乐。prompt 尽量用英文描述风格，效果更好。',
          en: 'Set "make_instrumental": true for instrumentals only (no vocals) — great for background music. English prompts work best for style description.',
        },
        videos: [],
        externalLinks: [
          { url: 'https://aimlapi.com/blog/suno-ai-complete-guide', title: { zh: 'Suno AI 完整使用指南', en: 'Suno AI Complete Guide' } },
          { url: 'https://github.com/gcui-art/suno-api', title: { zh: 'Suno API 开源项目 (GitHub)', en: 'Suno API Open Source (GitHub)' } },
        ],
      },
    ],
  },

  /* ================================================================
   * 6. 视频生成
   * ================================================================ */
  'video-generation': {
    title: { zh: '视频生成', en: 'Video Generation' },
    desc: {
      zh: '用 AI 从文字描述或图片生成短视频。同样使用异步任务模式。',
      en: 'Generate short videos from text or images with AI. Uses async task mode.',
    },
    tools: [
      {
        id: 'kling',
        name: 'Kling (可灵)',
        desc: {
          zh: '快手旗下 AI 视频生成模型，支持文生视频和图生视频，画质出色。',
          en: "Kuaishou's AI video model — text-to-video and image-to-video with excellent quality.",
        },
        url: 'https://klingai.com',
        steps: [
          {
            zh: '和 Midjourney/Suno 一样是异步任务：提交请求 → 等待生成（通常 2-5 分钟）→ 获取视频 URL。',
            en: 'Like Midjourney/Suno, it\'s async: submit → wait (usually 2-5 min) → get video URL.',
          },
          {
            zh: '运行下方 curl 命令提交视频生成任务。prompt 中描述你想要的视频内容和风格。',
            en: 'Run the curl command below to submit a video task. Describe the content and style in prompt.',
          },
          {
            zh: '用返回的 task_id 查询进度，完成后下载视频文件。',
            en: 'Use the returned task_id to check progress, download the video when done.',
          },
        ],
        code: {
          lang: 'bash',
          filename: 'Terminal — 提交视频生成任务',
          content: `curl -X POST {{BASE_URL}}/kling/submit/video \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer {{API_KEY}}" \\
  -d '{
    "prompt": "A golden retriever running on a beach at sunset, slow motion, cinematic",
    "duration": 5
  }'`,
        },
        tip: {
          zh: '视频生成比图片生成耗时更长（2-5 分钟），且费用较高。建议先用短时长（5秒）测试效果满意后再生成更长的。',
          en: 'Video generation takes longer (2-5 min) and costs more. Test with short duration (5s) first, then go longer.',
        },
        videos: [],
        externalLinks: [
          { url: 'https://klingai.com', title: { zh: 'Kling (可灵) 官网', en: 'Kling Official Website' } },
        ],
      },
    ],
  },

  /* ================================================================
   * 7. 语音合成 (TTS)
   * ================================================================ */
  'tts': {
    title: { zh: '语音合成 (TTS)', en: 'Text-to-Speech (TTS)' },
    desc: {
      zh: '把文字变成自然的语音。可以用来做有声读物、视频配音、语音助手等。',
      en: 'Convert text to natural speech. Use for audiobooks, video narration, voice assistants, etc.',
    },
    tools: [
      {
        id: 'openai-tts',
        name: 'OpenAI TTS',
        desc: {
          zh: 'OpenAI 的文字转语音服务。音质非常自然，支持 6 种音色，多种语言。',
          en: "OpenAI's text-to-speech. Very natural audio, 6 voice options, multilingual.",
        },
        url: 'https://platform.openai.com/docs/guides/text-to-speech',
        steps: [
          {
            zh: '确保已安装 Python 和 OpenAI SDK（参考"代码调用 → Python"的步骤）。',
            en: 'Make sure Python and OpenAI SDK are installed (see "Code Integration → Python").',
          },
          {
            zh: '创建文件 tts.py，粘贴下方代码，替换 API Key。',
            en: 'Create tts.py, paste the code below, replace API Key.',
          },
          {
            zh: '修改 input 参数为你想转成语音的文字，修改 voice 参数选择音色：alloy（中性）、echo（低沉男声）、fable（叙事感）、onyx（深沉男声）、nova（温暖女声）、shimmer（明亮女声）。',
            en: 'Modify input to your text, change voice: alloy (neutral), echo (deep male), fable (narrative), onyx (deep male), nova (warm female), shimmer (bright female).',
          },
          {
            zh: '运行 python tts.py，程序会在当前目录生成 output.mp3 文件。双击播放即可听到 AI 语音。',
            en: 'Run python tts.py — it creates output.mp3 in the current directory. Double-click to play.',
          },
        ],
        code: {
          lang: 'python',
          filename: 'tts.py',
          content: `from openai import OpenAI

client = OpenAI(
    base_url="{{BASE_URL}}/v1",
    api_key="{{API_KEY}}",
)

# 将文字转为语音
response = client.audio.speech.create(
    model="tts-1",       # tts-1 速度快, tts-1-hd 音质更好
    voice="nova",        # 音色: alloy, echo, fable, onyx, nova, shimmer
    input="你好！欢迎使用 AI API 平台。这是一段测试语音。",
)

# 保存为 mp3 文件
response.stream_to_file("output.mp3")
print("语音已保存到 output.mp3，双击即可播放！")`,
        },
        tip: {
          zh: 'tts-1 适合实时场景（速度快），tts-1-hd 适合制作高品质内容（音质更好但稍慢）。中英文混合文本也能正确朗读。',
          en: 'tts-1 is great for real-time (fast), tts-1-hd for high-quality content (better but slower). Handles mixed-language text well.',
        },
        videos: [],
        externalLinks: [
          { url: 'https://www.datacamp.com/tutorial/how-to-use-the-openai-text-to-speech-api', title: { zh: 'DataCamp: OpenAI TTS API 使用教程', en: 'DataCamp: How to Use OpenAI TTS API' } },
          { url: 'https://developers.openai.com/api/docs/guides/text-to-speech', title: { zh: 'OpenAI TTS 官方文档', en: 'OpenAI TTS Official Guide' } },
        ],
      },
    ],
  },

  /* ================================================================
   * 8. 语音识别 (STT)
   * ================================================================ */
  'stt': {
    title: { zh: '语音识别 (STT)', en: 'Speech-to-Text (STT)' },
    desc: {
      zh: '把音频文件转成文字。可以用来做会议纪要、字幕生成、语音笔记等。',
      en: 'Transcribe audio to text. Use for meeting notes, subtitle generation, voice notes, etc.',
    },
    tools: [
      {
        id: 'whisper',
        name: 'Whisper',
        desc: {
          zh: 'OpenAI 的语音识别模型，准确率高，支持 90 多种语言，自动检测语种。',
          en: "OpenAI's speech recognition model — high accuracy, 90+ languages, auto language detection.",
        },
        url: 'https://platform.openai.com/docs/guides/speech-to-text',
        steps: [
          {
            zh: '准备一个音频文件（MP3、WAV、M4A 等格式都行），文件大小不超过 25MB。可以用手机录一段语音来测试。',
            en: 'Prepare an audio file (MP3, WAV, M4A, etc.), max 25MB. You can record something on your phone to test.',
          },
          {
            zh: '确保已安装 Python 和 OpenAI SDK。创建文件 stt.py，粘贴下方代码。',
            en: 'Make sure Python and OpenAI SDK are installed. Create stt.py, paste the code below.',
          },
          {
            zh: '把代码中的 "recording.mp3" 替换为你实际的音频文件名（确保文件在同一目录下）。替换 API Key。',
            en: 'Replace "recording.mp3" with your actual audio filename (make sure it\'s in the same directory). Replace API Key.',
          },
          {
            zh: '运行 python stt.py，几秒后终端会输出识别出的文字内容。',
            en: 'Run python stt.py — after a few seconds, the transcribed text appears in the terminal.',
          },
        ],
        code: {
          lang: 'python',
          filename: 'stt.py',
          content: `from openai import OpenAI

client = OpenAI(
    base_url="{{BASE_URL}}/v1",
    api_key="{{API_KEY}}",
)

# 打开音频文件（替换为你的文件名）
audio_file = open("recording.mp3", "rb")

# 发送给 Whisper 识别
transcript = client.audio.transcriptions.create(
    model="whisper-1",
    file=audio_file,
)

print("识别结果:")
print(transcript.text)`,
        },
        tip: {
          zh: '如果音频超过 25MB，可以用 ffmpeg 压缩：ffmpeg -i input.wav -b:a 64k output.mp3。或者用 pydub 库在 Python 中分割音频。',
          en: 'If audio exceeds 25MB, compress with ffmpeg: ffmpeg -i input.wav -b:a 64k output.mp3. Or use pydub library to split in Python.',
        },
        videos: [],
        externalLinks: [
          { url: 'https://platform.openai.com/docs/guides/speech-to-text', title: { zh: 'OpenAI Whisper 官方文档', en: 'OpenAI Whisper Official Guide' } },
        ],
      },
    ],
  },

  /* ================================================================
   * 9. 文本嵌入 (Embeddings)
   * ================================================================ */
  'embeddings': {
    title: { zh: '文本嵌入 (Embeddings)', en: 'Text Embeddings' },
    desc: {
      zh: '把文字转成数字向量（一串数字），让计算机能理解文字的"含义"。这是构建 AI 搜索、知识库问答（RAG）的基础技术。',
      en: "Convert text to numerical vectors so computers understand meaning. The foundation for AI search and knowledge base Q&A (RAG).",
    },
    tools: [
      {
        id: 'openai-embeddings',
        name: 'OpenAI Embeddings',
        desc: {
          zh: '把一段文字变成一个向量（一组数字）。两段含义相似的文字，它们的向量也会很接近。这就是语义搜索的原理。',
          en: 'Convert text to a vector (array of numbers). Similar-meaning texts produce similar vectors — this is how semantic search works.',
        },
        url: 'https://platform.openai.com/docs/guides/embeddings',
        steps: [
          {
            zh: '确保已安装 Python 和 OpenAI SDK。创建文件 embedding.py，粘贴下方代码，替换 API Key。',
            en: 'Make sure Python and OpenAI SDK are installed. Create embedding.py, paste code below, replace API Key.',
          },
          {
            zh: '运行 python embedding.py。程序会输出向量的维度（1536 维）和前 5 个数值。这就是这段文字的"数字指纹"。',
            en: 'Run python embedding.py. It outputs the vector dimension (1536) and first 5 values — the text\'s "digital fingerprint".',
          },
          {
            zh: '实际应用中，你会把文档的每个段落都转成向量存入向量数据库（如 Chroma、Pinecone），然后用户提问时也转成向量，通过计算相似度找到最相关的文档。',
            en: 'In practice, convert each document paragraph to a vector, store in a vector DB (Chroma, Pinecone), then convert user questions to vectors and find similar docs.',
          },
        ],
        code: {
          lang: 'python',
          filename: 'embedding.py',
          content: `from openai import OpenAI

client = OpenAI(
    base_url="{{BASE_URL}}/v1",
    api_key="{{API_KEY}}",
)

# 把一段文字转成向量
response = client.embeddings.create(
    model="text-embedding-3-small",  # 性价比最高的模型
    input="这是一段测试文本，AI 会把它转换成一组数字向量。",
)

vector = response.data[0].embedding
print(f"向量维度: {len(vector)}")
print(f"前 5 个值: {vector[:5]}")`,
        },
        tip: {
          zh: 'text-embedding-3-small 足以应对大部分场景。如果对精度要求极高（如法律、医疗），可以用 text-embedding-3-large。',
          en: 'text-embedding-3-small works for most cases. For high precision needs (legal, medical), use text-embedding-3-large.',
        },
        videos: [],
        externalLinks: [
          { url: 'https://platform.openai.com/docs/guides/embeddings', title: { zh: 'OpenAI Embeddings 官方文档', en: 'OpenAI Embeddings Official Guide' } },
        ],
      },
    ],
  },

  /* ================================================================
   * 10. 翻译工具
   * ================================================================ */
  'translation-tools': {
    title: { zh: '翻译工具', en: 'Translation Tools' },
    desc: {
      zh: '在翻译工具中使用 AI API，实现高质量的 AI 翻译。比传统机器翻译更准确、更自然。',
      en: 'Use AI API in translation tools for high-quality AI translations — more accurate and natural than traditional machine translation.',
    },
    tools: [
      {
        id: 'immersive-translate',
        name: '沉浸式翻译 (Immersive Translate)',
        desc: {
          zh: '最受欢迎的浏览器翻译扩展。可以翻译网页、PDF、视频字幕，还支持双语对照显示。接入 AI API 后翻译质量远超谷歌翻译。',
          en: 'Most popular browser translation extension. Translates webpages, PDFs, video subtitles with bilingual display. AI-powered quality far exceeds Google Translate.',
        },
        url: 'https://immersivetranslate.com',
        steps: [
          {
            zh: '打开浏览器（Chrome、Edge、Firefox、Safari 都支持），访问 https://immersivetranslate.com，点击"安装"按钮。会跳转到浏览器扩展商店，点击"添加到浏览器"。',
            en: 'Open your browser (Chrome, Edge, Firefox, Safari all supported), go to https://immersivetranslate.com, click "Install". You\'ll be redirected to the extension store — click "Add to browser".',
          },
          {
            zh: '安装完成后，浏览器右上角会出现沉浸式翻译的图标。点击图标 → 点击"设置"（或"Options"）。',
            en: 'After install, the Immersive Translate icon appears at the top-right of your browser. Click it → click "Settings" (or "Options").',
          },
          {
            zh: '在设置页面找到"翻译服务"（或 "Translation Service"）。下拉找到 "OpenAI"，点击展开。',
            en: 'In Settings, find "Translation Service". Scroll down to "OpenAI" and expand it.',
          },
          {
            zh: '开启"自定义 API 接口"开关。在"API URL"中填入你的地址（见下方代码框，注意末尾要有 /v1/chat/completions）。在"API Key"中粘贴你的密钥。',
            en: 'Enable "Custom API endpoint". Enter your API URL (see code box — include /v1/chat/completions at the end). Paste your key in "API Key".',
          },
          {
            zh: '模型选择 gpt-4o-mini（翻译速度快、性价比高）或 gpt-4o（翻译质量最好）。点击保存。',
            en: 'Choose gpt-4o-mini (fast, cost-effective) or gpt-4o (best quality) as the model. Click save.',
          },
          {
            zh: '将 OpenAI 设为默认翻译服务。现在打开任意英文网页，点击沉浸式翻译图标或按快捷键（默认 Alt+A），就能看到 AI 双语翻译了！',
            en: 'Set OpenAI as default translation service. Now open any English webpage, click the icon or press the shortcut (default Alt+A) to see AI bilingual translation!',
          },
        ],
        code: {
          lang: 'text',
          filename: '沉浸式翻译 → Settings → OpenAI',
          content: `Translation Service:   OpenAI
✅ Custom API Endpoint
API URL:               {{BASE_URL}}/v1/chat/completions
API Key:               {{API_KEY}}
Model:                 gpt-4o-mini`,
        },
        tip: {
          zh: '翻译整个网页可能消耗较多 Token（一个长文章大约 0.01-0.05 元）。建议日常用 gpt-4o-mini，既便宜翻译质量又不错。只在重要文档翻译时切换到 gpt-4o。',
          en: 'Full-page translation uses many tokens. Use gpt-4o-mini daily (cheap + good quality), switch to gpt-4o only for important documents.',
        },
        videos: [
          { url: 'https://www.bilibili.com/video/BV1fi421h7QB/', title: { zh: '沉浸式翻译 10大场景使用教程', en: 'Immersive Translate — 10 Use Cases Tutorial' }, platform: 'bilibili', author: '檀东东Tango' },
        ],
        externalLinks: [
          { url: 'https://immersivetranslate.com/docs', title: { zh: '沉浸式翻译官方文档', en: 'Immersive Translate Docs' } },
        ],
      },
      {
        id: 'bob-translate',
        name: 'Bob 翻译 (macOS)',
        desc: {
          zh: 'macOS 上的翻译神器。支持划词翻译（选中文字自动翻译）、截图翻译（截图自动 OCR+翻译）。接入 AI 后翻译质量大幅提升。',
          en: 'macOS translation tool — selection translation (auto-translate selected text), screenshot translation (auto OCR + translate). AI integration dramatically improves quality.',
        },
        url: 'https://bobtranslate.com',
        steps: [
          {
            zh: '在 Mac App Store 搜索 "Bob" 下载安装（或从官网 https://bobtranslate.com 下载）。这是一个 macOS 专属工具。',
            en: 'Search "Bob" in Mac App Store and install (or download from https://bobtranslate.com). This is a macOS-only tool.',
          },
          {
            zh: '打开 Bob，进入"偏好设置"→"服务"→"翻译"标签。点击左下角 "+" 添加一个新的翻译服务。',
            en: 'Open Bob, go to Preferences → Services → Translation tab. Click "+" at bottom-left to add a new translation service.',
          },
          {
            zh: '在 Bob 的插件商店中搜索 "OpenAI" 并安装 OpenAI 翻译插件。安装完成后在翻译服务列表中会出现 "OpenAI Translator"。',
            en: 'Search "OpenAI" in Bob\'s plugin store and install the OpenAI translation plugin. "OpenAI Translator" will appear in the service list.',
          },
          {
            zh: '点击 "OpenAI Translator" 进入配置。填入你的 API 地址和 Key（见下方代码框）。模型建议选 gpt-4o-mini。',
            en: 'Click "OpenAI Translator" to configure. Enter your API address and Key (see code box). Recommended model: gpt-4o-mini.',
          },
          {
            zh: '将 OpenAI Translator 拖动到翻译服务列表的最上方（设为首选）。现在选中任意文字按翻译快捷键（默认 ⌥+D），就会用 AI 翻译了！',
            en: 'Drag OpenAI Translator to the top of the translation list (set as preferred). Now select any text and press the shortcut (default ⌥+D) for AI translation!',
          },
        ],
        code: {
          lang: 'text',
          filename: 'Bob → OpenAI Translator Plugin Settings',
          content: `API URL:    {{BASE_URL}}/v1/chat/completions
API Key:    {{API_KEY}}
Model:      gpt-4o-mini`,
        },
        tip: {
          zh: 'Bob 的划词翻译配合 AI 非常好用。看英文文档时选中一段文字，瞬间就能看到高质量的中文翻译，比逐句查字典效率高太多。',
          en: "Bob's selection translation with AI is incredibly useful. Select English text while reading docs — instant high-quality Chinese translation, much faster than dictionary lookups.",
        },
        videos: [],
        externalLinks: [
          { url: 'https://bobtranslate.com/guide/', title: { zh: 'Bob 使用指南', en: 'Bob User Guide' } },
        ],
      },
    ],
  },
};

export default GUIDE_CONTENT;
