package plmk

import (
	"encoding/json"
	"strconv"
	"time"
)

// MarketsResponse API 响应结构体，对应 marketsresp.json
type MarketsResponse []Market

// Market Polymarket 市场结构体
type Market struct {
	ID                           string       `json:"id"`
	Question                     string       `json:"question"`
	ConditionID                  string       `json:"conditionId"`
	Slug                         string       `json:"slug"`
	ResolutionSource             string       `json:"resolutionSource"`
	EndDate                      time.Time    `json:"endDate"`
	Liquidity                    string       `json:"liquidity"`
	StartDate                    time.Time    `json:"startDate"`
	Image                        string       `json:"image"`
	Icon                         string       `json:"icon"`
	Description                  string       `json:"description"`
	Outcomes                     []string     `json:"-"` // 由于原始是字符串数组，需要自定义解析
	OutcomePrices                []float64    `json:"-"` // 由于原始是字符串数组，需要自定义解析
	Volume                       string       `json:"volume"`
	Active                       bool         `json:"active"`
	Closed                       bool         `json:"closed"`
	MarketMakerAddress           string       `json:"marketMakerAddress"`
	CreatedAt                    time.Time    `json:"createdAt"`
	UpdatedAt                    time.Time    `json:"updatedAt"`
	New                          bool         `json:"new"`
	Featured                     bool         `json:"featured"`
	SubmittedBy                  string       `json:"submitted_by"`
	Archived                     bool         `json:"archived"`
	ResolvedBy                   string       `json:"resolvedBy"`
	Restricted                   bool         `json:"restricted"`
	GroupItemTitle               string       `json:"groupItemTitle"`
	GroupItemThreshold           string       `json:"groupItemThreshold"`
	QuestionID                   string       `json:"questionID"`
	EnableOrderBook              bool         `json:"enableOrderBook"`
	OrderPriceMinTickSize        float64      `json:"orderPriceMinTickSize"` // 注意这里使用了 string 标签
	OrderMinSize                 float64      `json:"orderMinSize"`
	VolumeNum                    float64      `json:"volumeNum"`
	LiquidityNum                 float64      `json:"liquidityNum"`
	EndDateIso                   string       `json:"endDateIso"`
	StartDateIso                 string       `json:"startDateIso"`
	HasReviewedDates             bool         `json:"hasReviewedDates"`
	Volume24hr                   float64      `json:"volume24hr"`
	Volume1wk                    float64      `json:"volume1wk"`
	Volume1mo                    float64      `json:"volume1mo"`
	Volume1yr                    float64      `json:"volume1yr"`
	ClobTokenIds                 []string     `json:"-"` // 由于原始是字符串数组，需要自定义解析
	UmaBond                      string       `json:"umaBond"`
	UmaReward                    string       `json:"umaReward"`
	Volume24hrClob               float64      `json:"volume24hrClob"`
	Volume1wkClob                float64      `json:"volume1wkClob"`
	Volume1moClob                float64      `json:"volume1moClob"`
	Volume1yrClob                float64      `json:"volume1yrClob"`
	VolumeClob                   float64      `json:"volumeClob"`
	LiquidityClob                float64      `json:"liquidityClob"`
	CustomLiveness               int          `json:"customLiveness"`
	AcceptingOrders              bool         `json:"acceptingOrders"`
	NegRisk                      bool         `json:"negRisk"`
	NegRiskRequestID             string       `json:"negRiskRequestID"`
	Events                       []Event      `json:"events"`
	Ready                        bool         `json:"ready"`
	Funded                       bool         `json:"funded"`
	AcceptingOrdersTimestamp     time.Time    `json:"acceptingOrdersTimestamp"`
	CYOM                         bool         `json:"cyom"`
	Competitive                  float64      `json:"competitive"`
	PagerDutyNotificationEnabled bool         `json:"pagerDutyNotificationEnabled"`
	Approved                     bool         `json:"approved"`
	ClobRewards                  []ClobReward `json:"clobRewards"`
	RewardsMinSize               float64      `json:"rewardsMinSize"`
	RewardsMaxSpread             float64      `json:"rewardsMaxSpread"`
	Spread                       float64      `json:"spread"`
	OneDayPriceChange            *float64     `json:"oneDayPriceChange,omitempty"`
	OneHourPriceChange           *float64     `json:"oneHourPriceChange,omitempty"`
	OneWeekPriceChange           *float64     `json:"oneWeekPriceChange,omitempty"`
	OneMonthPriceChange          *float64     `json:"oneMonthPriceChange,omitempty"`
	LastTradePrice               *float64     `json:"lastTradePrice,omitempty"`
	BestBid                      *float64     `json:"bestBid,omitempty"`
	BestAsk                      *float64     `json:"bestAsk,omitempty"`
	AutomaticallyActive          bool         `json:"automaticallyActive"`
	ClearBookOnStart             bool         `json:"clearBookOnStart"`
	SeriesColor                  string       `json:"seriesColor"`
	ShowGmpSeries                bool         `json:"showGmpSeries"`
	ShowGmpOutcome               bool         `json:"showGmpOutcome"`
	ManualActivation             bool         `json:"manualActivation"`
	NegRiskOther                 bool         `json:"negRiskOther"`
	UmaResolutionStatuses        []string     `json:"-"` // 由于原始是字符串数组，需要自定义解析
	PendingDeployment            bool         `json:"pendingDeployment"`
	Deploying                    bool         `json:"deploying"`
	DeployingTimestamp           time.Time    `json:"deployingTimestamp"`
	RFQEnabled                   bool         `json:"rfqEnabled"`
	HoldingRewardsEnabled        bool         `json:"holdingRewardsEnabled"`
	FeesEnabled                  bool         `json:"feesEnabled"`
	RequiresTranslation          bool         `json:"requiresTranslation"`
	FeeType                      *string      `json:"feeType"`
}

