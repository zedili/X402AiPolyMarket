package utils

import (
	"net/http"
	"time"

	"github.com/zeromicro/go-zero/rest/httpx"
)

// Response 统一响应结构
type Response struct {
	Code      int         `json:"code"`
	Msg       string      `json:"msg"`
	Data      interface{} `json:"data,omitempty"`
	Timestamp int64       `json:"timestamp"`
}

// 错误码定义
const (
	CodeSuccess             = 0
	CodeParamError          = 1001
	CodeUnauthorized        = 1002
	CodeForbidden           = 1003
	CodeNotFound            = 1004
	CodeServerError         = 1005
	CodeInvalidAddress      = 2001
	CodeInvalidSign         = 2002
	CodeMarketNotFound      = 3001
	CodeMarketClosed        = 3002
	CodeInsufficientBalance = 4001
	CodeOrderNotFound       = 4002
)

// Success 成功响应
func Success(w http.ResponseWriter, data interface{}) {
	resp := Response{
		Code:      CodeSuccess,
		Msg:       "success",
		Data:      data,
		Timestamp: time.Now().Unix(),
	}
	httpx.OkJson(w, resp)
}

// Error 错误响应
func Error(w http.ResponseWriter, code int, msg string) {
	resp := Response{
		Code:      code,
		Msg:       msg,
		Timestamp: time.Now().Unix(),
	}
	httpx.OkJson(w, resp)
}

// ParamError 参数错误
func ParamError(w http.ResponseWriter, msg string) {
	Error(w, CodeParamError, msg)
}

// Unauthorized 未授权
func Unauthorized(w http.ResponseWriter, msg string) {
	Error(w, CodeUnauthorized, msg)
}

// ServerError 服务器错误
func ServerError(w http.ResponseWriter, msg string) {
	Error(w, CodeServerError, msg)
}

