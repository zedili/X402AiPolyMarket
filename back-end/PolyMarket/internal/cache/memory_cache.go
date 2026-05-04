package cache

import (
	"sync"
	"time"
)

type memoryItem struct {
	value  *CacheValue
	expiry time.Time
}

// MemoryCache 内存缓存，带过期清理
type MemoryCache struct {
	mu    sync.RWMutex
	store map[string]*memoryItem
}

func NewMemoryCache(cleanupInterval time.Duration) *MemoryCache {
	c := &MemoryCache{store: make(map[string]*memoryItem)}
	go c.cleanupLoop(cleanupInterval)
	return c
}

func (c *MemoryCache) Get(key string) (*CacheValue, bool) {
	c.mu.RLock()
	item, ok := c.store[key]
	c.mu.RUnlock()
	if !ok || time.Now().After(item.expiry) {
		return nil, false
	}
	return item.value, true
}

func (c *MemoryCache) Set(key string, value *CacheValue, ttl time.Duration) {
	c.mu.Lock()
	c.store[key] = &memoryItem{
		value:  value,
		expiry: time.Now().Add(ttl),
	}
	c.mu.Unlock()
}

func (c *MemoryCache) cleanupLoop(interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for range ticker.C {
		c.mu.Lock()
		now := time.Now()
		for k, v := range c.store {
			if now.After(v.expiry) {
				delete(c.store, k)
			}
		}
		c.mu.Unlock()
	}
}
