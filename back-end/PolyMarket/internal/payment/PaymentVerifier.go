package payment

import (
	"context"
	"fmt"
	"time"

	"github.com/gagliardetto/solana-go"
	"github.com/gagliardetto/solana-go/rpc"
)

// PaymentVerifier 支付验证器，负责到链上确认支付是否真实完成
type PaymentVerifier struct {
	rpcClient *rpc.Client // 用于与Solana RPC节点通信的客户端
	recipient string      // 你的收款地址，用于验证
}

// NewPaymentVerifier 创建一个新的支付验证器
// rpcURL: 根据你的环境选择，例如 rpc.DevNetRPCEndpoint, rpc.MainNetBetaRPCEndpoint
func NewPaymentVerifier(rpcURL string, recipient string) *PaymentVerifier {
	return &PaymentVerifier{
		//rpcClient: rpc.New(rpc.DevNet_RPC),
		rpcClient: rpc.New(rpcURL),
		recipient: recipient,
	}
}

// TransactionStatus 定义交易状态
type TransactionStatus int

const (
	StatusNotFound  TransactionStatus = iota // 交易未找到
	StatusConfirmed                          // 交易已确认但尚未最终确定
	StatusFinalized                          // 交易已完成最终确认，不可回滚
	StatusFailed                             // 交易执行失败
)

// VerifyResult 是 VerifyPayment 方法的返回结构体
type VerifyResult struct {
	Status        TransactionStatus // 交易状态
	Payer         string            // 付款方地址
	Recipient     string            // 收款地址
	Amount        uint64            // 转账金额（lamports）
	Memo          string            // 交易备注
	Confirmations int               // 确认数
	ErrorReason   string            // 如果失败，这里包含失败原因

}

// VerifyPayment 是核心方法，根据签名进行链上验证
func (pv *PaymentVerifier) VerifyPayment(ctx context.Context, signatureStr string) (*VerifyResult, error) {
	// 第一步：解析签名
	signature, err := solana.SignatureFromBase58(signatureStr)
	if err != nil {
		return nil, fmt.Errorf("invalid signature format: %w", err)
	}

	// 第二步：查询交易详情 (带重试机制)
	txResult, err := pv.getTransactionWithRetry(ctx, signature, 10)
	if err != nil {
		return nil, fmt.Errorf("failed to get transaction: %w", err)
	}

	// 第三步：解析交易结果
	return pv.parseTransactionResult(txResult)
}

// getTransactionWithRetry 带重试机制的交易查询，以应对网络延迟
func (pv *PaymentVerifier) getTransactionWithRetry(ctx context.Context, sig solana.Signature, maxRetries int) (*rpc.GetTransactionResult, error) {
	var lastErr error
	// 必须设置 MaxSupportedTransactionVersion，否则很多交易解析会失败
	maxVersion := uint64(0)
	opts := &rpc.GetTransactionOpts{
		Commitment:                     rpc.CommitmentFinalized,
		MaxSupportedTransactionVersion: &maxVersion,
	}

	for i := 0; i < maxRetries; i++ {
		txResult, err := pv.rpcClient.GetTransaction(ctx, sig, opts)
		if err == nil && txResult != nil {
			return txResult, nil
		}
		if err == rpc.ErrNotFound {
			lastErr = fmt.Errorf("transaction not found after %d seconds", i*2)
			time.Sleep(2 * time.Second)
			continue
		}
		if err != nil {
			return nil, fmt.Errorf("rpc error: %w", err)
		}
	}
	return nil, lastErr
}

