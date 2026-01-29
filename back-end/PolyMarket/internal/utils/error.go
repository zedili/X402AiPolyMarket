package utils

import "strings"

// AppError 业务错误类型，包含错误码和消息
type AppError struct {
	Code int
	Msg  string
}

// Error 实现 error 接口
func (e *AppError) Error() string {
	return e.Msg
}

// NewError 创建一个带业务错误码的错误
func NewError(code int, msg string) error {
	return &AppError{
		Code: code,
		Msg:  msg,
	}
}

// IsCustomError 尝试将 error 转换为 AppError
func IsCustomError(err error) (*AppError, bool) {
	if err == nil {
		return nil, false
	}
	if e, ok := err.(*AppError); ok {
		return e, true
	}
	return nil, false
}

// EqualAddress 简单比较两个以太坊地址（忽略大小写）
func EqualAddress(a, b string) bool {
	return strings.EqualFold(a, b)
}
