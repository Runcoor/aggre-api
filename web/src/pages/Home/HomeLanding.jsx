import React, { useContext, useEffect, useState, useRef } from 'react';
import { Button } from '@douyinfe/semi-ui';
import { API, showError, copy, showSuccess } from '../../helpers';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { API_ENDPOINTS } from '../../constants/common.constant';
import { StatusContext } from '../../context/Status';
import { useActualTheme } from '../../context/Theme';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';
import {
  IconGithubLogo,
  IconPlay,
} from '@douyinfe/semi-icons';
import { Link } from 'react-router-dom';
import NoticeModal from '../../components/layout/NoticeModal';
import TextAnimate from '../../components/animation/TextAnimate';
import LogoLoop from '../../components/animation/LogoLoop';
import WordRotate from '../../components/animation/WordRotate';
import CountUp from '../../components/animation/CountUp';
import KineticText from '../../components/animation/KineticText';
import { Keyboard } from '../../components/animation/Keyboard';
import {
  Moonshot,
  OpenAI,
  XAI,
  Zhipu,
  Volcengine,
  Cohere,
  Claude,
  Gemini,
  Suno,
  Minimax,
  Wenxin,
  Spark,
  Qingyan,
  DeepSeek,
  Qwen,
  Midjourney,
  Grok,
  AzureAI,
  Hunyuan,
  Xinference,
  Cursor,
  Cline,
} from '@lobehub/icons';
import { VscVscode } from 'react-icons/vsc';

const ICON_SIZE = 44;
const ICON_SIZE_SM = 36;

const providerIcons = [
  { key: 'moonshot', Icon: Moonshot, color: false },
  { key: 'openai', Icon: OpenAI, color: false },
  { key: 'xai', Icon: XAI, color: false },
  { key: 'zhipu', Icon: Zhipu, color: true },
  { key: 'volcengine', Icon: Volcengine, color: true },
  { key: 'cohere', Icon: Cohere, color: true },
  { key: 'claude', Icon: Claude, color: true },
  { key: 'gemini', Icon: Gemini, color: true },
  { key: 'suno', Icon: Suno, color: false },
  { key: 'minimax', Icon: Minimax, color: true },
  { key: 'wenxin', Icon: Wenxin, color: true },
  { key: 'spark', Icon: Spark, color: true },
  { key: 'qingyan', Icon: Qingyan, color: true },
  { key: 'deepseek', Icon: DeepSeek, color: true },
  { key: 'qwen', Icon: Qwen, color: true },
  { key: 'midjourney', Icon: Midjourney, color: false },
  { key: 'grok', Icon: Grok, color: false },
  { key: 'azureai', Icon: AzureAI, color: true },
  { key: 'hunyuan', Icon: Hunyuan, color: true },
  { key: 'xinference', Icon: Xinference, color: true },
];

const ProviderIconItem = ({ icon, size }) => {
  const Comp = icon.color ? icon.Icon.Color || icon.Icon : icon.Icon;
  return (
    <div
      className='shrink-0 flex items-center justify-center'
      style={{
        width: size + 24,
        height: size + 24,
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface)',
        border: '1px solid var(--border-default)',
      }}
    >
      <Comp size={size} />
    </div>
  );
};

const ProviderLogoLoop = ({ isMobile }) => {
  const size = isMobile ? ICON_SIZE_SM : ICON_SIZE;
  return (
    <LogoLoop
      logos={providerIcons}
      speed={45}
      direction='left'
      logoHeight={size + 24}
      gap={16}
      hoverSpeed={15}
      fadeOut
      fadeOutColor='var(--bg-base)'
      ariaLabel='AI provider logos'
      renderItem={(item) => <ProviderIconItem icon={item} size={size} />}
    />
  );
};

const FeatureCard = ({ icon, title, desc, accent = false, wide = false }) => (
  <div
    className={`p-8 md:p-10 flex flex-col justify-between gap-6 ${wide ? 'md:col-span-2' : ''}`}
    style={{
      background: accent ? 'var(--accent-light)' : 'var(--surface)',
      border: `1px solid ${accent ? 'rgba(0,114,255,0.15)' : 'var(--border-default)'}`,
      borderRadius: 'var(--radius-lg)',
      minHeight: wide ? 280 : 240,
    }}
  >
    <span
      className='material-symbols-outlined'
      style={{
        fontSize: 40,
        color: 'var(--accent)',
        fontVariationSettings: "'FILL' 1",
      }}
    >
      {icon}
    </span>
    <div>
      <h3
        className='text-xl md:text-2xl font-semibold mb-3'
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}
      >
        {title}
      </h3>
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{desc}</p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Tutorial Panel
───────────────────────────────────────────── */
const KW = ({ children }) => (
  <span style={{ color: '#79b8ff' }}>{children}</span>
);
const STR = ({ children }) => (
  <span style={{ color: '#9ecbff' }}>{children}</span>
);
const CMT = ({ children }) => (
  <span style={{ color: '#6a737d', fontStyle: 'italic' }}>{children}</span>
);
const VAR = ({ children }) => (
  <span style={{ color: '#b392f0' }}>{children}</span>
);
const FN = ({ children }) => (
  <span style={{ color: '#79b8ff' }}>{children}</span>
);
const ENV = ({ children }) => (
  <span style={{ color: '#ffab70' }}>{children}</span>
);

