import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { copy } from '../../helpers';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function useLang() {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  if (lang && lang.startsWith('zh')) return 'zh';
  return 'en';
}

function t(obj, lang) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.en || obj.zh || '';
}

/* ─── Section data ────────────────────────────────────────────────────────── */

const SECTIONS = [
  {
    id: 'download',
    title: { zh: '第一阶段：下载 Node.js', en: 'Phase 1: Download Node.js' },
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
    steps: [
      {
        zh: '打开浏览器，在地址栏输入 Node.js 官方网站 https://nodejs.org/ 并回车。',
        en: 'Open your browser and navigate to the official Node.js website: https://nodejs.org/',
      },
      {
        zh: '网页打开后，你会看到两个显眼的下载按钮：\n• 左边写着 "LTS"（Long Term Support，长期支持版）\n• 右边写着 "Current"（最新功能版）',
        en: 'You\'ll see two prominent download buttons:\n• Left: "LTS" (Long Term Support)\n• Right: "Current" (latest features)',
      },
      {
        zh: '请点击左侧的 "LTS" 按钮。这是最稳定、最适合新手的版本。',
        en: 'Click the "LTS" button on the left. This is the most stable version and best for beginners.',
      },
      {
        zh: '点击后，浏览器会开始下载一个安装包（Windows 下类似 node-v22.x.x-x64.msi，Mac 下类似 node-v22.x.x.pkg）。等待下载完成。',
        en: 'Your browser will start downloading an installer (e.g., node-v22.x.x-x64.msi on Windows, node-v22.x.x.pkg on Mac). Wait for the download to complete.',
      },
    ],
    tip: {
      zh: '一定选择 LTS 版本！Current 版是给有经验的开发者尝鲜用的，可能存在兼容性问题。',
      en: 'Always choose the LTS version! The Current version is for experienced developers and may have compatibility issues.',
    },
    links: [
      { label: 'Node.js', url: 'https://nodejs.org/', desc: { zh: '官方下载页面', en: 'Official download page' } },
    ],
  },
  {
    id: 'install-windows',
    title: { zh: '第二阶段：安装（Windows）', en: 'Phase 2: Install (Windows)' },
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    desc: {
      zh: '下载完成后，找到 .msi 文件并双击打开。接下来只需一路"下一步"：',
      en: 'After download, find the .msi file and double-click it. Just click "Next" through each step:',
    },
    steps: [
      {
        zh: '欢迎界面：看到 "Welcome to the Node.js Setup Wizard"，直接点击右下角的 Next。',
        en: 'Welcome screen: See "Welcome to the Node.js Setup Wizard", click Next at the bottom-right.',
      },
      {
        zh: '同意协议：勾选 "I accept the terms in the License Agreement" 前面的复选框，然后点击 Next。',
        en: 'License agreement: Check "I accept the terms in the License Agreement", then click Next.',
      },
      {
        zh: '选择安装路径：默认安装在 C:\\Program Files\\nodejs\\。建议不要修改，直接点击 Next。',
        en: 'Installation path: Default is C:\\Program Files\\nodejs\\. Don\'t change it — just click Next.',
      },
      {
        zh: '自定义设置（Custom Setup）：列出将要安装的组件（Node.js runtime、npm 等）。保持默认，直接点击 Next。',
        en: 'Custom Setup: Lists components to install (Node.js runtime, npm, etc.). Keep defaults, click Next.',
      },
      {
        zh: '本地模块工具（Tools for Native Modules）：问你是否自动安装 C/C++ 编译工具。不要勾选那个复选框（保持空白），直接点击 Next。',
        en: 'Tools for Native Modules: Asks about installing C/C++ build tools. Don\'t check the box — leave it empty and click Next.',
      },
      {
        zh: '准备安装：点击带有盾牌图标的 Install 按钮。如果弹出"你要允许此应用对你的设备进行更改吗？"，点击"是"。',
        en: 'Ready to install: Click the Install button (with shield icon). If prompted "Do you want to allow this app to make changes?", click "Yes".',
      },
      {
        zh: '安装完成：看到 "Completed the Node.js Setup Wizard"，点击 Finish。恭喜你，Node.js 安装完成！',
        en: 'Installation complete: See "Completed the Node.js Setup Wizard", click Finish. Congratulations!',
      },
    ],
    tip: {
      zh: '"Tools for Native Modules" 那一步不要勾选。作为新手暂时用不到 C/C++ 编译工具，勾选了反而会弹出很多黑框框让你困惑。',
      en: 'Don\'t check "Tools for Native Modules". Beginners don\'t need C/C++ build tools — checking it will pop up confusing terminal windows.',
    },
  },
  {
    id: 'install-mac',
    title: { zh: '第二阶段：安装（macOS）', en: 'Phase 2: Install (macOS)' },
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06z" /><path d="M10 2c1 .5 2 2 2 5" />
      </svg>
    ),
    desc: {
      zh: '下载完成后，找到 .pkg 文件并双击打开：',
      en: 'After download, find the .pkg file and double-click it:',
    },
    steps: [
      {
        zh: '双击下载好的 .pkg 文件，打开安装向导。',
        en: 'Double-click the downloaded .pkg file to open the installer.',
      },
      {
        zh: '点击 "继续"（Continue），一路同意许可协议。',
        en: 'Click "Continue" and agree to the license agreement.',
      },
      {
        zh: '选择安装位置：保持默认，点击 "安装"（Install）。',
        en: 'Choose installation location: keep default, click "Install".',
      },
      {
        zh: '系统会要求输入你的 Mac 密码（开机密码），输入后点击 "安装软件"。',
        en: 'Enter your Mac password (login password) when prompted, then click "Install Software".',
      },
      {
        zh: '等待安装完成，点击 "关闭"（Close）。Node.js 和 npm 都已安装完成！',
        en: 'Wait for installation to complete, click "Close". Node.js and npm are now installed!',
      },
    ],
  },
  {
    id: 'verify',
    title: { zh: '第三阶段：验证安装', en: 'Phase 3: Verify Installation' },
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    desc: {
      zh: '用命令行检查是否安装成功。别怕，操作很简单！',
      en: 'Use the command line to verify. Don\'t worry — it\'s very simple!',
    },
    steps: [
      {
        zh: '打开命令行窗口：\n• Windows：按住 Win 键 + R，在弹出的"运行"小窗口中输入 cmd，点击确定\n• macOS：按 Cmd + 空格 打开 Spotlight，输入 Terminal，按回车',
        en: 'Open a terminal:\n• Windows: Press Win+R, type cmd, press Enter\n• macOS: Press Cmd+Space, type Terminal, press Enter',
      },
      {
        zh: '在黑色窗口（命令行）中输入以下命令，然后按回车：',
        en: 'In the terminal window, type the following command and press Enter:',
      },
      {
        zh: '如果输出了版本号（如 v22.11.0），说明 Node.js 安装成功！',
        en: 'If you see a version number (e.g., v22.11.0), Node.js is installed successfully!',
      },
      {
        zh: '继续输入以下命令检查 npm（Node.js 的包管理器）：',
        en: 'Now check npm (Node.js package manager) with:',
      },
      {
        zh: '如果输出了版本号（如 10.9.0），说明 npm 也安装成功了！',
        en: 'If you see a version number (e.g., 10.9.0), npm is installed too!',
      },
    ],
    commands: [
      { cmd: 'node -v', afterStep: 1 },
      { cmd: 'npm -v', afterStep: 3 },
    ],
    tip: {
      zh: '如果提示"不是内部或外部命令"或"command not found"，请重启终端再试。如果还是不行，可能安装时出了问题，重新下载安装一次。',
      en: 'If you see "not recognized as an internal or external command" or "command not found", restart the terminal. If still failing, reinstall Node.js.',
    },
  },
  {
    id: 'first-code',
    title: { zh: '第四阶段：运行第一段代码', en: 'Phase 4: Run Your First Code' },
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    desc: {
      zh: '让你的电脑用 Node.js 跟你打个招呼！',
      en: 'Let your computer say hello to you using Node.js!',
    },
    steps: [
      {
        zh: '在桌面上新建一个文件夹，起名叫 MyFirstNode。',
        en: 'Create a new folder on your Desktop called MyFirstNode.',
      },
      {
        zh: '打开 MyFirstNode 文件夹，在里面新建一个文本文档，重命名为 app.js。',
        en: 'Open the MyFirstNode folder and create a new text file. Rename it to app.js.',
      },
      {
        zh: '右键 app.js → 打开方式 → 记事本（Windows）或文本编辑（Mac），粘贴下方代码框中的内容，按 Ctrl+S（Mac: Cmd+S）保存。',
        en: 'Right-click app.js → Open with → Notepad (Windows) or TextEdit (Mac), paste the code from below, save with Ctrl+S (Cmd+S).',
      },
      {
        zh: '回到命令行窗口，用 cd 命令进入刚才的文件夹：\n• Windows 偷懒技巧：输入 cd 加一个空格，然后把文件夹直接拖到黑窗口里松手，按回车\n• Mac 偷懒技巧：输入 cd 加一个空格，然后把文件夹从 Finder 拖到终端里，按回车',
        en: 'Go back to the terminal and navigate to the folder:\n• Windows shortcut: type cd then drag the folder into the terminal window\n• Mac shortcut: type cd then drag the folder from Finder into Terminal',
      },
      {
        zh: '输入 node app.js 按回车。你会看到输出：\nHello, Node.js! 我终于学会啦！\n恭喜你完成了第一段 Node.js 代码！',
        en: 'Type node app.js and press Enter. You\'ll see:\nHello, Node.js! I did it!\nCongratulations on your first Node.js program!',
      },
    ],
    code: {
      lang: 'javascript',
      filename: 'app.js',
      content: 'console.log("Hello, Node.js! 我终于学会啦！");',
    },
    tip: {
      zh: '如果你的电脑隐藏了文件后缀名，可能会把文件存成 app.js.txt。请在文件管理器中点击"查看"→"显示"→ 勾选"文件扩展名"，确保后缀是 .js。',
      en: 'If your OS hides file extensions, you might save it as app.js.txt. In File Explorer, click View → Show → check "File name extensions" to make sure the extension is .js.',
    },
  },
];

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function StepNumber({ n }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: 'var(--accent-gradient)',
        color: '#fff',
        fontSize: 11,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {n}
    </span>
  );
}

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    copy(code.content, '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        borderRadius: 'var(--radius-md, 8px)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        fontSize: 13,
        fontFamily: 'var(--font-mono)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          background: 'var(--surface-active)',
          borderBottom: '1px solid var(--border-subtle)',
          fontSize: 11,
          color: 'var(--text-muted)',
        }}
      >
        <span>{code.filename}</span>
        <button
          onClick={handleCopy}
          style={{
            background: 'none',
            border: 'none',
            color: copied ? 'var(--accent)' : 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 11,
            padding: '2px 6px',
            borderRadius: 4,
            transition: 'color 0.2s',
            fontFamily: 'inherit',
          }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: '12px 14px',
          background: 'var(--bg-base)',
          overflowX: 'auto',
          lineHeight: 1.6,
          color: 'var(--text-primary)',
          whiteSpace: 'pre',
        }}
      >
        <code>{code.content}</code>
      </pre>
    </div>
  );
}

