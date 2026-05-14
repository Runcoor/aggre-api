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

	"github.com/runcoor/aggre-api/common"
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

// SkillUserArticle types — user submission categories from PRD V1.1.
// Strings appear in URLs / filters / JSON payloads; keep them stable.
const (
	SkillUserArticleTypeTutorial        = "tutorial"        // how-to walkthrough
	SkillUserArticleTypeReview          = "review"          // hands-on evaluation
	SkillUserArticleTypeShowcase        = "showcase"        // results / prompt + output
	SkillUserArticleTypeTroubleshooting = "troubleshooting" // problem + fix
	SkillUserArticleTypePrompts         = "prompts"         // prompt collection
	SkillUserArticleTypeComparison      = "comparison"      // A vs B
)

// SkillUserArticle status — author workflow + admin moderation.
const (
	SkillUserArticleStatusDraft    = "draft"    // author still editing
	SkillUserArticleStatusPending  = "pending"  // submitted, awaiting admin
	SkillUserArticleStatusApproved = "approved" // public
	SkillUserArticleStatusRejected = "rejected" // returned to author with reason
	SkillUserArticleStatusOffline  = "offline"  // taken down post-publish
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

	// Phase 2 aggregate counters — kept here (and not on SkillArticle)
	// because users rate the skill itself, not the language-specific
	// translation. The Plaza list reads these directly without joining.
	// Each counter is recomputed from its source table on every write.
	RatingAverage    float64 `json:"rating_average" gorm:"default:0"`
	RatingCount      int     `json:"rating_count" gorm:"default:0"`
	FavoriteCount    int     `json:"favorite_count" gorm:"default:0"`
	CommentCount     int     `json:"comment_count" gorm:"default:0"`
	// Multi-dim aggregates (PRD §6.2) — populated alongside RatingAverage
	// so the detail-page radar chart doesn't need to scan all ratings.
	RatingUsability    float64 `json:"rating_usability" gorm:"default:0"`
	RatingPracticality float64 `json:"rating_practicality" gorm:"default:0"`
	RatingClarity      float64 `json:"rating_clarity" gorm:"default:0"`
	RatingStability    float64 `json:"rating_stability" gorm:"default:0"`
	RatingInnovation   float64 `json:"rating_innovation" gorm:"default:0"`

	CreatedAt int64 `json:"created_at" gorm:"bigint;index"`
	UpdatedAt int64 `json:"updated_at" gorm:"bigint"`
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
		// LOWER() on both sides to stay case-insensitive across MySQL (default
		// collation is case-insensitive), SQLite (LIKE is ASCII case-insensitive
		// by default) and PostgreSQL (LIKE is case-sensitive — without LOWER()
		// the search would silently miss matches on PG).
		like := "%" + strings.ToLower(f.Search) + "%"
		q = q.Where("LOWER(name) LIKE ? OR LOWER(slug) LIKE ?", like, like)
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
		q = q.Where("LOWER(tags) LIKE ?", "%"+strings.ToLower(f.Tag)+"%")
	}
	if f.Search != "" {
		// LOWER() so PostgreSQL stays case-insensitive like the other two DBs.
		like := "%" + strings.ToLower(f.Search) + "%"
		q = q.Where("LOWER(name) LIKE ?", like)
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
	TokenInput     int    `json:"token_input"`
	TokenOutput    int    `json:"token_output"`
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

// =====================================================================
// SkillRating — one row per (user × skill). Five dimensions per PRD §6.2.
// Overall is computed as the mean of the five dims, persisted so the
// "sort by rating" path doesn't recompute. Comment is optional written
// feedback that pairs with the rating — kept on the same row so the
// "users who gave 5 stars said X" view stays cheap.
// =====================================================================
type SkillRating struct {
	Id      int `json:"id" gorm:"primaryKey"`
	SkillId int `json:"skill_id" gorm:"not null;uniqueIndex:idx_skill_rating_user,priority:2;index"`
	UserId  int `json:"user_id" gorm:"not null;uniqueIndex:idx_skill_rating_user,priority:1"`

	// Five dims, each 1–5.
	Usability    int `json:"usability" gorm:"default:0"`
	Practicality int `json:"practicality" gorm:"default:0"`
	Clarity      int `json:"clarity" gorm:"default:0"`
	Stability    int `json:"stability" gorm:"default:0"`
	Innovation   int `json:"innovation" gorm:"default:0"`

	// Overall = mean of the five dims, on a 1.00–5.00 scale. Stored so the
	// "sort by rating" / Plaza list can read it without aggregation.
	Overall float64 `json:"overall" gorm:"default:0"`

	VerifiedUsed bool   `json:"verified_used" gorm:"default:false"`
	Comment      string `json:"comment" gorm:"type:text"` // optional written review

	CreatedAt int64 `json:"created_at" gorm:"bigint;index"`
	UpdatedAt int64 `json:"updated_at" gorm:"bigint"`
}

func (SkillRating) TableName() string { return "skill_ratings" }

func (r *SkillRating) BeforeCreate(tx *gorm.DB) error {
	now := time.Now().Unix()
	r.CreatedAt = now
	r.UpdatedAt = now
	r.Overall = meanRating(r)
	return nil
}

func (r *SkillRating) BeforeUpdate(tx *gorm.DB) error {
	r.UpdatedAt = time.Now().Unix()
	r.Overall = meanRating(r)
	return nil
}

func meanRating(r *SkillRating) float64 {
	sum := r.Usability + r.Practicality + r.Clarity + r.Stability + r.Innovation
	dims := 0
	for _, v := range []int{r.Usability, r.Practicality, r.Clarity, r.Stability, r.Innovation} {
		if v > 0 {
			dims++
		}
	}
	if dims == 0 {
		return 0
	}
	return float64(sum) / float64(dims)
}

// UpsertSkillRating creates or updates the (skill_id, user_id) row and
// recomputes the parent Skill's aggregates in the same transaction so
// the Plaza list shows fresh numbers.
func UpsertSkillRating(r *SkillRating) error {
	if r.SkillId == 0 || r.UserId == 0 {
		return errors.New("skill_id and user_id are required")
	}
	return DB.Transaction(func(tx *gorm.DB) error {
		var existing SkillRating
		err := tx.Where("skill_id = ? AND user_id = ?", r.SkillId, r.UserId).First(&existing).Error
		if err == nil {
			r.Id = existing.Id
			r.CreatedAt = existing.CreatedAt
			if err := tx.Save(r).Error; err != nil {
				return err
			}
		} else if errors.Is(err, gorm.ErrRecordNotFound) {
			if err := tx.Create(r).Error; err != nil {
				return err
			}
		} else {
			return err
		}
		return recomputeSkillRatingAggregates(tx, r.SkillId)
	})
}

// GetUserRating returns the caller's existing rating for the skill (so
// the UI can pre-fill the form), or nil if they haven't rated yet.
// gorm.ErrRecordNotFound is treated as "no rating" (returns nil, nil).
func GetUserRating(skillId, userId int) (*SkillRating, error) {
	var r SkillRating
	err := DB.Where("skill_id = ? AND user_id = ?", skillId, userId).First(&r).Error
	if err == nil {
		return &r, nil
	}
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return nil, err
}

// recomputeSkillRatingAggregates rolls up the SkillRating rows for the
// given skill and writes the aggregates back to the parent Skill row.
// Called inside the rating upsert transaction.
func recomputeSkillRatingAggregates(tx *gorm.DB, skillId int) error {
	type agg struct {
		Count      int64
		Overall    float64
		Usability  float64
		Practical  float64
		Clarity    float64
		Stability  float64
		Innovation float64
	}
	var a agg
	// AVG returns NULL when count is 0 on PG and 0 on MySQL/SQLite — use
	// COALESCE to normalize. Column "overall" is reserved in some DBs as
	// a keyword? Actually it's not; safe to use unquoted on all three.
	row := tx.Model(&SkillRating{}).
		Select("COUNT(*) AS count, "+
			"COALESCE(AVG(overall), 0) AS overall, "+
			"COALESCE(AVG(usability), 0) AS usability, "+
			"COALESCE(AVG(practicality), 0) AS practical, "+
			"COALESCE(AVG(clarity), 0) AS clarity, "+
			"COALESCE(AVG(stability), 0) AS stability, "+
			"COALESCE(AVG(innovation), 0) AS innovation").
		Where("skill_id = ?", skillId).
		Row()
	if err := row.Scan(&a.Count, &a.Overall, &a.Usability, &a.Practical, &a.Clarity, &a.Stability, &a.Innovation); err != nil {
		return err
	}
	return tx.Model(&Skill{}).Where("id = ?", skillId).Updates(map[string]any{
		"rating_count":        int(a.Count),
		"rating_average":      a.Overall,
		"rating_usability":    a.Usability,
		"rating_practicality": a.Practical,
		"rating_clarity":      a.Clarity,
		"rating_stability":    a.Stability,
		"rating_innovation":   a.Innovation,
		"updated_at":          time.Now().Unix(),
	}).Error
}

// =====================================================================
// SkillFavorite — pure relation table. Phase-2 toggle endpoint creates
// the row on first call and deletes it on second; the parent Skill's
// favorite_count is recomputed each time.
// =====================================================================
type SkillFavorite struct {
	Id        int   `json:"id" gorm:"primaryKey"`
	SkillId   int   `json:"skill_id" gorm:"not null;uniqueIndex:idx_skill_fav_user,priority:2;index"`
	UserId    int   `json:"user_id" gorm:"not null;uniqueIndex:idx_skill_fav_user,priority:1"`
	CreatedAt int64 `json:"created_at" gorm:"bigint;index"`
}

func (SkillFavorite) TableName() string { return "skill_favorites" }

func (f *SkillFavorite) BeforeCreate(tx *gorm.DB) error {
	f.CreatedAt = time.Now().Unix()
	return nil
}

// ToggleSkillFavorite flips the favorite state for (skill_id, user_id).
// Returns the new state (true = now favorited). Refreshes the parent
// Skill's favorite_count in the same transaction.
func ToggleSkillFavorite(skillId, userId int) (bool, error) {
	if skillId == 0 || userId == 0 {
		return false, errors.New("skill_id and user_id are required")
	}
	var now bool
	err := DB.Transaction(func(tx *gorm.DB) error {
		var existing SkillFavorite
		err := tx.Where("skill_id = ? AND user_id = ?", skillId, userId).First(&existing).Error
		if err == nil {
			if err := tx.Delete(&existing).Error; err != nil {
				return err
			}
			now = false
		} else if errors.Is(err, gorm.ErrRecordNotFound) {
			fav := SkillFavorite{SkillId: skillId, UserId: userId}
			if err := tx.Create(&fav).Error; err != nil {
				return err
			}
			now = true
		} else {
			return err
		}
		// Refresh the aggregate. Cheap because COUNT is indexed.
		var count int64
		if err := tx.Model(&SkillFavorite{}).Where("skill_id = ?", skillId).Count(&count).Error; err != nil {
			return err
		}
		return tx.Model(&Skill{}).Where("id = ?", skillId).Updates(map[string]any{
			"favorite_count": int(count),
			"updated_at":     time.Now().Unix(),
		}).Error
	})
	return now, err
}

// IsFavorited returns whether the caller has favorited the skill. Used
// by the detail page to show the bookmark filled-in.
func IsFavorited(skillId, userId int) (bool, error) {
	if userId == 0 {
		return false, nil
	}
	var count int64
	err := DB.Model(&SkillFavorite{}).Where("skill_id = ? AND user_id = ?", skillId, userId).Count(&count).Error
	return count > 0, err
}

// ListUserFavoriteSkillIds returns the skill ids the caller has favorited,
// most-recent first. Used by /skills/me.
func ListUserFavoriteSkillIds(userId int, limit int) ([]int, error) {
	if limit <= 0 || limit > 200 {
		limit = 60
	}
	var favs []SkillFavorite
	err := DB.Where("user_id = ?", userId).Order("created_at desc").Limit(limit).Find(&favs).Error
	if err != nil {
		return nil, err
	}
	ids := make([]int, 0, len(favs))
	for _, f := range favs {
		ids = append(ids, f.SkillId)
	}
	return ids, nil
}

// GetSkillsByIDs returns Skill rows in the given id order. Used to hydrate
// the favorite list while preserving "most recently favorited" order.
func GetSkillsByIDs(ids []int) ([]Skill, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	var rows []Skill
	if err := DB.Where("id IN ?", ids).Find(&rows).Error; err != nil {
		return nil, err
	}
	// Preserve caller-supplied order.
	byID := make(map[int]Skill, len(rows))
	for _, r := range rows {
		byID[r.Id] = r
	}
	out := make([]Skill, 0, len(rows))
	for _, id := range ids {
		if r, ok := byID[id]; ok {
			out = append(out, r)
		}
	}
	return out, nil
}

// =====================================================================
// SkillComment — one row per comment. ParentId supports one level of
// reply nesting (matching the design: comment → reply, no infinite
// thread). Status defaults to "visible"; admin moderation can flip it
// to "hidden" without deleting the row.
// =====================================================================
type SkillComment struct {
	Id       int    `json:"id" gorm:"primaryKey"`
	SkillId  int    `json:"skill_id" gorm:"not null;index"`
	UserId   int    `json:"user_id" gorm:"not null;index"`
	ParentId int    `json:"parent_id" gorm:"index;default:0"` // 0 = top-level
	Content  string `json:"content" gorm:"type:text;not null"`
	LikeCount int   `json:"like_count" gorm:"default:0"`
	Status   string `json:"status" gorm:"type:varchar(20);not null;default:'visible';index"`

	CreatedAt int64 `json:"created_at" gorm:"bigint;index"`
	UpdatedAt int64 `json:"updated_at" gorm:"bigint"`

	// Hydrated by ListComments — not persisted.
	UserName   string `json:"user_name" gorm:"-"`
	UserAvatar string `json:"user_avatar" gorm:"-"`
	LikedByMe  bool   `json:"liked_by_me" gorm:"-"`
}

const (
	SkillCommentStatusVisible = "visible"
	SkillCommentStatusHidden  = "hidden"
)

func (SkillComment) TableName() string { return "skill_comments" }

func (c *SkillComment) BeforeCreate(tx *gorm.DB) error {
	now := time.Now().Unix()
	c.CreatedAt = now
	c.UpdatedAt = now
	if c.Status == "" {
		c.Status = SkillCommentStatusVisible
	}
	return nil
}

func (c *SkillComment) BeforeUpdate(tx *gorm.DB) error {
	c.UpdatedAt = time.Now().Unix()
	return nil
}

// CreateSkillComment writes the row and refreshes the parent Skill's
// comment_count in the same transaction. When ParentId is set, validates
// that the parent belongs to the same skill and is itself a top-level
// comment — we only allow one level of nesting, matching the design.
func CreateSkillComment(c *SkillComment) error {
	if c.SkillId == 0 || c.UserId == 0 {
		return errors.New("skill_id and user_id are required")
	}
	if strings.TrimSpace(c.Content) == "" {
		return errors.New("content is required")
	}
	if c.ParentId != 0 {
		var parent SkillComment
		if err := DB.First(&parent, c.ParentId).Error; err != nil {
			return errors.New("parent comment not found")
		}
		if parent.SkillId != c.SkillId {
			return errors.New("parent comment belongs to a different skill")
		}
		if parent.ParentId != 0 {
			// Replies can only point at top-level comments; reject deeper
			// nesting by collapsing — re-target at the top-level ancestor.
			c.ParentId = parent.ParentId
		}
	}
	return DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(c).Error; err != nil {
			return err
		}
		return refreshCommentCount(tx, c.SkillId)
	})
}

