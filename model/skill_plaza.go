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

package model

import (
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"
)

// =====================================================================
// SKILLS 广场 — admin imports GitHub Skill repos, AI drafts bilingual
// tutorials, users browse / rate / share showcases.
//
// Phase 1: admin pipeline only (import → generate → review → publish).
// Phase 2+: user articles, ratings, comments, showcases (placeholder
// columns reserved on the article model so phase-2 schemas don't need
// to alter the table).
//
// Cross-database safety (per CLAUDE.md Rule 2):
//   - All access via GORM abstractions, never raw DB-specific SQL.
//   - JSON-shaped fields stored as TEXT (no JSONB / @> / GROUP_CONCAT).
//   - No JSONB / SERIAL / AUTO_INCREMENT pinning.
// =====================================================================

// Source types and article statuses are mirrored on the frontend
// (web/src/pages/Skills/constants.js). Keep these strings stable
// — they appear in URLs, filters, and JSON payloads.
const (
	SkillSourceGitHub   = "github"   // admin-imported from GitHub repo
	SkillSourceOfficial = "official" // admin-curated, no GitHub source
	SkillSourceUser     = "user"     // phase 2+ user-submitted
	SkillSourceCase     = "case"     // phase 2+ user showcase
	SkillSourcePrompt   = "prompt"   // phase 2+ Prompt collection
)

const (
	SkillStatusDraft       = "draft"
	SkillStatusReview      = "review"
	SkillStatusPublished   = "published"
	SkillStatusOffline     = "offline"
	SkillStatusNeedsUpdate = "needs_update"
	SkillStatusExpired     = "expired"
)

const (
	SkillImportStatusPending    = "pending"
	SkillImportStatusFetching   = "fetching"
	SkillImportStatusGenerating = "generating"
	SkillImportStatusDone       = "done"
	SkillImportStatusFailed     = "failed"
)

const (
	SkillArticleLangZh = "zh-CN"
	SkillArticleLangEn = "en"
)

// =====================================================================
// Skill — one entry per imported GitHub repo (or one per manually
// created Skill). One Skill has 1..N articles (one per language).
// =====================================================================
type Skill struct {
	Id            int    `json:"id" gorm:"primaryKey"`
	Slug          string `json:"slug" gorm:"type:varchar(160);uniqueIndex"`
	Name          string `json:"name" gorm:"type:varchar(160);not null;index"`
	SourceType    string `json:"source_type" gorm:"type:varchar(20);not null;default:'github';index"`
	GitHubURL     string `json:"github_url" gorm:"column:github_url;type:varchar(512);index"`
	Owner         string `json:"owner" gorm:"type:varchar(160);index"`
	RepoName      string `json:"repo_name" gorm:"type:varchar(160)"`
	Branch        string `json:"branch" gorm:"type:varchar(120);default:'main'"`
	CommitHash    string `json:"commit_hash" gorm:"type:varchar(64)"`
	License       string `json:"license" gorm:"type:varchar(60)"`
	Category      string `json:"category" gorm:"type:varchar(60);index"`
	TagsCSV       string `json:"-" gorm:"column:tags;type:text"` // comma-separated for cross-DB
	RepoUpdatedAt int64  `json:"repo_updated_at" gorm:"bigint"`  // upstream pushed_at
	ImportedBy    int    `json:"imported_by" gorm:"index"`       // admin user id
	Status        string `json:"status" gorm:"type:varchar(20);not null;default:'draft';index"`
	CoverSeed     string `json:"cover_seed" gorm:"type:varchar(40)"` // for procedural SVG covers
	CreatedAt     int64  `json:"created_at" gorm:"bigint;index"`
	UpdatedAt     int64  `json:"updated_at" gorm:"bigint"`
}

func (Skill) TableName() string { return "skills" }

func (s *Skill) BeforeCreate(tx *gorm.DB) error {
	now := time.Now().Unix()
	s.CreatedAt = now
	s.UpdatedAt = now
	return nil
}

func (s *Skill) BeforeUpdate(tx *gorm.DB) error {
	s.UpdatedAt = time.Now().Unix()
	return nil
}

// Tags returns the tag list (split on comma, trimmed).
func (s *Skill) Tags() []string {
	if s.TagsCSV == "" {
		return nil
	}
	raw := strings.Split(s.TagsCSV, ",")
	out := make([]string, 0, len(raw))
	for _, t := range raw {
		t = strings.TrimSpace(t)
		if t != "" {
			out = append(out, t)
		}
	}
	return out
}

