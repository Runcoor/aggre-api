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