// ListSkillComments returns top-level comments (newest first) with their
// nested replies inlined. User name / avatar are hydrated via a single
// extra query to avoid N+1.
func ListSkillComments(skillId int, limit int) ([]SkillComment, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	var all []SkillComment
	if err := DB.Where("skill_id = ? AND status = ?", skillId, SkillCommentStatusVisible).
		Order("created_at desc").Limit(limit).Find(&all).Error; err != nil {
		return nil, err
	}
	if len(all) == 0 {
		return all, nil
	}
	// Hydrate display name in one extra query.
	userIds := make([]int, 0, len(all))
	seen := map[int]bool{}
	for _, c := range all {
		if !seen[c.UserId] {
			seen[c.UserId] = true
			userIds = append(userIds, c.UserId)
		}
	}
	var users []struct {
		Id          int
		Username    string
		DisplayName string
	}
	if err := DB.Table("users").Select("id, username, display_name").
		Where("id IN ?", userIds).Find(&users).Error; err != nil {
		return nil, err
	}
	nameByID := make(map[int]string, len(users))
	for _, u := range users {
		name := u.DisplayName
		if name == "" {
			name = u.Username
		}
		nameByID[u.Id] = name
	}
	for i := range all {
		all[i].UserName = nameByID[all[i].UserId]
		if all[i].UserName != "" {
			r := []rune(all[i].UserName)
			all[i].UserAvatar = string(r[:1])
		} else {
			all[i].UserAvatar = "?"
		}
	}
	return all, nil
}

