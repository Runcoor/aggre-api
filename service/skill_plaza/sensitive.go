/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

For commercial licensing, please contact support@quantumnous.com
*/

package skill_plaza

import (
	"strings"

	"github.com/runcoor/aggre-api/setting/operation_setting"
)

// DetectSensitive scans content for any configured sensitive phrase
// (case-insensitive substring match) and returns the *original-case*
// hits in the order they appear.
//
// Returns nil when no list is configured or no phrase matches — callers
// can simply check `if hits := DetectSensitive(s); len(hits) > 0`.
//
// Why substring (not word boundary): the typical use case is blocking
// brand-unsafe / abusive phrases that often appear inside longer words
// or punctuation runs, where word-boundary matching would miss them.
// Admins who want stricter matching can pad the phrase with spaces.
func DetectSensitive(content string) []string {
	words := operation_setting.SkillPlazaSensitiveWords()
	if len(words) == 0 || content == "" {
		return nil
	}
	lower := strings.ToLower(content)
	seen := make(map[string]struct{}, len(words))
	hits := make([]string, 0, 2)
	for _, w := range words {
		if _, dup := seen[w]; dup {
			continue
		}
		if strings.Contains(lower, w) {
			seen[w] = struct{}{}
			hits = append(hits, w)
		}
	}
	return hits
}