const TABS = [
  { id: 'claude', label: 'Claude Code', icon: <Claude size={14} /> },
  { id: 'opencode', label: 'OpenCode', icon: '◈' },
  { id: 'cline', label: 'Cline', icon: <Cline size={14} /> },
  { id: 'codex', label: 'Codex CLI', icon: <OpenAI size={14} /> },
  { id: 'cursor', label: 'Cursor', icon: <Cursor size={14} /> },
  { id: 'code', label: 'Code', icon: <VscVscode size={14} /> },
];

const getTutorial = (tab, serverAddress, t) => {
  // Single source of truth — always falls through to whatever the parent
  // computed. The parent already handles localhost / browser-origin fallback.
  const base = serverAddress || (typeof window !== 'undefined' ? window.location.origin : '');
  switch (tab) {
    case 'claude':
      return {
        filename: '~/.bashrc  /  ~/.zshrc',
        lines: [
          { n: '01', el: <><CMT># {t('Claude Code — 将 API 请求路由到')} {base}</CMT></> },
          { n: '02', el: <></> },
          { n: '03', el: <><KW>export</KW> <ENV>ANTHROPIC_BASE_URL</ENV>=<STR>{base}</STR></> },
          { n: '04', el: <><KW>export</KW> <ENV>ANTHROPIC_AUTH_TOKEN</ENV>=<STR>YOUR_API_KEY</STR></> },
          { n: '05', el: <></> },
          { n: '06', el: <><CMT># {t('然后在终端中启动')}</CMT></> },
          { n: '07', el: <><FN>claude</FN></> },
        ],
      };
    case 'codex':
      return {
        filename: 'terminal',
        lines: [
          { n: '01', el: <><CMT># {t('OpenAI Codex CLI — 指向自定义端点')}</CMT></> },
          { n: '02', el: <></> },
          { n: '03', el: <><KW>export</KW> <ENV>OPENAI_BASE_URL</ENV>=<STR>{base}/v1</STR></> },
          { n: '04', el: <><KW>export</KW> <ENV>OPENAI_API_KEY</ENV>=<STR>YOUR_API_KEY</STR></> },
          { n: '05', el: <></> },
          { n: '06', el: <><CMT># {t('启动 Codex')}</CMT></> },
          { n: '07', el: <><FN>codex</FN> <STR>"{t('重构这段代码，提升可读性')}"</STR></> },
        ],
      };
    case 'cursor':
      return {
        filename: 'Cursor → Settings → Models',
        lines: [
          { n: '01', el: <><CMT># {t('Cursor IDE — 自定义 API 端点')}</CMT></> },
          { n: '02', el: <></> },
          { n: '03', el: <><CMT># {t('路径')}: Settings → Models → OpenAI API Key</CMT></> },
          { n: '04', el: <></> },
          { n: '05', el: <><ENV>Override OpenAI Base URL</ENV></> },
          { n: '06', el: <><STR>{base}/v1</STR></> },
          { n: '07', el: <></> },
          { n: '08', el: <><ENV>API Key</ENV>: <STR>YOUR_API_KEY</STR></> },
        ],
      };
    case 'opencode':
      return {
        filename: 'terminal  (~/.config/opencode/config.json)',
        lines: [
          { n: '01', el: <><CMT># {t('OpenCode — 设置自定义 API 端点')}</CMT></> },
          { n: '02', el: <></> },
          { n: '03', el: <><KW>export</KW> <ENV>OPENAI_BASE_URL</ENV>=<STR>{base}/v1</STR></> },
          { n: '04', el: <><KW>export</KW> <ENV>OPENAI_API_KEY</ENV>=<STR>YOUR_API_KEY</STR></> },
          { n: '05', el: <></> },
          { n: '06', el: <><CMT># {t('或在 config.json 中配置')}</CMT></> },
          { n: '07', el: <>{'{'}</> },
          { n: '08', el: <>&nbsp;&nbsp;<ENV>"model"</ENV>: <STR>"openai/gpt-4o"</STR>,</> },
          { n: '09', el: <>&nbsp;&nbsp;<ENV>"openai"</ENV>: {'{'} <ENV>"baseURL"</ENV>: <STR>"{base}/v1"</STR> {'}'}</> },
          { n: '10', el: <>{'}'}</> },
        ],
      };
    case 'cline':
      return {
        filename: 'VSCode → Cline Extension → Settings',
        lines: [
          { n: '01', el: <><CMT># {t('Cline (VSCode Extension) — 自定义端点')}</CMT></> },
          { n: '02', el: <></> },
          { n: '03', el: <><CMT># 1. {t('打开 VSCode → Cline 扩展面板')}</CMT></> },
          { n: '04', el: <><CMT># 2. {t('点击右上角设置图标')}</CMT></> },
          { n: '05', el: <><CMT># 3. {t('API Provider 选择 "OpenAI Compatible"')}</CMT></> },
          { n: '06', el: <></> },
          { n: '07', el: <><ENV>Base URL</ENV>:   <STR>{base}/v1</STR></> },
          { n: '08', el: <><ENV>API Key</ENV>:    <STR>YOUR_API_KEY</STR></> },
          { n: '09', el: <><ENV>Model ID</ENV>:   <STR>claude-sonnet-4-5</STR></> },
        ],
      };
    case 'code':
    default:
      return {
        filename: 'example.js',
        lines: [
          { n: '01', el: <><KW>import</KW> <VAR>OpenAI</VAR> <KW>from</KW> <STR>'openai'</STR>;</> },
          { n: '02', el: <></> },
          { n: '03', el: <><KW>const</KW> <VAR>client</VAR> = <KW>new</KW> <FN>OpenAI</FN>({'{'}</> },
          { n: '04', el: <>&nbsp;&nbsp;<ENV>baseURL</ENV>: <STR>'{base}/v1'</STR>,</> },
          { n: '05', el: <>&nbsp;&nbsp;<ENV>apiKey</ENV>: <STR>'YOUR_API_KEY'</STR>,</> },
          { n: '06', el: <>{'}'})</> },
          { n: '07', el: <></> },
          { n: '08', el: <><KW>const</KW> <VAR>res</VAR> = <KW>await</KW> client.chat.completions.<FN>create</FN>({'{'}</> },
          { n: '09', el: <>&nbsp;&nbsp;<ENV>model</ENV>: <STR>'gpt-4o'</STR>,</> },
          { n: '10', el: <>&nbsp;&nbsp;<ENV>messages</ENV>: [{'{'} <ENV>role</ENV>: <STR>'user'</STR>, <ENV>content</ENV>: <STR>'Hello!'</STR> {'}'}],</> },
          { n: '11', el: <>{'}'});</> },
        ],
      };
  }
};

const TutorialPanel = ({ serverAddress, systemName, t }) => {
  const [activeTab, setActiveTab] = React.useState('claude');
  const [animKey, setAnimKey] = React.useState(0);

  const handleTab = (id) => {
    if (id === activeTab) return;
    setActiveTab(id);
    setAnimKey((k) => k + 1);
  };

  const tutorial = getTutorial(activeTab, serverAddress, t);

  return (
    <div className='relative z-10 w-full max-w-4xl mx-auto px-5 pb-20 md:pb-28'>
      <style>{`
        @keyframes code-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .code-line-anim {
          animation: code-fade-in 0.35s ease both;
        }
        .tutorial-tab {
          position: relative;
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.03em;
          cursor: pointer;
          transition: color 0.2s, background 0.2s;
          border: none;
          outline: none;
          background: transparent;
          white-space: nowrap;
        }
        .tutorial-tab.active {
          background: var(--accent-gradient);
          color: #fff;
          box-shadow: 0 2px 12px rgba(0,114,255,0.25);
        }
        .tutorial-tab:not(.active) {
          color: var(--text-muted);
        }
        .tutorial-tab:not(.active):hover {
          color: var(--text-primary);
          background: var(--surface-hover);
        }
      `}</style>

      {/* Tabs */}
      <div
        className='flex items-center gap-1 mb-3 p-1.5 overflow-x-auto'
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          width: 'fit-content',
          maxWidth: '100%',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tutorial-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => handleTab(tab.id)}
          >
            <span
              className='mr-1.5'
              style={{
                fontSize: 11,
                display: 'inline-flex',
                alignItems: 'center',
                verticalAlign: 'middle',
              }}
            >
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Code Window */}
      <div
        style={{
          background: '#0d1117',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {/* Titlebar */}
        <div
          className='flex items-center gap-2 px-4 py-3'
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className='w-3 h-3 rounded-full' style={{ background: '#ff5f57' }} />
          <div className='w-3 h-3 rounded-full' style={{ background: '#febc2e' }} />
          <div className='w-3 h-3 rounded-full' style={{ background: '#28c840' }} />
          <span
            className='ml-3 text-xs tracking-widest uppercase'
            style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.25)' }}
          >
            {tutorial.filename}
          </span>
        </div>

        {/* Lines */}
        <div className='p-5 md:p-7' style={{ fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: '1.9' }}>
          {tutorial.lines.map((row, i) => (
            <div
              key={`${animKey}-${i}`}
              className='code-line-anim flex gap-4'
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span style={{ color: 'rgba(255,255,255,0.18)', minWidth: 22, userSelect: 'none', textAlign: 'right' }}>
                {row.n}
              </span>
              <span style={{ color: '#e6edf3' }}>{row.el}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatItem = ({ value, label }) => (
  <div className='text-center'>
    <div
      className='text-3xl md:text-4xl font-bold mb-1'
      style={{
        background: 'var(--accent-gradient)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontFamily: 'var(--font-serif)',
      }}
    >
      {value}
    </div>
    <div className='text-xs uppercase tracking-widest' style={{ color: 'var(--text-muted)' }}>
      {label}
    </div>
  </div>
);

// ── FAQ Accordion ─────────────────────────────────────────────────────────
const FAQItem = ({ question, answer, isOpen, onToggle, index }) => {
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        background: isOpen ? 'var(--surface)' : 'transparent',
        transition: 'background 250ms ease',
      }}
    >
      {/* Border — gradient when open, solid when closed */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'var(--radius-lg)',
          padding: 1,
          background: isOpen ? 'var(--accent-gradient)' : 'var(--border-default)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
          transition: 'background 250ms ease',
        }}
      />
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '18px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--text-primary)',
          lineHeight: 1.5,
        }}>
          {question}
        </span>
        <span
          style={{
            flexShrink: 0,
            width: 24,
            height: 24,
            borderRadius: 'var(--radius-sm)',
            background: isOpen ? 'var(--accent-gradient)' : 'var(--surface-hover, rgba(128,128,128,0.1))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            color: isOpen ? '#fff' : 'var(--text-muted)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 1V11M1 6H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      <div
        style={{
          height,
          overflow: 'hidden',
          transition: 'height 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          ref={contentRef}
          style={{
            padding: '0 20px 18px',
            fontSize: 14,
            lineHeight: 1.8,
            color: 'var(--text-secondary)',
          }}
        >
          {answer}
        </div>
      </div>
    </div>
  );
};

const HomeFAQ = ({ t }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: t('支持哪些模型？'),
      a: t('支持 40+ 主流 AI 模型，包括 Claude 全系列（Opus、Sonnet、Haiku）、GPT-4o/GPT-5、Gemini、DeepSeek、Grok、Qwen、Moonshot 等。模型持续更新，第一时间同步上游最新版本。'),
    },
    {
      q: t('支持哪些工具和 IDE？'),
      a: t('兼容所有支持 OpenAI API 格式的工具：Claude Code、Codex CLI、Cursor、VS Code (Continue/Cline)、JetBrains AI、Cherry Studio、ChatBox 等。同时原生支持 Claude Messages 和 Gemini 格式。'),
    },
    {
      q: t('实际扣费怎么计算？'),
      a: t('按实际 Token 用量计费，充值余额永不过期。每次 API 调用会实时显示消耗的 Token 数和费用，在控制台可以随时查看详细的用量记录和账单。'),
    },
    {
      q: t('国内能直接用吗？'),
      a: t('可以直接使用，无需额外网络工具。我们提供国内可直连的 API 端点，针对国内网络环境做了专项优化，确保低延迟、高可用。'),
    },
    {
      q: t('服务稳定性怎么保障？'),
      a: t('企业级 SLA 保障，多节点负载均衡和自动故障转移。内置智能渠道路由，单一渠道异常时自动切换，确保请求成功率。控制台提供实时的服务状态监控。'),
    },
    {
      q: t('可以创建多个 API Key 吗？'),
      a: t('可以。每个账户支持创建多个 API Key，并可为每个 Key 单独设置额度上限、模型权限和有效期。适合按项目或团队成员分别管理。'),
    },
    {
      q: t('支持企业用户吗？'),
      a: <>{t('支持。我们提供企业专属方案，包括独立部署、专属渠道、优先技术支持、自定义 SLA 以及批量折扣。请联系')} <a href='mailto:hello@aggretoken.com' style={{ color: 'var(--accent)', textDecoration: 'underline' }}>hello@aggretoken.com</a> {t('获取定制方案。')}</>,
    },
  ];

  return (
    <section className='py-20 md:py-32' style={{ background: 'var(--bg-base)' }}>
      <div className='max-w-3xl mx-auto px-5'>
        <div className='text-center mb-12 md:mb-16'>
          <div
            className='inline-flex items-center gap-2 px-3 py-1 mb-6 text-xs font-semibold uppercase tracking-widest'
            style={{
              borderRadius: 'var(--radius-full, 9999px)',
              background: 'var(--surface)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-muted)',
            }}
          >
            FAQ
          </div>
          <TextAnimate
            as='h2'
            variant='scaleUp'
            duration={800}
            className='text-3xl md:text-4xl lg:text-5xl font-bold mb-4'
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
          >
            {t('常见问题')}
          </TextAnimate>
          <TextAnimate
            as='p'
            variant='slideLeftChar'
            delay={300}
            duration={550}
            stagger={28}
            style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}
          >
            {t('关于服务的一切，你想知道的都在这里')}
          </TextAnimate>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {faqs.map((faq, idx) => (
            <FAQItem
              key={idx}
              index={idx}
              question={faq.q}
              answer={faq.a}
              isOpen={openIndex === idx}
              onToggle={() => setOpenIndex(openIndex === idx ? null : idx)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const HomeLanding = () => {
  const { t, i18n } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const actualTheme = useActualTheme();
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(false);
  const isMobile = useIsMobile();
  const isDemoSiteMode = statusState?.status?.demo_site_enabled || false;
  const docsLink = statusState?.status?.docs_link || '';
  // Resolve the public server address shown in the tutorial.
  // Priority:
  //   1. Backend-configured server_address (admin option), unless it points
  //      to localhost / 127.0.0.1 (a leftover dev value users complain about).
  //   2. Current browser URL — whatever domain the user is actually viewing.
  // This way the tutorial always reflects the real public endpoint without
  // needing the admin to remember to update Settings → server_address.
  const serverAddress = (() => {
    const fromBackend = statusState?.status?.server_address || '';
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(fromBackend);
    if (fromBackend && !isLocal) return fromBackend;
    return window.location.origin;
  })();
  const endpointItems = API_ENDPOINTS.map((e) => ({ value: e }));
  const [endpointIndex, setEndpointIndex] = useState(0);
  const isChinese = i18n.language.startsWith('zh');
  const systemName = statusState?.status?.system_name || 'AGGRETOKEN';

  const displayHomePageContent = async () => {
    setHomePageContent(localStorage.getItem('home_page_content') || '');
    const res = await API.get('/api/home_page_content');
    const { success, message, data } = res.data;
    if (success) {
      let content = data;
      if (!data.startsWith('https://')) {
        content = marked.parse(data);
      }
      setHomePageContent(content);
      localStorage.setItem('home_page_content', content);
      if (data.startsWith('https://')) {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          iframe.onload = () => {
            iframe.contentWindow.postMessage({ themeMode: actualTheme }, '*');
            iframe.contentWindow.postMessage({ lang: i18n.language }, '*');
          };
        }
      }
    } else {
      showError(message);
      setHomePageContent('加载首页内容失败...');
    }
    setHomePageContentLoaded(true);
  };

  const [copied, setCopied] = useState(false);
  const handleCopyBaseURL = async () => {
    const ok = await copy(serverAddress);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  useEffect(() => {
    const checkNotice = async () => {
      const lastCloseDate = localStorage.getItem('notice_close_date');
      const today = new Date().toDateString();
      if (lastCloseDate !== today) {
        try {
          const res = await API.get('/api/notice');
          const { success, data } = res.data;
          if (success && data && data.trim() !== '') setNoticeVisible(true);
        } catch (e) {
          console.error('获取公告失败:', e);
        }
      }
    };
    checkNotice();
  }, []);

  useEffect(() => { displayHomePageContent(); }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setEndpointIndex((prev) => (prev + 1) % endpointItems.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [endpointItems.length]);

  return (
    <div
      className='w-full overflow-x-hidden'
      style={{ marginTop: 'calc(-1 * var(--header-height))' }}
    >
      <link
        href='https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap'
        rel='stylesheet'
      />
      <NoticeModal
        visible={noticeVisible}
        onClose={() => setNoticeVisible(false)}
        isMobile={isMobile}
      />

      {homePageContentLoaded && homePageContent === '' ? (
        <div className='w-full overflow-x-hidden'>

          {/* ===== Hero Section ===== */}
          <section
            className='relative w-full overflow-hidden'
            style={{
              background: 'var(--bg-base)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            {/* Subtle grid overlay */}
            <div
              className='absolute inset-0 pointer-events-none'
              style={{
                backgroundImage: 'radial-gradient(var(--border-default) 0.5px, transparent 0.5px)',
                backgroundSize: '32px 32px',
                opacity: 0.5,
              }}
            />
            {/* Glow — positioned so it bleeds behind the fixed header */}
            <div
              className='absolute pointer-events-none'
              style={{
                top: '-60px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 800,
                height: 500,
                borderRadius: '50%',
                background: 'var(--accent-gradient)',
                filter: 'blur(100px)',
                opacity: 0.18,
              }}
            />

            <div className='relative z-10 flex flex-col items-center justify-center text-center px-5 pt-28 pb-20 md:pt-36 md:pb-28 lg:pt-44 lg:pb-32 max-w-4xl mx-auto'>
              {/* Badge */}
              <div
                className='inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-xs font-medium uppercase tracking-widest'
                style={{
                  borderRadius: 'var(--radius-full, 9999px)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                }}
              >
                <span
                  className='inline-block w-2 h-2 rounded-full'
                  style={{ background: '#10b981' }}
                />
                {t('开启下一代 AI 业务架构')}{' '}
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>→</span>
              </div>

              {/* Heading */}
              <TextAnimate
                as='h1'
                variant='fadeUp'
                delay={100}
                duration={800}
                className={`text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[0.95] mb-6 ${isChinese ? 'tracking-wide' : 'tracking-tighter'}`}
                style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
              >
                <KineticText
                  text={systemName}
                  gradient='var(--accent-gradient)'
                />
                <br />
                {t('优质 API 管理平台')}
              </TextAnimate>

              {/* Subtitle */}
              <TextAnimate
                as='p'
                variant='fade'
                delay={350}
                duration={700}
                className='text-base md:text-xl lg:text-2xl font-light mb-8 max-w-2xl'
                style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}
              >
                {t('官方一手，为开发者提供')}{' '}
                <span style={{ color: 'var(--accent)', fontWeight: 500 }}>
                  {t('稳定、极速、满血版')}
                </span>{' '}
                {t('的 API 体验。')}
              </TextAnimate>

              {/* Base URL — code snippet style */}
              <div
                onClick={handleCopyBaseURL}
                className='group flex items-center gap-3 px-5 py-3 mb-10 cursor-pointer transition-all duration-200'
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-lg)',
                  maxWidth: '480px',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.boxShadow = '0 0 0 1px var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-default)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span
                  style={{
                    color: 'var(--accent)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '14px',
                    fontWeight: 600,
                    userSelect: 'none',
                  }}
                >
                  $
                </span>
                <span
                  className='flex-1 text-left truncate'
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {serverAddress}
                  <span style={{ color: 'var(--text-muted)', transition: 'opacity 200ms' }}>
                    {endpointItems[endpointIndex]?.value}
                  </span>
                </span>
                <span
                  style={{
                    color: copied ? 'var(--accent)' : 'var(--text-muted)',
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap',
                    transition: 'color 200ms',
                    userSelect: 'none',
                  }}
                >
                  {copied ? t('已复制') : t('复制')}
                </span>
              </div>

              {/* CTAs */}
              <div className='flex flex-row gap-3 justify-center items-center flex-wrap'>
                <Link to='/quick-start' className='quick-start-btn-link'>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: isMobile ? '7px 14px' : '9px 18px',
                      borderRadius: 9999,
                      background: 'var(--accent-gradient)',
                      color: '#fff',
                      fontSize: isMobile ? 13 : 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'box-shadow 0.3s, transform 0.2s',
                      boxShadow: '0 2px 8px color-mix(in srgb, var(--accent) 30%, transparent)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 18px color-mix(in srgb, var(--accent) 45%, transparent)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 2px 8px color-mix(in srgb, var(--accent) 30%, transparent)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <IconPlay style={{ fontSize: isMobile ? 13 : 14 }} />
                    {t('快速开始')}
                  </span>
                </Link>
                {isDemoSiteMode && statusState?.status?.version && (
                  <Button
                    size={isMobile ? 'default' : 'large'}
                    icon={<IconGithubLogo />}
                    style={{
                      borderRadius: 9999,
                      padding: '0 20px',
                      background: 'var(--surface-active)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border-default)',
                    }}
                    onClick={() => window.open('https://github.com/QuantumNous/aggre-api', '_blank')}
                  >
                    {statusState.status.version}
                  </Button>
                )}
                {/* Beginner guide button — gradient border + gradient text */}
                <Link to='/guide' className='guide-btn-link'>
                  <span
                    className='guide-btn-outer'
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '1px',
                      borderRadius: 9999,
                      background: 'var(--accent-gradient)',
                      cursor: 'pointer',
                      transition: 'box-shadow 0.3s',
                    }}
                    title={t('guide_tooltip')}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 16px color-mix(in srgb, var(--accent) 25%, transparent)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <span
                      className='guide-btn-inner'
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: isMobile ? '7px 14px' : '9px 18px',
                        borderRadius: 9999,
                        background: 'var(--bg-base)',
                        fontSize: isMobile ? 13 : 14,
                        fontWeight: 600,
                        backgroundClip: 'padding-box',
                        transition: 'background 0.25s',
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="url(#guide-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <defs>
                          <linearGradient id="guide-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--accent)" />
                            <stop offset="100%" stopColor="color-mix(in srgb, var(--accent) 60%, #a855f7)" />
                          </linearGradient>
                        </defs>
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                      </svg>
                      <span
                        style={{
                          background: 'var(--accent-gradient)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        {t('新手指南')}
                      </span>
                    </span>
                  </span>
                </Link>
              </div>
              {/* Trust Strip — single rotating pill */}
              <div className='mt-8 md:mt-10 flex justify-center'>
                <div
                  className='trust-rotate-pill'
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 16px',
                    borderRadius: 'var(--radius-full, 9999px)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                    whiteSpace: 'nowrap',
                    transition:
                      'border-color 0.25s, color 0.25s, background 0.25s, box-shadow 0.25s',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.color = 'var(--accent)';
                    e.currentTarget.style.background =
                      'color-mix(in srgb, var(--accent) 6%, var(--surface))';
                    e.currentTarget.style.boxShadow =
                      '0 0 14px color-mix(in srgb, var(--accent) 18%, transparent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.background = 'var(--surface)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <WordRotate
                    interval={2500}
                    duration={500}
                    items={[
                      {
                        icon: (
                          <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                            <path d='M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2.5' /><path d='M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4' />
                          </svg>
                        ),
                        text: t('余额随时可退'),
                      },
                      {
                        icon: (
                          <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                            <polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2' />
                          </svg>
                        ),
                        text: t('99.9% 可用率'),
                      },
                      {
                        icon: (
                          <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                            <rect width='18' height='11' x='3' y='11' rx='2' ry='2' /><path d='M7 11V7a5 5 0 0 1 10 0v4' />
                          </svg>
                        ),
                        text: t('不存储请求数据'),
                      },
                      {
                        icon: (
                          <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                            <path d='M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z' /><path d='M8 10h8' /><path d='M8 14h4' />
                          </svg>
                        ),
                        text: t('按量计费无绑定'),
                      },
                      {
                        icon: (
                          <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
                            <path d='M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z' />
                          </svg>
                        ),
                        text: t('7×24 技术支持'),
                      },
                    ]}
                    render={(item) => (
                      <>
                        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, opacity: 0.7, marginRight: 6 }}>
                          {item.icon}
                        </span>
                        {item.text}
                      </>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Tutorial Tabs Panel */}
            <TutorialPanel serverAddress={serverAddress} systemName={systemName} t={t} />
          </section>

          {/* ===== Scrolling Provider Icons ===== */}
          <section
            className='py-16 md:py-24'
            style={{
              background: 'var(--bg-base)',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div className='max-w-screen-xl mx-auto px-5'>
              <p
                className='text-xs uppercase tracking-widest mb-8 md:mb-10 text-center'
                style={{ color: 'var(--text-muted)', letterSpacing: '0.15em' }}
              >
                {t('支持众多的大模型供应商')}
              </p>
              <ProviderLogoLoop isMobile={isMobile} />
            </div>
          </section>

          {/* ===== Features Bento Grid ===== */}
          <section className='py-20 md:py-32' style={{ background: 'var(--bg-base)' }}>
            <div className='max-w-screen-xl mx-auto px-5'>
              <div className='flex flex-col md:flex-row justify-between items-end mb-12 md:mb-20 gap-6'>
                <div className='max-w-2xl'>
                  <TextAnimate
                    as='h2'
                    variant='scaleUp'
                    duration={800}
                    className='text-3xl md:text-4xl lg:text-5xl font-bold mb-4'
                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
                  >
                    {t('核心优势：为性能而生')}
                  </TextAnimate>
                  <TextAnimate
                    as='p'
                    variant='slideLeftChar'
                    delay={300}
                    duration={550}
                    stagger={28}
                    style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}
                  >
                    {t('企业级架构，为每一次调用保驾护航')}
                  </TextAnimate>
                </div>
                <TextAnimate
                  as='div'
                  variant='slideLeftChar'
                  delay={500}
                  duration={500}
                  stagger={40}
                  className='text-xs font-semibold uppercase tracking-widest hidden md:block'
                  style={{ color: 'var(--accent)' }}
                >
                  {t('功能架构')}
                </TextAnimate>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
                <FeatureCard
                  wide
                  icon='shield_with_heart'
                  title={t('卓越稳定性')}
                  desc={(() => {
                    // Split on a unique marker so we can inject the
                    // <CountUp> JSX between the translated prefix and
                    // suffix without losing i18n.
                    const MARK = '__SLA_VALUE__';
                    const parts = t(
                      '企业级 SLA 保证，{{value}}% 全年在线。多重负载均衡与实时熔断机制，确保您的业务永不断线。',
                      { value: MARK },
                    ).split(MARK);
                    return (
                      <>
                        {parts[0]}
                        <CountUp
                          value={99.9}
                          decimals={1}
                          duration={1800}
                          style={{
                            color: 'var(--text-primary)',
                            fontWeight: 700,
                          }}
                        />
                        {parts[1]}
                      </>
                    );
                  })()}
                />
                <FeatureCard
                  icon='bolt'
                  title={t('极速响应')}
                  desc={t('全球边缘节点并发，毫秒级延迟，感受如丝般顺滑的 API 调用体验。')}
                />
                <FeatureCard
                  icon='rocket_launch'
                  title={t('满血版体验')}
                  desc={t('提供最完整、无限制的 API 功能，打破封锁与限制，释放模型全部潜能。')}
                />
                <FeatureCard
                  wide
                  accent
                  icon='support_agent'
                  title={t('7x24 售后保障')}
                  desc={t('顶级技术团队实时待命，响应迅速。无论是接入调试还是高并发优化，我们都在您身后。')}
                />
              </div>
            </div>
          </section>

          {/* ===== FAQ Section ===== */}
          <HomeFAQ t={t} />

          {/* ===== CTA Section ===== */}
          <section
            className='pt-20 pb-32 md:pt-32 md:pb-56 relative overflow-hidden'
            style={{ background: 'var(--bg-base)' }}
          >
            <div
              className='absolute pointer-events-none'
              style={{
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 1000,
                height: 400,
                borderRadius: '50%',
                background: 'var(--accent-light)',
                filter: 'blur(150px)',
                opacity: 0.3,
              }}
            />
            <div className='max-w-screen-xl mx-auto px-5 relative z-10'>
              <div className='flex flex-col md:flex-row items-center gap-10 md:gap-8'>
                {/* Left — text + button */}
                <div className='w-full md:w-1/2 text-center md:text-left'>
                  <TextAnimate
                    as='h2'
                    variant='scaleUp'
                    duration={900}
                    className='text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight'
                    style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
                  >
                    {t('加入')}{' '}
                    <span
                      style={{
                        background: 'var(--accent-gradient)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {systemName}
                    </span>
                    <br />
                    <span
                      style={{
                        background: 'var(--accent-gradient)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {t('真货不缩水，体验极致')}
                    </span>
                  </TextAnimate>
                  <TextAnimate
                    as='p'
                    variant='slideLeftChar'
                    delay={350}
                    duration={550}
                    stagger={28}
                    className='text-base md:text-xl mb-10 max-w-2xl md:max-w-none mx-auto md:mx-0'
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {t('立刻即可开启您的下一代 AI 业务架构。')}
                  </TextAnimate>
                  <div className='flex justify-center md:justify-start'>
                    <Link to='/quick-start' className='quick-start-btn-link'>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '13px 32px',
                          borderRadius: 9999,
                          background: 'var(--accent-gradient)',
                          color: '#fff',
                          fontSize: 16,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'box-shadow 0.3s, transform 0.2s',
                          boxShadow: '0 4px 14px color-mix(in srgb, var(--accent) 35%, transparent)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = '0 0 24px color-mix(in srgb, var(--accent) 50%, transparent)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = '0 4px 14px color-mix(in srgb, var(--accent) 35%, transparent)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }}
                      >
                        {t('快速开始')}
                      </span>
                    </Link>
                  </div>
                </div>
                {/* Right — keyboard with left-side fade, offset down by half its height on desktop */}
                <div className='w-full md:w-1/2 relative overflow-hidden md:translate-y-1/2'>
                  <Keyboard
                    enableSound={false}
                    showPreview={false}
                    className='[zoom:0.55] sm:[zoom:0.75] md:[zoom:0.85] lg:[zoom:1] xl:[zoom:1.1]'
                  />
                  {/* 25% fade overlay on the keyboard's left side — text
                      column is on the left, fade transitions the keyboard
                      out into the section background as the eye scans
                      from the text toward the right. */}
                  <div
                    aria-hidden='true'
                    className='absolute inset-y-0 left-0 pointer-events-none'
                    style={{
                      width: '25%',
                      background:
                        'linear-gradient(to right, var(--bg-base) 0%, var(--bg-base) 30%, transparent 100%)',
                      zIndex: 5,
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ===== Footer ===== */}
          <footer
            className='py-8 px-5'
            style={{
              background: 'var(--surface)',
              borderTop: '1px solid var(--border-subtle)',
              marginBottom: 0,
            }}
          >
            <div className='flex flex-col md:flex-row justify-between items-center gap-6 max-w-screen-xl mx-auto'>
              <div className='flex flex-col items-center md:items-start gap-2'>
                <div
                  className='text-lg font-bold'
                  style={{ fontFamily: 'var(--font-serif)', color: 'var(--text-primary)' }}
                >
                  {systemName}
                </div>
                <p className='text-sm' style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                  © {new Date().getFullYear()} {systemName}.
                </p>
              </div>
              <div className='flex gap-6'>
                {[
                  { label: t('隐私政策'), to: '/privacy-policy' },
                  { label: t('服务条款'), to: '/terms-of-service' },
                  { label: t('安全'), to: '/security' },
                  { label: t('状态'), to: '/status' },
                  { label: t('更新日志'), to: '/changelog' },
                  { label: t('关于'), to: '/about' },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className='text-sm transition-colors duration-200'
                    style={{ color: 'var(--text-muted)', opacity: 0.5 }}
                    onMouseEnter={(e) => { e.target.style.color = 'var(--accent)'; e.target.style.opacity = '0.8'; }}
                    onMouseLeave={(e) => { e.target.style.color = 'var(--text-muted)'; e.target.style.opacity = '0.5'; }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </footer>
        </div>
      ) : (
        <div className='overflow-x-hidden w-full'>
          {homePageContent.startsWith('https://') ? (
            <iframe src={homePageContent} className='w-full h-screen border-none' />
          ) : (
            <div className='mt-[60px]' dangerouslySetInnerHTML={{ __html: homePageContent }} />
          )}
        </div>
      )}
    </div>
  );
};

export default HomeLanding;
