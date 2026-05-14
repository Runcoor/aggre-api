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
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/model"
	"github.com/runcoor/aggre-api/setting/operation_setting"
	"gorm.io/gorm"
)

// =====================================================================
// Import orchestrator: kick off an async job that fetches the repo,
// asks the model for bilingual tutorials, and lands a Skill + two
// SkillArticle drafts in the database.
//
// The HTTP handler creates the SkillImportJob in pending state, then
// calls StartImportAsync to spawn the worker goroutine. The admin UI
// polls GET /skill-plaza/admin/import-jobs/:id to watch progress.
// =====================================================================

// StartImportAsync runs the import in a detached goroutine. It updates
// the SkillImportJob row at each stage transition so the admin UI can
// reflect progress. Returns immediately.
func StartImportAsync(jobID int, repoURL, branch string, adminID int) {
	go func() {
		// Use a generous timeout for the whole pipeline; GitHub + a
		// bilingual generation can legitimately take a couple minutes
		// for a chatty repo.
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		if err := runImport(ctx, jobID, repoURL, branch, adminID); err != nil {
			common.SysLog(fmt.Sprintf("skill_plaza import job %d failed: %v", jobID, err))
			_ = model.UpdateSkillImportJob(jobID, map[string]any{
				"status":        model.SkillImportStatusFailed,
				"error_message": err.Error(),
				"finished_at":   time.Now().Unix(),
			})
		}
	}()
}

func runImport(ctx context.Context, jobID int, repoURL, branch string, adminID int) error {
	if !operation_setting.IsSkillPlazaEnabled() {
		return errors.New("SKILLS 广场 is disabled")
	}

	// ───── Parse URL ─────
	ref, err := ParseGitHubURL(repoURL)
	if err != nil {
		return err
	}
	if branch != "" {
		ref.Branch = branch
	}

	now := time.Now().Unix()
	if err := model.UpdateSkillImportJob(jobID, map[string]any{
		"status":     model.SkillImportStatusFetching,
		"started_at": now,
	}); err != nil {
		return err
	}

	// ───── Fetch GitHub manifest ─────
	manifest, err := FetchManifest(ctx, ref)
	if err != nil {
		return fmt.Errorf("fetch failed: %w", err)
	}

	// Persist manifest summary for audit (strip file bodies — too big).
	summary := manifestSummary(manifest)
	metaJSON, _ := common.Marshal(summary)
	_ = model.UpdateSkillImportJob(jobID, map[string]any{
		"metadata_json": string(metaJSON),
		"status":        model.SkillImportStatusGenerating,
	})

	// ───── Generate bilingual articles ─────
	results, err := GenerateBilingualArticles(ctx, manifest)
	if err != nil {
		return fmt.Errorf("generate failed: %w", err)
	}

	// ───── Persist Skill + articles ─────
	skill, err := upsertSkill(manifest, ref, adminID)
	if err != nil {
		return fmt.Errorf("save skill: %w", err)
	}

	for _, r := range results {
		article := &model.SkillArticle{
			SkillId:       skill.Id,
			Language:      r.Language,
			Title:         r.Title,
			Summary:       r.Summary,
			Body:          r.Body,
			Status:        model.SkillStatusDraft,
			ArticleType:   "tutorial",
			GeneratedBy:   r.Model,
			GeneratedAt:   r.GeneratedAt,
			TokenInput:    r.TokensIn,
			TokenOutput:   r.TokensOut,
			GenerationLog: fmt.Sprintf("import_job=%d", jobID),
		}
		if err := model.UpsertSkillArticle(article); err != nil {
			return fmt.Errorf("save article %s: %w", r.Language, err)
		}
	}

	_ = model.UpdateSkillImportJob(jobID, map[string]any{
		"status":      model.SkillImportStatusDone,
		"skill_id":    skill.Id,
		"finished_at": time.Now().Unix(),
	})
	return nil
}

