package cache

import "time"

// CacheValueType 缓存内容类型
type CacheValueType int

const (
	CacheValueJSON   CacheValueType = iota // 非流式完整 JSON
	CacheValueStream                       // 流式事件列表
)

// StreamEvent 流式响应中的一个 data 事件
type StreamEvent struct {
	Data string // 不含 "data: " 前缀的纯数据
}

// CacheValue 缓存的值
type CacheValue struct {
	Type      CacheValueType
	JsonBody  []byte
	Events    []StreamEvent
	Delays    []time.Duration // 新增：每个事件与上一个事件的时间差（第一个为 0）
	FromCache bool            // 是否来自缓存
}

// ChatCache 缓存接口
type ChatCache interface {
	Get(key string) (*CacheValue, bool)
	Set(key string, value *CacheValue, ttl time.Duration)
}
