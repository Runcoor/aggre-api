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

import React from 'react';

// All styles are scoped under .aas-root so they don't leak to other pages.
export const ACCOUNT_SETTINGS_STYLES = `
/* ------------------------------------------------------------------
   Semi UI Layout adds \`overflow-x: hidden\` on \`.semi-layout-has-sider > .semi-layout\`,
   which the spec promotes to \`overflow-y: auto\` and breaks
   \`position: sticky\` against the window. Override only while this
   page is mounted (the <style> tag lives inside .aas-root and unmounts
   on route change).
------------------------------------------------------------------ */
.semi-layout-has-sider > .semi-layout,
.semi-layout-has-sider > .semi-layout-content {
  overflow: visible !important;
}

.aas-root {
  --aas-grad: linear-gradient(135deg, #0072ff 0%, #00c6ff 100%);
  --aas-grad-r: linear-gradient(90deg, #0072ff 0%, #00c6ff 100%);
  --aas-grad-soft: linear-gradient(135deg, rgba(0,114,255,0.08) 0%, rgba(0,198,255,0.08) 100%);
  --aas-blue-1: #0072ff;
  --aas-blue-2: #00c6ff;
  --aas-ink-900: #0b1530;
  --aas-ink-700: #2a3556;
  --aas-ink-500: #6b7596;
  --aas-ink-400: #97a0bc;
  --aas-ink-300: #b6bfca;
  --aas-line: #e7ecf5;
  --aas-line-soft: #eef2f9;
  --aas-bg: #f4f6fb;
  --aas-card: #ffffff;
  --aas-green: #15803d;
  --aas-green-bg: rgba(22,163,74,0.10);
  --aas-orange: #a35a04;
  --aas-orange-bg: rgba(217,119,6,0.12);
  --aas-red: #b91c1c;
  --aas-red-bg: rgba(220,38,38,0.10);
  --aas-purple: #7c3aed;
  --aas-purple-bg: #f0e9ff;

  font-family: "Inter", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif;
  color: var(--aas-ink-900);
  -webkit-font-smoothing: antialiased;
  font-size: 13px;
  line-height: 1.45;
  width: 100%;
  background: var(--aas-bg);
  font-feature-settings: "cv11", "ss01", "ss02";
}
.aas-root *, .aas-root *::before, .aas-root *::after { box-sizing: border-box; }
.aas-root .aas-mono { font-family: "JetBrains Mono", ui-monospace, monospace; font-feature-settings: "tnum"; }
/* Bare button reset for our custom buttons. Padding is intentionally
   omitted so Semi UI buttons embedded in this page (e.g. TwoFASetting)
   keep their default padding. */
.aas-root button { font-family: inherit; cursor: pointer; border: none; background: none; color: inherit; }
.aas-root input, .aas-root select, .aas-root textarea { font-family: inherit; }

.aas-root .aas-page { max-width: 1240px; margin: 0 auto; padding: 24px 28px 80px; }

/* ---------- topbar ---------- */
.aas-root .aas-topbar { display: flex; align-items: center; gap: 14px; margin-bottom: 14px; }
.aas-root .aas-brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 15px; letter-spacing: -.01em; color: var(--aas-ink-900); }
.aas-root .aas-brand .aas-brand-mk {
  width: 26px; height: 26px; border-radius: 8px; background: var(--aas-grad);
  display: grid; place-items: center;
  box-shadow: 0 8px 18px -8px rgba(0,114,255,.5), inset 0 1px 0 rgba(255,255,255,.4);
}
.aas-root .aas-brand .aas-brand-mk i { display: block; width: 10px; height: 10px; border-radius: 3px; background: #fff; transform: rotate(45deg); }
.aas-root .aas-brand-meta { color: var(--aas-ink-500); font-weight: 500; }
.aas-root .aas-crumb { color: var(--aas-ink-500); font-size: 13px; display: flex; gap: 8px; align-items: center; }
.aas-root .aas-crumb b { color: var(--aas-ink-700); font-weight: 600; }
.aas-root .aas-crumb .aas-crumb-sep { color: var(--aas-ink-400); }

/* ---------- two-col grid ---------- */
.aas-root .aas-app-grid {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 24px;
  align-items: start;
}

/* ---------- sticky left rail ---------- */
.aas-root .aas-side {
  position: sticky;
  top: calc(var(--header-height, 52px) + 16px);
  display: flex;
  flex-direction: column;
  gap: 14px;
  z-index: 5;
}

.aas-root .aas-profile-card {
  background: #fff;
  border: 1px solid var(--aas-line);
  border-radius: 16px;
  padding: 18px;
  position: relative;
  overflow: hidden;
}
.aas-root .aas-profile-card::before {
  content: ''; position: absolute; left: -30px; top: -30px;
  width: 160px; height: 160px; border-radius: 50%;
  background: var(--aas-grad); opacity: .10; filter: blur(40px);
  pointer-events: none;
}
.aas-root .aas-profile-card > * { position: relative; }

.aas-root .aas-pc-row { display: flex; align-items: center; gap: 12px; }
.aas-root .aas-pc-ava {
  width: 48px; height: 48px; border-radius: 14px;
  background: var(--aas-grad); color: #fff;
  display: grid; place-items: center;
  font-weight: 700; font-size: 20px; letter-spacing: .5px;
  box-shadow: 0 8px 18px -8px rgba(0,114,255,.5);
  flex: none; overflow: hidden;
}
.aas-root .aas-pc-ava img { width: 100%; height: 100%; object-fit: cover; display: block; }
.aas-root .aas-pc-name { margin: 0; font-size: 15px; font-weight: 700; letter-spacing: -.01em; color: var(--aas-ink-900); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
.aas-root .aas-pc-at { font-size: 12px; color: var(--aas-ink-500); margin-top: 1px; }
.aas-root .aas-pc-role {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
  padding: 2px 8px; border-radius: 99px;
  background: var(--aas-grad-soft); color: var(--aas-blue-1);
  border: 1px solid rgba(0,114,255,.18);
  margin-top: 6px;
}

.aas-root .aas-pc-balance {
  margin-top: 14px; padding-top: 14px;
  border-top: 1px solid var(--aas-line-soft);
}
.aas-root .aas-pc-lbl { font-size: 11px; color: var(--aas-ink-500); font-weight: 600; letter-spacing: .04em; text-transform: uppercase; }
.aas-root .aas-pc-val { font-size: 30px; font-weight: 700; letter-spacing: -.02em; background: var(--aas-grad); -webkit-background-clip: text; background-clip: text; color: transparent; margin-top: 4px; line-height: 1; }
.aas-root .aas-pc-sub { font-size: 12px; color: var(--aas-ink-500); margin-top: 6px; }

.aas-root .aas-pc-mini { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--aas-line-soft); }
.aas-root .aas-pc-mini .aas-pc-mlbl { font-size: 10.5px; color: var(--aas-ink-500); font-weight: 600; text-transform: uppercase; letter-spacing: .04em; }
.aas-root .aas-pc-mini .aas-pc-mval { font-size: 14px; font-weight: 700; color: var(--aas-ink-900); margin-top: 3px; letter-spacing: -.01em; }
.aas-root .aas-pc-mini .aas-pc-msub { font-size: 11px; color: var(--aas-ink-400); margin-top: 1px; }

/* ---------- anchor nav ---------- */
.aas-root .aas-anchors { background: #fff; border: 1px solid var(--aas-line); border-radius: 16px; padding: 8px; }
.aas-root .aas-anchor {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 11px; border-radius: 9px;
  color: var(--aas-ink-700); font-size: 13px; font-weight: 500;
  cursor: pointer; text-decoration: none;
  border: 1px solid transparent;
  transition: .12s;
  width: 100%; text-align: left;
}
.aas-root .aas-anchor + .aas-anchor { margin-top: 2px; }
.aas-root .aas-anchor .aas-anchor-ic { color: var(--aas-ink-500); display: inline-flex; flex: none; }
.aas-root .aas-anchor .aas-anchor-ct { flex: 1; min-width: 0; }
.aas-root .aas-anchor .aas-anchor-tag {
  font-size: 10.5px; color: var(--aas-ink-500); font-weight: 600;
  background: var(--aas-bg); padding: 1px 6px; border-radius: 99px;
  border: 1px solid var(--aas-line); flex: none;
}
.aas-root .aas-anchor:hover { background: #f8fafe; color: var(--aas-ink-900); }
.aas-root .aas-anchor:hover .aas-anchor-ic { color: var(--aas-ink-700); }
.aas-root .aas-anchor.active { background: var(--aas-grad-soft); color: var(--aas-blue-1); border-color: rgba(0,114,255,.16); }
.aas-root .aas-anchor.active .aas-anchor-ic { color: var(--aas-blue-1); }
.aas-root .aas-anchor.active .aas-anchor-tag { background: rgba(0,114,255,.10); color: var(--aas-blue-1); border-color: rgba(0,114,255,.16); }

/* ---------- main column ---------- */
.aas-root .aas-main { display: flex; flex-direction: column; gap: 16px; min-width: 0; }

/* ---------- section ---------- */
.aas-root .aas-section {
  background: var(--aas-card);
  border: 1px solid var(--aas-line);
  border-radius: 16px;
  scroll-margin-top: calc(var(--header-height, 52px) + 16px);
  overflow: hidden;
}
.aas-root .aas-section-head {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; padding: 18px 20px;
  flex-wrap: wrap;
}
.aas-root .aas-section-head .aas-head-ttl { display: flex; align-items: center; gap: 10px; min-width: 0; }
.aas-root .aas-section-head .aas-head-ic {
  width: 30px; height: 30px; border-radius: 9px;
  background: var(--aas-grad-soft); color: var(--aas-blue-1);
  display: grid; place-items: center; flex: none;
}
.aas-root .aas-section-head h3 { margin: 0; font-size: 15px; font-weight: 600; color: var(--aas-ink-900); letter-spacing: -.005em; }
.aas-root .aas-section-head .aas-head-sub { font-size: 12px; color: var(--aas-ink-500); margin-top: 2px; }
.aas-root .aas-section-head .aas-head-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.aas-root .aas-section-head .aas-head-sub b { color: var(--aas-ink-900); font-weight: 600; }

/* legacy h2 head support — kept so existing markup keeps working */
.aas-root .aas-section-head h2 { font-size: 14px; font-weight: 600; margin: 0; display: flex; align-items: center; gap: 8px; color: var(--aas-ink-900); }
.aas-root .aas-section-head h2 .aas-hint { font-size: 11px; color: var(--aas-ink-500); font-weight: 400; }
.aas-root .aas-section-head .aas-meta { font-size: 11px; color: var(--aas-ink-500); }
.aas-root .aas-section-body { padding: 4px 0 0; }

/* ---------- pills/tags ---------- */
.aas-root .aas-pill, .aas-root .aas-tag-mini, .aas-root .aas-tag {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10.5px; font-weight: 700; letter-spacing: .04em;
  text-transform: uppercase; padding: 2px 7px; border-radius: 6px; line-height: 1.45;
}
.aas-root .aas-tag.brand, .aas-root .aas-pill.info { background: rgba(0,114,255,.1); color: var(--aas-blue-1); }
.aas-root .aas-tag.muted, .aas-root .aas-pill.muted { background: var(--aas-line-soft); color: var(--aas-ink-500); }
.aas-root .aas-tag.warn, .aas-root .aas-pill.warn { background: var(--aas-orange-bg); color: var(--aas-orange); }
.aas-root .aas-tag.danger, .aas-root .aas-pill.danger { background: var(--aas-red-bg); color: var(--aas-red); }
.aas-root .aas-tag.success, .aas-root .aas-pill.ok { background: var(--aas-green-bg); color: var(--aas-green); }

/* ---------- buttons ---------- */
.aas-root .aas-btn {
  display: inline-flex; align-items: center; gap: 6px;
  font: 600 12.5px Inter; font-family: inherit;
  padding: 7px 12px; border-radius: 9px;
  border: 1px solid var(--aas-line); background: #fff; color: var(--aas-ink-700);
  cursor: pointer; transition: .12s; white-space: nowrap;
}
.aas-root .aas-btn:hover:not(:disabled) { border-color: #cfd8ec; color: var(--aas-ink-900); }
.aas-root .aas-btn:disabled, .aas-root .aas-btn.disabled { opacity: 0.55; cursor: not-allowed; }
.aas-root .aas-btn.primary, .aas-root .aas-btn.brand {
  background: var(--aas-grad); color: #fff; border-color: transparent;
  box-shadow: 0 8px 22px -10px rgba(0,114,255,.5);
}
.aas-root .aas-btn.primary:hover:not(:disabled), .aas-root .aas-btn.brand:hover:not(:disabled) { transform: translateY(-1px); color: #fff; }
.aas-root .aas-btn.danger { color: var(--aas-red); border-color: rgba(220,38,38,.22); background: #fff; }
.aas-root .aas-btn.danger:hover:not(:disabled) { background: rgba(220,38,38,.06); }
.aas-root .aas-btn.sm { padding: 5px 10px; font-size: 12px; }
.aas-root .aas-btn.ghost { background: transparent; border-color: transparent; color: var(--aas-ink-500); }
.aas-root .aas-btn.ghost:hover:not(:disabled) { color: var(--aas-blue-1); background: var(--aas-grad-soft); border-color: transparent; }

/* ---------- profile fields ---------- */
.aas-root .aas-fields {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 14px; padding: 0 20px 18px;
}
.aas-root .aas-field { display: flex; flex-direction: column; min-width: 0; }
.aas-root .aas-field-label {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 11.5px; font-weight: 600; color: var(--aas-ink-700); margin-bottom: 6px;
}
.aas-root .aas-field-label .aas-field-meta { color: var(--aas-ink-500); font-weight: 500; font-size: 11px; }
.aas-root .aas-input {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 12px; border: 1px solid var(--aas-line); border-radius: 10px;
  background: #fff; transition: .15s; min-width: 0;
}
.aas-root .aas-input:focus-within {
  border-color: var(--aas-blue-1);
  box-shadow: 0 0 0 3px rgba(0,114,255,.12);
}
.aas-root .aas-input input, .aas-root .aas-input select {
  flex: 1; min-width: 0; border: 0; outline: 0; background: transparent;
  font: 500 13px Inter; font-family: inherit;
  color: var(--aas-ink-900); font-feature-settings: "tnum";
}
.aas-root .aas-input input:disabled, .aas-root .aas-input input[readonly] { color: var(--aas-ink-500); }
.aas-root .aas-input svg { color: var(--aas-ink-500); flex: none; }
.aas-root .aas-input .aas-suffix {
  font-size: 11.5px; color: var(--aas-ink-500); font-weight: 600;
  text-transform: uppercase; letter-spacing: .04em; flex: none;
}
.aas-root .aas-field-help { font-size: 11.5px; color: var(--aas-ink-500); margin-top: 6px; }

/* ---------- bindings (intro-grid) ---------- */
.aas-root .aas-bindings {
  display: grid; grid-template-columns: repeat(2, 1fr);
  gap: 10px; padding: 0 20px 18px;
  background: transparent;
}
.aas-root .aas-binding {
  display: flex; align-items: center; gap: 12px;
  padding: 12px; border-radius: 12px;
  border: 1px solid var(--aas-line); background: #fff;
  transition: .15s; position: relative; min-width: 0;
}
.aas-root .aas-binding:hover { border-color: #cfd8ec; transform: translateY(-1px); box-shadow: 0 8px 18px -10px rgba(11,21,48,.15); }
.aas-root .aas-binding.bound {
  border-color: rgba(0,114,255,.20);
  background: linear-gradient(180deg, rgba(0,114,255,.04), #fff 50%);
}
.aas-root .aas-binding-icon {
  width: 36px; height: 36px; border-radius: 11px;
  background: var(--aas-bg); border: 1px solid var(--aas-line);
  display: grid; place-items: center; flex: none;
  color: var(--aas-ink-700);
}
.aas-root .aas-binding.bound .aas-binding-icon { background: #fff; border-color: rgba(0,114,255,.18); }
.aas-root .aas-binding-icon.email { background: #e7f0ff; color: var(--aas-blue-1); border-color: rgba(0,114,255,.14); }
.aas-root .aas-binding-icon.wechat { background: #e2f5e9; color: #07c160; border-color: rgba(7,193,96,.18); }
.aas-root .aas-binding-icon.github { background: #1a1f24; color: #fff; border-color: #1a1f24; }
.aas-root .aas-binding-icon.discord { background: #e9ecff; color: #5865f2; border-color: rgba(88,101,242,.20); }
.aas-root .aas-binding-icon.telegram { background: #e0f2fe; color: #0088cc; border-color: rgba(0,136,204,.18); }
.aas-root .aas-binding-icon.linuxdo { background: #fef3e7; color: #d97706; border-color: rgba(217,119,6,.18); }
.aas-root .aas-binding-icon.oidc { background: var(--aas-purple-bg); color: var(--aas-purple); border-color: rgba(124,58,237,.18); }
.aas-root .aas-binding-icon.custom { background: var(--aas-line-soft); color: var(--aas-ink-500); }
.aas-root .aas-binding-info { flex: 1; min-width: 0; }
.aas-root .aas-binding-name {
  display: flex; align-items: center; gap: 6px;
  font-size: 13.5px; font-weight: 600; color: var(--aas-ink-900);
}
.aas-root .aas-binding-status {
  font-size: 11.5px; color: var(--aas-ink-500); margin-top: 2px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.aas-root .aas-binding-status.bound { color: var(--aas-ink-700); }
.aas-root .aas-binding-action {
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600; flex: none;
  padding: 5px 10px; border-radius: 9px;
  border: 1px solid var(--aas-line); background: #fff;
  color: var(--aas-ink-700); cursor: pointer; transition: .12s;
  white-space: nowrap;
}
.aas-root .aas-binding-action:hover:not(.disabled) { border-color: #cfd8ec; color: var(--aas-ink-900); }
.aas-root .aas-binding-action.brand,
.aas-root .aas-binding-action.primary {
  background: var(--aas-grad); color: #fff; border-color: transparent;
  box-shadow: 0 8px 22px -10px rgba(0,114,255,.5);
}
.aas-root .aas-binding-action.brand:hover:not(.disabled),
.aas-root .aas-binding-action.primary:hover:not(.disabled) { transform: translateY(-1px); }
.aas-root .aas-binding-action.unbind { color: var(--aas-ink-500); }
.aas-root .aas-binding-action.unbind:hover:not(.disabled) { background: var(--aas-red-bg); color: var(--aas-red); border-color: rgba(220,38,38,.22); }
.aas-root .aas-binding-action.disabled { opacity: 0.55; cursor: not-allowed; }
.aas-root .aas-binding .aas-primary-tag {
  font-size: 9px; padding: 1px 5px; border-radius: 3px;
  background: rgba(0,114,255,.10); color: var(--aas-blue-1); font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.aas-root .aas-binding .aas-binding-dot {
  width: 6px; height: 6px; border-radius: 50%;
  display: inline-block; flex: none;
}
.aas-root .aas-binding .aas-binding-dot.on { background: #16a34a; box-shadow: 0 0 0 3px rgba(22,163,74,.18); }
.aas-root .aas-binding .aas-binding-dot.off { background: #cfd6e6; }

/* ---------- security checklist rows ---------- */
.aas-root .aas-sec-list { padding: 0 20px 18px; display: flex; flex-direction: column; gap: 8px; }
.aas-root .aas-sec-row {
  display: grid; grid-template-columns: auto 1fr auto;
  align-items: center; gap: 14px; padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--aas-line-soft);
  background: #fff; transition: .12s;
}
.aas-root .aas-sec-row:hover { border-color: var(--aas-line); background: #fcfdff; }
.aas-root .aas-sec-row .aas-sec-check {
  width: 30px; height: 30px; border-radius: 50%;
  display: grid; place-items: center; flex: none;
  background: var(--aas-line-soft); color: var(--aas-ink-500);
}
.aas-root .aas-sec-row.done .aas-sec-check { background: var(--aas-green-bg); color: var(--aas-green); }
.aas-root .aas-sec-row.todo .aas-sec-check { background: rgba(0,114,255,.10); color: var(--aas-blue-1); }
.aas-root .aas-sec-row.danger-row {
  border-color: rgba(220,38,38,.18);
  background: linear-gradient(180deg, rgba(220,38,38,.03), transparent);
}
.aas-root .aas-sec-row.danger-row:hover { background: linear-gradient(180deg, rgba(220,38,38,.05), transparent); }
.aas-root .aas-sec-row.danger-row .aas-sec-check { background: var(--aas-red-bg); color: var(--aas-red); }
.aas-root .aas-sec-row .aas-sec-info { min-width: 0; }
.aas-root .aas-sec-row .aas-sec-title {
  font-size: 13.5px; font-weight: 600; color: var(--aas-ink-900);
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.aas-root .aas-sec-row .aas-sec-desc { font-size: 12px; color: var(--aas-ink-500); margin-top: 2px; line-height: 1.5; }

.aas-root .aas-sec-row .aas-sec-extra { grid-column: 1 / -1; padding-top: 10px; border-top: 1px dashed var(--aas-line); margin-top: 4px; }

/* ---------- preference rows (notify / pricing / privacy) ---------- */
.aas-root .aas-pref {
  display: grid; grid-template-columns: auto 1fr auto;
  align-items: center; gap: 14px;
  padding: 14px 20px;
  border-top: 1px solid var(--aas-line-soft);
}
.aas-root .aas-pref:first-of-type, .aas-root .aas-pref.first { border-top: 0; }
.aas-root .aas-pref .aas-pref-glyph {
  width: 32px; height: 32px; border-radius: 10px;
  background: var(--aas-grad-soft); color: var(--aas-blue-1);
  display: grid; place-items: center;
  border: 1px solid rgba(0,114,255,.14);
  flex: none;
}
.aas-root .aas-pref .aas-pref-glyph.muted { background: var(--aas-line-soft); color: var(--aas-ink-500); border-color: var(--aas-line); }
.aas-root .aas-pref .aas-pref-glyph.warn { background: var(--aas-orange-bg); color: var(--aas-orange); border-color: rgba(217,119,6,.18); }
.aas-root .aas-pref .aas-pref-info { min-width: 0; }
.aas-root .aas-pref .aas-pref-title {
  font-size: 13.5px; font-weight: 600; color: var(--aas-ink-900);
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.aas-root .aas-pref .aas-pref-desc { font-size: 12px; color: var(--aas-ink-500); margin-top: 2px; }

/* ---------- thresholds grid (notify) ---------- */
.aas-root .aas-thresh {
  padding: 14px 20px 18px;
  border-top: 1px solid var(--aas-line-soft);
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
}
.aas-root .aas-thresh.cols-1 { grid-template-columns: 1fr; }

/* ---------- advanced collapsible bar ---------- */
.aas-root .aas-advanced {
  margin: 0 20px 14px;
  border: 1px dashed var(--aas-line); border-radius: 11px;
  padding: 11px 13px;
  display: flex; align-items: center; justify-content: space-between;
  cursor: pointer; color: var(--aas-ink-700);
  font-size: 13px; font-weight: 600;
  transition: .12s;
}
.aas-root .aas-advanced:hover { border-style: solid; border-color: #cfd8ec; background: #fcfdff; }
.aas-root .aas-advanced .aas-advanced-l { display: inline-flex; align-items: center; gap: 6px; }
.aas-root .aas-advanced .aas-advanced-r { display: inline-flex; transition: .2s; }

.aas-root .aas-advanced-grid {
  padding: 0 20px 18px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
}

/* ---------- channels (3-col) ---------- */
.aas-root .aas-channels { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 0 20px 18px; }
.aas-root .aas-channel { display: flex; align-items: center; gap: 10px; padding: 11px; border: 1px solid var(--aas-line-soft); border-radius: 11px; background: #fff; }
.aas-root .aas-channel .aas-channel-glyph { width: 30px; height: 30px; border-radius: 9px; background: var(--aas-bg); color: var(--aas-ink-500); display: grid; place-items: center; border: 1px solid var(--aas-line); flex: none; }
.aas-root .aas-channel .aas-channel-name { font-size: 13px; font-weight: 600; color: var(--aas-ink-900); }
.aas-root .aas-channel .aas-channel-sub { font-size: 11px; color: var(--aas-ink-500); margin-top: 1px; }

/* ---------- switch ---------- */
.aas-root .aas-switch {
  position: relative; width: 38px; height: 22px; border-radius: 99px;
  background: #dde3ef; cursor: pointer;
  border: 0; padding: 0;
  transition: .2s; flex: none;
}
.aas-root .aas-switch::after {
  content: ''; position: absolute; top: 2px; left: 2px;
  width: 18px; height: 18px; border-radius: 50%;
  background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,.18);
  transition: .2s;
}
.aas-root .aas-switch.on { background: var(--aas-grad); box-shadow: 0 6px 14px -4px rgba(0,114,255,.45); }
.aas-root .aas-switch.on::after { left: 18px; }
.aas-root .aas-switch:disabled { opacity: 0.5; cursor: not-allowed; }

/* ---------- token display block ---------- */
.aas-root .aas-token-display {
  display: flex; align-items: center; gap: 8px;
  background: #0b1530; color: #e8f1ff;
  padding: 8px 12px; border-radius: 9px;
  font-family: "JetBrains Mono", ui-monospace, monospace; font-size: 12px;
  margin-top: 10px;
  word-break: break-all;
}
.aas-root .aas-token-display button {
  color: var(--aas-blue-2); font-size: 11px; font-weight: 600; padding: 3px 8px;
  border-radius: 5px; background: rgba(0,198,255,0.12); flex: none;
  display: inline-flex; align-items: center; gap: 4px;
}
.aas-root .aas-token-display button:hover { background: rgba(0,198,255,0.22); }

/* ---------- legacy aas-row support (kept for any straggler markup) ---------- */
.aas-root .aas-row {
  display: grid; grid-template-columns: auto 1fr auto;
  gap: 14px; align-items: center;
  padding: 14px 20px;
  border-top: 1px solid var(--aas-line-soft);
}
.aas-root .aas-row:first-child { border-top: 0; }
.aas-root .aas-row-icon { width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; background: var(--aas-line-soft); color: var(--aas-ink-500); flex: none; }
.aas-root .aas-row-icon.tinted-blue { background: var(--aas-grad-soft); color: var(--aas-blue-1); border: 1px solid rgba(0,114,255,.14); }
.aas-root .aas-row-icon.tinted-red { background: var(--aas-red-bg); color: var(--aas-red); }
.aas-root .aas-row-icon.tinted-orange { background: var(--aas-orange-bg); color: var(--aas-orange); }
.aas-root .aas-row-icon.tinted-green { background: var(--aas-green-bg); color: var(--aas-green); }
.aas-root .aas-row-info { min-width: 0; }
.aas-root .aas-row-title { font-size: 13.5px; font-weight: 600; color: var(--aas-ink-900); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.aas-root .aas-row-desc { font-size: 12px; color: var(--aas-ink-500); margin-top: 2px; }
.aas-root .aas-row-extra { grid-column: 1 / -1; padding-top: 10px; }

/* ---------- danger row legacy ---------- */
.aas-root .aas-danger-row {
  margin: 6px 14px 8px;
  background: linear-gradient(180deg, rgba(220,38,38,.03), transparent);
  border: 1px solid rgba(220,38,38,.18);
  border-radius: 12px;
}
.aas-root .aas-danger-row .aas-row-title { color: var(--aas-red) !important; }
.aas-root .aas-danger-row .aas-row-desc { color: rgba(220,38,38,0.7); }

/* ---------- legacy config-grid (used by NotificationSettings advanced inputs) ---------- */
.aas-root .aas-config-grid { padding: 14px 20px 18px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; border-top: 1px solid var(--aas-line-soft); }
.aas-root .aas-config-grid.cols-1 { grid-template-columns: 1fr; }
.aas-root .aas-config-grid .aas-field label, .aas-root .aas-field label { font-size: 12px; color: var(--aas-ink-700); font-weight: 500; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }
.aas-root .aas-config-grid .aas-field label .aas-req, .aas-root .aas-field label .aas-req { color: var(--aas-red); }
.aas-root .aas-config-grid .aas-field label .aas-help, .aas-root .aas-field label .aas-help { color: var(--aas-ink-400); font-weight: 400; font-size: 11px; }

/* ---------- sidebar modules sub-rows ---------- */
.aas-root .aas-sub-grid { padding: 0 20px 18px 64px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.aas-root .aas-sub-card { background: var(--aas-line-soft); border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; gap: 12px; }
.aas-root .aas-sub-card.disabled { opacity: 0.55; }
.aas-root .aas-sub-card .aas-sub-info { flex: 1; min-width: 0; }
.aas-root .aas-sub-card .aas-sub-title { font-size: 12.5px; font-weight: 600; color: var(--aas-ink-900); }
.aas-root .aas-sub-card .aas-sub-desc { font-size: 11px; color: var(--aas-ink-500); margin-top: 1px; }

/* ---------- floating save bar (portalled) ---------- */
.aas-save-bar {
  position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
  background: #0b1530; color: white;
  padding: 8px 8px 8px 18px; border-radius: 999px;
  display: flex; align-items: center; gap: 14px;
  box-shadow: 0 14px 40px -10px rgba(11,21,48,.5);
  font-size: 13px; z-index: 1100; white-space: nowrap;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  animation: aas-save-bar-in .26s cubic-bezier(0.2, 0.9, 0.2, 1);
}
@keyframes aas-save-bar-in {
  from { transform: translateX(-50%) translateY(140%); opacity: 0; }
  to   { transform: translateX(-50%) translateY(0); opacity: 1; }
}
.aas-save-bar .aas-dot { width: 6px; height: 6px; border-radius: 50%; background: #ff9500; animation: aas-pulse 1.5s infinite; flex: none; }
@keyframes aas-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
.aas-save-bar button { font-family: inherit; cursor: pointer; border: none; background: transparent; color: inherit; }
.aas-save-bar .aas-discard { color: rgba(255,255,255,0.7); font-size: 12px; padding: 4px 10px; border-radius: 6px; }
.aas-save-bar .aas-discard:hover { color: white; background: rgba(255,255,255,0.08); }
.aas-save-bar .aas-save-action { background: var(--aas-grad, linear-gradient(135deg,#0072ff 0%,#00c6ff 100%)); color: white; padding: 7px 16px; border-radius: 999px; font-weight: 600; font-size: 12px; }
.aas-save-bar .aas-save-action:disabled { opacity: 0.65; cursor: progress; }

/* ---------- responsive ---------- */
@media (max-width: 1024px) {
  .aas-root .aas-app-grid { grid-template-columns: 1fr; }
  .aas-root .aas-side { position: static; }
  .aas-root .aas-anchors { display: none; }
}
@media (max-width: 720px) {
  .aas-root .aas-page { padding: 16px 14px 80px; }
  .aas-root .aas-fields, .aas-root .aas-thresh, .aas-root .aas-advanced-grid, .aas-root .aas-config-grid { grid-template-columns: 1fr; }
  .aas-root .aas-bindings, .aas-root .aas-channels { grid-template-columns: 1fr; }
  .aas-root .aas-section-head { padding: 14px 16px; }
  .aas-root .aas-pref, .aas-root .aas-row { padding: 12px 16px; }
  .aas-root .aas-sec-list { padding: 0 14px 14px; }
  .aas-root .aas-sub-grid { grid-template-columns: 1fr; padding-left: 18px; }
}

/* ============================================================
   Dark mode
   ============================================================ */
html.dark .aas-root {
  --aas-ink-900: rgba(255,255,255,0.95);
  --aas-ink-700: rgba(255,255,255,0.78);
  --aas-ink-500: rgba(255,255,255,0.55);
  --aas-ink-400: rgba(255,255,255,0.42);
  --aas-ink-300: rgba(255,255,255,0.28);
  --aas-line: rgba(255,255,255,0.08);
  --aas-line-soft: rgba(255,255,255,0.04);
  --aas-bg: #1c1c1e;
  --aas-card: #2a2a2c;
  --aas-green-bg: rgba(48,209,88,0.18);
  --aas-orange-bg: rgba(255,159,10,0.18);
  --aas-red-bg: rgba(255,69,58,0.18);
  --aas-purple-bg: rgba(124,58,237,0.22);
}
html.dark .aas-root .aas-profile-card,
html.dark .aas-root .aas-anchors,
html.dark .aas-root .aas-section,
html.dark .aas-root .aas-binding,
html.dark .aas-root .aas-sec-row,
html.dark .aas-root .aas-channel { background: var(--aas-card); }
html.dark .aas-root .aas-binding:hover,
html.dark .aas-root .aas-sec-row:hover,
html.dark .aas-root .aas-anchor:hover { background: rgba(255,255,255,0.04); }
html.dark .aas-root .aas-binding-icon.email { background: rgba(56,182,255,0.18); color: #5ec4ff; border-color: rgba(56,182,255,0.28); }
html.dark .aas-root .aas-binding-icon.wechat { background: rgba(7,193,96,0.18); color: #4ade80; border-color: rgba(7,193,96,0.28); }
html.dark .aas-root .aas-binding-icon.github { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.92); border-color: rgba(255,255,255,0.12); }
html.dark .aas-root .aas-binding-icon.discord { background: rgba(88,101,242,0.22); color: #a4adff; border-color: rgba(88,101,242,0.32); }
html.dark .aas-root .aas-binding-icon.telegram { background: rgba(0,136,204,0.22); color: #5cc5ff; border-color: rgba(0,136,204,0.32); }
html.dark .aas-root .aas-binding-icon.linuxdo { background: rgba(255,159,10,0.18); color: #ffb340; border-color: rgba(255,159,10,0.28); }
html.dark .aas-root .aas-btn,
html.dark .aas-root .aas-binding-action { background: rgba(255,255,255,0.04); color: var(--aas-ink-700); }
html.dark .aas-root .aas-btn.danger,
html.dark .aas-root .aas-binding-action.unbind { background: rgba(255,255,255,0.04); }
html.dark .aas-root .aas-switch { background: rgba(255,255,255,0.18); }
html.dark .aas-root .aas-switch::after { background: #f0f0f2; }
html.dark .aas-root .aas-input { background: rgba(255,255,255,0.04); border-color: rgba(255,255,255,0.10); }
html.dark .aas-root .aas-sub-card,
html.dark .aas-root .aas-anchor .aas-anchor-tag { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.10); }
html.dark .aas-root .aas-token-display { background: #0a0a0c; color: #cce6ff; }
html.dark .aas-root .aas-pc-ava { box-shadow: 0 8px 18px -8px rgba(0,114,255,.7); }
html.dark .aas-root .aas-sec-row { border-color: rgba(255,255,255,0.06); }

html.dark .aas-save-bar { background: #0a0a0c; box-shadow: 0 14px 40px -10px rgba(0,0,0,0.65); }
`;

