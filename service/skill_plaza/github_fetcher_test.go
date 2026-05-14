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

package skill_plaza

import (
	"strings"
	"testing"
)

// TestParseGitHubURL covers the four flavors:
//   - bare repo
//   - repo + branch (no subdir)
//   - repo + branch + single-segment subdir
//   - repo + branch + nested subdir
//
// plus a few rejection cases that must NOT parse.
func TestParseGitHubURL(t *testing.T) {
	type want struct {
		owner, repo, branch, subdir string
		canonical                   string
	}
	cases := []struct {
		name string
		in   string
		want want
	}{
		{
			name: "bare repo",
			in:   "https://github.com/anthropic/skill-pdf",
			want: want{
				owner: "anthropic", repo: "skill-pdf",
				branch: "", subdir: "",
				canonical: "https://github.com/anthropic/skill-pdf",
			},
		},
		{
			name: "repo with .git suffix",
			in:   "https://github.com/anthropic/skill-pdf.git",
			want: want{
				owner: "anthropic", repo: "skill-pdf",
				canonical: "https://github.com/anthropic/skill-pdf",
			},
		},
		{
			name: "repo + branch",
			in:   "https://github.com/anthropic/skill-pdf/tree/main",
			want: want{
				owner: "anthropic", repo: "skill-pdf",
				branch: "main", subdir: "",
				canonical: "https://github.com/anthropic/skill-pdf",
			},
		},
		{
			name: "monorepo single-segment subdir",
			in:   "https://github.com/89jobrien/steve/tree/main/skill-creator",
			want: want{
				owner: "89jobrien", repo: "steve",
				branch: "main", subdir: "skill-creator",
				canonical: "https://github.com/89jobrien/steve/tree/main/skill-creator",
			},
		},
		{
			name: "monorepo nested subdir",
			in:   "https://github.com/89jobrien/steve/tree/main/steve/skills/skill-creator",
			want: want{
				owner: "89jobrien", repo: "steve",
				branch: "main", subdir: "steve/skills/skill-creator",
				canonical: "https://github.com/89jobrien/steve/tree/main/steve/skills/skill-creator",
			},
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			ref, err := ParseGitHubURL(tc.in)
			if err != nil {
				t.Fatalf("unexpected err: %v", err)
			}
			if ref.Owner != tc.want.owner {
				t.Errorf("owner = %q, want %q", ref.Owner, tc.want.owner)
			}
			if ref.Repo != tc.want.repo {
				t.Errorf("repo = %q, want %q", ref.Repo, tc.want.repo)
			}
			if ref.Branch != tc.want.branch {
				t.Errorf("branch = %q, want %q", ref.Branch, tc.want.branch)
			}
			if ref.Subdir != tc.want.subdir {
				t.Errorf("subdir = %q, want %q", ref.Subdir, tc.want.subdir)
			}
			if got := ref.CanonicalURL(); got != tc.want.canonical {
				t.Errorf("canonical = %q, want %q", got, tc.want.canonical)
			}
		})
	}
}

// TestParseGitHubURL_Rejects exercises the security-relevant rejection paths.
// All of these must return an error — silently accepting them would either
// be a parse bug or, worse, a SSRF / traversal vector.
func TestParseGitHubURL_Rejects(t *testing.T) {
	bad := []struct {
		name string
		in   string
	}{
		{"empty", ""},
		{"non-https scheme", "ftp://github.com/owner/repo"},
		{"wrong host", "https://gitlab.com/owner/repo"},
		{"host spoof via userinfo", "https://github.com.evil.com/owner/repo"},
		{"missing repo", "https://github.com/owner"},
		{"invalid owner chars", "https://github.com/own er/repo"},
		{"invalid branch chars", "https://github.com/o/r/tree/has space"},
		{"subdir with traversal segment", "https://github.com/o/r/tree/main/foo/../bar"},
		{"subdir with dot segment", "https://github.com/o/r/tree/main/foo/./bar"},
		{"subdir with space", "https://github.com/o/r/tree/main/has space"},
		{"subdir with shell meta", "https://github.com/o/r/tree/main/foo;rm-rf"},
	}
	for _, tc := range bad {
		t.Run(tc.name, func(t *testing.T) {
			if ref, err := ParseGitHubURL(tc.in); err == nil {
				t.Fatalf("expected error, got %+v", ref)
			}
		})
	}
}

