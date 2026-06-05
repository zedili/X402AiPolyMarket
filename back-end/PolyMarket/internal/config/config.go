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
	Enable         bool                   `json:"Enable" yaml:"Enable"`
	FacilitatorUrl string                 `json:"FacilitatorUrl" yaml:"FacilitatorUrl"`
	DefaultNetwork string                 `json:"DefaultNetwork" yaml:"DefaultNetwork"`
	DefaultScheme  string                 `json:"DefaultScheme" yaml:"DefaultScheme"`
	Routes         map[string]RouteConfig `json:"Routes" yaml:"Routes"`
}

type RouteConfig struct {
	Accepts     []AcceptConfig `json:"Accepts" yaml:"Accepts"`
	Description string         `json:"Description" yaml:"Description"`
	MimeType    string         `json:"MimeType" yaml:"MimeType"`
}

type AcceptConfig struct {
	Scheme  string `json:"Scheme" yaml:"Scheme"`
	Asset   string `json:"Asset" yaml:"Asset"`
	Price   string `json:"Price" yaml:"Price"`
	Network string `json:"Network" yaml:"Network"`
	PayTo   string `json:"PayTo" yaml:"PayTo"`
	Extra   Extra
}

type Extra struct {
	Name    string `json:"Name" yaml:"Name"`
	Version string `json:"Version" yaml:"Version"`
}