function CommandBlock({ cmd }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    copy(cmd, '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 14px',
        borderRadius: 'var(--radius-md, 8px)',
        background: 'var(--bg-base)',
        border: '1px solid var(--border-subtle)',
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
      }}
    >
      <span style={{ color: 'var(--accent)', fontWeight: 600, userSelect: 'none' }}>$</span>
      <code style={{ flex: 1, color: 'var(--text-primary)' }}>{cmd}</code>
      <button
        onClick={handleCopy}
        style={{
          background: 'none',
          border: 'none',
          color: copied ? 'var(--accent)' : 'var(--text-muted)',
          cursor: 'pointer',
          fontSize: 11,
          padding: '2px 6px',
          borderRadius: 4,
          fontFamily: 'inherit',
          flexShrink: 0,
        }}
      >
        {copied ? '✓' : 'Copy'}
      </button>
    </div>
  );
}

/* ─── TOC ─────────────────────────────────────────────────────────────────── */

function TOC({ sections, activeId, lang }) {
  return (
    <nav style={{ position: 'sticky', top: 'calc(var(--header-height) + 24px)', width: 200, flexShrink: 0 }}>
      <p
        style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 12,
        }}
      >
        {lang === 'zh' ? '安装步骤' : 'Steps'}
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {sections.map((s) => {
          const isActive = activeId === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                style={{
                  display: 'block', padding: '5px 12px', fontSize: 13,
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 600 : 400, textDecoration: 'none',
                  borderLeft: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                  transition: 'color 0.2s, border-color 0.2s',
                }}
              >
                {t(s.title, lang)}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */

export default function NodejsSetup() {
  const lang = useLang();
  const isMobile = useIsMobile();
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const sectionRefs = useRef({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    for (const sec of SECTIONS) {
      const el = sectionRefs.current[sec.id];
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingTop: 'var(--header-height)' }}>
      {/* Header */}
      <div
        className='max-w-screen-lg mx-auto px-5'
        style={{ paddingTop: isMobile ? 32 : 48, paddingBottom: isMobile ? 24 : 32 }}
      >
        <Link
          to='/guide'
          className='inline-flex items-center gap-1.5 mb-5'
          style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          {lang === 'zh' ? '返回指南' : 'Back to Guide'}
        </Link>

        {/* Node.js logo + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div
            style={{
              width: 48, height: 48, borderRadius: 'var(--radius-md, 8px)',
              background: 'linear-gradient(135deg, #339933 0%, #68A063 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
            </svg>
          </div>
          <div>
            <h1
              style={{
                fontSize: isMobile ? 26 : 36, fontWeight: 800,
                fontFamily: 'var(--font-serif)', color: 'var(--text-primary)',
                lineHeight: 1.2, margin: 0,
              }}
            >
              {lang === 'zh' ? '安装 Node.js' : 'Install Node.js'}
            </h1>
          </div>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.6 }}>
          {lang === 'zh'
            ? 'Node.js 是许多 AI 编程工具的运行环境（如 Claude Code、Codex CLI 等）。本教程将手把手教你从零安装 Node.js，完全不需要任何编程基础。'
            : 'Node.js is the runtime for many AI coding tools (Claude Code, Codex CLI, etc.). This guide walks you through installing Node.js from scratch — no programming experience needed.'}
        </p>
      </div>

      {/* Body */}
      <div
        className='max-w-screen-lg mx-auto px-5'
        style={{ display: 'flex', gap: 48, paddingBottom: 80, alignItems: 'flex-start' }}
      >
        {!isMobile && <TOC sections={SECTIONS} activeId={activeId} lang={lang} />}

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 28 }}>
          {SECTIONS.map((section) => (
            <div key={section.id} id={section.id} ref={(el) => (sectionRefs.current[section.id] = el)}>
              <article
                style={{
                  borderRadius: 'var(--radius-lg, 12px)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface)',
                  overflow: 'hidden',
                }}
              >
                {/* Section header */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: 'color-mix(in srgb, var(--accent) 3%, var(--surface))',
                  }}
                >
                  <span style={{ color: 'var(--accent)', display: 'flex' }}>{section.icon}</span>
                  <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {t(section.title, lang)}
                  </h2>
                </div>

                {/* Section body */}
                <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Description */}
                  {section.desc && (
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
                      {t(section.desc, lang)}
                    </p>
                  )}

                  {/* Steps with interleaved commands */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {section.steps.map((step, i) => {
                      const commandAfter = section.commands?.find((c) => c.afterStep === i);
                      return (
                        <React.Fragment key={i}>
                          <div
                            style={{
                              display: 'flex', alignItems: 'flex-start', gap: 10,
                              fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
                            }}
                          >
                            <StepNumber n={i + 1} />
                            <span style={{ paddingTop: 1, whiteSpace: 'pre-line' }}>{t(step, lang)}</span>
                          </div>
                          {commandAfter && (
                            <div style={{ marginLeft: 32 }}>
                              <CommandBlock cmd={commandAfter.cmd} />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* Code block */}
                  {section.code && <CodeBlock code={section.code} />}

                  {/* Tip */}
                  {section.tip && (
                    <div
                      style={{
                        display: 'flex', gap: 10, padding: '12px 14px',
                        borderRadius: 'var(--radius-md, 8px)',
                        background: 'color-mix(in srgb, var(--accent) 5%, var(--bg-base))',
                        border: '1px solid color-mix(in srgb, var(--accent) 12%, var(--border-subtle))',
                        fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
                      }}
                    >
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{ flexShrink: 0, marginTop: 2 }}
                      >
                        <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                        <line x1="9" y1="21" x2="15" y2="21" />
                      </svg>
                      <span>{t(section.tip, lang)}</span>
                    </div>
                  )}

                  {/* Links */}
                  {section.links && section.links.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {section.links.map((link, li) => (
                        <a
                          key={li}
                          href={link.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 12px', borderRadius: 'var(--radius-md, 8px)',
                            border: '1px solid var(--border-subtle)', background: 'var(--bg-base)',
                            textDecoration: 'none', fontSize: 13, color: 'var(--text-secondary)',
                            transition: 'border-color 0.2s',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--accent) 30%, var(--border-subtle))'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                        >
                          <span style={{ fontWeight: 650, color: 'var(--text-primary)' }}>{link.label}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>— {t(link.desc, lang)}</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            </div>
          ))}

          {/* Bottom CTA */}
          <div
            style={{
              textAlign: 'center', padding: '24px 20px', borderRadius: 'var(--radius-lg, 12px)',
              background: 'color-mix(in srgb, var(--accent) 4%, var(--surface))',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <p style={{ fontSize: 15, fontWeight: 650, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              {lang === 'zh' ? 'Node.js 安装完成！' : 'Node.js Installation Complete!'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px' }}>
              {lang === 'zh'
                ? '现在你可以继续配置 AI 编程工具了。'
                : 'Now you can proceed to set up your AI coding tools.'}
            </p>
            <Link
              to='/guide/coding-assistants'
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 20px', borderRadius: 'var(--radius-md, 8px)',
                background: 'var(--accent-gradient)', color: '#fff',
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px color-mix(in srgb, var(--accent) 25%, transparent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              {lang === 'zh' ? '继续：AI 编程助手教程' : 'Next: AI Coding Assistants'}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