// parseTransactionResult 解析交易详情，验证支付内容
func (pv *PaymentVerifier) parseTransactionResult(txResult *rpc.GetTransactionResult) (*VerifyResult, error) {
	//spew.Dump(txResult)                              // 打印完整交易对象
	//spew.Dump(txResult.Transaction.GetTransaction()) // 打印解析后的交易

	// 1. 提取内部交易对象
	innerTx, err := txResult.Transaction.GetTransaction()
	if err != nil {
		return nil, fmt.Errorf("failed to decode transaction: %w", err)
	}

	result := &VerifyResult{
		Payer: innerTx.Message.AccountKeys[0].String(),
	}

	// 获取交易元数据 (Meta)，包含执行状态、日志、费用等信息
	meta := txResult.Meta
	if meta == nil {
		return nil, fmt.Errorf("transaction metadata is nil")
	}

	// 1. 检查交易执行状态
	// meta.Err 如果为 nil，表示交易执行成功
	if meta.Err != nil {
		result.Status = StatusFailed
		result.ErrorReason = fmt.Sprintf("%v", meta.Err)
		return result, nil
	}

	// 2. 验证交易确认状态
	if txResult.Slot == 0 {
		return nil, fmt.Errorf("transaction not yet confirmed")
	}
	result.Status = StatusFinalized
	// result.Confirmations = meta.ComputeUnitsConsumed // 这不是确认数，Solana没有内置的确认数概念

	// 3. 解析交易指令，校验收款地址和金额
	// Solana交易的底层逻辑被封装为“指令(Instruction)”，每条指令完成一个特定操作（如转账）。
	// 系统程序(System Program)的Transfer指令，是SOL转账的标准方式。
	instructions := innerTx.Message.Instructions
	for _, instruction := range instructions {
		// 通过指令所调用的程序ID来判断指令类型
		programID := innerTx.Message.AccountKeys[instruction.ProgramIDIndex]

		// 系统程序(System Program) 的地址是固定的，其Transfer指令的data前4个字节也是固定的
		if programID.Equals(solana.SystemProgramID) && len(instruction.Data) >= 4 {
			// 检查是否为Transfer指令 (前4个字节为2,0,0,0)
			if instruction.Data[0] == 2 && instruction.Data[1] == 0 && instruction.Data[2] == 0 && instruction.Data[3] == 0 {
				// 解析转账信息
				fromPubkey := innerTx.Message.AccountKeys[instruction.Accounts[0]].String() // 付款方
				toPubkey := innerTx.Message.AccountKeys[instruction.Accounts[1]].String()   // 收款方
				//amount := binary.LittleEndian.Uint64(instruction.Data[4:12])  // 更好的方式是从Meta中直接对比余额变化

				// 获取交易前和交易后的账户余额，这对于复杂交易更可靠
				//preBalance := meta.PreTokenBalances // 仅适用于SPL Token
				//postBalance := meta.PostTokenBalances

				result.Payer = fromPubkey
				result.Recipient = toPubkey

				// 对于SOL余额，可以通过PreBalances和PostBalances获取
				if len(meta.PreBalances) > 1 && len(meta.PostBalances) > 1 {
					// 计算收款方余额变化
					toIndex := instruction.Accounts[1]
					if toIndex < uint16(len(meta.PreBalances)) && toIndex < uint16(len(meta.PostBalances)) {
						result.Amount = meta.PostBalances[toIndex] - meta.PreBalances[toIndex]
					}
				}

				// 验证收款地址（这是最重要的一步！）
				if toPubkey != pv.recipient {
					// 收款地址不匹配，可能是伪造的交易
					return nil, fmt.Errorf("recipient mismatch: expected %s, got %s", pv.recipient, toPubkey)
				}

				// 可选：验证付款方
				// if fromPubkey != expectedPayer {
				//     return nil, fmt.Errorf("payer mismatch")
				// }

				// 验证金额
				if result.Amount == 0 {
					return nil, fmt.Errorf("transfer amount is zero, potential fake transaction")
				}
				break // 找到转账指令后退出循环
			}
		}

	}

	// 4. 提取备注(Memo)
	// 检查Memo程序ID
	for _, instruction := range instructions {
		// 通过指令所调用的程序ID来判断指令类型
		programID := innerTx.Message.AccountKeys[instruction.ProgramIDIndex]
		if programID.Equals(solana.MemoProgramID) {
			// 解析memo数据
			result.Memo = string(instruction.Data)
			break
		}
	}

	return result, nil
}