// DeleteSkillComment removes a comment if the caller owns it (or is admin).
// Recomputes comment_count.
func DeleteSkillComment(commentId, userId int, isAdmin bool) error {
	var c SkillComment
	if err := DB.First(&c, commentId).Error; err != nil {
		return err
	}
	if !isAdmin && c.UserId != userId {
		return errors.New("forbidden")
	}
	return DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Delete(&c).Error; err != nil {
			return err
		}
		return refreshCommentCount(tx, c.SkillId)
	})
}

func refreshCommentCount(tx *gorm.DB, skillId int) error {
	var count int64
	if err := tx.Model(&SkillComment{}).
		Where("skill_id = ? AND status = ?", skillId, SkillCommentStatusVisible).
		Count(&count).Error; err != nil {
		return err
	}
	return tx.Model(&Skill{}).Where("id = ?", skillId).Updates(map[string]any{
		"comment_count": int(count),
		"updated_at":    time.Now().Unix(),
	}).Error
}

// =====================================================================
// SkillCommentLike — one row per (user, comment). Lookups stay cheap
// because the LikeCount denormalized on SkillComment is what UI reads;
// this table is just the source of truth + idempotency guard for the
// toggle endpoint.
// =====================================================================
type SkillCommentLike struct {
	Id        int   `json:"id" gorm:"primaryKey"`
	CommentId int   `json:"comment_id" gorm:"not null;index;uniqueIndex:idx_comment_user"`
	UserId    int   `json:"user_id" gorm:"not null;index;uniqueIndex:idx_comment_user"`
	CreatedAt int64 `json:"created_at" gorm:"bigint;index"`
}

func (SkillCommentLike) TableName() string { return "skill_comment_likes" }

func (l *SkillCommentLike) BeforeCreate(tx *gorm.DB) error {
	l.CreatedAt = time.Now().Unix()
	return nil
}

// ToggleSkillCommentLike flips the like state for (userId, commentId).
// Returns the new state and the resulting like_count snapshot. Wrapped
// in a transaction so the SkillComment.LikeCount stays consistent with
// the underlying rows.
func ToggleSkillCommentLike(userId, commentId int) (liked bool, count int, err error) {
	err = DB.Transaction(func(tx *gorm.DB) error {
		// Ensure the comment exists and isn't hidden.
		var c SkillComment
		if e := tx.First(&c, commentId).Error; e != nil {
			return e
		}
		if c.Status == SkillCommentStatusHidden {
			return errors.New("comment is hidden")
		}

		var existing SkillCommentLike
		findErr := tx.Where("comment_id = ? AND user_id = ?", commentId, userId).
			First(&existing).Error
		switch {
		case findErr == nil:
			if e := tx.Delete(&existing).Error; e != nil {
				return e
			}
			liked = false
		case errors.Is(findErr, gorm.ErrRecordNotFound):
			row := SkillCommentLike{CommentId: commentId, UserId: userId}
			if e := tx.Create(&row).Error; e != nil {
				return e
			}
			liked = true
		default:
			return findErr
		}

		var c64 int64
		if e := tx.Model(&SkillCommentLike{}).
			Where("comment_id = ?", commentId).Count(&c64).Error; e != nil {
			return e
		}
		count = int(c64)
		return tx.Model(&SkillComment{}).Where("id = ?", commentId).
			Updates(map[string]any{
				"like_count": count,
				"updated_at": time.Now().Unix(),
			}).Error
	})
	return
}

// ListCommentLikesByUser returns the set of comment IDs (from the given
// list) that userId has liked. Used to hydrate the "I liked this" pill
// on the comment thread without N+1 lookups.
func ListCommentLikesByUser(userId int, commentIds []int) (map[int]bool, error) {
	out := make(map[int]bool, len(commentIds))
	if userId <= 0 || len(commentIds) == 0 {
		return out, nil
	}
	var rows []SkillCommentLike
	if err := DB.Where("user_id = ? AND comment_id IN ?", userId, commentIds).
		Find(&rows).Error; err != nil {
		return nil, err
	}
	for _, r := range rows {
		out[r.CommentId] = true
	}
	return out, nil
}

// ListUserRatings returns the ratings the caller has left, joined with
// the parent Skill so /skills/me can render skill name + slug without
// a follow-up call.
type UserRatingItem struct {
	Rating SkillRating `json:"rating"`
	Skill  Skill       `json:"skill"`
}

func ListUserRatings(userId int, limit int) ([]UserRatingItem, error) {
	if limit <= 0 || limit > 200 {
		limit = 60
	}
	var ratings []SkillRating
	if err := DB.Where("user_id = ?", userId).Order("updated_at desc").Limit(limit).
		Find(&ratings).Error; err != nil {
		return nil, err
	}
	if len(ratings) == 0 {
		return nil, nil
	}
	ids := make([]int, 0, len(ratings))
	for _, r := range ratings {
		ids = append(ids, r.SkillId)
	}
	skills, err := GetSkillsByIDs(ids)
	if err != nil {
		return nil, err
	}
	byID := make(map[int]Skill, len(skills))
	for _, s := range skills {
		byID[s.Id] = s
	}
	out := make([]UserRatingItem, 0, len(ratings))
	for _, r := range ratings {
		out = append(out, UserRatingItem{Rating: r, Skill: byID[r.SkillId]})
	}
	return out, nil
}

