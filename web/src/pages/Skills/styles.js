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

// Shared scoped styles for the SKILLS 广场 module.
//
// Color/spacing tokens come from the design bundle (skills-mart/styles.css).
// We map them onto aggre-api's existing CSS variables where the meaning
// overlaps (--surface, --text-primary, --border-default) so dark mode
// keeps working without a separate theme switch.

export const SKILL_PLAZA_STYLES = `
  .skp-root { color: var(--text-primary); }
  .skp-page { max-width: 1320px; margin: 0 auto; padding: 24px; width: 100%; }
  .skp-page.skp-wide { max-width: 1480px; }
  .skp-page.skp-narrow { max-width: 920px; }

  /* Hero ---------------------------------------------------------------- */
  .skp-hero {
    position: relative; overflow: hidden;
    border-radius: 18px; padding: 36px 36px 28px;
    background:
      radial-gradient(circle at 100% 0%, rgba(0,198,255,0.16), transparent 50%),
      radial-gradient(circle at 0% 100%, rgba(0,114,255,0.16), transparent 55%),
      linear-gradient(180deg, var(--surface) 0%, var(--bg-base) 100%);
    border: 1px solid var(--border-default);
    margin-bottom: 22px;
  }
  .skp-hero h1 {
    font-size: 30px; letter-spacing: -0.5px; margin: 0 0 6px 0;
    background: linear-gradient(135deg,#0072ff 0%, #00c6ff 100%);
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
  .skp-hero p { color: var(--text-secondary); max-width: 640px; font-size: 14.5px; margin: 0 0 22px 0; }
  .skp-hero .skp-stats { display: flex; gap: 28px; margin-top: 18px; flex-wrap: wrap; align-items: center; }
  .skp-hero .skp-stat { display: inline-flex; align-items: center; gap: 6px; color: var(--text-secondary); font-size: 13px; line-height: 1; }
  .skp-hero .skp-stat strong { font-size: 18px; color: var(--text-primary); line-height: 1; }

  .skp-search {
    display: flex; align-items: center; gap: 8px;
    height: 52px; padding: 0 8px 0 18px; max-width: 720px;
    background: var(--surface); border-radius: 14px;
    border: 1px solid var(--border-default);
    box-shadow: 0 14px 30px rgba(0,114,255,0.10);
  }
  .skp-search input {
    flex: 1; border: 0; background: transparent; font-size: 15px;
    color: var(--text-primary); outline: none;
  }
  .skp-search input::placeholder { color: var(--text-muted); }

  /* Filter bar ---------------------------------------------------------- */
  .skp-filter-bar {
    display: flex; flex-direction: column; gap: 12px;
    padding: 16px 18px; background: var(--surface);
    border: 1px solid var(--border-default); border-radius: 14px;
    margin-bottom: 18px;
  }
  .skp-filter-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .skp-filter-row .skp-label-sm { color: var(--text-muted); font-size: 12px; min-width: 48px; }

  .skp-pill {
    display: inline-flex; align-items: center; gap: 4px;
    height: 28px; padding: 0 10px; border-radius: 999px;
    border: 1px solid var(--border-default); background: var(--surface);
    color: var(--text-secondary); font-size: 12.5px; cursor: pointer;
    transition: all .15s;
  }
  .skp-pill:hover { color: #0072ff; border-color: #0072ff; }
  .skp-pill.active {
    background: linear-gradient(135deg,#0072ff,#00c6ff); color: #fff;
    border-color: transparent;
    box-shadow: 0 4px 12px rgba(0,114,255,0.25);
  }
  .skp-pill .count { color: var(--text-muted); font-size: 11.5px; }
  .skp-pill.active .count { color: rgba(255,255,255,0.85); }

  /* Grid + Cards -------------------------------------------------------- */
  .skp-grid {
    display: grid; gap: 18px;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
  .skp-card {
    background: var(--surface); border: 1px solid var(--border-default);
    border-radius: 14px; overflow: hidden; cursor: pointer;
    display: flex; flex-direction: column;
    transition: transform .18s ease, box-shadow .18s ease, border-color .18s;
    text-decoration: none; color: inherit;
  }
  .skp-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 40px rgba(11,17,32,0.10), 0 4px 12px rgba(11,17,32,0.06);
    border-color: rgba(0,114,255,0.3);
  }
  .skp-card-cover { width: 100%; height: 140px; overflow: hidden; }
  .skp-card-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
  .skp-card-row { display: flex; justify-content: space-between; align-items: center; }
  .skp-card-title {
    font-size: 15.5px; font-weight: 600; line-height: 1.4;
    color: var(--text-primary); margin: 2px 0 0;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .skp-card-summary {
    color: var(--text-secondary); font-size: 13px; line-height: 1.55;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    margin: 0;
  }
  .skp-card-tags { display: flex; gap: 6px; flex-wrap: wrap; }
  .skp-mini-tag {
    font-size: 11.5px; color: var(--text-secondary);
    background: var(--bg-base); padding: 2px 8px; border-radius: 6px;
  }
  .skp-card-meta {
    display: flex; justify-content: space-between; align-items: center;
    padding-top: 8px; border-top: 1px dashed var(--border-default); margin-top: auto;
  }

  /* Badges -------------------------------------------------------------- */
  .skp-source-badge {
    display: inline-flex; align-items: center;
    padding: 3px 9px; border-radius: 6px;
    font-size: 11.5px; font-weight: 500; letter-spacing: 0.2px;
  }
  .skp-status-badge {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 3px 9px; border-radius: 6px;
    font-size: 12px; font-weight: 500;
  }
  .skp-status-badge .dot { width: 6px; height: 6px; border-radius: 50%; }

  /* Detail page -------------------------------------------------------- */
  /* Narrower sidebars vs original 230/320 — gives the article column      */
  /* ~100px more breathing room. Combined with .skp-wide (1480 max-width). */
  .skp-detail-layout {
    display: grid; gap: 24px; align-items: start;
    grid-template-columns: 200px minmax(0,1fr) 260px;
  }
  .skp-detail-header { padding: 4px 0 18px; }
  .skp-detail-header h1 {
    font-size: 30px; letter-spacing: -0.5px; line-height: 1.3;
    margin: 0 0 12px 0; color: var(--text-primary);
  }
  .skp-detail-badges {
    display: flex; align-items: center; gap: 8px;
    flex-wrap: wrap; margin-bottom: 14px;
  }
  .skp-detail-meta {
    display: flex; align-items: center; gap: 14px;
    color: var(--text-secondary); font-size: 13px; flex-wrap: wrap;
    margin-top: 12px;
  }
  .skp-detail-meta .sep { color: var(--text-muted); }

  /* Tab-bar (segmented control) — used for zh/en language switcher.      */
  .skp-tab-bar {
    display: inline-flex; gap: 4px; padding: 4px;
    background: var(--bg-base); border-radius: 10px; width: fit-content;
  }
  .skp-tab-bar button {
    border: 0; background: transparent; padding: 6px 14px;
    border-radius: 7px; color: var(--text-secondary); font-size: 12.5px;
    cursor: pointer; font-weight: 500; transition: all .15s;
  }
  .skp-tab-bar button:hover { color: var(--text-primary); }
  .skp-tab-bar button.active {
    background: var(--surface); color: #0072ff;
    box-shadow: 0 1px 2px rgba(11,17,32,0.04), 0 1px 1px rgba(11,17,32,0.03);
  }

  .skp-github-source {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 18px; border-radius: 10px;
    background: var(--bg-base); border: 1px solid var(--border-default);
    margin: 16px 0 20px;
  }
  .skp-github-source .repo-name {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 13.5px; color: var(--text-primary); font-weight: 600;
  }
  .skp-github-source .repo-meta {
    font-size: 12px; color: var(--text-muted); margin-top: 2px;
    display: flex; gap: 14px; flex-wrap: wrap; align-items: center;
  }
  .skp-github-source .repo-meta code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    background: var(--surface); padding: 1px 6px; border-radius: 4px;
    color: var(--text-secondary);
  }

  /* TOC ---------------------------------------------------------------- */
  .skp-toc { position: sticky; top: 84px; }
  .skp-toc h4 {
    font-size: 12px; color: var(--text-muted); text-transform: uppercase;
    letter-spacing: 0.8px; margin: 0 0 12px 0; font-weight: 600;
  }
  .skp-toc ol {
    list-style: none; padding: 0; margin: 0;
    display: flex; flex-direction: column; gap: 2px;
    counter-reset: toc;
  }
  .skp-toc li {
    counter-increment: toc;
    padding: 7px 10px; border-radius: 6px;
    font-size: 13px; color: var(--text-secondary);
    border-left: 2px solid transparent;
    transition: background .15s, color .15s, border-color .15s;
  }
  .skp-toc li a {
    color: inherit; text-decoration: none; display: block;
    line-height: 1.5;
  }
  .skp-toc li .toc-num {
    color: var(--text-muted);
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px; margin-right: 6px; font-weight: 500;
  }
  .skp-toc li:hover {
    color: var(--text-primary); background: var(--surface-hover);
  }
  .skp-toc li.active {
    color: #0072ff; border-left-color: #0072ff;
    background: rgba(0,114,255,0.05); font-weight: 500;
  }
  .skp-toc li.active .toc-num { color: #0072ff; }

  /* Article body typography now lives in markdown-document.css (.markdown-doc). */

  /* Sidebar cards ------------------------------------------------------- */
  .skp-side-card {
    background: var(--surface); border: 1px solid var(--border-default);
    border-radius: 14px; padding: 16px;
  }
  .skp-side-card h4 {
    font-size: 13.5px; color: var(--text-primary); margin: 0 0 12px 0;
    font-weight: 600;
    display: flex; justify-content: space-between; align-items: center;
    gap: 8px;
  }
  .skp-side-card .kv {
    display: flex; justify-content: space-between; align-items: center;
    font-size: 12.5px; padding: 6px 0; color: var(--text-secondary);
    border-bottom: 1px dashed var(--border-default);
    gap: 12px;
  }
  .skp-side-card .kv:last-child { border-bottom: 0; }
  .skp-side-card .kv strong {
    color: var(--text-primary); font-weight: 500;
    text-align: right; word-break: break-all;
  }

  /* Social section (ratings + comments) -------------------------------- */
  /* Sectioned vertical stack (replaces the old tab strip). Layout      */
  /* follows the design's .section-h + .card pattern; visuals borrow    */
  /* from modern review patterns: J-shaped distribution bars, dim       */
  /* breakdown rows, indented reply rail.                                */
  .skp-social { margin-top: 40px; }
  .skp-social-section + .skp-social-section { margin-top: 28px; }

  .skp-section-h {
    display: flex; align-items: flex-end; justify-content: space-between;
    margin: 0 0 14px 0; gap: 16px; flex-wrap: wrap;
  }
  .skp-section-h .skp-section-title {
    font-size: 19px; font-weight: 600; color: var(--text-primary);
    margin: 0; letter-spacing: -0.2px;
  }
  .skp-section-h .skp-section-sub {
    color: var(--text-muted); font-size: 12.5px;
    margin: 4px 0 0 0;
  }
  .skp-section-h .skp-section-tools {
    display: inline-flex; gap: 8px; align-items: center; flex-wrap: wrap;
  }

  /* Rating overview card — left: average + distribution, right: radar  */
  /* + 5-dim breakdown rows.                                             */
  .skp-rating-card {
    background: var(--surface); border: 1px solid var(--border-default);
    border-radius: 14px; padding: 24px;
    display: grid; gap: 28px;
    grid-template-columns: 280px 1fr;
    align-items: start;
  }
  .skp-rating-summary {
    display: flex; flex-direction: column; gap: 14px; min-width: 0;
  }
  .skp-rating-big {
    display: flex; align-items: baseline; gap: 8px;
  }
  .skp-rating-big .num {
    font-size: 48px; font-weight: 700; color: var(--text-primary);
    line-height: 1; letter-spacing: -1.2px;
  }
  .skp-rating-big .max {
    font-size: 18px; color: var(--text-muted); font-weight: 500;
  }
  .skp-rating-stars { display: inline-flex; gap: 2px; }
  .skp-rating-count { font-size: 12.5px; color: var(--text-muted); }

  /* 5/4/3/2/1 star distribution — J-shaped histogram. */
  .skp-rating-dist {
    display: flex; flex-direction: column; gap: 7px;
    margin-top: 4px;
  }
  .skp-dist-row {
    display: grid; grid-template-columns: 22px 1fr 30px;
    gap: 10px; align-items: center;
    font-size: 12px; color: var(--text-muted);
  }
  .skp-dist-row .star-label {
    display: inline-flex; align-items: center; gap: 3px;
    color: var(--text-secondary); font-weight: 500;
  }
  .skp-dist-bar {
    height: 7px; background: var(--bg-base); border-radius: 999px;
    overflow: hidden;
  }
  .skp-dist-fill {
    height: 100%; background: linear-gradient(90deg,#fbbf24,#f59e0b);
    border-radius: 999px; transition: width .4s ease;
  }
  .skp-dist-count { text-align: right; font-variant-numeric: tabular-nums; }

  /* Radar + dimension breakdown (right column of rating card). */
  .skp-rating-radar-row {
    display: grid; grid-template-columns: 240px 1fr;
    gap: 24px; align-items: center; min-width: 0;
  }
  .skp-dim-list {
    display: flex; flex-direction: column; gap: 14px; min-width: 0;
  }
  .skp-dim-row {
    display: grid; grid-template-columns: minmax(0,1.2fr) minmax(120px,1fr) 44px;
    gap: 14px; align-items: center;
  }
  .skp-dim-row .label {
    font-size: 13px; font-weight: 500; color: var(--text-primary);
    line-height: 1.4;
  }
  .skp-dim-row .desc {
    font-size: 11.5px; color: var(--text-muted); margin-top: 2px;
    line-height: 1.4;
  }
  .skp-dim-bar {
    height: 7px; background: var(--bg-base); border-radius: 999px;
    overflow: hidden; min-width: 0;
  }
  .skp-dim-fill {
    height: 100%; border-radius: 999px;
    background: linear-gradient(90deg,#0072ff,#00c6ff);
    transition: width .4s ease;
  }
  .skp-dim-row .score {
    display: inline-flex; align-items: center; gap: 4px;
    justify-content: flex-end; font-size: 13px; font-weight: 600;
    color: var(--text-primary); font-variant-numeric: tabular-nums;
  }

  /* Sort filter pills — used as .section-tools children. */
  .skp-sort-pill {
    display: inline-flex; align-items: center; gap: 4px;
    height: 28px; padding: 0 12px; border-radius: 999px;
    border: 1px solid var(--border-default);
    background: var(--surface); color: var(--text-secondary);
    font-size: 12.5px; cursor: pointer;
    transition: all .15s;
  }
  .skp-sort-pill:hover { color: #0072ff; border-color: #0072ff; }
  .skp-sort-pill.active {
    background: rgba(0,114,255,0.08); color: #0072ff;
    border-color: rgba(0,114,255,0.4); font-weight: 500;
  }

  /* Rating form (toggled drawer). */
  .skp-rate-drawer {
    background: var(--surface); border: 1px solid var(--border-default);
    border-radius: 14px; padding: 22px;
    margin-top: 16px;
    box-shadow: 0 6px 18px rgba(0,114,255,0.06);
    animation: skp-fade-in .25s ease;
  }
  @keyframes skp-fade-in {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .skp-rate-grid {
    display: grid; grid-template-columns: repeat(5, 1fr);
    gap: 16px; margin-bottom: 16px;
  }
  .skp-rate-grid .skp-rate-cell {
    display: flex; flex-direction: column; gap: 6px;
    min-width: 0;
  }
  .skp-rate-cell .skp-rate-label {
    font-size: 12.5px; color: var(--text-secondary); font-weight: 500;
  }
  .skp-rate-stars { display: inline-flex; gap: 3px; }
  .skp-rate-stars button {
    width: 28px; height: 28px; border-radius: 6px; padding: 0;
    background: var(--bg-base);
    border: 1px solid var(--border-default);
    color: var(--text-muted); cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center;
    transition: transform .12s, background .12s, color .12s;
  }
  .skp-rate-stars button:hover { transform: scale(1.08); }
  .skp-rate-stars button.on {
    background: linear-gradient(135deg,#fbbf24,#f59e0b);
    border-color: transparent; color: #fff;
  }

  /* Comment list ------------------------------------------------------- */
  .skp-comment-form {
    background: var(--surface); border: 1px solid var(--border-default);
    border-radius: 12px; padding: 16px; margin-bottom: 14px;
    transition: border-color .15s, box-shadow .15s;
  }
  .skp-comment-form.replying {
    border-color: rgba(0,114,255,0.4);
    box-shadow: 0 0 0 3px rgba(0,114,255,0.06);
  }
  .skp-reply-chip {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 10px; margin-bottom: 10px;
    background: rgba(0,114,255,0.08); color: #0072ff;
    border-radius: 999px; font-size: 12px; font-weight: 500;
  }
  .skp-reply-chip button {
    background: transparent; border: 0; color: inherit;
    padding: 0; cursor: pointer;
    display: inline-flex; align-items: center;
  }
  .skp-comment-textarea {
    width: 100%; padding: 12px;
    border-radius: 8px;
    border: 1px solid var(--border-default);
    background: var(--bg-base); color: var(--text-primary);
    font-size: 14px; line-height: 1.7;
    font-family: inherit; resize: vertical;
    transition: border-color .15s, box-shadow .15s;
  }
  .skp-comment-textarea:focus {
    outline: none;
    border-color: #0072ff;
    box-shadow: 0 0 0 3px rgba(0,114,255,0.10);
  }
  .skp-comment-textarea.error {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239,68,68,0.08);
  }
  .skp-comment-form-actions {
    display: flex; justify-content: space-between; align-items: center;
    margin-top: 10px; gap: 12px; flex-wrap: wrap;
  }
  .skp-char-count { font-size: 12px; color: var(--text-muted); }
  .skp-submit-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 18px; border-radius: 8px; border: 0;
    color: #fff; font-size: 13px; font-weight: 600;
    background: linear-gradient(135deg,#0072ff,#00c6ff);
    cursor: pointer; transition: filter .15s, box-shadow .15s;
    box-shadow: 0 4px 12px rgba(0,114,255,0.22);
  }
  .skp-submit-btn:hover { filter: brightness(1.05); box-shadow: 0 6px 18px rgba(0,114,255,0.30); }
  .skp-submit-btn:disabled {
    background: var(--bg-base); color: var(--text-muted);
    cursor: not-allowed; box-shadow: none;
  }
  .skp-sensitive-warn {
    margin-top: 8px; padding: 8px 12px;
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.25);
    border-radius: 8px;
    color: #b91c1c; font-size: 12px;
  }

  .skp-comment-list {
    display: flex; flex-direction: column;
  }
  .skp-comment {
    display: flex; gap: 12px;
    padding: 18px 0;
    border-bottom: 1px solid var(--border-default);
  }
  .skp-comment:first-child { padding-top: 8px; }
  .skp-comment:last-child  { border-bottom: 0; padding-bottom: 8px; }
  .skp-comment-replies {
    margin-top: 12px; margin-left: -8px;
    padding-left: 16px;
    border-left: 2px solid var(--border-default);
    display: flex; flex-direction: column; gap: 12px;
  }
  .skp-comment.is-reply { padding: 10px 0; border-bottom: 0; }

  .skp-comment-avatar {
    flex-shrink: 0;
    width: 36px; height: 36px; border-radius: 50%;
    background: linear-gradient(135deg,#0072ff,#00c6ff);
    color: #fff; display: inline-flex;
    align-items: center; justify-content: center;
    font-size: 14px; font-weight: 600;
  }
  .skp-comment.is-reply .skp-comment-avatar { width: 28px; height: 28px; font-size: 12px; }

  .skp-comment-body { flex: 1; min-width: 0; }
  .skp-comment-head {
    display: flex; align-items: center; gap: 8px;
    flex-wrap: wrap; margin-bottom: 6px;
  }
  .skp-comment-head .name {
    font-weight: 600; color: var(--text-primary); font-size: 13.5px;
  }
  .skp-verified-pill {
    display: inline-flex; align-items: center; gap: 3px;
    padding: 1px 7px; border-radius: 4px;
    background: rgba(22,163,74,0.10); color: #16a34a;
    font-size: 11px; font-weight: 500;
  }
  .skp-comment-time {
    font-size: 12px; color: var(--text-muted);
    margin-left: auto;
  }
  .skp-comment-text {
    color: var(--text-primary); font-size: 14px; line-height: 1.7;
    white-space: pre-wrap; word-wrap: break-word;
  }
  .skp-comment-actions {
    display: flex; align-items: center; gap: 4px;
    margin-top: 10px; margin-left: -8px;
  }
  .skp-comment-action {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 10px; border-radius: 6px; border: 0;
    background: transparent; color: var(--text-muted);
    font-size: 12.5px; cursor: pointer;
    transition: background .15s, color .15s;
  }
  .skp-comment-action:hover {
    background: var(--surface-hover); color: var(--text-primary);
  }
  .skp-comment-action.liked { color: #e0245e; }
  .skp-comment-action.liked:hover { background: rgba(224,36,94,0.08); }
  .skp-comment-action.danger:hover { color: #dc2626; background: rgba(220,38,38,0.06); }

  .skp-empty-state {
    padding: 40px 20px; text-align: center;
    color: var(--text-muted); font-size: 13.5px;
    border: 1px dashed var(--border-default);
    border-radius: 12px;
  }
  .skp-empty-state .icon {
    opacity: 0.5; margin-bottom: 8px;
  }

  .skp-login-prompt {
    padding: 22px; text-align: center;
    background: var(--bg-base);
    border: 1px dashed var(--border-default);
    border-radius: 12px;
    margin-bottom: 14px;
  }
  .skp-login-prompt-text {
    color: var(--text-secondary); font-size: 13.5px;
    margin-bottom: 12px;
  }

  /* Rate-CTA button — pairs with section header. */
  .skp-rate-cta {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 8px; border: 0;
    color: #fff; font-size: 13px; font-weight: 600;
    background: linear-gradient(135deg,#0072ff,#00c6ff);
    cursor: pointer; transition: filter .15s, box-shadow .15s;
    box-shadow: 0 4px 12px rgba(0,114,255,0.22);
  }
  .skp-rate-cta:hover { filter: brightness(1.05); box-shadow: 0 6px 18px rgba(0,114,255,0.30); }
  .skp-rate-cta.ghost {
    background: var(--surface); color: var(--text-secondary);
    border: 1px solid var(--border-default); box-shadow: none;
  }
  .skp-rate-cta.ghost:hover {
    color: #0072ff; border-color: #0072ff;
    box-shadow: 0 0 0 3px rgba(0,114,255,0.08);
  }

  /* Social-section responsive. */
  @media (max-width: 900px) {
    .skp-rating-card { grid-template-columns: 1fr; gap: 22px; }
    .skp-rating-radar-row { grid-template-columns: 1fr; }
    .skp-rate-grid { grid-template-columns: repeat(2, 1fr); }
  }

  /* Import + Review pages ---------------------------------------------- */
  .skp-stepper { display: flex; gap: 8px; padding: 4px 0 22px; flex-wrap: wrap; }
  .skp-step {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 6px 12px; border-radius: 999px; font-size: 12.5px;
    background: var(--bg-base); color: var(--text-muted);
  }
  .skp-step .num {
    width: 18px; height: 18px; border-radius: 50%;
    background: var(--surface); color: var(--text-muted);
    font-weight: 700; font-size: 11px;
    display: inline-flex; align-items: center; justify-content: center;
  }
  .skp-step.active {
    background: linear-gradient(135deg,#0072ff,#00c6ff); color: #fff;
  }
  .skp-step.active .num { background: rgba(255,255,255,0.25); color: #fff; }
  .skp-step.done {
    background: rgba(22,163,74,0.10); color: #16a34a;
  }
  .skp-step.done .num { background: #16a34a; color: #fff; }

  .skp-detect-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 14px; border-radius: 8px;
    border: 1px solid var(--border-default); margin-bottom: 8px;
    background: var(--surface);
  }
  .skp-detect-item.found {
    border-color: rgba(22,163,74,0.30); background: rgba(22,163,74,0.05);
  }
  .skp-detect-item.missing {
    border-color: rgba(220,38,38,0.20); background: rgba(220,38,38,0.04);
  }
  .skp-detect-item .file-name {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 13px; color: var(--text-primary);
  }

  .skp-banner {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px; border-radius: 10px;
    background: rgba(0,114,255,0.08); color: #0072ff;
    border: 1px solid rgba(0,114,255,0.15);
    font-size: 13px; margin: 14px 0 18px;
  }
  .skp-banner.warn {
    background: #fef3c7; color: #d97706; border-color: rgba(217,119,6,0.25);
  }
  .skp-banner.ok {
    background: #dcfce7; color: #16a34a; border-color: rgba(22,163,74,0.25);
  }

  /* Review layout ------------------------------------------------------ */
  .skp-review-layout {
    display: grid; grid-template-columns: 320px minmax(0,1fr);
    gap: 20px; align-items: start;
  }

  /* Responsive --------------------------------------------------------- */
  @media (max-width: 1100px) {
    .skp-detail-layout, .skp-review-layout { grid-template-columns: 1fr; }
    .skp-toc { position: static; }
  }
  @media (max-width: 720px) {
    .skp-hero { padding: 28px 22px; }
    .skp-hero h1 { font-size: 24px; }
    .skp-grid { grid-template-columns: 1fr; }
  }
`;

