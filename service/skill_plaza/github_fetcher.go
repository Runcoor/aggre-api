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

// Package skill_plaza implements the SKILLS 广场 backend:
// GitHub content fetching, AI tutorial generation, and import-job orchestration.
package skill_plaza

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path"
	"regexp"
	"strings"
	"time"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/setting/operation_setting"
)

// =====================================================================
// URL parsing & validation
//
// We only accept github.com URLs. The Host check is the primary defense
// against SSRF — every downstream fetch goes to one of two hardcoded
// domains (api.github.com, raw.githubusercontent.com), never a host the
// user controls.
// =====================================================================

// RepoRef identifies a single GitHub repository (and optional branch).
type RepoRef struct {
	Owner  string
	Repo   string
	Branch string // empty means "use default"
}

var slugRe = regexp.MustCompile(`^[A-Za-z0-9._-]+$`)

// ParseGitHubURL accepts e.g. "https://github.com/owner/repo" or
// "https://github.com/owner/repo/tree/main" and returns a RepoRef.
// Returns an error for any non-github.com URL or malformed path.
func ParseGitHubURL(raw string) (*RepoRef, error) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, errors.New("repository URL is required")
	}
	// Some users paste with trailing .git
	raw = strings.TrimSuffix(raw, ".git")
	u, err := url.Parse(raw)
	if err != nil {
		return nil, fmt.Errorf("invalid URL: %w", err)
	}
	if u.Scheme != "https" && u.Scheme != "http" {
		return nil, errors.New("URL must be HTTP or HTTPS")
	}
	// Strict host whitelist — refuse anything but github.com.
	host := strings.ToLower(u.Host)
	if host != "github.com" && host != "www.github.com" {
		return nil, fmt.Errorf("only github.com URLs are accepted (got host: %s)", host)
	}
	parts := strings.Split(strings.Trim(u.Path, "/"), "/")
	if len(parts) < 2 {
		return nil, errors.New("URL must be in the form github.com/owner/repo")
	}
	owner, repo := parts[0], parts[1]
	if !slugRe.MatchString(owner) || !slugRe.MatchString(repo) {
		return nil, errors.New("invalid owner or repo segment")
	}
	ref := &RepoRef{Owner: owner, Repo: repo}
	// Optional /tree/<branch>/...
	if len(parts) >= 4 && parts[2] == "tree" {
		if !slugRe.MatchString(parts[3]) {
			return nil, errors.New("invalid branch segment")
		}
		ref.Branch = parts[3]
	}
	return ref, nil
}

// CanonicalURL returns the canonical https://github.com/owner/repo form
// that we store in the database (without branch suffix).
func (r *RepoRef) CanonicalURL() string {
	return fmt.Sprintf("https://github.com/%s/%s", r.Owner, r.Repo)
}

// =====================================================================
// GitHub API responses (only the fields we care about)
// =====================================================================

type ghRepoMeta struct {
	Name          string `json:"name"`
	FullName      string `json:"full_name"`
	Description   string `json:"description"`
	DefaultBranch string `json:"default_branch"`
	PushedAt      string `json:"pushed_at"` // RFC3339
	License       *struct {
		SPDXID string `json:"spdx_id"`
		Name   string `json:"name"`
	} `json:"license"`
	HTMLURL string `json:"html_url"`
	Size    int    `json:"size"` // KB
}

type ghBranch struct {
	Name   string `json:"name"`
	Commit struct {
		Sha string `json:"sha"`
	} `json:"commit"`
}

type ghTreeEntry struct {
	Path string `json:"path"`
	Type string `json:"type"` // "blob" or "tree"
	Size int    `json:"size"`
	SHA  string `json:"sha"`
}

type ghTreeResp struct {
	Tree      []ghTreeEntry `json:"tree"`
	Truncated bool          `json:"truncated"`
}

// =====================================================================
// Manifest — what FetchManifest returns to the import orchestrator
// and what gets serialized into SkillImportJob.MetadataJSON.
// =====================================================================