// Event 事件结构体
type Event struct {
	ID                  string        `json:"id"`
	Ticker              string        `json:"ticker"`
	Slug                string        `json:"slug"`
	Title               string        `json:"title"`
	Description         string        `json:"description"`
	ResolutionSource    string        `json:"resolutionSource"`
	StartDate           time.Time     `json:"startDate"`
	CreationDate        time.Time     `json:"creationDate"`
	EndDate             time.Time     `json:"endDate"`
	Image               string        `json:"image"`
	Icon                string        `json:"icon"`
	Active              bool          `json:"active"`
	Closed              bool          `json:"closed"`
	Archived            bool          `json:"archived"`
	New                 bool          `json:"new"`
	Featured            bool          `json:"featured"`
	Restricted          bool          `json:"restricted"`
	Liquidity           float64       `json:"liquidity"`
	Volume              float64       `json:"volume"`
	OpenInterest        float64       `json:"openInterest"`
	SortBy              string        `json:"sortBy"`
	CreatedAt           time.Time     `json:"createdAt"`
	UpdatedAt           time.Time     `json:"updatedAt"`
	Competitive         float64       `json:"competitive"`
	Volume24hr          float64       `json:"volume24hr"`
	Volume1wk           float64       `json:"volume1wk"`
	Volume1mo           float64       `json:"volume1mo"`
	Volume1yr           float64       `json:"volume1yr"`
	EnableOrderBook     bool          `json:"enableOrderBook"`
	LiquidityClob       float64       `json:"liquidityClob"`
	NegRisk             bool          `json:"negRisk"`
	CommentCount        int           `json:"commentCount"`
	CYOM                bool          `json:"cyom"`
	ShowAllOutcomes     bool          `json:"showAllOutcomes"`
	ShowMarketImages    bool          `json:"showMarketImages"`
	EnableNegRisk       bool          `json:"enableNegRisk"`
	AutomaticallyActive bool          `json:"automaticallyActive"`
	GMPChartMode        string        `json:"gmpChartMode"`
	NegRiskAugmented    bool          `json:"negRiskAugmented"`
	CumulativeMarkets   bool          `json:"cumulativeMarkets"`
	PendingDeployment   bool          `json:"pendingDeployment"`
	Deploying           bool          `json:"deploying"`
	RequiresTranslation bool          `json:"requiresTranslation"`
	EventMetadata       EventMetadata `json:"eventMetadata"`
}

// EventMetadata 事件元数据结构体
type EventMetadata struct {
	ContextDescription   string    `json:"context_description"`
	ContextRequiresRegen bool      `json:"context_requires_regen"`
	ContextUpdatedAt     time.Time `json:"context_updated_at"`
}

// ClobReward CLOB奖励结构体
type ClobReward struct {
	ID               string  `json:"id"`
	ConditionID      string  `json:"conditionId"`
	AssetAddress     string  `json:"assetAddress"`
	RewardsAmount    float64 `json:"rewardsAmount"`
	RewardsDailyRate float64 `json:"rewardsDailyRate"`
	StartDate        string  `json:"startDate"`
	EndDate          string  `json:"endDate"`
}

