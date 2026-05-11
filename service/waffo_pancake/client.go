package waffo_pancake

import (
	"bytes"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/runcoor/aggre-api/common"
	"github.com/runcoor/aggre-api/setting"
)

// Client signs and dispatches requests against the Pancake REST API
// (https://docs.waffo.ai/api-reference/authentication).
//
// Authentication: RSA-SHA256 over the canonical request
//
//	METHOD \n PATH \n TIMESTAMP \n BASE64(SHA256(BODY))
//
// signed with the merchant's private key. The X-Merchant-Id, X-Timestamp,
// and X-Signature headers carry the result. Environment (test vs prod) is
// implied by which keypair signs — there is no X-Environment header for
// API-key auth.
type Client struct {
	http *http.Client
}

func New() *Client {
	return &Client{
		http: &http.Client{Timeout: 30 * time.Second},
	}
}

// ApiError carries a non-2xx response body from Pancake. Pancake returns
// JSON like {"code": "...", "message": "..."} but we keep the raw body too
// for surfacing in logs when the shape is unexpected.
type ApiError struct {
	Status  int
	Code    string `json:"code"`
	Message string `json:"message"`
	RawBody string
}

func (e *ApiError) Error() string {
	if e.Code != "" || e.Message != "" {
		return fmt.Sprintf("waffo-pancake %d [%s] %s", e.Status, e.Code, e.Message)
	}
	return fmt.Sprintf("waffo-pancake %d: %s", e.Status, e.RawBody)
}

// do performs a signed POST and unmarshals the JSON response envelope into
// `out` (the field named `data` inside the envelope). Pancake responds with
// `{"data": ...}` on success.
func (c *Client) do(method, path string, body any, out any) error {
	merchantId := setting.WaffoPancakeMerchantId
	if merchantId == "" {
		return errors.New("waffo-pancake merchant id not configured")
	}
	privateKeyPEM := setting.GetWaffoPancakePrivateKey()
	if privateKeyPEM == "" {
		return errors.New("waffo-pancake private key not configured")
	}

	var bodyBytes []byte
	if body != nil {
		b, err := common.Marshal(body)
		if err != nil {
			return fmt.Errorf("marshal request: %w", err)
		}
		bodyBytes = b
	} else {
		bodyBytes = []byte("{}")
	}

	timestamp := strconv.FormatInt(time.Now().Unix(), 10)

	signature, err := signCanonicalRequest(method, path, timestamp, bodyBytes, privateKeyPEM)
	if err != nil {
		return fmt.Errorf("sign request: %w", err)
	}

	req, err := http.NewRequest(method, setting.WaffoPancakeApiBase+path, bytes.NewReader(bodyBytes))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Merchant-Id", merchantId)
	req.Header.Set("X-Timestamp", timestamp)
	req.Header.Set("X-Signature", signature)

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("call waffo-pancake: %w", err)
	}
	defer resp.Body.Close()

	respBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("read waffo-pancake response: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		apiErr := &ApiError{Status: resp.StatusCode, RawBody: string(respBytes)}
		_ = common.Unmarshal(respBytes, apiErr)
		return apiErr
	}

	if out == nil {
		return nil
	}
	envelope := struct {
		Data any `json:"data"`
	}{Data: out}
	if err := common.Unmarshal(respBytes, &envelope); err != nil {
		return fmt.Errorf("decode waffo-pancake response: %w (body=%s)", err, string(respBytes))
	}
	return nil
}

// signCanonicalRequest builds and signs the canonical string per
// docs.waffo.ai/api-reference/authentication:
//
//	METHOD\nPATH\nTIMESTAMP\nBASE64(SHA256(BODY))
//
// Signing uses RSA PKCS#1 v1.5 with SHA-256.
func signCanonicalRequest(method, path, timestamp string, body []byte, privateKeyPEM string) (string, error) {
	bodyHashRaw := sha256.Sum256(body)
	bodyHash := base64.StdEncoding.EncodeToString(bodyHashRaw[:])
	canonical := method + "\n" + path + "\n" + timestamp + "\n" + bodyHash

	key, err := parseRSAPrivateKey(privateKeyPEM)
	if err != nil {
		return "", err
	}

	digest := sha256.Sum256([]byte(canonical))
	sig, err := rsa.SignPKCS1v15(rand.Reader, key, crypto.SHA256, digest[:])
	if err != nil {
		return "", fmt.Errorf("rsa sign: %w", err)
	}
	return base64.StdEncoding.EncodeToString(sig), nil
}

// parseRSAPrivateKey accepts either PKCS#1 ("RSA PRIVATE KEY") or PKCS#8
// ("PRIVATE KEY") PEM blocks — Pancake dashboard exports vary by browser.
func parseRSAPrivateKey(pemStr string) (*rsa.PrivateKey, error) {
	block, _ := pem.Decode([]byte(pemStr))
	if block == nil {
		return nil, errors.New("invalid PEM: no block found")
	}
	if k, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		return k, nil
	}
	parsed, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("parse private key: %w", err)
	}
	rsaKey, ok := parsed.(*rsa.PrivateKey)
	if !ok {
		return nil, errors.New("private key is not RSA")
	}
	return rsaKey, nil
}

// parseRSAPublicKey accepts a PEM "PUBLIC KEY" block (PKIX/SPKI format),
// which is what the Pancake dashboard hands out for webhook verification.
func parseRSAPublicKey(pemStr string) (*rsa.PublicKey, error) {
	block, _ := pem.Decode([]byte(pemStr))
	if block == nil {
		return nil, errors.New("invalid PEM: no block found")
	}
	pub, err := x509.ParsePKIXPublicKey(block.Bytes)
	if err != nil {
		// Some dashboards export PKCS#1 "RSA PUBLIC KEY" — try that too.
		if k, e2 := x509.ParsePKCS1PublicKey(block.Bytes); e2 == nil {
			return k, nil
		}
		return nil, fmt.Errorf("parse public key: %w", err)
	}
	rsaPub, ok := pub.(*rsa.PublicKey)
	if !ok {
		return nil, errors.New("public key is not RSA")
	}
	return rsaPub, nil
}