// FileEntry is one whitelisted file we actually read.
type FileEntry struct {
	Path  string `json:"path"`
	Size  int    `json:"size"`
	Bytes string `json:"-"` // file body (kept out of JSON metadata)
}

// Manifest is the result of a single GitHub repo import probe.
type Manifest struct {
	RepoURL       string      `json:"repo_url"`
	Owner         string      `json:"owner"`
	Repo          string      `json:"repo"`
	Branch        string      `json:"branch"`
	CommitHash    string      `json:"commit_hash"`
	License       string      `json:"license"`
	Description   string      `json:"description"`
	RepoUpdatedAt int64       `json:"repo_updated_at"` // pushed_at epoch
	RepoSizeKB    int         `json:"repo_size_kb"`
	Detected      []FileEntry `json:"detected"`
	Truncated     bool        `json:"truncated"`
	TotalBytes    int         `json:"total_bytes"`
}

// =====================================================================
// File whitelist — pattern matched against each tree entry's path.
//
// The set is small and intentionally additive: a repo missing any one
// of these is fine, we just won't include it in the manifest.
// =====================================================================

var fileWhitelist = []struct {
	Pattern     string // glob-style (* matches any non-slash, ** matches any)
	Description string
}{
	{"SKILL.md", "Primary skill manifest"},
	{"README.md", "Project overview"},
	{"README", "Project overview (no extension)"},
	{"LICENSE", "License terms"},
	{"LICENSE.md", "License terms"},
	{"LICENSE.txt", "License terms"},
	{"agents/*.yaml", "Agent tool definitions"},
	{"agents/*.yml", "Agent tool definitions"},
	{"references/*.md", "Reference documents"},
	{"references/**.md", "Reference documents (nested)"},
	{"examples/*.md", "Example walkthroughs"},
	{"docs/*.md", "Documentation"},
	{"*.md", "Top-level markdown"},
}

