package cache

import (
	"context"
	"encoding/json"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisCache 基于 Redis 的聊天缓存
type RedisCache struct {
	client *redis.Client
	prefix string
}

func NewRedisCache(client *redis.Client, prefix string) *RedisCache {
	return &RedisCache{
		client: client,
		prefix: prefix,
	}
}

func (r *RedisCache) Get(key string) (*CacheValue, bool) {
	ctx := context.Background()
	val, err := r.client.Get(ctx, r.prefix+key).Bytes()
	if err != nil {
		return nil, false
	}
	var cv CacheValue
	if err := json.Unmarshal(val, &cv); err != nil {
		return nil, false
	}
	return &cv, true
}

func (r *RedisCache) Set(key string, value *CacheValue, ttl time.Duration) {
	ctx := context.Background()
	data, _ := json.Marshal(value)
	r.client.Set(ctx, r.prefix+key, data, ttl)
}