// SetTags writes the tag list back to TagsCSV (deduped, trimmed).
func (s *Skill) SetTags(tags []string) {
	seen := map[string]bool{}
	keep := make([]string, 0, len(tags))
	for _, t := range tags {
		t = strings.TrimSpace(t)
		if t == "" || seen[t] {
			continue
		}
		seen[t] = true
		keep = append(keep, t)
	}
	s.TagsCSV = strings.Join(keep, ",")
}

func CreateSkill(s *Skill) error {
	if s.Slug == "" {
		return errors.New("slug is required")
	}
	if s.Name == "" {
		return errors.New("name is required")
	}
	if s.SourceType == "" {
		s.SourceType = SkillSourceGitHub
	}
	if s.Status == "" {
		s.Status = SkillStatusDraft
	}
	return DB.Create(s).Error
}

func GetSkillByID(id int) (*Skill, error) {
	var s Skill
	if err := DB.First(&s, id).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

func GetSkillBySlug(slug string) (*Skill, error) {
	var s Skill
	if err := DB.Where("slug = ?", slug).First(&s).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

func GetSkillByGitHubURL(url string) (*Skill, error) {
	var s Skill
	if err := DB.Where("github_url = ?", url).First(&s).Error; err != nil {
		return nil, err
	}
	return &s, nil
}

func UpdateSkill(id int, updates map[string]any) error {
	updates["updated_at"] = time.Now().Unix()
	return DB.Model(&Skill{}).Where("id = ?", id).Updates(updates).Error
}

func DeleteSkill(id int) error {
	return DB.Where("id = ?", id).Delete(&Skill{}).Error
}

// ListSkillsAdminFilter — admin list with status / category / source / search.
type ListSkillsAdminFilter struct {
	Status     string
	SourceType string
	Category   string
	Search     string
	Page       int
	PageSize   int
}

func ListSkillsAdmin(f ListSkillsAdminFilter) ([]Skill, int64, error) {
	q := DB.Model(&Skill{})
	if f.Status != "" {
		q = q.Where("status = ?", f.Status)
	}
	if f.SourceType != "" {
		q = q.Where("source_type = ?", f.SourceType)
	}
	if f.Category != "" {
		q = q.Where("category = ?", f.Category)
	}
	if f.Search != "" {
		like := "%" + f.Search + "%"
		q = q.Where("name LIKE ? OR slug LIKE ?", like, like)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if f.PageSize <= 0 {
		f.PageSize = 20
	}
	if f.Page <= 0 {
		f.Page = 1
	}
	offset := (f.Page - 1) * f.PageSize
	var out []Skill
	err := q.Order("updated_at desc").Offset(offset).Limit(f.PageSize).Find(&out).Error
	return out, total, err
}

// ListSkillsPublicFilter — public list (only published).
type ListSkillsPublicFilter struct {
	Category   string
	SourceType string
	Tag        string // single tag — uses LIKE %,tag,% pattern below
	Language   string // restricts joined article language
	Search     string
	Sort       string // latest / updated
	Page       int
	PageSize   int
}

func ListSkillsPublic(f ListSkillsPublicFilter) ([]Skill, int64, error) {
	q := DB.Model(&Skill{}).Where("status = ?", SkillStatusPublished)
	if f.Category != "" {
		q = q.Where("category = ?", f.Category)
	}
	if f.SourceType != "" {
		q = q.Where("source_type = ?", f.SourceType)
	}
	if f.Tag != "" {
		q = q.Where("tags LIKE ?", "%"+f.Tag+"%")
	}
	if f.Search != "" {
		like := "%" + f.Search + "%"
		q = q.Where("name LIKE ?", like)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	switch f.Sort {
	case "updated":
		q = q.Order("repo_updated_at desc")
	default:
		q = q.Order("created_at desc")
	}
	if f.PageSize <= 0 {
		f.PageSize = 20
	}
	if f.Page <= 0 {
		f.Page = 1
	}
	offset := (f.Page - 1) * f.PageSize
	var out []Skill
	err := q.Offset(offset).Limit(f.PageSize).Find(&out).Error
	return out, total, err
}

// =====================================================================
// SkillArticle — bilingual tutorial body. One row per (skill_id, language).
//
// Reserved phase-2 columns (Rating*, FavoriteCount, CommentCount,
// ArticleType, AuthorId) live here so the table doesn't need to be
// altered when user content lands. They default to zero and are
// ignored by phase-1 controllers.
// =====================================================================
type SkillArticle struct {
	Id          int    `json:"id" gorm:"primaryKey"`
	SkillId     int    `json:"skill_id" gorm:"not null;uniqueIndex:idx_skill_lang,priority:1"`
	Language    string `json:"language" gorm:"type:varchar(8);not null;uniqueIndex:idx_skill_lang,priority:2;index"`
	Title       string `json:"title" gorm:"type:varchar(240);not null"`
	Summary     string `json:"summary" gorm:"type:text"`
	// Body uses TEXT (not LONGTEXT) because PostgreSQL has no LONGTEXT type
	// and TEXT is unlimited there. On MySQL TEXT caps at 64KB — large
	// enough for typical Markdown tutorials; if real-world articles exceed
	// that, the per-DB migration can ALTER to MEDIUMTEXT.
	Body        string `json:"body" gorm:"type:text"`
	CoverImage  string `json:"cover_image" gorm:"type:varchar(512)"`
	Status      string `json:"status" gorm:"type:varchar(20);not null;default:'draft';index"`
	ArticleType string `json:"article_type" gorm:"type:varchar(20);default:'tutorial'"` // tutorial/review/case/troubleshoot/prompt/compare

	// Generation provenance — populated by AI gen service for audit.
	GeneratedBy    string `json:"generated_by" gorm:"type:varchar(120)"` // model name e.g. gpt-5
	GeneratedAt    int64  `json:"generated_at" gorm:"bigint"`
	TokenInput     int    `json:"token_input" gorm:"int"`
	TokenOutput    int    `json:"token_output" gorm:"int"`
	GenerationLog  string `json:"generation_log" gorm:"type:text"` // optional debug trace
	HumanRevisions int    `json:"human_revisions" gorm:"default:0"`

	// Lifecycle
	AuthorId    int   `json:"author_id" gorm:"index;default:0"` // 0 for AI-generated
	EditedBy    int   `json:"edited_by" gorm:"index;default:0"`
	EditedAt    int64 `json:"edited_at" gorm:"bigint"`
	PublishedAt int64 `json:"published_at" gorm:"bigint;index"`
	ViewCount   int64 `json:"view_count" gorm:"bigint;default:0"`

	// Phase-2 placeholders — default 0, no controller writes these in phase 1.
	RatingAverage float64 `json:"rating_average" gorm:"default:0"`
	RatingCount   int     `json:"rating_count" gorm:"default:0"`
	FavoriteCount int     `json:"favorite_count" gorm:"default:0"`
	CommentCount  int     `json:"comment_count" gorm:"default:0"`

	CreatedAt int64 `json:"created_at" gorm:"bigint"`
	UpdatedAt int64 `json:"updated_at" gorm:"bigint"`
}

func (SkillArticle) TableName() string { return "skill_articles" }

func (a *SkillArticle) BeforeCreate(tx *gorm.DB) error {
	now := time.Now().Unix()
	a.CreatedAt = now
	a.UpdatedAt = now
	return nil
}

func (a *SkillArticle) BeforeUpdate(tx *gorm.DB) error {
	a.UpdatedAt = time.Now().Unix()
	return nil
}

func CreateSkillArticle(a *SkillArticle) error {
	if a.SkillId == 0 {
		return errors.New("skill_id is required")
	}
	if a.Language == "" {
		return errors.New("language is required")
	}
	if a.Status == "" {
		a.Status = SkillStatusDraft
	}
	return DB.Create(a).Error
}

func GetSkillArticle(id int) (*SkillArticle, error) {
	var a SkillArticle
	if err := DB.First(&a, id).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

func GetSkillArticleByLang(skillId int, language string) (*SkillArticle, error) {
	var a SkillArticle
	if err := DB.Where("skill_id = ? AND language = ?", skillId, language).First(&a).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

// UpsertSkillArticle creates or replaces the (skill_id, language) row.
// AI generation calls this on each regenerate to overwrite the draft.
func UpsertSkillArticle(a *SkillArticle) error {
	existing := SkillArticle{}
	err := DB.Where("skill_id = ? AND language = ?", a.SkillId, a.Language).First(&existing).Error
	if err == nil {
		a.Id = existing.Id
		a.CreatedAt = existing.CreatedAt
		// Preserve human edits if the existing article was already edited by an admin.
		if existing.HumanRevisions > 0 {
			a.HumanRevisions = existing.HumanRevisions
		}
		return DB.Save(a).Error
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return DB.Create(a).Error
	}
	return err
}

func UpdateSkillArticle(id int, updates map[string]any) error {
	updates["updated_at"] = time.Now().Unix()
	return DB.Model(&SkillArticle{}).Where("id = ?", id).Updates(updates).Error
}

func ListSkillArticlesBySkill(skillId int) ([]SkillArticle, error) {
	var out []SkillArticle
	err := DB.Where("skill_id = ?", skillId).Order("language asc").Find(&out).Error
	return out, err
}

// GetPublishedArticleForSkill returns the published article for a given
// skill in the requested language, falling back to the other language if
// the requested one isn't published yet.
func GetPublishedArticleForSkill(skillId int, language string) (*SkillArticle, error) {
	var a SkillArticle
	err := DB.Where("skill_id = ? AND language = ? AND status = ?", skillId, language, SkillStatusPublished).
		First(&a).Error
	if err == nil {
		return &a, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	// fallback to any published article for this skill
	err = DB.Where("skill_id = ? AND status = ?", skillId, SkillStatusPublished).First(&a).Error
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func IncrementArticleViewCount(id int) {
	// Best-effort, non-blocking; ignore errors.
	DB.Model(&SkillArticle{}).Where("id = ?", id).
		UpdateColumn("view_count", gorm.Expr("view_count + ?", 1))
}

// =====================================================================
// SkillImportJob — async import task: fetch + AI generate. The admin
// can poll the job to watch progress and see error messages.
//
// MetadataJSON stores the parsed manifest summary (files detected,
// sizes, README excerpt) as a JSON string (TEXT) for cross-DB safety.
// =====================================================================
type SkillImportJob struct {
	Id           int    `json:"id" gorm:"primaryKey"`
	SkillId      int    `json:"skill_id" gorm:"index;default:0"` // backfilled when generation completes
	RepoURL      string `json:"repo_url" gorm:"type:varchar(512);not null;index"`
	Branch       string `json:"branch" gorm:"type:varchar(120);default:'main'"`
	Status       string `json:"status" gorm:"type:varchar(20);not null;default:'pending';index"`
	ErrorMessage string `json:"error_message" gorm:"type:text"`
	TriggeredBy  int    `json:"triggered_by" gorm:"index"`
	StartedAt    int64  `json:"started_at" gorm:"bigint"`
	FinishedAt   int64  `json:"finished_at" gorm:"bigint"`
	// MetadataJSON: JSON string with detected files, commit hash, license, etc.
	// Stored as TEXT for SQLite/MySQL/PostgreSQL compatibility (no JSONB).
	MetadataJSON string `json:"metadata_json" gorm:"type:text"`
	CreatedAt    int64  `json:"created_at" gorm:"bigint;index"`
	UpdatedAt    int64  `json:"updated_at" gorm:"bigint"`
}

func (SkillImportJob) TableName() string { return "skill_import_jobs" }

func (j *SkillImportJob) BeforeCreate(tx *gorm.DB) error {
	now := time.Now().Unix()
	j.CreatedAt = now
	j.UpdatedAt = now
	return nil
}

func (j *SkillImportJob) BeforeUpdate(tx *gorm.DB) error {
	j.UpdatedAt = time.Now().Unix()
	return nil
}

func CreateSkillImportJob(j *SkillImportJob) error {
	if j.RepoURL == "" {
		return errors.New("repo_url is required")
	}
	if j.Status == "" {
		j.Status = SkillImportStatusPending
	}
	return DB.Create(j).Error
}

func GetSkillImportJob(id int) (*SkillImportJob, error) {
	var j SkillImportJob
	if err := DB.First(&j, id).Error; err != nil {
		return nil, err
	}
	return &j, nil
}

func UpdateSkillImportJob(id int, updates map[string]any) error {
	updates["updated_at"] = time.Now().Unix()
	return DB.Model(&SkillImportJob{}).Where("id = ?", id).Updates(updates).Error
}

func ListSkillImportJobs(adminID int, limit int) ([]SkillImportJob, error) {
	if limit <= 0 || limit > 100 {
		limit = 30
	}
	var out []SkillImportJob
	q := DB.Order("created_at desc").Limit(limit)
	if adminID > 0 {
		q = q.Where("triggered_by = ?", adminID)
	}
	err := q.Find(&out).Error
	return out, err
}
