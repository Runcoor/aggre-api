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
	"fmt"
	"html"
	"io"
	"net"
	"net/http"
	"regexp"
	"strings"
	"syscall"
	"time"

	"github.com/runcoor/aggre-api/common"
)

// =====================================================================
// Reference-article fetcher.
//
// Unlike the GitHub fetcher (which only ever talks to two hardcoded
// hosts), this fetches an admin-supplied article URL — e.g. a WeChat
// 公众号 article or a blog post someone wrote about a skill. Because the
// host is arbitrary, SSRF defense is mandatory:
//
//   1. ValidateURL — scheme/port/private-IP pre-check.
//   2. A Dialer.Control hook that re-checks the *actually connected* IP,
//      defeating DNS-rebinding (the pre-check resolves one IP, the dial
//      could otherwise connect to a different, private one).
//
// On any failure we return an error; the import orchestrator treats a
// failed fetch as "no reference" and falls back to GitHub-only / pasted
// content rather than aborting the whole import.
// =====================================================================

const (
	// maxReferenceRawBytes caps the raw HTTP body we read before stripping.
	maxReferenceRawBytes = 4 * 1024 * 1024
	// maxReferenceTextRunes caps the extracted plain text fed to the model,
	// so a huge page can't blow the generation token budget.
	maxReferenceTextRunes = 40000
)

// refProtection runs in blacklist mode: empty domain/IP lists mean "allow
// any public host", while AllowPrivateIp=false keeps loopback/private/
// link-local ranges blocked. Ports are restricted to the web defaults.
var refProtection = &common.SSRFProtection{
	AllowPrivateIp:         false,
	DomainFilterMode:       false, // blacklist mode
	IpFilterMode:           false, // blacklist mode
	AllowedPorts:           []int{80, 443},
	ApplyIPFilterForDomain: true,
}

// refClient uses a dialer whose Control hook validates the resolved IP at
// connect time — this is the real SSRF guard (ValidateURL alone is racy).
var refClient = &http.Client{
	Timeout: 25 * time.Second,
	Transport: &http.Transport{
		DialContext: (&net.Dialer{
			Timeout: 10 * time.Second,
			Control: func(network, address string, _ syscall.RawConn) error {
				host, _, err := net.SplitHostPort(address)
				if err != nil {
					return err
				}
				ip := net.ParseIP(host)
				if ip == nil {
					return fmt.Errorf("cannot parse connect address %s", address)
				}
				if !refProtection.IsIPAccessAllowed(ip) {
					return fmt.Errorf("blocked connection to disallowed IP %s", ip.String())
				}
				return nil
			},
		}).DialContext,
		// Don't follow into the connection-reuse pool for these one-shot
		// fetches; keep it lean.
		MaxIdleConns:        4,
		IdleConnTimeout:     30 * time.Second,
		TLSHandshakeTimeout: 10 * time.Second,
	},
	// Cap redirects; each hop is re-validated by the dialer Control hook.
	CheckRedirect: func(req *http.Request, via []*http.Request) error {
		if len(via) >= 5 {
			return fmt.Errorf("too many redirects")
		}
		return nil
	},
}

// FetchReferenceArticle downloads rawURL and returns its main text content
// as plain text (HTML tags stripped). Returns an error on any SSRF
// rejection, network failure, non-2xx status, or empty extraction.
func FetchReferenceArticle(ctx context.Context, rawURL string) (string, error) {
	rawURL = strings.TrimSpace(rawURL)
	if rawURL == "" {
		return "", fmt.Errorf("empty reference URL")
	}
	if !strings.HasPrefix(rawURL, "http://") && !strings.HasPrefix(rawURL, "https://") {
		rawURL = "https://" + rawURL
	}
	if err := refProtection.ValidateURL(rawURL); err != nil {
		return "", fmt.Errorf("reference URL rejected: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return "", err
	}
	// Pose as a normal browser; some sites (incl. mp.weixin.qq.com) return a
	// stub for unknown agents.
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")

	resp, err := refClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("reference fetch failed: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("reference fetch returned %d", resp.StatusCode)
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, maxReferenceRawBytes+1))
	if err != nil {
		return "", fmt.Errorf("read reference body: %w", err)
	}
	if len(body) > maxReferenceRawBytes {
		body = body[:maxReferenceRawBytes]
	}

	text := htmlToText(string(body))
	text = strings.TrimSpace(text)
	if text == "" {
		return "", fmt.Errorf("no readable text extracted from reference")
	}
	if r := []rune(text); len(r) > maxReferenceTextRunes {
		text = string(r[:maxReferenceTextRunes]) + "\n…(已截断)"
	}
	return text, nil
}

// =====================================================================
// HTML → text
//
// A deliberately small, dependency-free extractor. It drops script/style/
// head noise, turns block-level tags into line breaks, strips the rest,
// then unescapes entities and collapses whitespace. Good enough for
// server-rendered article bodies (WeChat 公众号 renders the body into
// #js_content server-side, so this captures it).
// =====================================================================

var (
	reScriptStyle = regexp.MustCompile(`(?is)<(script|style|noscript|head|svg|nav|footer)[^>]*>.*?</\s*(script|style|noscript|head|svg|nav|footer)\s*>`)
	reComment     = regexp.MustCompile(`(?s)<!--.*?-->`)
	reBlockClose  = regexp.MustCompile(`(?i)</(p|div|li|h[1-6]|tr|section|article|blockquote|pre)\s*>`)
	reBreak       = regexp.MustCompile(`(?i)<br\s*/?>`)
	reTag         = regexp.MustCompile(`(?s)<[^>]+>`)
	reBlankLines  = regexp.MustCompile(`\n[ \t]*\n[ \t]*(\n[ \t]*)+`)
	reTrailing    = regexp.MustCompile(`[ \t]+\n`)
)

func htmlToText(in string) string {
	s := reScriptStyle.ReplaceAllString(in, " ")
	s = reComment.ReplaceAllString(s, " ")
	s = reBreak.ReplaceAllString(s, "\n")
	s = reBlockClose.ReplaceAllString(s, "\n")
	s = reTag.ReplaceAllString(s, "")
	s = html.UnescapeString(s)
	// Normalize whitespace: collapse runs of spaces/tabs, trim trailing
	// spaces, and squeeze 3+ blank lines down to a single blank line.
	s = strings.ReplaceAll(s, "\r\n", "\n")
	lines := strings.Split(s, "\n")
	for i, ln := range lines {
		lines[i] = strings.Join(strings.Fields(ln), " ")
	}
	s = strings.Join(lines, "\n")
	s = reTrailing.ReplaceAllString(s, "\n")
	s = reBlankLines.ReplaceAllString(s, "\n\n")
	return s
}
