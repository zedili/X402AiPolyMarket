package service

import (
	"X402AiPolyMarket/PolyMarket/internal/config"
	"X402AiPolyMarket/PolyMarket/internal/model"
	"context"
	"flag"
	"fmt"
	"testing"

	"github.com/zeromicro/go-zero/core/conf"
	"github.com/zeromicro/go-zero/core/logx"
)

// BaseServiceTest 测试基类，提供通用的初始化和清理功能
type BaseServiceTest struct {
	t          *testing.T
	ctx        context.Context
	cancelFunc context.CancelFunc
}

// Newbase_service_test 创建测试基类实例
func NewBaseServiceTest(t *testing.T) *BaseServiceTest {
	// 解析命令行参数（如果需要
	flag.Parse()

	// 标记为 “辅助函数”，错误发生时，不会指向辅助函数的代码行
	t.Helper()
	ctx, cancel := context.WithCancel(context.Background())

	return &BaseServiceTest{
		t:          t,
		ctx:        ctx,
		cancelFunc: cancel,
	}
}

// Setup 前置初始化（相当于 Before）
func (b *BaseServiceTest) Setup() {
	b.t.Helper()

	var c config.Config
	// "f" 就是一个命令行参数的短名称，用于在启动程序时动态指定配置文件路径
	configFile := flag.String("f", "../../../etc/polymarket-api.yaml", "the config file")
	conf.MustLoad(*configFile, &c)

	fmt.Println("=== 开始设置测试环境 ===")
	// 初始化数据库
	if err := model.InitDB(c.MySQL); err != nil {
		panic(err)
	}
	fmt.Println("✓ 数据库连接成功")
	// 初始化 Redis
	if err := model.InitRedis(c.Redis); err != nil {
		panic(err)
	}
	fmt.Println("✓ redis连接成功")

	fmt.Println("=== 测试环境准备完成 ===")
}

// Teardown 后置清理（相当于 After）
func (b *BaseServiceTest) Teardown() {
	b.t.Helper()

	fmt.Println("=== 开始清理测试环境 ===")

	// 取消上下文
	if b.cancelFunc != nil {
		b.cancelFunc()
	}

	if err := model.CloseDB(); err != nil {
		logx.Errorf("Failed to close database: %v", err)
	}

	if err := model.CloseRedis(); err != nil {
		logx.Errorf("Failed to close redis: %v", err)
	}

	fmt.Println("=== 测试环境清理完成 ===")
}

// GetContext 获取上下文
func (b *BaseServiceTest) GetContext() context.Context {
	return b.ctx
}
