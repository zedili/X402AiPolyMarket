package polymarket

import (
	"testing"
)

func TestGetMarkets(t *testing.T) {
	client := NewGammaClient()
	markets, err := client.GetMarkets(nil)
	if err != nil {
		t.Errorf("GetMarkets() error = %v", err)
		return
	}
	if len(markets) == 0 {
		t.Errorf("GetMarkets() returned empty list")
		return
	}
	t.Logf("GetMarkets() returned %d markets", len(markets))
}
