// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package config

import "github.com/zeromicro/go-zero/rest"

type Config struct {
	rest.RestConf

	MySQL          MySQLConfig
	Redis          RedisConfig
	Blockchain     BlockchainConfig
	Auth           AuthConfig
	Business       BusinessConfig
	DeepseekConfig DeepseekConfig
	X402Config     X402Config
}

type MySQLConfig struct {
	Host            string
	Port            int
	User            string
	Password        string
	Database        string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime int
}

type RedisConfig struct {
	Host     string
	Password string
	DB       int
	PoolSize int
}

type BlockchainConfig struct {
	RpcUrl     string
	ChainId    int64
	PrivateKey string
}

type AuthConfig struct {
	AccessSecret  string
	AccessExpire  int64
	RefreshSecret string
	RefreshExpire int64
}

type BusinessConfig struct {
	PlatformFeeRate   float64
	MinMarketDuration int64
	MaxMarketDuration int64
	MinLiquidity      float64
}

type DeepseekConfig struct {
	ApiKey string
}

type X402Config struct {
	Enable    bool    `json:"Enable" yaml:"Enable"`
	Amount    float64 `json:"Amount" yaml:"Amount"`       // 默认服务费用
	Recipient string  `json:"Recipient" yaml:"Recipient"` // 收款地址
	RpcUrl    string  `json:"RpcUrl" yaml:"RpcUrl"`       // Solana RPC 端点
}

// DefaultX402Config 返回默认配置
func DefaultX402Config() X402Config {
	return X402Config{
		Enable:    true,
		Amount:    0.001, // 默认 0.001 SOL
		Recipient: "",    // 需要配置
		RpcUrl:    "https://api.mainnet-beta.solana.com",
	}
}
