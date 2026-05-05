package polymarket

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/zeromicro/go-zero/core/logx"
)

const (
	//        markets：https://gamma-api.polymarket.com/markets
	GammaAPIBaseURL = "https://gamma-api.polymarket.com"
)

type GammaClient struct {
	baseURL    string
	httpClient *http.Client
}

func NewGammaClient() *GammaClient {
	return &GammaClient{
		baseURL: GammaAPIBaseURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// GetMarkets 获取市场列表
func (c *GammaClient) GetMarkets(params map[string]string, offset *int) ([]Market, error) {

	url := c.baseURL + "/markets" + "?limit=100" + "&offset=" + fmt.Sprintf("%d", *offset)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("create request failed: %w", err)
	}

	q := req.URL.Query()
	for k, v := range params {
		q.Add(k, v)
	}
	req.URL.RawQuery = q.Encode()

	resp, err := c.httpClient.Do(req)
	logx.Infof("GetMarkets: %s", req.URL.String())

	if err != nil {
		return nil, fmt.Errorf("request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API returned status %d", resp.StatusCode)
	}

	var markets []Market
	if err := json.NewDecoder(resp.Body).Decode(&markets); err != nil {
		return nil, fmt.Errorf("decode response failed: %w", err)
	}

	logx.Infof("Fetched %d markets from Polymarket API", len(markets))
	return markets, nil
}
