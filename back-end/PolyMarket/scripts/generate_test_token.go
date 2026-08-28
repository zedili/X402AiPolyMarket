//go:build gentoken

package main

import (
	"fmt"
	"log"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func main() {
	// 测试用的钱包地址
	walletAddress := "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

	// 从配置文件中获取的密钥（需要与 etc/polymarket-api.yaml 中的 AccessSecret 一致）
	accessSecret := "your-access-secret-key-change-in-production"

	// 创建Token
	now := time.Now()
	claims := jwt.MapClaims{
		"wallet_address": walletAddress,
		"exp":            now.Add(24 * time.Hour).Unix(),
		"iat":            now.Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(accessSecret))
	if err != nil {
		log.Fatalf("Failed to generate token: %v", err)
	}

	fmt.Println("===========================================")
	fmt.Println("Test Access Token Generated Successfully!")
	fmt.Println("===========================================")
	fmt.Println()
	fmt.Println("Wallet Address:", walletAddress)
	fmt.Println()
	fmt.Println("Access Token:")
	fmt.Println(tokenString)
	fmt.Println()
	fmt.Println("Token expires in: 24 hours")
	fmt.Println()
	fmt.Println("===========================================")
	fmt.Println("Use this token in your API requests:")
	fmt.Println("Authorization: Bearer " + tokenString)
	fmt.Println("===========================================")
}
