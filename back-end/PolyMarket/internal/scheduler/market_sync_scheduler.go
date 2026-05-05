package scheduler

import (
	"X402AiPolyMarket/PolyMarket/internal/polymarket/service"
	"context"
	"runtime/debug"
	"sync"
	"time"

	"github.com/robfig/cron/v3"
	"github.com/zeromicro/go-zero/core/logx"
)

// MarketSyncScheduler 市场数据同步定时任务调度器
type MarketSyncScheduler struct {
	cron        *cron.Cron
	syncService *service.MarketSyncService
	ctx         context.Context
	cancel      context.CancelFunc
	wg          sync.WaitGroup
}

// NewMarketSyncScheduler 创建市场数据同步调度器
func NewMarketSyncScheduler() *MarketSyncScheduler {
	ctx, cancel := context.WithCancel(context.Background())

	return &MarketSyncScheduler{
		cron:        cron.New(cron.WithSeconds()),
		syncService: service.NewMarketSyncService(),
		ctx:         ctx,
		cancel:      cancel,
	}
}

// Start 启动定时任务
func (s *MarketSyncScheduler) Start() error {
	logx.Info("启动市场数据同步定时任务...")

	// 每分钟同步一次市场数据
	_, err := s.cron.AddFunc("0 */5 * * * *", func() {
		s.wg.Add(1)
		defer s.wg.Done()
		defer func() {
			if r := recover(); r != nil {
				//捕获当前 gorutine 的 panic，捕获后程序继续运行
				logx.Errorf("同步任务发生 panic: %v\n堆栈: %s", r, debug.Stack())
			}
		}()

		logx.Info("=== 开始执行市场数据同步任务 ===")
		startTime := time.Now()

		timeCtx, cancel := context.WithTimeout(s.ctx, 10*time.Minute)
		defer cancel()
		if err := s.syncService.SyncMarkets(timeCtx); err != nil {
			logx.Errorf("市场数据同步失败: %v", err)
		} else {
			logx.Infof("市场数据同步成功，耗时: %v", time.Since(startTime))
		}
	})

	if err != nil {
		return err
	}

	if err != nil {
		return err
	}

	go func() {
		ticker := time.NewTicker(1 * time.Minute)
		defer ticker.Stop()
		for {
			select {
			case <-s.ctx.Done():
				logx.Info("市场数据同步定时任务已停止")
				logx.Error(string(debug.Stack()))
				return
			case <-time.After(time.Second * 30):
				logx.Info("=== 调度器存活心跳 ===")
			case <-ticker.C:
				if len(s.cron.Entries()) == 0 {
					logx.Error("FATAL: cron 中没有任何任务，调度器可能已意外停止")
					logx.Error(string(debug.Stack()))
				}
			}
		}
	}()

	s.cron.Start()

	go func() {
		<-s.ctx.Done()
		logx.Errorf("市场数据同步定时任务意外终止")
	}()

	logx.Info("市场数据同步定时任务启动成功")

	return nil
}

// Stop 停止定时任务
func (s *MarketSyncScheduler) Stop() {
	logx.Info("正在停止市场数据同步定时任务...")

	// 取消上下文
	s.cancel()

	// 停止 cron
	s.cron.Stop()

	// 等待所有任务完成
	s.wg.Wait()

	logx.Info("市场数据同步定时任务已停止")
}

// TriggerNow 立即触发一次同步（用于测试或手动触发）
func (s *MarketSyncScheduler) TriggerNow() error {
	logx.Info("手动触发市场数据同步...")

	s.wg.Add(1)
	defer s.wg.Done()

	startTime := time.Now()
	if err := s.syncService.SyncMarkets(s.ctx); err != nil {
		logx.Errorf("手动触发同步失败: %v", err)
		return err
	}

	logx.Infof("手动触发同步成功，耗时: %v", time.Since(startTime))
	return nil
}
