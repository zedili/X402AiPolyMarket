// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package main

import (
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"X402AiPolyMarket/PolyMarket/internal/config"
	"X402AiPolyMarket/PolyMarket/internal/handler"
	"X402AiPolyMarket/PolyMarket/internal/middleware"
	"X402AiPolyMarket/PolyMarket/internal/model"
	"X402AiPolyMarket/PolyMarket/internal/scheduler"
	"X402AiPolyMarket/PolyMarket/internal/svc"

	"github.com/zeromicro/go-zero/core/conf"
	"github.com/zeromicro/go-zero/core/logx"
	"github.com/zeromicro/go-zero/rest"
)

func main() {
	// 重定向 stderr 到文件，捕获所有致命错误
	stderrLog, err := os.OpenFile("stderr.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		panic(fmt.Sprintf("无法打开 stderr.log: %v", err))
	}
	defer stderrLog.Close()
	os.Stderr = stderrLog

	// 0️⃣ 加载配置文件
	configFile := flag.String("f", "etc/polymarket-api.yaml", "the config file")
	flag.Parse()

	var c config.Config
	conf.MustLoad(*configFile, &c)

	// 1️⃣ 创建 HTTP server
	server := rest.MustNewServer(c.RestConf)
	defer server.Stop()

	// 全局中间件：CORS 处理（保证前端可以正常跨域访问）
	server.Use(middleware.NewCorsMiddleware().Handle)

	// 3️⃣ 初始化 service context
	ctx := svc.NewServiceContext(c)

	// 4️⃣ 再注册 handlers（路由）
	handler.RegisterHandlers(server, ctx)

	// 5️⃣  启动定时器
	if err := scheduler.NewMarketSyncScheduler().Start(); err != nil {
		logx.Errorf("启动市场同步任务失败: %v", err)
	}

	// 6️⃣ 优雅关闭
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
		<-sigChan

		logx.Info("Shutting down server...")

		if err := model.CloseDB(); err != nil {
			logx.Errorf("Failed to close database: %v", err)
		}

		if err := model.CloseRedis(); err != nil {
			logx.Errorf("Failed to close redis: %v", err)
		}

		os.Exit(0)
	}()

	fmt.Printf("Starting server at %s:%d...\n", c.Host, c.Port)
	server.Start()
}