// manifestSummary strips file bodies before persisting metadata, so
// the row stays small even for repos with many big READMEs.
func manifestSummary(mf *Manifest) map[string]any {
	files := make([]map[string]any, 0, len(mf.Detected))
	for _, f := range mf.Detected {
		files = append(files, map[string]any{
			"path": f.Path,
			"size": f.Size,
		})
	}
	return map[string]any{
		"repo_url":        mf.RepoURL,
		"owner":           mf.Owner,
		"repo":            mf.Repo,
		"branch":          mf.Branch,
		"commit_hash":     mf.CommitHash,
		"license":         mf.License,
		"description":     mf.Description,
		"repo_updated_at": mf.RepoUpdatedAt,
		"repo_size_kb":    mf.RepoSizeKB,
		"truncated":       mf.Truncated,
		"total_bytes":     mf.TotalBytes,
		"files":           files,
	}
}

// upsertSkill creates a Skill if it doesn't exist for this repo URL,
// otherwise refreshes its commit hash / license / branch / pushed_at.
// Returns the resulting Skill row.
func upsertSkill(mf *Manifest, ref *RepoRef, adminID int) (*model.Skill, error) {
	existing, err := model.GetSkillByGitHubURL(mf.RepoURL)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	if existing != nil {
		updates := map[string]any{
			"commit_hash":     mf.CommitHash,
			"license":         mf.License,
			"branch":          mf.Branch,
			"repo_updated_at": mf.RepoUpdatedAt,
		}
		// Bump status from `expired` / `needs_update` back to its previous
		// state when admin re-imports — but leave `published` alone (admin
		// has to explicitly re-publish after reviewing the new draft).
		if existing.Status == model.SkillStatusExpired || existing.Status == model.SkillStatusNeedsUpdate {
			updates["status"] = model.SkillStatusDraft
		}
		if err := model.UpdateSkill(existing.Id, updates); err != nil {
			return nil, err
		}
		return model.GetSkillByID(existing.Id)
	}

	slug, err := uniqueSlug(mf.Owner, mf.Repo)
	if err != nil {
		return nil, err
	}
	skill := &model.Skill{
		Slug:          slug,
		Name:          mf.Repo,
		SourceType:    model.SkillSourceGitHub,
		GitHubURL:     mf.RepoURL,
		Owner:         mf.Owner,
		RepoName:      mf.Repo,
		Branch:        mf.Branch,
		CommitHash:    mf.CommitHash,
		License:       mf.License,
		Category:      "", // admin sets during review
		RepoUpdatedAt: mf.RepoUpdatedAt,
		ImportedBy:    adminID,
		Status:        model.SkillStatusDraft,
		CoverSeed:     CoverSeedFor(mf.Owner, mf.Repo),
	}
	if err := model.CreateSkill(skill); err != nil {
		return nil, err
	}
	return skill, nil
}

// uniqueSlug picks a slug derived from owner/repo and appends a numeric
// suffix on collision.
func uniqueSlug(owner, repo string) (string, error) {
	base := SlugFor(owner, repo)
	if base == "" {
		return "", errors.New("could not derive slug from owner/repo")
	}
	candidate := base
	for i := 2; i < 100; i++ {
		_, err := model.GetSkillBySlug(candidate)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return candidate, nil
		}
		if err != nil {
			return "", err
		}
		candidate = fmt.Sprintf("%s-%d", base, i)
	}
	return "", errors.New("could not find a unique slug")
}

// SanitizeUserSlug is exposed so admin endpoints can validate a slug
// before persisting (e.g. when admin renames a Skill).
func SanitizeUserSlug(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	var b strings.Builder
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' || r == '_' {
			b.WriteRune(r)
		} else if r == ' ' || r == '/' || r == '.' {
			b.WriteRune('-')
		}
	}
	out := strings.Trim(b.String(), "-")
	if len(out) > 100 {
		out = out[:100]
	}
	return out
}