// Inline SVG icon set used across the redesigned account page.
const Stroke = (p) => ({
  width: p.size || 16,
  height: p.size || 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: p.sw || 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});

export const AasIcons = {
  /* nav + section heads */
  User: (p = {}) => (
    <svg {...Stroke(p)}>
      <circle cx='12' cy='8' r='4' />
      <path d='M4 21a8 8 0 0 1 16 0' />
    </svg>
  ),
  Plug: (p = {}) => (
    <svg {...Stroke(p)}>
      <path d='M9 2v6M15 2v6' />
      <path d='M5 8h14v4a7 7 0 0 1-14 0V8z' />
      <path d='M12 19v3' />
    </svg>
  ),
  Link: (p = {}) => (
    <svg {...Stroke(p)}>
      <path d='M10 13a5 5 0 0 0 7 0l3-3a5 5 0 1 0-7-7l-1 1' />
      <path d='M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 1 0 7 7l1-1' />
    </svg>
  ),
  Shield: (p = {}) => (
    <svg {...Stroke(p)}>
      <path d='M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z' />
      <path d='m9 12 2 2 4-4' />
    </svg>
  ),
  Bell: (p = {}) => (
    <svg {...Stroke(p)}>
      <path d='M6 8a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z' />
      <path d='M10 21a2 2 0 0 0 4 0' />
    </svg>
  ),
  Tag: (p = {}) => (
    <svg {...Stroke(p)}>
      <path d='M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9z' />
      <circle cx='8' cy='8' r='1.6' />
    </svg>
  ),
  Lock: (p = {}) => (
    <svg {...Stroke(p)}>
      <rect x='4' y='11' width='16' height='10' rx='2' />
      <path d='M8 11V7a4 4 0 0 1 8 0v4' />
    </svg>
  ),
  Key: (p = {}) => (
    <svg {...Stroke(p)}>
      <circle cx='8' cy='15' r='4' />
      <path d='m11 12 9-9' />
      <path d='m17 6 3 3' />
      <path d='m14 9 3 3' />
    </svg>
  ),
  Fingerprint: (p = {}) => (
    <svg {...Stroke({ ...p, sw: 1.6 })}>
      <path d='M5 12a7 7 0 0 1 14 0v3' />
      <path d='M9 17a4 4 0 0 0 8 0v-5a4 4 0 0 0-8 0' />
      <path d='M13 12v5' />
    </svg>
  ),
  Guard: (p = {}) => (
    <svg {...Stroke(p)}>
      <path d='M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z' />
      <path d='M12 8v4M12 15v.5' />
    </svg>
  ),
  Power: (p = {}) => (
    <svg {...Stroke(p)}>
      <path d='M12 3v9' />
      <path d='M5.5 8a8 8 0 1 0 13 0' />
    </svg>
  ),
  Mail: (p = {}) => (
    <svg {...Stroke(p)}>
      <rect x='3' y='5' width='18' height='14' rx='2' />
      <path d='m3 7 9 6 9-6' />
    </svg>
  ),
  Send: (p = {}) => (
    <svg {...Stroke(p)}>
      <path d='m22 2-11 11' />
      <path d='M22 2 15 22l-4-9-9-4 20-7z' />
    </svg>
  ),
  Globe: (p = {}) => (
    <svg {...Stroke(p)}>
      <circle cx='12' cy='12' r='9' />
      <path d='M3 12h18' />
      <path d='M12 3a14 14 0 0 1 0 18' />
      <path d='M12 3a14 14 0 0 0 0 18' />
    </svg>
  ),
  Chevron: (p = {}) => (
    <svg {...Stroke(p)}>
      <path d='m6 9 6 6 6-6' />
    </svg>
  ),
  Check: (p = {}) => (
    <svg {...Stroke({ ...p, sw: 2 })}>
      <path d='m5 12 5 5 9-11' />
    </svg>
  ),
  Arrow: (p = {}) => (
    <svg {...Stroke(p)}>
      <path d='M5 12h14' />
      <path d='m13 5 7 7-7 7' />
    </svg>
  ),
  Refresh: (p = {}) => (
    <svg {...Stroke(p)}>
      <path d='M3 12a9 9 0 0 1 15-6.7L21 8' />
      <path d='M21 3v5h-5' />
      <path d='M21 12a9 9 0 0 1-15 6.7L3 16' />
      <path d='M3 21v-5h5' />
    </svg>
  ),
  Trash: (p = {}) => (
    <svg {...Stroke(p)}>
      <path d='M4 7h16' />
      <path d='M9 7V4h6v3' />
      <path d='M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13' />
    </svg>
  ),
  Plus: (p = {}) => (
    <svg {...Stroke({ ...p, sw: 2 })}>
      <path d='M12 5v14' />
      <path d='M5 12h14' />
    </svg>
  ),
  Alert: (p = {}) => (
    <svg {...Stroke(p)}>
      <path d='M10.3 3.7 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0z' />
      <path d='M12 9v4' />
      <path d='M12 17h.01' />
    </svg>
  ),
  Spark: (p = {}) => (
    <svg {...Stroke({ ...p, sw: 2 })}>
      <path d='M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.5 2.5M16 16l2.5 2.5M5.5 18.5 8 16M16 8l2.5-2.5' />
    </svg>
  ),
  Eye: (p = {}) => (
    <svg {...Stroke(p)}>
      <path d='M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z' />
      <circle cx='12' cy='12' r='3' />
    </svg>
  ),
  EyeOff: (p = {}) => (
    <svg {...Stroke(p)}>
      <path d='M17.94 17.94A10.07 10.07 0 0 1 12 19c-7 0-11-7-11-7a18.5 18.5 0 0 1 4.06-5.06' />
      <path d='M22.54 12.88A18.5 18.5 0 0 0 23 12s-4-7-11-7c-1.4 0-2.74.27-4 .73' />
      <path d='M9.88 9.88A3 3 0 1 0 14.12 14.12' />
      <line x1='1' y1='1' x2='23' y2='23' />
    </svg>
  ),
  Copy: (p = {}) => (
    <svg {...Stroke({ ...p, size: p.size || 13, sw: 2 })}>
      <rect x='9' y='9' width='13' height='13' rx='2' />
      <path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
    </svg>
  ),
  Layout: (p = {}) => (
    <svg {...Stroke({ ...p, sw: 2 })}>
      <rect x='3' y='3' width='18' height='18' rx='2' />
      <line x1='3' y1='9' x2='21' y2='9' />
      <line x1='9' y1='21' x2='9' y2='9' />
    </svg>
  ),
  Webhook: (p = {}) => (
    <svg {...Stroke({ ...p, sw: 2 })}>
      <path d='M18 18a4 4 0 1 0-3.9-3' />
      <path d='M14 18H8' />
      <path d='m9 12-2.1 4.6A4 4 0 1 0 9 21' />
      <path d='M14 6a4 4 0 1 0-7 1' />
    </svg>
  ),
  Sliders: (p = {}) => (
    <svg {...Stroke({ ...p, sw: 2 })}>
      <line x1='4' y1='21' x2='4' y2='14' />
      <line x1='4' y1='10' x2='4' y2='3' />
      <line x1='12' y1='21' x2='12' y2='12' />
      <line x1='12' y1='8' x2='12' y2='3' />
      <line x1='20' y1='21' x2='20' y2='16' />
      <line x1='20' y1='12' x2='20' y2='3' />
      <circle cx='4' cy='12' r='2' />
      <circle cx='12' cy='10' r='2' />
      <circle cx='20' cy='14' r='2' />
    </svg>
  ),

  /* brand-colored fills for binding cards */
  WeChat: (p = {}) => (
    <svg width={p.size || 18} height={p.size || 18} viewBox='0 0 24 24' fill='currentColor'>
      <path d='M9 4C5 4 2 6.7 2 10c0 1.7.9 3.3 2.4 4.4L4 16l2-1.2c.6.2 1.3.3 2 .3-.7-2.5.9-5.3 4-6.4-.6-2.6-2.7-4.7-3-4.7zM7 8.5a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6zm4 0a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6zM16 9c-3.3 0-6 2.2-6 5s2.7 5 6 5c.6 0 1.1-.1 1.7-.2L19 19l-.3-1.4c1.4-.9 2.3-2.3 2.3-3.6 0-2.8-2.7-5-5-5zm-2 3.5a.7.7 0 1 1 0 1.4.7.7 0 0 1 0-1.4zm4 0a.7.7 0 1 1 0 1.4.7.7 0 0 1 0-1.4z' />
    </svg>
  ),
  GitHub: (p = {}) => (
    <svg width={p.size || 18} height={p.size || 18} viewBox='0 0 24 24' fill='currentColor'>
      <path d='M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.4-3.4-1.4-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 3 .8.1-.7.4-1.1.7-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5A10 10 0 0 0 12 2z' />
    </svg>
  ),
  Discord: (p = {}) => (
    <svg width={p.size || 18} height={p.size || 18} viewBox='0 0 24 24' fill='currentColor'>
      <path d='M19.6 5.6a17 17 0 0 0-4.3-1.3c-.2.4-.4.8-.5 1.2a16 16 0 0 0-4.6 0c-.1-.4-.3-.8-.5-1.2-1.5.3-3 .7-4.3 1.3-2.7 4-3.4 8-3 11.8a17 17 0 0 0 5.3 2.7c.4-.6.8-1.2 1.1-1.9-.6-.2-1.2-.5-1.7-.9.1-.1.3-.2.4-.4 3.4 1.6 7 1.6 10.4 0 .1.2.3.3.4.4-.5.4-1.1.7-1.7.9.3.7.7 1.3 1.1 1.9a17 17 0 0 0 5.3-2.7c.5-4.4-.7-8.4-3-11.8zM8.7 14.6c-1 0-1.9-.9-1.9-2.1 0-1.2.8-2.1 1.9-2.1s1.9.9 1.9 2.1c0 1.2-.9 2.1-1.9 2.1zm6.6 0c-1 0-1.9-.9-1.9-2.1 0-1.2.8-2.1 1.9-2.1s1.9.9 1.9 2.1c0 1.2-.9 2.1-1.9 2.1z' />
    </svg>
  ),
  Telegram: (p = {}) => (
    <svg width={p.size || 18} height={p.size || 18} viewBox='0 0 24 24' fill='currentColor'>
      <path d='M21.5 4.5 2.5 11.7c-.7.3-.7 1.3 0 1.5l4.4 1.5L17 7.5c.4-.3.9.2.5.5l-8.3 7.6-.3 4.5c.5 0 .7-.2 1-.5l2.4-2.3 4.5 3.3c.8.5 1.4.2 1.6-.7l3-13.4c.3-1.1-.4-1.6-1.2-1.4z' />
    </svg>
  ),
  Linux: (p = {}) => (
    <svg width={p.size || 18} height={p.size || 18} viewBox='0 0 24 24' fill='currentColor'>
      <path d='M12 2c-2.5 0-3.5 2.5-3.5 5 0 1.2.4 2.3.9 3.2-1.5 1.4-3.4 3.7-3.4 6.3 0 2.5 1.5 4 3 4.5 1 .3 1.5.5 1.5 1V22c0 .5.5 1 1 1h2c.5 0 1-.5 1-1v-.5c0-.5.5-.7 1.5-1 1.5-.5 3-2 3-4.5 0-2.6-1.9-4.9-3.4-6.3.5-.9.9-2 .9-3.2 0-2.5-1-5-3.5-5zm-1.5 4.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm3 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z' />
    </svg>
  ),
  Oidc: (p = {}) => (
    <svg width={p.size || 18} height={p.size || 18} viewBox='0 0 24 24' fill='currentColor'>
      <circle cx='12' cy='9' r='4' />
      <path d='M11 13v8h2v-3l3 1v-2l-3-1v-3z' />
    </svg>
  ),
};

// Convenience helper to mount the styles once per page render. Call inside the
// root <div className="aas-root"> of the page.
export const AccountSettingsStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: ACCOUNT_SETTINGS_STYLES }} />
);
