package utils

import (
	"crypto/ed25519"
	"encoding/base64"
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

// 验证 solana 签名
func VerifySolanaSignature(message, signature, address string) (bool, error) {
	// 验证 solana 地址格式
	if !IsValidSolanaAddress(address) {
		return false, errors.New("invalid solana address")
	}

	// 解码 Base58 地址为公钥字节
	pubKeyBytes, err := decodeBase58(address)
	if err != nil {
		return false, fmt.Errorf("failed to decode solana address %w", err)
	}

	// solana 的公钥必须是 32 字节
	if len(pubKeyBytes) != 32 {
		return false, errors.New("invalid solana public key length")
	}

	// 解码签名（通常是 Base64 编码）
	signatureBytes, err := base64.StdEncoding.DecodeString(signature)
	if err != nil {
		// 尝试 hex 解码
		signatureBytes, err = hexutil.Decode(signature)
		if err != nil {
			return false, fmt.Errorf("failed to decode signature:%w", signature)
		}
	}

	// solana 签名必须是 64 字节（Ed25519 签名）
	if len(signatureBytes) != 64 {
		return false, errors.New("invalid solana signature length")
	}

	// 将消息转换成字节数组
	messageBytes := []byte(message)

	// 使用 Ed25519 包验证签名
	pubKey := ed25519.PublicKey(pubKeyBytes)
	verify := ed25519.Verify(pubKey, messageBytes, signatureBytes)

	return verify, nil

}

func IsValidSolanaAddress(address string) bool {
	address = strings.TrimSpace(address)
	// 地址格式 (base58 编码，只有字母和数字（大小写敏感），无校验和)
	// ** 特意移除4个容易混淆的字符：数字0、大写字母O、大写字母I、小写字母l
	if len(address) < 32 || len(address) > 44 {
		return false
	}

	// 尝试 Base58 解码
	_, err := decodeBase58(address)

	return err == nil
}

func decodeBase58(address string) ([]byte, error) {
	// base58 的字符表
	const base58Alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

	// 计算前导零的数量
	leadingZeros := 0
	for _, c := range address {
		if c == '1' {
			leadingZeros++
		} else {
			break
		}
	}

	// base58 解码
	var decodedBig []byte
	for _, char := range address {
		idx := strings.IndexRune(base58Alphabet, char)
		if idx == -1 {
			return nil, errors.New("invalid base58 character")
		}

		var carry int64 = int64(idx)
		for i := len(decodedBig) - 1; i >= 0; i-- {
			carry += int64(decodedBig[i]) * 58
			decodedBig[i] = byte(carry & 0xff)
			carry >>= 8
		}

		for carry > 0 {
			decodedBig = append([]byte{byte(carry & 0xff)}, decodedBig...)
			carry >>= 8
		}
	}

	// 添加前缀零
	result := make([]byte, leadingZeros+len(decodedBig))
	copy(result[leadingZeros:], decodedBig)

	return result, nil

}