// ListUserComments returns the comments the caller has left, with their
// parent Skill hydrated. Same shape as ListUserRatings for /skills/me.
type UserCommentItem struct {
	Comment SkillComment `json:"comment"`
	Skill   Skill        `json:"skill"`
}

// =====================================================================
// SkillReport — user-filed reports against comments / skills / showcases.
// Phase 3-3 of the SKILLS 广场 roadmap.
//
// One row per (reporter, target_type, target_id). Re-reporting the same
// target as the same user just updates the reason and bumps created_at;
// this keeps the queue clean without losing context. Resolution flow:
//   open → resolved | dismissed
// `resolved_by` / `resolved_at` are populated by the admin handler.
//
// Cross-DB safe: GORM-only, no DB-specific types or operators.
// =====================================================================

const (
	SkillReportTargetComment  = "comment"
	SkillReportTargetSkill    = "skill"
	SkillReportTargetShowcase = "showcase"
)

const (
	SkillReportStatusOpen      = "open"
	SkillReportStatusResolved  = "resolved"
	SkillReportStatusDismissed = "dismissed"
)

type SkillReport struct {
	Id         int    `json:"id" gorm:"primaryKey"`
	ReporterId int    `json:"reporter_id" gorm:"not null;index;uniqueIndex:idx_report_unique"`
	TargetType string `json:"target_type" gorm:"size:32;not null;index;uniqueIndex:idx_report_unique"`
	TargetId   int    `json:"target_id" gorm:"not null;index;uniqueIndex:idx_report_unique"`
	Reason     string `json:"reason" gorm:"type:text"`
	Status     string `json:"status" gorm:"size:16;not null;default:'open';index"`
	CreatedAt  int64  `json:"created_at" gorm:"bigint;index"`
	ResolvedAt int64  `json:"resolved_at" gorm:"bigint"`
	ResolvedBy int    `json:"resolved_by"`
}

func (SkillReport) TableName() string { return "skill_reports" }

func (r *SkillReport) BeforeCreate(tx *gorm.DB) error {
	if r.CreatedAt == 0 {
		r.CreatedAt = time.Now().Unix()
	}
	if r.Status == "" {
		r.Status = SkillReportStatusOpen
	}
	return nil
}

// IsValidReportTarget returns whether the given target_type string is one
// of the three supported targets. Callers should use this before inserting
// so the queue doesn't fill up with junk types.
func IsValidReportTarget(t string) bool {
	switch t {
	case SkillReportTargetComment, SkillReportTargetSkill, SkillReportTargetShowcase:
		return true
	}
	return false
}

