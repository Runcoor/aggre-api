/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

// DocumentMarkdownRenderer — production-quality Markdown reader for
// long-form documentation (SKILLS Plaza Detail, user articles, editor
// preview). Separate from chat MarkdownRenderer so the chat-bubble
// look (compact, surface-hover code blocks) stays untouched.
//
// Why a dedicated component:
// - Chat wants in-flow subtle code styling.
// - Docs want production polish: dark code blocks, copy button, language
//   badge, polished tables, proper hierarchy. Two different jobs.
//
// CSS lives in `./markdown-document.css`. All visual choices are there;
// React only injects the DOM + light interaction (copy button, heading
// id slugger for TOC anchors).

import React, { useCallback, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import RemarkMath from 'remark-math';
import RemarkBreaks from 'remark-breaks';
import RemarkGfm from 'remark-gfm';
import RehypeKatex from 'rehype-katex';
import RehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import './markdown-document.css';
import { Toast } from '@douyinfe/semi-ui';
import { IconCopy } from '@douyinfe/semi-icons';
import { copy } from '../../../helpers';
import { useTranslation } from 'react-i18next';

// extractText walks React children of a heading and concatenates raw text.
// Used by headingIdSlugger so callers can build TOC anchors like
// `#h-<slug>`. Recurses into element children so inline <code> etc inside
// a heading still contribute their text.
function extractText(node) {
  if (node == null || node === false) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (typeof node === 'object' && node.props && node.props.children) {
    return extractText(node.props.children);
  }
  return '';
}

// escapeBrackets converts LaTeX-style \[ \] and \( \) into $$ $$ and $ $
// so remark-math can pick them up. Code fences are left untouched.
function escapeBrackets(text) {
  if (!text) return '';
  const pattern =
    /(```[\s\S]*?```|`[^`\n]*`)|\\\[([\s\S]*?[^\\])\\\]|\\\((.*?)\\\)/g;
  return text.replace(
    pattern,
    (match, codeBlock, squareBracket, roundBracket) => {
      if (codeBlock) return codeBlock;
      if (squareBracket) return `$$${squareBracket}$$`;
      if (roundBracket) return `$${roundBracket}$`;
      return match;
    },
  );
}

// CodeBlock — the <pre> wrapper. Adds a language badge (top-left) and
// a copy button (top-right). Renders children verbatim so the inner
// <code> with hljs spans isn't disrupted.
function CodeBlock({ children }) {
  const { t } = useTranslation();
  const ref = useRef(null);

  // react-markdown passes the <code> element as the only child of <pre>.
  // Extract its language from the className that rehype-highlight set.
  const lang = useMemo(() => {
    const child = Array.isArray(children) ? children[0] : children;
    const className =
      (child && child.props && child.props.className) || '';
    const m = /language-([\w-]+)/i.exec(className);
    return m ? m[1].toLowerCase() : '';
  }, [children]);

  const onCopy = useCallback(() => {
    const text = ref.current?.querySelector('code')?.textContent ?? '';
    if (!text) return;
    copy(text).then((ok) => {
      if (ok) Toast.success(t('代码已复制到剪贴板'));
      else Toast.error(t('复制失败,请手动复制'));
    });
  }, [t]);

  const cls = lang ? 'md-code-block has-lang' : 'md-code-block';

  return (
    <pre ref={ref} className={cls}>
      {lang && <span className='md-code-lang'>{lang}</span>}
      <button
        type='button'
        className='md-code-copy'
        aria-label={t('复制代码')}
        title={t('复制代码')}
        onClick={onCopy}
      >
        <IconCopy />
      </button>
      {children}
    </pre>
  );
}

// TableWrap wraps <table> in a scroll container so wide tables don't
// blow out the article column on mobile.
function TableWrap({ children }) {
  return <div className='md-table-wrap'><table>{children}</table></div>;
}

function makeHeadingRenderer(Tag, slugger) {
  return function Heading({ children, ...rest }) {
    let id;
    if (typeof slugger === 'function') {
      const text = extractText(children).trim();
      if (text) id = slugger(text);
    }
    return (
      <Tag id={id} {...rest}>
        {children}
      </Tag>
    );
  };
}

const REMARK_PLUGINS = [RemarkMath, RemarkGfm, RemarkBreaks];
const REHYPE_PLUGINS = [
  RehypeKatex,
  [RehypeHighlight, { detect: true, ignoreMissing: true }],
];

export function DocumentMarkdownRenderer({
  content,
  headingIdSlugger,
  className,
  style,
}) {
  const escapedContent = useMemo(
    () => escapeBrackets(content || ''),
    [content],
  );

  const components = useMemo(
    () => ({
      pre: CodeBlock,
      table: TableWrap,
      h1: makeHeadingRenderer('h1', headingIdSlugger),
      h2: makeHeadingRenderer('h2', headingIdSlugger),
      h3: makeHeadingRenderer('h3', headingIdSlugger),
      h4: makeHeadingRenderer('h4', headingIdSlugger),
      h5: makeHeadingRenderer('h5', headingIdSlugger),
      h6: makeHeadingRenderer('h6', headingIdSlugger),
      a: ({ node, ...props }) => (
        <a
          {...props}
          target={
            props.href && props.href.startsWith('#') ? '_self' : '_blank'
          }
          rel='noopener noreferrer'
        />
      ),
    }),
    [headingIdSlugger],
  );

  return (
    <div
      className={['markdown-doc', className].filter(Boolean).join(' ')}
      style={style}
    >
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
        components={components}
      >
        {escapedContent}
      </ReactMarkdown>
    </div>
  );
}

export default DocumentMarkdownRenderer;
