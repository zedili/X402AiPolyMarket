package utils

import (
	"errors"
	"fmt"
	"strings"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/ethereum/go-ethereum/crypto"
)

// VerifySignature 验证以太坊签名
func VerifySignature(message, signature, address string) (bool, error) {
	// 标准化地址格式
	if !strings.HasPrefix(address, "0x") {
		address = "0x" + address
	}
	if !common.IsHexAddress(address) {
		return false, errors.New("invalid ethereum address")
	}

	// 解码签名
	sig, err := hexutil.Decode(signature)
	if err != nil {
		return false, fmt.Errorf("failed to decode signature: %w", err)
	}

	// 签名长度必须是 65 字节
	if len(sig) != 65 {
		return false, errors.New("invalid signature length")
	}

	// 调整 v 值（MetaMask 签名的 v 值是 27 或 28）
	if sig[64] >= 27 {
		sig[64] -= 27
	}

	// 构造以太坊签名消息
	hash := crypto.Keccak256Hash([]byte(fmt.Sprintf("\x19Ethereum Signed Message:\n%d%s", len(message), message)))

	// 恢复公钥
	pubKey, err := crypto.SigToPub(hash.Bytes(), sig)
	if err != nil {
		return false, fmt.Errorf("failed to recover public key: %w", err)
	}

	// 从公钥恢复地址
	recoveredAddr := crypto.PubkeyToAddress(*pubKey)

	// 比较地址
	return strings.EqualFold(recoveredAddr.Hex(), address), nil
}

// IsValidAddress 验证以太坊地址格式
func IsValidAddress(address string) bool {
	address = strings.TrimSpace(address)
	return common.IsHexAddress(address)
}

// NormalizeAddress 标准化地址格式
func NormalizeAddress(address string) string {
	if !strings.HasPrefix(address, "0x") {
		address = "0x" + address
	}
	return strings.ToLower(address)
}
