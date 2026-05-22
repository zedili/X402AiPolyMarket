package payment

import (
	"context"

	"testing"

	"github.com/gagliardetto/solana-go/rpc"
)

func TestVerifiTransaction(t *testing.T) {
	//Hk8as5BkVuhownGZUuRWa37SWnGgH1RtoWNpYqowyita
	verifier := NewPaymentVerifier(rpc.DevNet_RPC, "Hk8as5BkVuhownGZUuRWa37SWnGgH1RtoWNpYqowyita")
	verifyResult, err := verifier.VerifyPayment(context.Background(),
		"4wBSkdcLWAHMGNAr6x5rJeJFxEvUdXEJJiP3B9xCTZqqiyWH233CExMNdKjA2bPGBpujoFit1wpawgPpry6gZ19m",
	)

	if err != nil {
		t.Error(err)
	}
	t.Log(verifyResult)

}