// CreateOrUpdateSkillReport upserts a report so a single user can't spam
// the queue with the same target. Returns the resulting row.
//
// Behavior:
//   - if (reporter, target_type, target_id) already exists and is OPEN,
//     update the reason + bump created_at so the queue surfaces the most
//     recent complaint.
//   - if it exists but is RESOLVED/DISMISSED, re-open it with the new
//     reason — repeat complaints after a dismissal are signal worth
//     surfacing again.
//   - otherwise create a fresh row.
func CreateOrUpdateSkillReport(reporterId int, targetType string, targetId int, reason string) (*SkillReport, error) {
	if reporterId <= 0 {
		return nil, errors.New("reporter required")
	}
	if !IsValidReportTarget(targetType) || targetId <= 0 {
		return nil, errors.New("invalid target")
	}
	reason = strings.TrimSpace(reason)
	if len(reason) > 1000 {
		reason = reason[:1000]
	}

	var existing SkillReport
	err := DB.Where("reporter_id = ? AND target_type = ? AND target_id = ?",
		reporterId, targetType, targetId).First(&existing).Error
	if err == nil {
		existing.Reason = reason
		existing.Status = SkillReportStatusOpen
		existing.CreatedAt = time.Now().Unix()
		existing.ResolvedAt = 0
		existing.ResolvedBy = 0
		if err := DB.Save(&existing).Error; err != nil {
			return nil, err
		}
		return &existing, nil
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	row := &SkillReport{
		ReporterId: reporterId,
		TargetType: targetType,
		TargetId:   targetId,
		Reason:     reason,
		Status:     SkillReportStatusOpen,
	}
	if err := DB.Create(row).Error; err != nil {
		return nil, err
	}
	return row, nil
}

// ListSkillReports lists reports filtered by status. status="" returns
// every status. Newest first. Limit clamped to [1, 200].
func ListSkillReports(status string, limit int) ([]SkillReport, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	q := DB.Model(&SkillReport{})
	if status != "" {
		q = q.Where("status = ?", status)
	}
	var rows []SkillReport
	if err := q.Order("created_at desc").Limit(limit).Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

// ResolveSkillReport flips a report to resolved/dismissed and stamps it
// with the admin who closed it. Pass status=open to re-open (rare).
func ResolveSkillReport(reportId, adminId int, status string) error {
	switch status {
	case SkillReportStatusResolved, SkillReportStatusDismissed:
	case SkillReportStatusOpen:
	default:
		return errors.New("invalid status")
	}
	updates := map[string]any{
		"status": status,
	}
	if status == SkillReportStatusOpen {
		updates["resolved_at"] = 0
		updates["resolved_by"] = 0
	} else {
		updates["resolved_at"] = time.Now().Unix()
		updates["resolved_by"] = adminId
	}
	return DB.Model(&SkillReport{}).Where("id = ?", reportId).Updates(updates).Error
}

// CountOpenReports returns how many reports are currently OPEN — used as
// a badge in the admin sidebar.
func CountOpenReports() (int64, error) {
	var n int64
	err := DB.Model(&SkillReport{}).Where("status = ?", SkillReportStatusOpen).Count(&n).Error
	return n, err
}

// =====================================================================
// SkillAuditLog — admin action timeline. Best-effort logging: write
// failures are swallowed (logged at sys-error level) so they never
// block the underlying operation. Reads power the admin audit page.
// =====================================================================

const (
	SkillAuditActionPublish            = "article.publish"
	SkillAuditActionUnpublish          = "article.unpublish"
	SkillAuditActionSkillUpdate        = "skill.update"
	SkillAuditActionSkillDelete        = "skill.delete"
	SkillAuditActionImport             = "skill.import"
	SkillAuditActionReportResolve      = "report.resolve"
	SkillAuditActionSettings           = "settings.update"
	SkillAuditActionUserArticleApprove = "user_article.approve"
	SkillAuditActionUserArticleReject  = "user_article.reject"
	SkillAuditActionUserArticleOffline = "user_article.offline"
)

type SkillAuditLog struct {
	Id         int    `json:"id" gorm:"primaryKey"`
	AdminId    int    `json:"admin_id" gorm:"not null;index"`
	Action     string `json:"action" gorm:"size:64;not null;index"`
	TargetType string `json:"target_type" gorm:"size:32;index"`
	TargetId   int    `json:"target_id" gorm:"index"`
	Summary    string `json:"summary" gorm:"type:text"`
	Meta       string `json:"meta" gorm:"type:text"` // JSON blob, optional
	CreatedAt  int64  `json:"created_at" gorm:"bigint;index"`

	// Hydrated by ListSkillAuditLogs from users table for display.
	AdminName string `json:"admin_name" gorm:"-"`
}

func (SkillAuditLog) TableName() string { return "skill_audit_logs" }

func (l *SkillAuditLog) BeforeCreate(tx *gorm.DB) error {
	if l.CreatedAt == 0 {
		l.CreatedAt = time.Now().Unix()
	}
	return nil
}

// WriteSkillAuditLog records one admin action. adminId=0 falls back to
// the system actor so seed/cron writes still leave a trace. Returns
// the row id, but callers should NOT block on the error — call sites
// log to sys-error and continue.
func WriteSkillAuditLog(adminId int, action, targetType string, targetId int, summary, meta string) error {
	row := &SkillAuditLog{
		AdminId:    adminId,
		Action:     action,
		TargetType: targetType,
		TargetId:   targetId,
		Summary:    summary,
		Meta:       meta,
	}
	return DB.Create(row).Error
}

// ListSkillAuditLogs returns the newest `limit` rows, optionally
// filtered by action and/or target_type. Hydrates admin display name
// via one extra users-table query (avoids N+1).
func ListSkillAuditLogs(action, targetType string, limit int) ([]SkillAuditLog, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	q := DB.Model(&SkillAuditLog{})
	if action != "" {
		q = q.Where("action = ?", action)
	}
	if targetType != "" {
		q = q.Where("target_type = ?", targetType)
	}
	var rows []SkillAuditLog
	if err := q.Order("created_at desc").Limit(limit).Find(&rows).Error; err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return rows, nil
	}
	// Hydrate admin name.
	idSet := map[int]bool{}
	ids := make([]int, 0, len(rows))
	for _, r := range rows {
		if r.AdminId > 0 && !idSet[r.AdminId] {
			idSet[r.AdminId] = true
			ids = append(ids, r.AdminId)
		}
	}
	if len(ids) > 0 {
		var users []struct {
			Id          int
			Username    string
			DisplayName string
		}
		if err := DB.Table("users").Select("id, username, display_name").
			Where("id IN ?", ids).Find(&users).Error; err != nil {
			return nil, err
		}
		nameByID := make(map[int]string, len(users))
		for _, u := range users {
			name := u.DisplayName
			if name == "" {
				name = u.Username
			}
			nameByID[u.Id] = name
		}
		for i := range rows {
			rows[i].AdminName = nameByID[rows[i].AdminId]
		}
	}
	return rows, nil
}

func ListUserComments(userId int, limit int) ([]UserCommentItem, error) {
	if limit <= 0 || limit > 200 {
		limit = 60
	}
	var comments []SkillComment
	if err := DB.Where("user_id = ? AND status = ?", userId, SkillCommentStatusVisible).
		Order("created_at desc").Limit(limit).Find(&comments).Error; err != nil {
		return nil, err
	}
	if len(comments) == 0 {
		return nil, nil
	}
	idSet := map[int]bool{}
	ids := make([]int, 0, len(comments))
	for _, c := range comments {
		if !idSet[c.SkillId] {
			idSet[c.SkillId] = true
			ids = append(ids, c.SkillId)
		}
	}
	skills, err := GetSkillsByIDs(ids)
	if err != nil {
		return nil, err
	}
	byID := make(map[int]Skill, len(skills))
	for _, s := range skills {
		byID[s.Id] = s
	}
	out := make([]UserCommentItem, 0, len(comments))
	for _, c := range comments {
		out = append(out, UserCommentItem{Comment: c, Skill: byID[c.SkillId]})
	}
	return out, nil
}

// =====================================================================
// SkillUserArticle — V1.1 user-submitted content (tutorials, reviews,
// showcases, etc.). Distinct from SkillArticle (which is AI-generated
// from an imported GitHub repo and tied to a specific Skill). User
// articles may optionally reference a Skill (review / troubleshooting)
// but are not required to.
//
// Lifecycle: draft → pending → approved (public) | rejected (back to author)
// Admin can also flip approved → offline.
// =====================================================================
type SkillUserArticle struct {
	Id         int    `json:"id" gorm:"primaryKey"`
	AuthorId   int    `json:"author_id" gorm:"not null;index"`
	Type       string `json:"type" gorm:"type:varchar(24);not null;index;default:'tutorial'"`
	Slug       string `json:"slug" gorm:"type:varchar(200);uniqueIndex"`
	Language   string `json:"language" gorm:"type:varchar(8);not null;default:'zh-CN';index"`
	Title      string `json:"title" gorm:"type:varchar(240);not null"`
	Summary    string `json:"summary" gorm:"type:text"`
	Content    string `json:"content" gorm:"type:text"` // Markdown body
	CoverImage string `json:"cover_image" gorm:"type:varchar(512)"`
	TagsCSV    string `json:"-" gorm:"column:tags;type:text"`
	SkillId    int    `json:"skill_id" gorm:"index;default:0"` // optional FK

	Status string `json:"status" gorm:"type:varchar(20);not null;default:'draft';index"`

	// Admin review trail.
	ReviewedBy   int    `json:"reviewed_by" gorm:"index;default:0"`
	ReviewedAt   int64  `json:"reviewed_at" gorm:"bigint"`
	RejectReason string `json:"reject_reason" gorm:"type:text"`

	// Engagement counters — reserve columns even though V1.1 read path
	// is limited; V1.2 surface metrics for the user profile page.
	ViewCount int64 `json:"view_count" gorm:"bigint;default:0"`
	LikeCount int   `json:"like_count" gorm:"default:0"`

	PublishedAt int64 `json:"published_at" gorm:"bigint;index"`
	CreatedAt   int64 `json:"created_at" gorm:"bigint;index"`
	UpdatedAt   int64 `json:"updated_at" gorm:"bigint"`

	// Hydrated by List queries — no DB column.
	AuthorName string `json:"author_name" gorm:"-"`
	SkillName  string `json:"skill_name" gorm:"-"`
	SkillSlug  string `json:"skill_slug" gorm:"-"`
}

func (SkillUserArticle) TableName() string { return "skill_user_articles" }

// MarshalJSON exposes the comma-split tags slice as `tags` so clients can
// consume the list directly. The underlying TagsCSV column stays private
// (json:"-"). Using a type alias avoids triggering MarshalJSON recursion.
func (a SkillUserArticle) MarshalJSON() ([]byte, error) {
	type alias SkillUserArticle
	return common.Marshal(struct {
		alias
		Tags []string `json:"tags"`
	}{
		alias: alias(a),
		Tags:  a.Tags(),
	})
}

func (a *SkillUserArticle) BeforeCreate(tx *gorm.DB) error {
	now := time.Now().Unix()
	a.CreatedAt = now
	a.UpdatedAt = now
	return nil
}

func (a *SkillUserArticle) BeforeUpdate(tx *gorm.DB) error {
	a.UpdatedAt = time.Now().Unix()
	return nil
}

func (a *SkillUserArticle) Tags() []string {
	if a.TagsCSV == "" {
		return nil
	}
	raw := strings.Split(a.TagsCSV, ",")
	out := make([]string, 0, len(raw))
	for _, t := range raw {
		t = strings.TrimSpace(t)
		if t != "" {
			out = append(out, t)
		}
	}
	return out
}

func (a *SkillUserArticle) SetTags(tags []string) {
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
	a.TagsCSV = strings.Join(keep, ",")
}

func IsValidSkillUserArticleType(t string) bool {
	switch t {
	case SkillUserArticleTypeTutorial, SkillUserArticleTypeReview,
		SkillUserArticleTypeShowcase, SkillUserArticleTypeTroubleshooting,
		SkillUserArticleTypePrompts, SkillUserArticleTypeComparison:
		return true
	}
	return false
}

// userArticleSlugify produces a URL-safe slug from the title. Falls back
// to "post" if the title is empty/all-symbols. Caller is responsible
// for ensuring uniqueness via ensureUserArticleSlugUnique.
func userArticleSlugify(title string) string {
	title = strings.ToLower(strings.TrimSpace(title))
	var b strings.Builder
	prevDash := false
	for _, r := range title {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			b.WriteRune(r)
			prevDash = false
		case r >= 'A' && r <= 'Z':
			b.WriteRune(r + 32)
			prevDash = false
		case r >= 0x4E00 && r <= 0x9FFF: // CJK unified ideographs — preserve
			b.WriteRune(r)
			prevDash = false
		default:
			if !prevDash && b.Len() > 0 {
				b.WriteByte('-')
				prevDash = true
			}
		}
	}
	out := strings.Trim(b.String(), "-")
	if out == "" {
		out = "post"
	}
	if len(out) > 160 {
		out = out[:160]
	}
	return out
}