// SOURCE_BADGE_COLORS — keep in sync with backend model.Skill.SourceType
// values (see model/skill_plaza.go).
export const SOURCE_BADGE_COLORS = {
  github: {
    label: 'GitHub 导入',
    bg: 'rgba(30,58,138,0.10)',
    color: '#1e3a8a',
    borderColor: 'rgba(30,58,138,0.25)',
  },
  official: {
    label: '官方',
    gradient: 'linear-gradient(135deg,#0072ff,#00c6ff)',
    color: '#fff',
    borderColor: 'transparent',
  },
  user: {
    label: '用户原创',
    bg: 'rgba(139,92,246,0.10)',
    color: '#8b5cf6',
    borderColor: 'rgba(139,92,246,0.25)',
  },
  case: {
    label: '案例分享',
    bg: 'rgba(245,158,11,0.10)',
    color: '#f59e0b',
    borderColor: 'rgba(245,158,11,0.25)',
  },
  prompt: {
    label: 'Prompt',
    bg: 'rgba(16,185,129,0.10)',
    color: '#10b981',
    borderColor: 'rgba(16,185,129,0.25)',
  },
};

// STATUS_BADGE_COLORS — keep in sync with model.Skill.Status values.
export const STATUS_BADGE_COLORS = {
  draft: { label: '草稿', color: '#64748b', bg: '#f1f5f9' },
  review: { label: '待审核', color: '#d97706', bg: '#fef3c7' },
  published: { label: '已发布', color: '#16a34a', bg: '#dcfce7' },
  offline: { label: '已下架', color: '#dc2626', bg: '#fee2e2' },
  needs_update: { label: '需更新', color: '#ea580c', bg: '#fed7aa' },
  expired: { label: '已过期', color: '#64748b', bg: '#e2e8f0' },
};

