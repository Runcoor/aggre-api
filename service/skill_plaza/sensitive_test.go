/*
Copyright (C) 2025 QuantumNous

For commercial licensing, please contact support@quantumnous.com
*/

package skill_plaza

import (
	"testing"

	"github.com/runcoor/aggre-api/setting/operation_setting"
	"github.com/stretchr/testify/assert"
)

func TestDetectSensitive(t *testing.T) {
	// Snapshot + restore so other tests in this package aren't affected.
	settings := operation_setting.GetSkillPlazaSetting()
	original := settings.SensitiveWords
	t.Cleanup(func() { settings.SensitiveWords = original })

	require := assert.New(t)

	// Empty word list → no detection regardless of content. Use Empty
	// (not Nil) since testify's Nil sometimes mis-reports typed-nil
	// slices that are returned through interface{} boxing.
	settings.SensitiveWords = ""
	require.Empty(DetectSensitive("anything"))

	settings.SensitiveWords = "Spam\nfraud\n违禁词"
	require.ElementsMatch([]string{"spam"}, DetectSensitive("Buy SPAM now"))
	require.ElementsMatch([]string{"spam", "fraud"},
		DetectSensitive("the spam-fraud combo"))
	require.ElementsMatch([]string{"违禁词"},
		DetectSensitive("文本里有违禁词出现"))
	require.Empty(DetectSensitive("clean content"))
}
