package service

import (
	"context"
	"testing"
)

func TestSyncMarkets(t *testing.T) {
	//1、创建测试基类实例
	testBase := NewBaseServiceTest(t)
	testBase.Setup()
	// defer 作用是延迟执行某行的调用（当前函数 return 时执行）
	defer testBase.Teardown()

	// 创建一个测试实例
	s := NewMarketSyncService()

	// 测试 SyncMarkets 方法
	err := s.SyncMarkets(context.Background())
	if err != nil {
		t.Errorf("SyncMarkets() error = %v", err)
	}
}
