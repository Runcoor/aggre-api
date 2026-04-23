package ai_news

import (
	"context"
	"encoding/xml"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

// FeedItem is a normalized RSS/Atom item.
type FeedItem struct {
	Title       string
	URL         string
	Description string
	Published   time.Time
}

// FetchRSS fetches and parses an RSS 2.0 or Atom 1.0 feed.
// Bytes are capped at 4MB to avoid runaway feeds.
func FetchRSS(ctx context.Context, feedURL string) ([]FeedItem, error) {
	feedURL = strings.TrimSpace(feedURL)
	if feedURL == "" {
		return nil, fmt.Errorf("feed URL is required")
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, feedURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/rss+xml, application/atom+xml, application/xml, text/xml")
	req.Header.Set("User-Agent", "aggre-api ai-news-agent/1.0")
	resp, err := rssHTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode/100 != 2 {
		return nil, fmt.Errorf("rss HTTP %d for %s", resp.StatusCode, feedURL)
	}
	body, err := io.ReadAll(io.LimitReader(resp.Body, 4*1024*1024))
	if err != nil {
		return nil, err
	}
	return parseFeedXML(body)
}

var rssHTTPClient = &http.Client{Timeout: 30 * time.Second}

// rss / atom shared envelope shapes (subset)
type rssRoot struct {
	XMLName xml.Name   `xml:"rss"`
	Channel rssChannel `xml:"channel"`
}

type rssChannel struct {
	Items []rssItem `xml:"item"`
}

type rssItem struct {
	Title       string `xml:"title"`
	Link        string `xml:"link"`
	Description string `xml:"description"`
	PubDate     string `xml:"pubDate"`
}

type atomRoot struct {
	XMLName xml.Name   `xml:"feed"`
	Entries []atomEntry `xml:"entry"`
}

type atomEntry struct {
	Title   string     `xml:"title"`
	Links   []atomLink `xml:"link"`
	Summary string     `xml:"summary"`
	Content string     `xml:"content"`
	Updated string     `xml:"updated"`
}

type atomLink struct {
	Href string `xml:"href,attr"`
	Rel  string `xml:"rel,attr"`
}

func parseFeedXML(data []byte) ([]FeedItem, error) {
	// Try RSS first
	var rss rssRoot
	if err := xml.Unmarshal(data, &rss); err == nil && len(rss.Channel.Items) > 0 {
		items := make([]FeedItem, 0, len(rss.Channel.Items))
		for _, it := range rss.Channel.Items {
			items = append(items, FeedItem{
				Title:       cleanText(it.Title),
				URL:         strings.TrimSpace(it.Link),
				Description: cleanText(it.Description),
				Published:   parseFeedTime(it.PubDate),
			})
		}
		return items, nil
	}

	// Fall back to Atom
	var atom atomRoot
	if err := xml.Unmarshal(data, &atom); err != nil {
		return nil, fmt.Errorf("parse feed: %w", err)
	}
	items := make([]FeedItem, 0, len(atom.Entries))
	for _, e := range atom.Entries {
		link := pickAtomLink(e.Links)
		summary := e.Summary
		if summary == "" {
			summary = e.Content
		}
		items = append(items, FeedItem{
			Title:       cleanText(e.Title),
			URL:         strings.TrimSpace(link),
			Description: cleanText(summary),
			Published:   parseFeedTime(e.Updated),
		})
	}
	return items, nil
}

func pickAtomLink(links []atomLink) string {
	for _, l := range links {
		if l.Rel == "" || l.Rel == "alternate" {
			return l.Href
		}
	}
	if len(links) > 0 {
		return links[0].Href
	}
	return ""
}

func cleanText(s string) string {
	s = strings.TrimSpace(s)
	// Drop CDATA markers (encoding/xml strips most, but be defensive)
	s = strings.TrimPrefix(s, "<![CDATA[")
	s = strings.TrimSuffix(s, "]]>")
	return strings.TrimSpace(s)
}

func parseFeedTime(s string) time.Time {
	s = strings.TrimSpace(s)
	if s == "" {
		return time.Time{}
	}
	for _, layout := range []string{
		time.RFC1123Z, time.RFC1123, time.RFC3339, time.RFC3339Nano,
		"Mon, 2 Jan 2006 15:04:05 -0700",
		"2006-01-02T15:04:05Z",
	} {
		if t, err := time.Parse(layout, s); err == nil {
			return t
		}
	}
	return time.Time{}
}
