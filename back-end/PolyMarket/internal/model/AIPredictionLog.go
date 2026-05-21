package model

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"X402AiPolyMarket/PolyMarket/internal/cache"
)

// AIPredictionLog AI预测调用记录模型
type AIPredictionLog struct {
	ID          uint64 `gorm:"primaryKey;autoIncrement" json:"id"`
	UserAddress string `gorm:"type:varchar(42);not null;index:idx_user_address" json:"user_address"`

	// 预测请求信息
	CacheKey    string  `gorm:"type:varchar(255);not null;index:idx_cache_key" json:"cache_key"` // 缓存键（预测唯一标识）
	Model       string  `gorm:"type:varchar(100);not null" json:"model"`                         // 使用的AI模型
	Messages    JSONMap `gorm:"type:json;not null" json:"messages"`                              // 请求消息列表
	Temperature float64 `gorm:"type:decimal(3,2);default:1.00" json:"temperature"`               // 温度参数
	TopP        float64 `gorm:"type:decimal(3,2);default:1.00" json:"top_p"`                     // TopP参数
	MaxTokens   *int    `gorm:"type:int" json:"max_tokens,omitempty"`                            // 最大token数
	Stream      bool    `gorm:"type:boolean;default:false" json:"stream"`                        // 是否流式请求

	// 预测结果（参考Redis缓存结构）
	ResultType   uint8         `gorm:"type:tinyint unsigned;not null;default:0" json:"result_type"` // 结果类型：0-JSON 1-Stream
	ResultJSON   *[]byte       `gorm:"type:longblob" json:"result_json,omitempty"`                  // 非流式结果（完整JSON）
	ResultEvents *JSONArrayStr `gorm:"type:json" json:"result_events,omitempty"`                    // 流式结果（事件列表）
	ResultDelays *JSONArrayInt `gorm:"type:json" json:"result_delays,omitempty"`                    // 流式延迟（时间差数组）

	// 性能指标
	ResponseTime int64 `gorm:"type:bigint;default:0" json:"response_time"`  // 响应时间（毫秒）
	TokenUsage   *int  `gorm:"type:int" json:"token_usage,omitempty"`       // Token使用量
	CacheHit     bool  `gorm:"type:boolean;default:false" json:"cache_hit"` // 是否命中缓存

	// 状态和错误
	Status       uint8   `gorm:"type:tinyint unsigned;default:0;index:idx_status" json:"status"` // 状态：0-待预测 1-成功 2-失败
	ErrorMessage *string `gorm:"type:text" json:"error_message,omitempty"`                       // 错误信息

	// 元数据
	RequestMetadata *JSONMap `gorm:"type:json" json:"request_metadata,omitempty"` // 请求元数据（扩展字段）

	// 时间信息
	CreatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP;index:idx_created_at" json:"created_at"`
	UpdatedAt time.Time `gorm:"type:timestamp;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

// TableName 指定表名
func (AIPredictionLog) TableName() string {
	return "ai_prediction_logs"
}

// JSONArrayStr JSON字符串数组类型（用于存储流式事件）
type JSONArrayStr []string

func (j JSONArrayStr) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

func (j *JSONArrayStr) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, j)
}

// JSONArrayInt JSON整数数组类型（用于存储延迟时间）
type JSONArrayInt []int64

func (j JSONArrayInt) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

func (j *JSONArrayInt) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, j)
}

// 结果类型常量
const (
	ResultTypeJSON   uint8 = 0 // 非流式JSON结果
	ResultTypeStream uint8 = 1 // 流式事件结果
)

// 状态常量
const (
	AIPrediStatusPending uint8 = 0 // 待预测
	AIPrediStatusSuccess uint8 = 1 // 成功
	AIPrediStatusFailed  uint8 = 2 // 失败
)

// IsStreamResult 判断是否为流式结果
func (log *AIPredictionLog) IsStreamResult() bool {
	return log.ResultType == ResultTypeStream
}

// GetCacheValue 将数据库记录转换为 CacheValue（用于重新缓存）
func (log *AIPredictionLog) GetCacheValue() *cache.CacheValue { // 1、*T 定义 T 类型的指针
	cv := &cache.CacheValue{ // 2、&T{}: 创建对象，取出地址返回
		Type: cache.CacheValueType(log.ResultType), // 3、 不使用 & 创建的是值，不是指针
	}

	if log.ResultJSON != nil {
		cv.JsonBody = *log.ResultJSON
	}

	if log.ResultEvents != nil {
		events := make([]cache.StreamEvent, len(*log.ResultEvents))
		for i, data := range *log.ResultEvents {
			events[i] = cache.StreamEvent{Data: data}
		}
		cv.Events = events
	}

	if log.ResultDelays != nil {
		delays := make([]time.Duration, len(*log.ResultDelays))
		for i, d := range *log.ResultDelays {
			delays[i] = time.Duration(d)
		}
		cv.Delays = delays
	}

	return cv
}
