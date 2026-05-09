package middleware

import (
	"net"
	"net/http"
	"os"
	"strings"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/runcoor/aggre-api/common"
)

// RealIP rewrites c.Request.RemoteAddr to the actual client IP based on a
// header priority chain. Every downstream caller — c.ClientIP(), gin
// LoggerFormatter, login-log writer, rate-limiter, turnstile — automatically
// sees the corrected value, no per-call refactor required.
//
// Header priority (first non-empty wins):
//
//  1. CF-Connecting-IP     — Cloudflare (proxy & tunnel)
//  2. True-Client-IP       — Cloudflare Enterprise / Akamai
//  3. X-Real-IP            — nginx / Caddy `header_up X-Real-IP $remote_addr`
//  4. X-Forwarded-For      — walk right-to-left, return first IP that is NOT
//                            in TRUSTED_PROXIES (i.e. the real client beyond
//                            the proxy chain)
//  5. r.RemoteAddr         — fall back to the TCP peer
//
// Configure TRUSTED_PROXIES (comma-separated CIDRs) to declare which upstreams
// are allowed to set forwarded headers. Defaults cover loopback + RFC1918 +
// link-local, which is appropriate for the common deploy shape:
//
//	user → public Caddy/nginx (sets XFF) → private LAN/loopback → Go app
//
// When DEBUG_REAL_IP=true, every request emits one SysLog line showing the
// raw headers + the picked IP. Useful for diagnosing why a misconfigured
// upstream is delivering the wrong forwarded header.
func RealIP() gin.HandlerFunc {
	trusted := loadTrustedCIDRs()
	debug := common.GetEnvOrDefaultBool("DEBUG_REAL_IP", false)

	return func(c *gin.Context) {
		picked, source := pickRealIP(c.Request, trusted)
		if picked != "" {
			// Preserve host:port format — Gin's c.RemoteIP() uses
			// net.SplitHostPort() and returns "" if it can't parse one.
			// JoinHostPort handles IPv6 bracketing for us.
			c.Request.RemoteAddr = net.JoinHostPort(picked, "0")
		}
		if debug {
			common.SysLog("[real-ip] picked=" + picked + " source=" + source +
				" cf=" + c.GetHeader("CF-Connecting-IP") +
				" tc=" + c.GetHeader("True-Client-IP") +
				" xri=" + c.GetHeader("X-Real-IP") +
				" xff=" + c.GetHeader("X-Forwarded-For") +
				" remote=" + c.Request.RemoteAddr)
		}
		c.Next()
	}
}

// TrustedCIDRs returns the parsed trusted-proxy list so callers (e.g. main.go
// wiring `engine.SetTrustedProxies`) can reuse the same configuration.
func TrustedCIDRs() []*net.IPNet { return loadTrustedCIDRs() }

// ─────────────────────────────────────────────────────────────────────────────

var (
	cidrOnce  sync.Once
	cidrCache []*net.IPNet
)

// loadTrustedCIDRs parses TRUSTED_PROXIES env once. Format: comma-separated
// CIDRs or bare IPs ("38.207.165.179" gets treated as /32). Falls back to a
// safe default covering private + loopback + link-local.
func loadTrustedCIDRs() []*net.IPNet {
	cidrOnce.Do(func() {
		raw := strings.TrimSpace(os.Getenv("TRUSTED_PROXIES"))
		if raw == "" {
			cidrCache = defaultTrustedCIDRs()
			return
		}
		out := make([]*net.IPNet, 0, 8)
		for _, item := range strings.Split(raw, ",") {
			item = strings.TrimSpace(item)
			if item == "" {
				continue
			}
			if !strings.Contains(item, "/") {
				if strings.Contains(item, ":") {
					item += "/128"
				} else {
					item += "/32"
				}
			}
			_, n, err := net.ParseCIDR(item)
			if err != nil {
				common.SysError("[real-ip] invalid TRUSTED_PROXIES entry: " + item + " (" + err.Error() + ")")
				continue
			}
			out = append(out, n)
		}
		if len(out) == 0 {
			out = defaultTrustedCIDRs()
		}
		cidrCache = out
	})
	return cidrCache
}

func defaultTrustedCIDRs() []*net.IPNet {
	cidrs := []string{
		"127.0.0.0/8",
		"10.0.0.0/8",
		"172.16.0.0/12",
		"192.168.0.0/16",
		"169.254.0.0/16",
		"::1/128",
		"fc00::/7",
		"fe80::/10",
	}
	out := make([]*net.IPNet, 0, len(cidrs))
	for _, c := range cidrs {
		_, n, err := net.ParseCIDR(c)
		if err == nil {
			out = append(out, n)
		}
	}
	return out
}

func isTrustedIP(ip net.IP, trusted []*net.IPNet) bool {
	for _, n := range trusted {
		if n.Contains(ip) {
			return true
		}
	}
	return false
}

// stripPort accepts "1.2.3.4", "1.2.3.4:5678", "[::1]:5678", "::1" and
// returns just the IP portion. Returns the input unchanged if it doesn't
// parse.
func stripPort(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return s
	}
	// SplitHostPort handles IPv6 brackets correctly.
	if h, _, err := net.SplitHostPort(s); err == nil {
		return h
	}
	return s
}

// pickFromXFF walks an X-Forwarded-For value right-to-left, returning the
// first IP that is NOT a trusted proxy. With all-trusted (or empty) lists,
// returns the leftmost IP. Returns "" if XFF is malformed.
func pickFromXFF(xff string, trusted []*net.IPNet) string {
	if xff == "" {
		return ""
	}
	parts := strings.Split(xff, ",")
	for i := len(parts) - 1; i >= 0; i-- {
		s := stripPort(parts[i])
		ip := net.ParseIP(s)
		if ip == nil {
			return ""
		}
		if i == 0 || !isTrustedIP(ip, trusted) {
			return s
		}
	}
	return ""
}

// pickRealIP runs the priority chain. Returns (ip, source) where source
// labels which header (or "remote") supplied the value. Both empty when no
// usable IP is found.
func pickRealIP(r *http.Request, trusted []*net.IPNet) (string, string) {
	type cand struct{ name, val string }
	for _, c := range []cand{
		{"cf-connecting-ip", r.Header.Get("CF-Connecting-IP")},
		{"true-client-ip", r.Header.Get("True-Client-IP")},
		{"x-real-ip", r.Header.Get("X-Real-IP")},
	} {
		s := stripPort(c.val)
		if s == "" {
			continue
		}
		if net.ParseIP(s) != nil {
			return s, c.name
		}
	}
	if pick := pickFromXFF(r.Header.Get("X-Forwarded-For"), trusted); pick != "" {
		return pick, "x-forwarded-for"
	}
	if remote := stripPort(r.RemoteAddr); remote != "" && net.ParseIP(remote) != nil {
		return remote, "remote"
	}
	return "", ""
}
