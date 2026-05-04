package cache

import (
	"sync"
)

type call struct {
	wg  sync.WaitGroup
	val *CacheValue
	err error
}

type SingleFlight struct {
	mu    sync.Mutex
	calls map[string]*call
}

func NewSingleFlight() *SingleFlight {
	return &SingleFlight{calls: make(map[string]*call)}
}

// Do 确保同一 key 只执行一次 fn，其他协程等待结果
func (s *SingleFlight) Do(key string, fn func() (*CacheValue, error)) (*CacheValue, error) {
	s.mu.Lock()
	if c, ok := s.calls[key]; ok {
		s.mu.Unlock()
		c.wg.Wait()
		return c.val, c.err
	}
	c := &call{}
	c.wg.Add(1)
	s.calls[key] = c
	s.mu.Unlock()

	c.val, c.err = fn()
	c.wg.Done()

	s.mu.Lock()
	delete(s.calls, key)
	s.mu.Unlock()

	return c.val, c.err
}
