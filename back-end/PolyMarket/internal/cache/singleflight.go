package cache

import (
	"sync"
)

// call 表示一个正在进行的调用
// 用于存储正在执行的函数结果，供其他等待的 goroutine 共享
type call struct {
	wg  sync.WaitGroup // 等待组，用于通知其他 goroutine 该调用已完成
	val *CacheValue    // 缓存执行成功后的值
	err error          // 缓存执行的错误信息
}

// SingleFlight 单飞模式
// 核心思想：对于相同的 key ，无论有多少并发请求，只执行一次 fn func() ，其他相同的请求会等待第一个请求完成，并共享结果

type SingleFlight struct {
	mu    sync.Mutex       // 互斥锁： 保护 calls map 的并发安全
	calls map[string]*call // 正在执行的调用映射表， key 为请求的唯一标识
}

func NewSingleFlight() *SingleFlight {
	return &SingleFlight{calls: make(map[string]*call)}
}

// Do 确保同一 key 只执行一次 fn，其他协程等待结果
// 执行函数
func (s *SingleFlight) Do(key string, fn func() (*CacheValue, error)) (*CacheValue, error) {
	// -----------   1、获取锁，检查是否已有相同 key 的请求在执行
	s.mu.Lock() // 加锁，确保 goroutine 的并发安全
	if c, ok := s.calls[key]; ok {
		s.mu.Unlock()       // 释放锁，避免阻塞其他请求 goroutine 的检查
		c.wg.Wait()         // 等待第一个请求任务调用 done，完成请求
		return c.val, c.err // 返回共享的执行结果、错误信息
	}
	// -----------   2、如果没有，则创建一个调用对象，并注册到映射表、执行实际的请求
	c := &call{}     // 创建一个调用对象
	c.wg.Add(1)      // 增加等待计数（表示一个任务在执行）
	s.calls[key] = c // 注册到映射表，后续相同 key 的请求会发现他
	s.mu.Unlock()    // 释放锁，允许其他请求进行检查

	// 执行函数
	// 只有第一个到达的 goroutine 会执行到这里
	c.val, c.err = fn() // 执行函数，一般是较为耗时的操作
	c.wg.Done()         // 减少等待计数，触发所有 wait() 的goroutine 继续执行

	// -------------3、任务执行完毕，从映射表中删除该 key 的调用对象

	s.mu.Lock()          // 加锁 并发安全
	delete(s.calls, key) // 删除该 key 的调用对象
	s.mu.Unlock()        // 释放锁

	return c.val, c.err
}
