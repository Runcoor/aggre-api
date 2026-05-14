/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

For commercial licensing, please contact support@quantumnous.com
*/

// Tests for the SKILLS 广场 social tables: ratings / comments / favorites
// / likes / reports. The shared TestMain in task_cas_test.go bootstraps
// the in-memory SQLite + AutoMigrate; helpers here reset the rows between
// tests so cases don't leak into each other.

package model

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func resetSkillPlazaTables(t *testing.T) {
	t.Helper()
	for _, table := range []string{
		"skills", "skill_articles", "skill_import_jobs",
		"skill_ratings", "skill_favorites",
		"skill_comments", "skill_comment_likes",
		"skill_reports",
	} {
		DB.Exec("DELETE FROM " + table)
	}
}

func seedSkill(t *testing.T, slug string) *Skill {
	t.Helper()
	s := &Skill{
		Slug:       slug,
		Name:       slug,
		SourceType: SkillSourceGitHub,
		Status:     SkillStatusPublished,
	}
	require.NoError(t, DB.Create(s).Error)
	return s
}

// =====================================================================
// Rating upsert + aggregate recompute
// =====================================================================

func TestUpsertSkillRating_CreatesThenUpdates(t *testing.T) {
	resetSkillPlazaTables(t)
	s := seedSkill(t, "rating-skill")

	// First write → create.
	r1 := &SkillRating{
		SkillId: s.Id, UserId: 1,
		Usability: 5, Practicality: 5, Clarity: 5,
		Stability: 5, Innovation: 5,
	}
	require.NoError(t, UpsertSkillRating(r1))
	assert.NotZero(t, r1.Id)
	assert.InDelta(t, 5.0, r1.Overall, 0.001)

	// Aggregates on parent skill should reflect 5.0 / 1.
	var refreshed Skill
	require.NoError(t, DB.First(&refreshed, s.Id).Error)
	assert.Equal(t, 1, refreshed.RatingCount)
	assert.InDelta(t, 5.0, refreshed.RatingAverage, 0.001)
	assert.InDelta(t, 5.0, refreshed.RatingUsability, 0.001)

	// Second write for same (skill, user) → update, count stays 1.
	r2 := &SkillRating{
		SkillId: s.Id, UserId: 1,
		Usability: 1, Practicality: 1, Clarity: 1,
		Stability: 1, Innovation: 1,
	}
	require.NoError(t, UpsertSkillRating(r2))
	assert.Equal(t, r1.Id, r2.Id, "should hit the upsert path, same row")

	require.NoError(t, DB.First(&refreshed, s.Id).Error)
	assert.Equal(t, 1, refreshed.RatingCount, "still one rating after upsert")
	assert.InDelta(t, 1.0, refreshed.RatingAverage, 0.001)
}

func TestUpsertSkillRating_AveragesAcrossUsers(t *testing.T) {
	resetSkillPlazaTables(t)
	s := seedSkill(t, "avg-skill")

	for i, score := range []int{5, 3, 1} {
		require.NoError(t, UpsertSkillRating(&SkillRating{
			SkillId: s.Id, UserId: i + 1,
			Usability: score, Practicality: score, Clarity: score,
			Stability: score, Innovation: score,
		}))
	}

	var refreshed Skill
	require.NoError(t, DB.First(&refreshed, s.Id).Error)
	assert.Equal(t, 3, refreshed.RatingCount)
	assert.InDelta(t, 3.0, refreshed.RatingAverage, 0.001, "(5+3+1)/3")
	assert.InDelta(t, 3.0, refreshed.RatingPracticality, 0.001)
}

// =====================================================================
// Favorite toggle
// =====================================================================

func TestToggleSkillFavorite_OnOffOn(t *testing.T) {
	resetSkillPlazaTables(t)
	s := seedSkill(t, "fav-skill")

	on, err := ToggleSkillFavorite(s.Id, 7)
	require.NoError(t, err)
	assert.True(t, on)

	favored, err := IsFavorited(s.Id, 7)
	require.NoError(t, err)
	assert.True(t, favored)

	var refreshed Skill
	require.NoError(t, DB.First(&refreshed, s.Id).Error)
	assert.Equal(t, 1, refreshed.FavoriteCount)

	off, err := ToggleSkillFavorite(s.Id, 7)
	require.NoError(t, err)
	assert.False(t, off)

	require.NoError(t, DB.First(&refreshed, s.Id).Error)
	assert.Equal(t, 0, refreshed.FavoriteCount)

	on2, err := ToggleSkillFavorite(s.Id, 7)
	require.NoError(t, err)
	assert.True(t, on2)

	require.NoError(t, DB.First(&refreshed, s.Id).Error)
	assert.Equal(t, 1, refreshed.FavoriteCount)
}

// =====================================================================
// Comment create + reply collapse + count refresh
// =====================================================================

func TestCreateSkillComment_TopLevelAndReply(t *testing.T) {
	resetSkillPlazaTables(t)
	s := seedSkill(t, "comment-skill")

	top := &SkillComment{SkillId: s.Id, UserId: 1, Content: "first"}
	require.NoError(t, CreateSkillComment(top))
	assert.NotZero(t, top.Id)
	assert.Equal(t, 0, top.ParentId)

	reply := &SkillComment{
		SkillId: s.Id, UserId: 2, ParentId: top.Id, Content: "second",
	}
	require.NoError(t, CreateSkillComment(reply))
	assert.Equal(t, top.Id, reply.ParentId)

	// Reply to a reply should be collapsed to the top-level ancestor —
	// CreateSkillComment retargets parent_id rather than rejecting the
	// row. Frontend renders flat-with-replies so this keeps the tree
	// well-formed without surfacing an error to the user.
	nested := &SkillComment{
		SkillId: s.Id, UserId: 3, ParentId: reply.Id, Content: "third",
	}
	require.NoError(t, CreateSkillComment(nested))
	assert.Equal(t, top.Id, nested.ParentId, "deeper nesting collapses to top")

	// Aggregate refreshes (3 comments total).
	var refreshed Skill
	require.NoError(t, DB.First(&refreshed, s.Id).Error)
	assert.Equal(t, 3, refreshed.CommentCount)
}