// UnmarshalJSON 自定义反序列化函数处理特殊字段
func (m *Market) UnmarshalJSON(data []byte) error {
	type Alias Market
	aux := &struct {
		OutcomesStr              string `json:"outcomes"`
		OutcomePricesStr         string `json:"outcomePrices"`
		ClobTokenIdsStr          string `json:"clobTokenIds"`
		UmaResolutionStatusesStr string `json:"umaResolutionStatuses"`
		//OrderPriceMinTickSizeStr string `json:"orderPriceMinTickSize"`
		//OrderMinSizeStr     string `json:"orderMinSize"`
		//RewardsMinSizeStr   string `json:"rewardsMinSize"`
		//RewardsMaxSpreadStr string `json:"rewardsMaxSpread"`
		*Alias
	}{
		Alias: (*Alias)(m),
	}

	if err := json.Unmarshal(data, &aux); err != nil {
		return err
	}

	// 解析 outcomes 数组
	if aux.OutcomesStr != "" {
		if err := json.Unmarshal([]byte(aux.OutcomesStr), &m.Outcomes); err != nil {
			m.Outcomes = []string{}
		}
	} else {
		m.Outcomes = []string{}
	}

	// 解析 outcomePrices 数组
	var outcomePricesStr []string
	if aux.OutcomePricesStr != "" {
		if err := json.Unmarshal([]byte(aux.OutcomePricesStr), &outcomePricesStr); err != nil {
			m.OutcomePrices = []float64{}
		} else {
			m.OutcomePrices = make([]float64, len(outcomePricesStr))
			for i, priceStr := range outcomePricesStr {
				price, err := strconv.ParseFloat(priceStr, 64)
				if err == nil {
					m.OutcomePrices[i] = price
				}
			}
		}
	} else {
		m.OutcomePrices = []float64{}
	}

	// 解析 clobTokenIds 数组
	if aux.ClobTokenIdsStr != "" {
		if err := json.Unmarshal([]byte(aux.ClobTokenIdsStr), &m.ClobTokenIds); err != nil {
			m.ClobTokenIds = []string{}
		}
	} else {
		m.ClobTokenIds = []string{}
	}

	// 解析 umaResolutionStatuses 数组
	if aux.UmaResolutionStatusesStr != "" {
		if err := json.Unmarshal([]byte(aux.UmaResolutionStatusesStr), &m.UmaResolutionStatuses); err != nil {
			m.UmaResolutionStatuses = []string{}
		}
	} else {
		m.UmaResolutionStatuses = []string{}
	}

	// 解析数值字符串字段
	//if aux.OrderPriceMinTickSizeStr != "" {
	//	m.OrderPriceMinTickSize, _ = strconv.ParseFloat(aux.OrderPriceMinTickSizeStr, 64)
	//}

	//if aux.OrderMinSizeStr != "" {
	//	m.OrderMinSize, _ = strconv.ParseFloat(aux.OrderMinSizeStr, 64)
	//}

	//if aux.RewardsMinSizeStr != "" {
	//	m.RewardsMinSize, _ = strconv.ParseFloat(aux.RewardsMinSizeStr, 64)
	//}

	//if aux.RewardsMaxSpreadStr != "" {
	//	m.RewardsMaxSpread, _ = strconv.ParseFloat(aux.RewardsMaxSpreadStr, 64)
	//}

	return nil
}

// MarshalJSON 自定义序列化函数
func (m Market) MarshalJSON() ([]byte, error) {
	type Alias Market
	outcomesBytes, _ := json.Marshal(m.Outcomes)
	pricesBytes, _ := json.Marshal(m.OutcomePrices)
	tokenIdsBytes, _ := json.Marshal(m.ClobTokenIds)
	statusesBytes, _ := json.Marshal(m.UmaResolutionStatuses)

	aux := &struct {
		OutcomesStr              string `json:"outcomes"`
		OutcomePricesStr         string `json:"outcomePrices"`
		ClobTokenIdsStr          string `json:"clobTokenIds"`
		UmaResolutionStatusesStr string `json:"umaResolutionStatuses"`
		OrderPriceMinTickSizeStr string `json:"orderPriceMinTickSize"`
		OrderMinSizeStr          string `json:"orderMinSize"`
		RewardsMinSizeStr        string `json:"rewardsMinSize"`
		RewardsMaxSpreadStr      string `json:"rewardsMaxSpread"`
		*Alias
	}{
		OutcomesStr:              string(outcomesBytes),
		OutcomePricesStr:         string(pricesBytes),
		ClobTokenIdsStr:          string(tokenIdsBytes),
		UmaResolutionStatusesStr: string(statusesBytes),
		OrderPriceMinTickSizeStr: strconv.FormatFloat(m.OrderPriceMinTickSize, 'f', -1, 64),
		OrderMinSizeStr:          strconv.FormatFloat(m.OrderMinSize, 'f', -1, 64),
		RewardsMinSizeStr:        strconv.FormatFloat(m.RewardsMinSize, 'f', -1, 64),
		RewardsMaxSpreadStr:      strconv.FormatFloat(m.RewardsMaxSpread, 'f', -1, 64),
		Alias:                    (*Alias)(&m),
	}
	return json.Marshal(aux)
}