func matchPattern(pattern, p string) bool {
	// Simple glob: support * (any non-slash) and ** (any) wildcards.
	// We compile to a regex on first use; for our short whitelist this
	// is cheap enough to do inline.
	rx := "^"
	i := 0
	for i < len(pattern) {
		c := pattern[i]
		if c == '*' {
			if i+1 < len(pattern) && pattern[i+1] == '*' {
				rx += ".*"
				i += 2
			} else {
				rx += "[^/]*"
				i++
			}
		} else if c == '.' || c == '+' || c == '(' || c == ')' || c == '|' || c == '^' || c == '$' || c == '?' || c == '[' || c == ']' || c == '{' || c == '}' || c == '\\' {
			rx += `\` + string(c)
			i++
		} else {
			rx += string(c)
			i++
		}
	}
	rx += "$"
	re, err := regexp.Compile(rx)
	if err != nil {
		return false
	}
	return re.MatchString(p)
}

func isWhitelisted(p string) bool {
	// Reject anything with traversal or absolute paths defensively.
	if strings.Contains(p, "..") || strings.HasPrefix(p, "/") {
		return false
	}
	for _, w := range fileWhitelist {
		if matchPattern(w.Pattern, p) {
			return true
		}
	}
	// Heuristic: allow top-level *.md files even if the whitelist regex
	// pass missed them.
	if !strings.Contains(p, "/") && strings.HasSuffix(strings.ToLower(p), ".md") {
		return true
	}
	return false
}

// =====================================================================
// HTTP plumbing
// =====================================================================

var ghClient = &http.Client{Timeout: 20 * time.Second}

func ghGet(ctx context.Context, endpoint string, into any) error {
	cfg := operation_setting.GetSkillPlazaSetting()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("X-GitHub-Api-Version", "2022-11-28")
	req.Header.Set("User-Agent", "aggre-api/skill-plaza")
	if cfg.GitHubPAT != "" {
		req.Header.Set("Authorization", "Bearer "+cfg.GitHubPAT)
	}
	resp, err := ghClient.Do(req)
	if err != nil {
		return fmt.Errorf("github request failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusNotFound {
		return fmt.Errorf("github 404 — repository not found or private")
	}
	if resp.StatusCode == http.StatusForbidden {
		return fmt.Errorf("github 403 — rate limited or access denied (consider setting a PAT)")
	}
	if resp.StatusCode >= 400 {
		body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return fmt.Errorf("github error %d: %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}
	return common.DecodeJson(resp.Body, into)
}

func fetchRaw(ctx context.Context, owner, repo, branch, p string, maxBytes int) ([]byte, error) {
	endpoint := fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/%s/%s",
		url.PathEscape(owner), url.PathEscape(repo), url.PathEscape(branch), p)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "aggre-api/skill-plaza")
	cfg := operation_setting.GetSkillPlazaSetting()
	if cfg.GitHubPAT != "" {
		req.Header.Set("Authorization", "Bearer "+cfg.GitHubPAT)
	}
	resp, err := ghClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("raw fetch failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("raw fetch %d for %s", resp.StatusCode, p)
	}
	// LimitReader is defense-in-depth: tree entry already had a size,
	// but the body could still be too large (or chunked).
	body, err := io.ReadAll(io.LimitReader(resp.Body, int64(maxBytes)+1))
	if err != nil {
		return nil, err
	}
	if len(body) > maxBytes {
		return nil, fmt.Errorf("file %s exceeds max size %d bytes", p, maxBytes)
	}
	return body, nil
}

// =====================================================================
// FetchManifest — the entry point used by the import job orchestrator.
//
// Steps:
//   1. Repo meta (default branch, license, pushed_at, size)
//   2. Branch tip commit hash
//   3. Recursive tree listing → filter against whitelist
//   4. For each whitelisted file, fetch raw bytes (capped)
//
// All steps respect ctx; the caller can attach a timeout.
// =====================================================================
func FetchManifest(ctx context.Context, ref *RepoRef) (*Manifest, error) {
	cfg := operation_setting.GetSkillPlazaSetting()
	maxFileBytes := cfg.MaxFileSizeKB * 1024
	if maxFileBytes <= 0 {
		maxFileBytes = 1024 * 1024
	}
	maxRepoBytes := cfg.MaxRepoSizeMB * 1024 * 1024
	if maxRepoBytes <= 0 {
		maxRepoBytes = 200 * 1024 * 1024
	}
	maxFiles := cfg.MaxFileCount
	if maxFiles <= 0 {
		maxFiles = 200
	}

	// 1. Repo metadata
	var meta ghRepoMeta
	if err := ghGet(ctx, fmt.Sprintf("https://api.github.com/repos/%s/%s", ref.Owner, ref.Repo), &meta); err != nil {
		return nil, err
	}
	if meta.Size*1024 > maxRepoBytes {
		return nil, fmt.Errorf("repo size %dKB exceeds limit %dMB", meta.Size, cfg.MaxRepoSizeMB)
	}

	branch := ref.Branch
	if branch == "" {
		branch = meta.DefaultBranch
	}
	if branch == "" {
		branch = "main"
	}

	// 2. Branch info
	var br ghBranch
	if err := ghGet(ctx, fmt.Sprintf("https://api.github.com/repos/%s/%s/branches/%s", ref.Owner, ref.Repo, branch), &br); err != nil {
		return nil, fmt.Errorf("branch %s: %w", branch, err)
	}

	// 3. Tree
	var tree ghTreeResp
	if err := ghGet(ctx, fmt.Sprintf("https://api.github.com/repos/%s/%s/git/trees/%s?recursive=1", ref.Owner, ref.Repo, br.Commit.Sha), &tree); err != nil {
		return nil, fmt.Errorf("tree: %w", err)
	}

	// 4. Filter + fetch whitelisted blobs
	mf := &Manifest{
		RepoURL:    ref.CanonicalURL(),
		Owner:      ref.Owner,
		Repo:       ref.Repo,
		Branch:     branch,
		CommitHash: br.Commit.Sha,
		Truncated:  tree.Truncated,
		RepoSizeKB: meta.Size,
	}
	if meta.License != nil {
		if meta.License.SPDXID != "" && meta.License.SPDXID != "NOASSERTION" {
			mf.License = meta.License.SPDXID
		} else {
			mf.License = meta.License.Name
		}
	}
	mf.Description = meta.Description
	if t, err := time.Parse(time.RFC3339, meta.PushedAt); err == nil {
		mf.RepoUpdatedAt = t.Unix()
	}

	picked := 0
	totalBytes := 0
	for _, entry := range tree.Tree {
		if entry.Type != "blob" {
			continue
		}
		// Cheap pre-filter on path
		if !isWhitelisted(entry.Path) {
			continue
		}
		if entry.Size > maxFileBytes {
			continue
		}
		body, err := fetchRaw(ctx, ref.Owner, ref.Repo, branch, entry.Path, maxFileBytes)
		if err != nil {
			// Best-effort: log and continue. Don't fail the whole import
			// because one file went sideways.
			common.SysLog("skill_plaza: fetchRaw " + entry.Path + " — " + err.Error())
			continue
		}
		totalBytes += len(body)
		if totalBytes > maxRepoBytes {
			return nil, fmt.Errorf("aggregate read exceeded %dMB cap", cfg.MaxRepoSizeMB)
		}
		mf.Detected = append(mf.Detected, FileEntry{
			Path:  entry.Path,
			Size:  len(body),
			Bytes: string(body),
		})
		picked++
		if picked >= maxFiles {
			break
		}
	}
	mf.TotalBytes = totalBytes
	if len(mf.Detected) == 0 {
		return nil, errors.New("no whitelisted documentation files found in repo")
	}
	return mf, nil
}

// =====================================================================
// Helpers for the AI generation step (used by ai_gen.go)
// =====================================================================

// SlugFor returns a URL-friendly slug derived from owner+repo, e.g.
// "anthropic-pdf-toolkit". Caller should de-dup on collision.
func SlugFor(owner, repo string) string {
	clean := func(s string) string {
		var b strings.Builder
		for _, r := range strings.ToLower(s) {
			if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
				b.WriteRune(r)
			} else if r == '-' || r == '_' || r == '.' {
				b.WriteRune('-')
			}
		}
		return strings.Trim(b.String(), "-")
	}
	slug := clean(owner) + "-" + clean(repo)
	if len(slug) > 100 {
		slug = slug[:100]
	}
	return slug
}

// EnvelopeFiles wraps each fetched file in an explicit data envelope.
// The AI generation prompt instructs the model to treat the envelope
// contents as untrusted data, not instructions — the wrapping is the
// boundary that makes that instruction enforceable.
func EnvelopeFiles(mf *Manifest) string {
	var b strings.Builder
	b.WriteString("<UNTRUSTED_SOURCE_DOC repo=\"")
	b.WriteString(mf.RepoURL)
	b.WriteString("\" commit=\"")
	b.WriteString(mf.CommitHash)
	b.WriteString("\" branch=\"")
	b.WriteString(mf.Branch)
	b.WriteString("\">\n")
	for _, f := range mf.Detected {
		b.WriteString("\n=== FILE: ")
		b.WriteString(f.Path)
		b.WriteString(" ===\n")
		b.WriteString(f.Bytes)
		b.WriteString("\n")
	}
	b.WriteString("\n</UNTRUSTED_SOURCE_DOC>\n")
	return b.String()
}

// CoverSeedFor returns a short deterministic seed used by the frontend's
// procedural SVG cover generator.
func CoverSeedFor(owner, repo string) string {
	return path.Base(owner) + "-" + path.Base(repo)
}
