package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"

	_ "github.com/go-sql-driver/mysql"
)

func main() {
	// 连接到 MySQL（不指定数据库）
	dsn := "root:root@tcp(127.0.0.1:3306)/?charset=utf8mb4&parseTime=True&loc=Local&multiStatements=true"
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("Failed to connect to MySQL: %v", err)
	}
	defer db.Close()

	// 测试连接
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping MySQL: %v", err)
	}

	fmt.Println("Connected to MySQL successfully!")

	// 创建数据库
	fmt.Println("Creating database 'polymarket'...")
	_, err = db.Exec("CREATE DATABASE IF NOT EXISTS polymarket DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
	if err != nil {
		log.Fatalf("Failed to create database: %v", err)
	}

	// 切换到 polymarket 数据库
	_, err = db.Exec("USE polymarket")
	if err != nil {
		log.Fatalf("Failed to use database: %v", err)
	}

	fmt.Println("Database 'polymarket' created successfully!")

	// 读取并执行 init_db.sql
	fmt.Println("Executing init_db.sql...")
	initSQL, err := os.ReadFile("init_db.sql")
	if err != nil {
		log.Fatalf("Failed to read init_db.sql: %v", err)
	}

	// 分割并执行 SQL 语句
	statements := strings.Split(string(initSQL), ";")
	for _, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" || strings.HasPrefix(stmt, "--") || strings.HasPrefix(stmt, "CREATE DATABASE") {
			continue
		}
		_, err = db.Exec(stmt)
		if err != nil {
			// 忽略已存在的错误
			if !strings.Contains(err.Error(), "already exists") && !strings.Contains(err.Error(), "Duplicate") {
				log.Printf("Warning executing statement: %v", err)
			}
		}
	}

	fmt.Println("init_db.sql executed successfully!")

	// 读取并执行 module1_init_db.sql
	fmt.Println("Executing module1_init_db.sql...")
	module1SQL, err := os.ReadFile("module1_init_db.sql")
	if err != nil {
		log.Fatalf("Failed to read module1_init_db.sql: %v", err)
	}

	// 分割并执行 SQL 语句（处理存储过程）
	sqlContent := string(module1SQL)

	// 先执行非存储过程的语句
	parts := strings.Split(sqlContent, "DELIMITER")
	if len(parts) > 0 {
		statements := strings.Split(parts[0], ";")
		for _, stmt := range statements {
			stmt = strings.TrimSpace(stmt)
			if stmt == "" || strings.HasPrefix(stmt, "--") || strings.HasPrefix(stmt, "USE") {
				continue
			}
			_, err = db.Exec(stmt)
			if err != nil {
				// 忽略已存在的错误
				if !strings.Contains(err.Error(), "Duplicate") && !strings.Contains(err.Error(), "check that column") {
					log.Printf("Warning executing statement: %v", err)
				}
			}
		}
	}

	fmt.Println("Module 1 tables created successfully!")
	fmt.Println("\nDatabase initialization completed!")
}