/* eslint-disable react/prop-types, react/react-in-jsx-scope */
import React from 'react';

export function SourceBadge({ type }) {
  const cfg = SOURCE_BADGE_COLORS[type] || SOURCE_BADGE_COLORS.user;
  const style = cfg.gradient
    ? {
        background: cfg.gradient,
        color: '#fff',
        border: '1px solid transparent',
      }
    : {
        background: cfg.bg,
        color: cfg.color,
        border: '1px solid ' + cfg.borderColor,
      };
  return (
    <span className='skp-source-badge' style={style}>
      {cfg.label}
    </span>
  );
}

export function StatusBadge({ status }) {
  const cfg = STATUS_BADGE_COLORS[status];
  if (!cfg) return null;
  return (
    <span
      className='skp-status-badge'
      style={{ background: cfg.bg, color: cfg.color }}
    >
      <span className='dot' style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

// ProceduralCover — hash a seed string to a hue and render a gradient
// SVG that's deterministic per skill. Mirrors the design bundle's Cover
// component.
export function ProceduralCover({ seed, label, height = 140 }) {
  let h = 0;
  const s = String(seed || 'skill');
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const hue1 = h % 360;
  const hue2 = (hue1 + 40) % 360;
  const angle = (h % 7) * 30;
  return (
    <div className='skp-card-cover' style={{ height }}>
      <svg
        width='100%'
        height='100%'
        viewBox='0 0 320 160'
        preserveAspectRatio='xMidYMid slice'
      >
        <defs>
          <linearGradient
            id={`skp-cov-${seed}`}
            x1='0'
            y1='0'
            x2='1'
            y2='1'
            gradientTransform={`rotate(${angle} 0.5 0.5)`}
          >
            <stop offset='0' stopColor={`hsl(${hue1} 70% 92%)`} />
            <stop offset='1' stopColor={`hsl(${hue2} 70% 80%)`} />
          </linearGradient>
          <pattern
            id={`skp-st-${seed}`}
            width='14'
            height='14'
            patternUnits='userSpaceOnUse'
            patternTransform={`rotate(${angle})`}
          >
            <line
              x1='0'
              y1='0'
              x2='0'
              y2='14'
              stroke={`hsl(${hue2} 60% 70% / 0.35)`}
              strokeWidth='1'
            />
          </pattern>
        </defs>
        <rect width='320' height='160' fill={`url(#skp-cov-${seed})`} />
        <rect width='320' height='160' fill={`url(#skp-st-${seed})`} />
        <text
          x='20'
          y='146'
          fontFamily='ui-monospace, SFMono-Regular, Menlo, monospace'
          fontSize='11'
          fill={`hsl(${hue1} 60% 35% / 0.55)`}
        >
          {`/* ${label || seed} */`}
        </text>
      </svg>
    </div>
  );
}