func TestCreateSkillComment_RejectsCrossSkillParent(t *testing.T) {
	resetSkillPlazaTables(t)
	a := seedSkill(t, "skill-a")
	b := seedSkill(t, "skill-b")

	parent := &SkillComment{SkillId: a.Id, UserId: 1, Content: "on a"}
	require.NoError(t, CreateSkillComment(parent))

	bad := &SkillComment{
		SkillId: b.Id, UserId: 2, ParentId: parent.Id, Content: "on b",
	}
	err := CreateSkillComment(bad)
	assert.Error(t, err, "parent on different skill must be rejected")
}

// =====================================================================
// Comment like toggle
// =====================================================================

func TestToggleSkillCommentLike_OnOff(t *testing.T) {
	resetSkillPlazaTables(t)
	s := seedSkill(t, "like-skill")
	c := &SkillComment{SkillId: s.Id, UserId: 1, Content: "likeable"}
	require.NoError(t, CreateSkillComment(c))

	liked, count, err := ToggleSkillCommentLike(2, c.Id)
	require.NoError(t, err)
	assert.True(t, liked)
	assert.Equal(t, 1, count)

	var refreshed SkillComment
	require.NoError(t, DB.First(&refreshed, c.Id).Error)
	assert.Equal(t, 1, refreshed.LikeCount)

	// Toggling again from the same user flips back to 0.
	liked, count, err = ToggleSkillCommentLike(2, c.Id)
	require.NoError(t, err)
	assert.False(t, liked)
	assert.Equal(t, 0, count)
}

func TestListCommentLikesByUser_Batch(t *testing.T) {
	resetSkillPlazaTables(t)
	s := seedSkill(t, "batch-likes")
	c1 := &SkillComment{SkillId: s.Id, UserId: 1, Content: "a"}
	c2 := &SkillComment{SkillId: s.Id, UserId: 1, Content: "b"}
	require.NoError(t, CreateSkillComment(c1))
	require.NoError(t, CreateSkillComment(c2))

	_, _, err := ToggleSkillCommentLike(99, c1.Id) // user 99 likes c1 only
	require.NoError(t, err)

	hits, err := ListCommentLikesByUser(99, []int{c1.Id, c2.Id})
	require.NoError(t, err)
	assert.True(t, hits[c1.Id])
	assert.False(t, hits[c2.Id], "user 99 didn't like c2")
}

// =====================================================================
// Report upsert
// =====================================================================

func TestCreateOrUpdateSkillReport_UpsertSemantics(t *testing.T) {
	resetSkillPlazaTables(t)

	r1, err := CreateOrUpdateSkillReport(1, SkillReportTargetComment, 100, "spam")
	require.NoError(t, err)
	assert.NotZero(t, r1.Id)
	assert.Equal(t, SkillReportStatusOpen, r1.Status)
	assert.Equal(t, "spam", r1.Reason)

	// Same reporter + target = updates the SAME row (no duplicate).
	r2, err := CreateOrUpdateSkillReport(1, SkillReportTargetComment, 100, "still spam")
	require.NoError(t, err)
	assert.Equal(t, r1.Id, r2.Id)
	assert.Equal(t, "still spam", r2.Reason)

	var count int64
	require.NoError(t, DB.Model(&SkillReport{}).Count(&count).Error)
	assert.Equal(t, int64(1), count)

	// Different reporter on the same target → new row.
	r3, err := CreateOrUpdateSkillReport(2, SkillReportTargetComment, 100, "agreed")
	require.NoError(t, err)
	assert.NotEqual(t, r1.Id, r3.Id)
}

func TestResolveSkillReport_StampAndReopen(t *testing.T) {
	resetSkillPlazaTables(t)
	r, err := CreateOrUpdateSkillReport(1, SkillReportTargetComment, 5, "bad")
	require.NoError(t, err)

	require.NoError(t, ResolveSkillReport(r.Id, 99, SkillReportStatusResolved))
	var refreshed SkillReport
	require.NoError(t, DB.First(&refreshed, r.Id).Error)
	assert.Equal(t, SkillReportStatusResolved, refreshed.Status)
	assert.Equal(t, 99, refreshed.ResolvedBy)
	assert.NotZero(t, refreshed.ResolvedAt)

	// Re-reporting after resolution should re-open the row.
	again, err := CreateOrUpdateSkillReport(1, SkillReportTargetComment, 5, "still bad")
	require.NoError(t, err)
	assert.Equal(t, r.Id, again.Id)
	assert.Equal(t, SkillReportStatusOpen, again.Status)
	assert.Zero(t, again.ResolvedAt)
}

func TestIsValidReportTarget(t *testing.T) {
	assert.True(t, IsValidReportTarget(SkillReportTargetComment))
	assert.True(t, IsValidReportTarget(SkillReportTargetSkill))
	assert.True(t, IsValidReportTarget(SkillReportTargetShowcase))
	assert.False(t, IsValidReportTarget(""))
	assert.False(t, IsValidReportTarget("user"))
}
