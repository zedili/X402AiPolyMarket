package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
)

func main() {
	// 与 etc/polymarket-api.yaml 中的 MySQL 配置保持一致：root 用户无密码
	rootDSN := "root:@tcp(127.0.0.1:3306)/?charset=utf8mb4&parseTime=True&loc=Local&multiStatements=true"
	rootDB, err := sql.Open("mysql", rootDSN)
	checkErr(err, "连接 MySQL 失败")
	defer rootDB.Close()
	checkErr(rootDB.Ping(), "无法连接到 MySQL")

	// Step 1: 检查数据库是否存在
	var dbExists bool
	err = rootDB.QueryRow(`SELECT COUNT(*) > 0 FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = 'polymarket'`).Scan(&dbExists)
	checkErr(err, "检查数据库是否存在失败")

	if !dbExists {
		fmt.Println("📦 创建数据库 polymarket...")
		_, err = rootDB.Exec(`CREATE DATABASE polymarket DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
		checkErr(err, "创建数据库失败")
		fmt.Println("✅ 数据库 polymarket 创建成功")
	} else {
		fmt.Println("✅ 数据库 polymarket 已存在")
	}

	// Step 2: 连接 polymarket 数据库
	dbDSN := "root:@tcp(127.0.0.1:3306)/polymarket?charset=utf8mb4&parseTime=True&loc=Local&multiStatements=true"
	db, err := sql.Open("mysql", dbDSN)
	checkErr(err, "连接 polymarket 数据库失败")
	defer db.Close()
	checkErr(db.Ping(), "无法连接到数据库 polymarket")

	// Step 3: 初始化 init_db.sql（如 system_configs）
	if !tableExists(db, "system_configs") {
		execSQLFile(db, "init_db.sql")
	} else {
		fmt.Println("⚠️ 表 system_configs 已存在，跳过 init_db.sql")
	}

	// Step 4: 初始化 module1（如 users 表）
	if !tableExists(db, "users") {
		execSQLFile(db, "module1_init_db.sql")
	} else {
		fmt.Println("⚠️ 表 users 已存在，跳过 module1_init_db.sql")
	}

	// Step 5: 初始化 module2（如 markets, market_categories 表）
	if !tableExists(db, "markets") || !tableExists(db, "market_categories") {
		execSQLFile(db, "module2_init_db.sql")
	} else {
		fmt.Println("⚠️ 表 markets / market_categories 已存在，跳过 module2_init_db.sql")
	}

	// Step 6: 初始化 module3（交易模块：orders, trades, positions 表）
	if !tableExists(db, "orders") || !tableExists(db, "trades") || !tableExists(db, "positions") {
		execSQLFile(db, "module3_init_db.sql")
	} else {
		fmt.Println("⚠️ 表 orders / trades / positions 已存在，跳过 module3_init_db.sql")
	}

	// Step 7: 如果 market_categories 无数据，插入默认分类
	if tableExists(db, "market_categories") && !tableHasData(db, "market_categories") {
		fmt.Println("📥 插入默认市场分类...")
		_, err := db.Exec(`
			INSERT INTO market_categories (name, display_name, icon, description, sort_order) VALUES
			('CRYPTO', 'Cryptocurrency', '₿', '加密货币相关预测市场', 1),
			('TECH', 'Technology', '💻', '科技行业相关预测市场', 2),
			('STOCKS', 'Stocks', '📈', '股票市场相关预测', 3),
			('POLITICS', 'Politics', '🏛️', '政治事件相关预测', 4),
			('SPORTS', 'Sports', '⚽', '体育赛事相关预测', 5),
			('SCIENCE', 'Science', '🔬', '科学研究相关预测', 6)
			ON DUPLICATE KEY UPDATE 
			  display_name = VALUES(display_name),
			  icon = VALUES(icon),
			  description = VALUES(description),
			  sort_order = VALUES(sort_order);
		`)
		checkErr(err, "插入默认分类失败")
		fmt.Println("✅ 默认分类插入成功")
	} else {
		fmt.Println("✅ 分类表已有数据，跳过默认分类插入")
	}

	// Step 8: Market 增加 市场id 字段
	execSQLFile(db, "module4_init_db.sql")

	// Step 9: 初始化 module5（AI预测模块：ai_prediction_logs, payments 表）
	if !tableExists(db, "ai_prediction_logs") || !tableExists(db, "payments") {
		execSQLFile(db, "module5_init_db.sql")
	} else {
		fmt.Println("⚠️ 表 ai_prediction_logs / payments  已存在，跳过 module5_init_db.sql")
	}

	fmt.Println("\n🎉 数据库初始化流程完成！")
}

// 读取并执行 SQL 文件
func execSQLFile(db *sql.DB, filename string) {
	fmt.Printf("📄 执行 %s...\n", filename)
	sqlBytes, err := os.ReadFile(filename)
	checkErr(err, fmt.Sprintf("读取文件 %s 失败", filename))

	_, err = db.Exec(string(sqlBytes))
	checkErr(err, fmt.Sprintf("执行文件 %s 出错", filename))

	fmt.Printf("✅ 文件 %s 执行成功\n", filename)
}

// 表是否存在
func tableExists(db *sql.DB, tableName string) bool {
	var exists bool
	query := `
		SELECT COUNT(*) > 0
		FROM information_schema.tables
		WHERE table_schema = 'polymarket' AND table_name = ?
	`
	err := db.QueryRow(query, tableName).Scan(&exists)
	if err != nil {
		log.Printf("⚠️ 检查表 %s 是否存在时出错: %v", tableName, err)
		return false
	}
	return exists
}

// 表中是否有数据
func tableHasData(db *sql.DB, tableName string) bool {
	var count int
	query := fmt.Sprintf("SELECT COUNT(*) FROM %s", tableName)
	err := db.QueryRow(query).Scan(&count)
	if err != nil {
		log.Printf("⚠️ 检查表 %s 数据时出错: %v", tableName, err)
		return false
	}
	return count > 0
}

// 错误处理
func checkErr(err error, msg string) {
	if err != nil {
		log.Fatalf("❌ %s: %v", msg, err)
	}
}