// TestRelPathForWhitelist covers the subdir-prefix stripping helper. The
// whitelist itself stays anchored at "root" — this helper is what makes
// monorepo subdirs see the same view of patterns.
func TestRelPathForWhitelist(t *testing.T) {
	cases := []struct {
		treePath, subdir string
		wantRel          string
		wantOK           bool
	}{
		// subdir empty → pass everything through unchanged
		{"SKILL.md", "", "SKILL.md", true},
		{"references/foo.md", "", "references/foo.md", true},

		// subdir set → only matching prefixes get rewritten
		{"steve/skills/skill-creator/SKILL.md", "steve/skills/skill-creator", "SKILL.md", true},
		{"steve/skills/skill-creator/references/a.md", "steve/skills/skill-creator", "references/a.md", true},

		// rejection: not under subdir
		{"steve/skills/other-skill/SKILL.md", "steve/skills/skill-creator", "", false},
		{"unrelated.md", "steve/skills/skill-creator", "", false},

		// subdir-prefix-without-slash trap: "skill-creat" should NOT match
		// "skill-creator/..." (the helper enforces the trailing slash)
		{"skill-creator/SKILL.md", "skill-creat", "", false},
	}
	for _, tc := range cases {
		got, ok := relPathForWhitelist(tc.treePath, tc.subdir)
		if ok != tc.wantOK {
			t.Errorf("%q under %q: ok = %v, want %v", tc.treePath, tc.subdir, ok, tc.wantOK)
		}
		if got != tc.wantRel {
			t.Errorf("%q under %q: rel = %q, want %q", tc.treePath, tc.subdir, got, tc.wantRel)
		}
	}
}

// TestIsWhitelisted_RelativeToSubdir confirms that after the helper
// strips the subdir prefix, the existing whitelist patterns still hit.
// This is the integration point that lets the import work end-to-end
// without inventing a second set of patterns.
func TestIsWhitelisted_RelativeToSubdir(t *testing.T) {
	subdir := "monorepo/path/skill-x"
	mustPass := []string{
		"SKILL.md",
		"README.md",
		"LICENSE",
		"references/api.md",
		"agents/helper.yaml",
		"docs/intro.md",
	}
	for _, p := range mustPass {
		full := subdir + "/" + p
		rel, ok := relPathForWhitelist(full, subdir)
		if !ok {
			t.Fatalf("%q should be under subdir", full)
		}
		if !isWhitelisted(rel) {
			t.Errorf("rel %q (from %q) should be whitelisted", rel, full)
		}
	}

	// And things that should still be rejected even relative to subdir.
	for _, p := range []string{"src/main.py", "scripts/run.sh", "Makefile"} {
		full := subdir + "/" + p
		rel, ok := relPathForWhitelist(full, subdir)
		if !ok {
			t.Fatalf("%q should be under subdir", full)
		}
		if isWhitelisted(rel) {
			t.Errorf("rel %q (from %q) should NOT be whitelisted", rel, full)
		}
	}
}

// TestSlugFor covers the three shapes: bare repo, repo with single-segment
// subdir, repo with nested subdir (only the leaf goes into the slug).
func TestSlugFor(t *testing.T) {
	cases := []struct {
		owner, repo, subdir string
		want                string
	}{
		{"Anthropic", "Skill-PDF", "", "anthropic-skill-pdf"},
		{"89jobrien", "steve", "skill-creator", "89jobrien-steve-skill-creator"},
		{"anthropics", "skills", "document-skills/pdf", "anthropics-skills-pdf"},
		{"x", "y", "Caps_With.Dots", "x-y-caps-with-dots"},
	}
	for _, tc := range cases {
		got := SlugFor(tc.owner, tc.repo, tc.subdir)
		if got != tc.want {
			t.Errorf("SlugFor(%q,%q,%q) = %q, want %q",
				tc.owner, tc.repo, tc.subdir, got, tc.want)
		}
	}
}

// TestEnvelopeFiles_Subdir confirms the envelope tag carries the subdir
// attribute when set, so the AI model can reference it in the output
// footer ("Source: …/tree/<branch>/<subdir>"). Empty subdir omits the
// attribute entirely so legacy envelopes stay byte-identical.
func TestEnvelopeFiles_Subdir(t *testing.T) {
	mf := &Manifest{
		RepoURL:    "https://github.com/o/r/tree/main/sub/dir",
		Branch:     "main",
		CommitHash: "abc123",
		Subdir:     "sub/dir",
		Detected:   []FileEntry{{Path: "SKILL.md", Bytes: "hello"}},
	}
	env := EnvelopeFiles(mf)
	if !strings.Contains(env, `subdir="sub/dir"`) {
		t.Errorf("envelope missing subdir attr: %s", env)
	}
	if !strings.Contains(env, "=== FILE: SKILL.md ===") {
		t.Errorf("envelope missing file marker")
	}

	// Empty subdir → no attr.
	mf2 := &Manifest{
		RepoURL: "https://github.com/o/r", Branch: "main", CommitHash: "x",
		Detected: []FileEntry{{Path: "SKILL.md", Bytes: "x"}},
	}
	if strings.Contains(EnvelopeFiles(mf2), "subdir=") {
		t.Errorf("legacy envelope should NOT contain subdir attr")
	}
}