// ensureUserArticleSlugUnique appends -2, -3, ... until a free slug is
// found. Safe under concurrent inserts only because of the uniqueIndex
// on slug — on conflict the caller retries by reading the new error.
func ensureUserArticleSlugUnique(base string) string {
	slug := base
	for i := 2; i < 100; i++ {
		var cnt int64
		if err := DB.Model(&SkillUserArticle{}).Where("slug = ?", slug).Count(&cnt).Error; err != nil {
			return slug
		}
		if cnt == 0 {
			return slug
		}
		slug = base + "-" + intToStr(i)
	}
	return slug
}

func intToStr(n int) string {
	if n == 0 {
		return "0"
	}
	neg := n < 0
	if neg {
		n = -n
	}
	var buf [20]byte
	i := len(buf)
	for n > 0 {
		i--
		buf[i] = byte('0' + n%10)
		n /= 10
	}
	if neg {
		i--
		buf[i] = '-'
	}
	return string(buf[i:])
}

// CreateSkillUserArticle validates required fields and generates a slug
// if the caller didn't supply one. The created row starts in `draft`
// unless the caller pre-set Status.
func CreateSkillUserArticle(a *SkillUserArticle) error {
	if a.AuthorId == 0 {
		return errors.New("author_id is required")
	}
	if a.Title == "" {
		return errors.New("title is required")
	}
	if !IsValidSkillUserArticleType(a.Type) {
		a.Type = SkillUserArticleTypeTutorial
	}
	if a.Language == "" {
		a.Language = SkillArticleLangZh
	}
	if a.Status == "" {
		a.Status = SkillUserArticleStatusDraft
	}
	if a.Slug == "" {
		a.Slug = ensureUserArticleSlugUnique(userArticleSlugify(a.Title))
	}
	return DB.Create(a).Error
}

