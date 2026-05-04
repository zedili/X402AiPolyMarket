package utils

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
)

// GenerateCacheKey 从请求体生成唯一缓存键
func GenerateCacheKey(bodyBytes []byte) (string, error) {
	var req struct {
		Model    string `json:"model"`
		Messages []struct {
			Role    string `json:"role"`
			Content string `json:"content"`
		} `json:"messages"`
		Temperature *float64 `json:"temperature"`
		TopP        *float64 `json:"top_p"`
		Stop        any      `json:"stop"`
		MaxTokens   *int     `json:"max_tokens"`
		Stream      bool     `json:"stream"`
	}
	if err := json.Unmarshal(bodyBytes, &req); err != nil {
		return "", err
	}

	// 使用默认值标准化参数
	temp := 1.0
	if req.Temperature != nil {
		temp = *req.Temperature
	}
	topP := 1.0
	if req.TopP != nil {
		topP = *req.TopP
	}

	h := sha256.New()
	h.Write([]byte(req.Model))
	h.Write([]byte(fmt.Sprintf("temp=%.6f", temp)))
	h.Write([]byte(fmt.Sprintf("topp=%.6f", topP)))
	h.Write([]byte(fmt.Sprintf("stream=%v", req.Stream)))

	// 对 stop 进行稳定序列化
	if req.Stop != nil {
		stopBytes, _ := json.Marshal(req.Stop)
		h.Write(stopBytes)
	}
	if req.MaxTokens != nil {
		h.Write([]byte(fmt.Sprintf("maxtokens=%d", *req.MaxTokens)))
	}

	// 对 messages 规范化排序（避免顺序影响）
	sort.Slice(req.Messages, func(i, j int) bool {
		return req.Messages[i].Role < req.Messages[j].Role ||
			(req.Messages[i].Role == req.Messages[j].Role &&
				strings.Compare(req.Messages[i].Content, req.Messages[j].Content) < 0)
	})
	for _, m := range req.Messages {
		h.Write([]byte(m.Role))
		h.Write([]byte(m.Content))
	}

	return fmt.Sprintf("deepseek:%x", h.Sum(nil)), nil
}