func GetSkillUserArticleByID(id int) (*SkillUserArticle, error) {
	var a SkillUserArticle
	if err := DB.First(&a, id).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

func GetSkillUserArticleBySlug(slug string) (*SkillUserArticle, error) {
	var a SkillUserArticle
	if err := DB.Where("slug = ?", slug).First(&a).Error; err != nil {
		return nil, err
	}
	return &a, nil
}

// UpdateSkillUserArticle applies a partial update. The status column is
// not editable through this path — use SubmitSkillUserArticle /
// ReviewSkillUserArticle / OfflineSkillUserArticle which enforce the
// state machine. Drops disallowed keys defensively.
func UpdateSkillUserArticle(id int, updates map[string]any) error {
	delete(updates, "id")
	delete(updates, "status")
	delete(updates, "reviewed_by")
	delete(updates, "reviewed_at")
	delete(updates, "reject_reason")
	delete(updates, "published_at")
	delete(updates, "created_at")
	delete(updates, "author_id")
	delete(updates, "view_count")
	delete(updates, "like_count")
	updates["updated_at"] = time.Now().Unix()
	return DB.Model(&SkillUserArticle{}).Where("id = ?", id).Updates(updates).Error
}

// DeleteSkillUserArticle hard-deletes the row. Author may delete their
// own draft/rejected/pending row; admin may delete anything. Returns
// gorm.ErrRecordNotFound if no row matches the ownership filter.
func DeleteSkillUserArticle(id, authorId int, isAdmin bool) error {
	q := DB.Where("id = ?", id)
	if !isAdmin {
		// Author can only delete their own non-approved articles.
		q = q.Where("author_id = ? AND status IN ?", authorId,
			[]string{SkillUserArticleStatusDraft,
				SkillUserArticleStatusPending,
				SkillUserArticleStatusRejected})
	}
	res := q.Delete(&SkillUserArticle{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

// SubmitSkillUserArticle moves draft / rejected → pending. Author only.
func SubmitSkillUserArticle(id, authorId int) error {
	res := DB.Model(&SkillUserArticle{}).
		Where("id = ? AND author_id = ? AND status IN ?", id, authorId,
			[]string{SkillUserArticleStatusDraft, SkillUserArticleStatusRejected}).
		Updates(map[string]any{
			"status":     SkillUserArticleStatusPending,
			"updated_at": time.Now().Unix(),
		})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("article not found or not in a submittable state")
	}
	return nil
}

// ReviewSkillUserArticle is the admin action: pending → approved or rejected.
// On approval, PublishedAt is stamped (first time only — re-approval
// of a previously offline article keeps the original PublishedAt).
func ReviewSkillUserArticle(id, adminId int, approve bool, reason string) error {
	target := SkillUserArticleStatusRejected
	if approve {
		target = SkillUserArticleStatusApproved
	}
	now := time.Now().Unix()
	// Look up current row to decide whether to stamp published_at.
	cur, err := GetSkillUserArticleByID(id)
	if err != nil {
		return err
	}
	if cur.Status != SkillUserArticleStatusPending {
		return errors.New("only pending articles can be reviewed")
	}
	updates := map[string]any{
		"status":        target,
		"reviewed_by":   adminId,
		"reviewed_at":   now,
		"reject_reason": reason,
		"updated_at":    now,
	}
	if approve && cur.PublishedAt == 0 {
		updates["published_at"] = now
	}
	return DB.Model(&SkillUserArticle{}).Where("id = ?", id).Updates(updates).Error
}

// OfflineSkillUserArticle takes an approved article off the public
// surface (status -> offline). Admin only. The article remains in the
// DB and visible to the author in their dashboard.
func OfflineSkillUserArticle(id, adminId int, reason string) error {
	now := time.Now().Unix()
	res := DB.Model(&SkillUserArticle{}).
		Where("id = ? AND status = ?", id, SkillUserArticleStatusApproved).
		Updates(map[string]any{
			"status":        SkillUserArticleStatusOffline,
			"reviewed_by":   adminId,
			"reviewed_at":   now,
			"reject_reason": reason,
			"updated_at":    now,
		})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("article not found or not currently approved")
	}
	return nil
}

// ListUserArticlesByAuthor returns the author's own articles (any
// status). Newest first. Used by /skills/me article tab.
func ListUserArticlesByAuthor(authorId int, status string, limit int) ([]SkillUserArticle, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	q := DB.Where("author_id = ?", authorId)
	if status != "" {
		q = q.Where("status = ?", status)
	}
	var rows []SkillUserArticle
	if err := q.Order("created_at desc").Limit(limit).Find(&rows).Error; err != nil {
		return nil, err
	}
	hydrateUserArticleSkillNames(rows)
	return rows, nil
}

// ListUserArticlesPublicFilter — Plaza-facing list (status=approved).
type ListUserArticlesPublicFilter struct {
	Type     string
	Language string
	Tag      string
	SkillId  int
	AuthorId int
	Search   string
	Page     int
	PageSize int
	Limit    int // when >0, returns the first N rows without pagination math
}

func ListUserArticlesPublic(f ListUserArticlesPublicFilter) ([]SkillUserArticle, int64, error) {
	q := DB.Model(&SkillUserArticle{}).
		Where("status = ?", SkillUserArticleStatusApproved)
	if f.Type != "" {
		q = q.Where("type = ?", f.Type)
	}
	if f.Language != "" {
		q = q.Where("language = ?", f.Language)
	}
	if f.SkillId > 0 {
		q = q.Where("skill_id = ?", f.SkillId)
	}
	if f.AuthorId > 0 {
		q = q.Where("author_id = ?", f.AuthorId)
	}
	if f.Tag != "" {
		// Cross-DB safe: tags is a CSV TEXT column. Surround the haystack
		// with commas so a tag of "ai" doesn't match "ai-safety" mid-token.
		// MySQL uses `||` for logical OR, so CONCAT() is required there;
		// SQLite/PostgreSQL accept both but CONCAT works on modern SQLite
		// (3.44+) — branch to keep older SQLite happy.
		like := "%," + strings.ToLower(strings.TrimSpace(f.Tag)) + ",%"
		if common.UsingMySQL {
			q = q.Where("LOWER(CONCAT(',', tags, ',')) LIKE ?", like)
		} else {
			q = q.Where("LOWER(',' || tags || ',') LIKE ?", like)
		}
	}
	if f.Search != "" {
		like := "%" + strings.ToLower(f.Search) + "%"
		q = q.Where("LOWER(title) LIKE ? OR LOWER(summary) LIKE ?", like, like)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if f.Limit > 0 {
		// Bulk fetch mode — used by author profile etc.
		cap := f.Limit
		if cap > 200 {
			cap = 200
		}
		var rows []SkillUserArticle
		if err := q.Order("published_at desc").Limit(cap).Find(&rows).Error; err != nil {
			return nil, 0, err
		}
		hydrateUserArticleAuthorNames(rows)
		hydrateUserArticleSkillNames(rows)
		return rows, total, nil
	}
	if f.PageSize <= 0 || f.PageSize > 100 {
		f.PageSize = 24
	}
	if f.Page <= 0 {
		f.Page = 1
	}
	var rows []SkillUserArticle
	if err := q.Order("published_at desc").
		Offset((f.Page - 1) * f.PageSize).Limit(f.PageSize).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	hydrateUserArticleAuthorNames(rows)
	hydrateUserArticleSkillNames(rows)
	return rows, total, nil
}

// ListUserArticlesAdminFilter — admin moderation queue.
type ListUserArticlesAdminFilter struct {
	Status   string
	Type     string
	Search   string
	Page     int
	PageSize int
}

func ListUserArticlesAdmin(f ListUserArticlesAdminFilter) ([]SkillUserArticle, int64, error) {
	q := DB.Model(&SkillUserArticle{})
	if f.Status != "" {
		q = q.Where("status = ?", f.Status)
	}
	if f.Type != "" {
		q = q.Where("type = ?", f.Type)
	}
	if f.Search != "" {
		like := "%" + strings.ToLower(f.Search) + "%"
		q = q.Where("LOWER(title) LIKE ?", like)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if f.PageSize <= 0 || f.PageSize > 100 {
		f.PageSize = 30
	}
	if f.Page <= 0 {
		f.Page = 1
	}
	var rows []SkillUserArticle
	// Admin queue is most useful sorted by `updated_at desc` so the most
	// recently submitted item bubbles to the top of the pending list.
	if err := q.Order("updated_at desc").
		Offset((f.Page - 1) * f.PageSize).Limit(f.PageSize).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	hydrateUserArticleAuthorNames(rows)
	hydrateUserArticleSkillNames(rows)
	return rows, total, nil
}

// CountUserArticlesByStatus returns counts grouped by status. Used by
// the admin queue KPI strip.
func CountUserArticlesByStatus() (map[string]int64, error) {
	type row struct {
		Status string
		Cnt    int64
	}
	var rows []row
	if err := DB.Model(&SkillUserArticle{}).
		Select("status, COUNT(*) as cnt").
		Group("status").Find(&rows).Error; err != nil {
		return nil, err
	}
	out := make(map[string]int64, len(rows))
	for _, r := range rows {
		out[r.Status] = r.Cnt
	}
	return out, nil
}

// hydrateUserArticleAuthorNames runs one extra users-table query per
// page to fill AuthorName (display_name → username fallback).
func hydrateUserArticleAuthorNames(rows []SkillUserArticle) {
	if len(rows) == 0 {
		return
	}
	idSet := map[int]bool{}
	ids := make([]int, 0, len(rows))
	for _, r := range rows {
		if r.AuthorId > 0 && !idSet[r.AuthorId] {
			idSet[r.AuthorId] = true
			ids = append(ids, r.AuthorId)
		}
	}
	if len(ids) == 0 {
		return
	}
	var users []struct {
		Id          int
		Username    string
		DisplayName string
	}
	if err := DB.Table("users").Select("id, username, display_name").
		Where("id IN ?", ids).Find(&users).Error; err != nil {
		return
	}
	nameByID := make(map[int]string, len(users))
	for _, u := range users {
		name := u.DisplayName
		if name == "" {
			name = u.Username
		}
		nameByID[u.Id] = name
	}
	for i := range rows {
		rows[i].AuthorName = nameByID[rows[i].AuthorId]
	}
}

// ─────────────────────────────────────────────────────────────────────────
// P4-4 — Skill User Article version history.
//
// The editor pushes a snapshot every ~30s and after each manual save.
// We keep up to userArticleVersionLimit rows per article and prune older
// ones in-place — version history is for "oops, I just deleted three
// paragraphs", not for permanent archiving.
// ─────────────────────────────────────────────────────────────────────────

const userArticleVersionLimit = 50

type SkillUserArticleVersion struct {
	Id        int    `json:"id" gorm:"primaryKey"`
	ArticleId int    `json:"article_id" gorm:"not null;index"`
	AuthorId  int    `json:"author_id" gorm:"not null;index"`
	Title     string `json:"title" gorm:"type:varchar(240)"`
	Summary   string `json:"summary" gorm:"type:text"`
	Content   string `json:"content" gorm:"type:text"`
	TagsCSV   string `json:"-" gorm:"column:tags;type:text"`
	Type      string `json:"type" gorm:"type:varchar(24)"`
	Source    string `json:"source" gorm:"type:varchar(16);default:'auto'"` // auto | manual
	CreatedAt int64  `json:"created_at" gorm:"bigint;index"`
}

func (SkillUserArticleVersion) TableName() string { return "skill_user_article_versions" }

func (v *SkillUserArticleVersion) BeforeCreate(tx *gorm.DB) error {
	v.CreatedAt = time.Now().Unix()
	return nil
}

func (v *SkillUserArticleVersion) Tags() []string {
	if v.TagsCSV == "" {
		return nil
	}
	raw := strings.Split(v.TagsCSV, ",")
	out := make([]string, 0, len(raw))
	for _, t := range raw {
		t = strings.TrimSpace(t)
		if t != "" {
			out = append(out, t)
		}
	}
	return out
}

// CreateUserArticleSnapshot writes a version row capturing the article's
// current state. authorId must match the article owner; pass source =
// "auto" for 30s ticks, "manual" for explicit save points. Older
// snapshots beyond userArticleVersionLimit get pruned.
func CreateUserArticleSnapshot(articleId, authorId int, source string) (*SkillUserArticleVersion, error) {
	art, err := GetSkillUserArticleByID(articleId)
	if err != nil {
		return nil, err
	}
	if art.AuthorId != authorId {
		return nil, errors.New("forbidden")
	}
	if source != "manual" {
		source = "auto"
	}
	v := &SkillUserArticleVersion{
		ArticleId: art.Id,
		AuthorId:  art.AuthorId,
		Title:     art.Title,
		Summary:   art.Summary,
		Content:   art.Content,
		TagsCSV:   art.TagsCSV,
		Type:      art.Type,
		Source:    source,
	}
	if err := DB.Create(v).Error; err != nil {
		return nil, err
	}
	// Prune older versions beyond the cap. Best-effort — failure is not
	// fatal (the snapshot is already saved).
	_ = pruneUserArticleVersions(articleId)
	return v, nil
}

func pruneUserArticleVersions(articleId int) error {
	var ids []int
	if err := DB.Model(&SkillUserArticleVersion{}).
		Where("article_id = ?", articleId).
		Order("id DESC").
		Offset(userArticleVersionLimit).
		Limit(1000).
		Pluck("id", &ids).Error; err != nil {
		return err
	}
	if len(ids) == 0 {
		return nil
	}
	return DB.Where("id IN ?", ids).Delete(&SkillUserArticleVersion{}).Error
}

func ListUserArticleVersions(articleId, authorId int) ([]SkillUserArticleVersion, error) {
	art, err := GetSkillUserArticleByID(articleId)
	if err != nil {
		return nil, err
	}
	if art.AuthorId != authorId {
		return nil, errors.New("forbidden")
	}
	var rows []SkillUserArticleVersion
	if err := DB.Where("article_id = ?", articleId).
		Order("id DESC").
		Limit(userArticleVersionLimit).
		Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func GetUserArticleVersion(articleId, authorId, versionId int) (*SkillUserArticleVersion, error) {
	var v SkillUserArticleVersion
	if err := DB.Where("id = ? AND article_id = ?", versionId, articleId).
		First(&v).Error; err != nil {
		return nil, err
	}
	if v.AuthorId != authorId {
		return nil, errors.New("forbidden")
	}
	return &v, nil
}

// RestoreUserArticleVersion overwrites the article's title/summary/content/
// tags with the version's snapshot. Status / reviewed_* / published_at are
// preserved; restore is editing only.
func RestoreUserArticleVersion(articleId, authorId, versionId int) error {
	art, err := GetSkillUserArticleByID(articleId)
	if err != nil {
		return err
	}
	if art.AuthorId != authorId {
		return errors.New("forbidden")
	}
	if art.Status != SkillUserArticleStatusDraft && art.Status != SkillUserArticleStatusRejected {
		return errors.New("only draft or rejected articles can be restored")
	}
	v, err := GetUserArticleVersion(articleId, authorId, versionId)
	if err != nil {
		return err
	}
	return DB.Model(&SkillUserArticle{}).Where("id = ?", articleId).Updates(map[string]any{
		"title":   v.Title,
		"summary": v.Summary,
		"content": v.Content,
		"tags":    v.TagsCSV,
	}).Error
}

// ─────────────────────────────────────────────────────────────────────────
// P4-6 — Public author profile.
//
// Aggregates stats for /api/skill-plaza/u/:username so we can render
// the public author page without N+1 queries.
// ─────────────────────────────────────────────────────────────────────────

type AuthorProfile struct {
	UserId        int     `json:"user_id"`
	Username      string  `json:"username"`
	DisplayName   string  `json:"display_name"`
	Bio           string  `json:"bio"`
	JoinedAt      int64   `json:"joined_at"`
	ArticleCount  int64   `json:"article_count"`
	TotalLikes    int64   `json:"total_likes"`
	TotalViews    int64   `json:"total_views"`
	CommentCount  int64   `json:"comment_count"`
	FavoriteCount int64   `json:"favorite_count"`
	Level         int     `json:"level"` // 1..5, derived from articles + likes
}

// GetAuthorProfile returns the public profile for the given username plus
// aggregated counters used by the user home page. The user must exist; an
// "not found" error is returned otherwise.
func GetAuthorProfile(username string) (*AuthorProfile, error) {
	var u struct {
		Id          int
		Username    string
		DisplayName string
		CreatedTime int64
	}
	if err := DB.Table("users").Select("id, username, display_name, created_time").
		Where("username = ?", username).
		First(&u).Error; err != nil {
		return nil, err
	}
	p := &AuthorProfile{
		UserId:      u.Id,
		Username:    u.Username,
		DisplayName: u.DisplayName,
		JoinedAt:    u.CreatedTime,
	}
	// Approved articles authored.
	_ = DB.Model(&SkillUserArticle{}).
		Where("author_id = ? AND status = ?", u.Id, SkillUserArticleStatusApproved).
		Count(&p.ArticleCount).Error
	// Sum of likes + views across approved articles.
	type sumRow struct {
		TotalLikes int64
		TotalViews int64
	}
	var s sumRow
	_ = DB.Model(&SkillUserArticle{}).
		Select("COALESCE(SUM(like_count),0) AS total_likes, COALESCE(SUM(view_count),0) AS total_views").
		Where("author_id = ? AND status = ?", u.Id, SkillUserArticleStatusApproved).
		Scan(&s).Error
	p.TotalLikes = s.TotalLikes
	p.TotalViews = s.TotalViews
	// Comments + favorites — counted across all skills, not just authored.
	_ = DB.Table("skill_comments").Where("user_id = ?", u.Id).Count(&p.CommentCount).Error
	_ = DB.Table("skill_favorites").Where("user_id = ?", u.Id).Count(&p.FavoriteCount).Error
	p.Level = deriveAuthorLevel(p.ArticleCount, p.TotalLikes)
	return p, nil
}

// deriveAuthorLevel — pragmatic tiered badge:
//   1 新人 (default)
//   2 活跃   (3+ articles)
//   3 资深   (10+ articles OR 50+ likes)
//   4 大佬   (25+ articles OR 200+ likes)
//   5 传奇   (50+ articles OR 500+ likes)
func deriveAuthorLevel(articles, likes int64) int {
	switch {
	case articles >= 50 || likes >= 500:
		return 5
	case articles >= 25 || likes >= 200:
		return 4
	case articles >= 10 || likes >= 50:
		return 3
	case articles >= 3:
		return 2
	default:
		return 1
	}
}

// hydrateUserArticleSkillNames fills SkillName / SkillSlug for rows
// that reference a Skill. One query per page, no N+1.
func hydrateUserArticleSkillNames(rows []SkillUserArticle) {
	if len(rows) == 0 {
		return
	}
	idSet := map[int]bool{}
	ids := make([]int, 0, len(rows))
	for _, r := range rows {
		if r.SkillId > 0 && !idSet[r.SkillId] {
			idSet[r.SkillId] = true
			ids = append(ids, r.SkillId)
		}
	}
	if len(ids) == 0 {
		return
	}
	skills, err := GetSkillsByIDs(ids)
	if err != nil {
		return
	}
	byID := make(map[int]Skill, len(skills))
	for _, s := range skills {
		byID[s.Id] = s
	}
	for i := range rows {
		if s, ok := byID[rows[i].SkillId]; ok {
			rows[i].SkillName = s.Name
			rows[i].SkillSlug = s.Slug
		}
	}
}
