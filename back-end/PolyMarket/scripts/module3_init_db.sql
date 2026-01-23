-- =============================================
-- 模块3：交易模块 - 数据库初始化脚本
-- =============================================

USE polymarket;

-- =============================================
-- 1. 订单表 (orders)
-- =============================================
CREATE TABLE IF NOT EXISTS `orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `market_id` BIGINT UNSIGNED NOT NULL COMMENT '市场ID',
  `user_address` VARCHAR(42) NOT NULL COMMENT '用户地址',
  
  `order_type` TINYINT UNSIGNED NOT NULL COMMENT '订单类型: 0-买入 1-卖出',
  `position` TINYINT UNSIGNED NOT NULL COMMENT '仓位: 0-NO 1-YES',
  
  `amount` DECIMAL(20,8) NOT NULL COMMENT '数量',
  `price` DECIMAL(10,2) NOT NULL COMMENT '价格(cents)',
  `total_value` DECIMAL(20,8) NOT NULL COMMENT '总价值',
  `fee` DECIMAL(20,8) DEFAULT 0 COMMENT '手续费',
  
  `filled_amount` DECIMAL(20,8) DEFAULT 0 COMMENT '已成交数量',
  `avg_filled_price` DECIMAL(10,2) DEFAULT 0 COMMENT '平均成交价',
  
  `status` TINYINT UNSIGNED DEFAULT 0 COMMENT '状态: 0-待成交 1-部分成交 2-完全成交 3-已取消',
  
  `tx_hash` VARCHAR(66) DEFAULT NULL COMMENT '交易哈希',
  `block_number` BIGINT UNSIGNED DEFAULT NULL COMMENT '区块号',
  
  `cancelled_at` TIMESTAMP NULL DEFAULT NULL COMMENT '取消时间',
  `completed_at` TIMESTAMP NULL DEFAULT NULL COMMENT '完成时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  KEY `idx_market_id` (`market_id`),
  KEY `idx_user_address` (`user_address`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_tx_hash` (`tx_hash`),
  KEY `idx_user_status` (`user_address`, `status`),
  KEY `idx_market_status` (`market_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- =============================================
-- 2. 交易记录表 (trades)
-- =============================================
CREATE TABLE IF NOT EXISTS `trades` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '交易ID',
  `market_id` BIGINT UNSIGNED NOT NULL COMMENT '市场ID',
  `buy_order_id` BIGINT UNSIGNED NOT NULL COMMENT '买单ID',
  `sell_order_id` BIGINT UNSIGNED NOT NULL COMMENT '卖单ID',
  
  `buyer_address` VARCHAR(42) NOT NULL COMMENT '买方地址',
  `seller_address` VARCHAR(42) NOT NULL COMMENT '卖方地址',
  
  `position` TINYINT UNSIGNED NOT NULL COMMENT '仓位: 0-NO 1-YES',
  `amount` DECIMAL(20,8) NOT NULL COMMENT '成交数量',
  `price` DECIMAL(10,2) NOT NULL COMMENT '成交价格',
  `total_value` DECIMAL(20,8) NOT NULL COMMENT '成交总额',
  
  `buyer_fee` DECIMAL(20,8) DEFAULT 0 COMMENT '买方手续费',
  `seller_fee` DECIMAL(20,8) DEFAULT 0 COMMENT '卖方手续费',
  
  `tx_hash` VARCHAR(66) DEFAULT NULL COMMENT '交易哈希',
  `block_number` BIGINT UNSIGNED DEFAULT NULL COMMENT '区块号',
  
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  
  PRIMARY KEY (`id`),
  KEY `idx_market_id` (`market_id`),
  KEY `idx_buyer` (`buyer_address`),
  KEY `idx_seller` (`seller_address`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_tx_hash` (`tx_hash`),
  KEY `idx_market_created` (`market_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='交易记录表';

-- =============================================
-- 3. 持仓表 (positions)
-- =============================================
CREATE TABLE IF NOT EXISTS `positions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '持仓ID',
  `user_address` VARCHAR(42) NOT NULL COMMENT '用户地址',
  `market_id` BIGINT UNSIGNED NOT NULL COMMENT '市场ID',
  
  `position` TINYINT UNSIGNED NOT NULL COMMENT '仓位: 0-NO 1-YES',
  `shares` DECIMAL(20,8) NOT NULL DEFAULT 0 COMMENT '持有份额',
  `avg_price` DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '平均成本价',
  `total_cost` DECIMAL(20,8) NOT NULL DEFAULT 0 COMMENT '总成本',
  
  `current_value` DECIMAL(20,8) DEFAULT 0 COMMENT '当前价值',
  `unrealized_pnl` DECIMAL(20,8) DEFAULT 0 COMMENT '未实现盈亏',
  `realized_pnl` DECIMAL(20,8) DEFAULT 0 COMMENT '已实现盈亏',
  
  `is_settled` BOOLEAN DEFAULT FALSE COMMENT '是否已结算',
  `settlement_value` DECIMAL(20,8) DEFAULT 0 COMMENT '结算价值',
  
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_market_position` (`user_address`, `market_id`, `position`),
  KEY `idx_user_address` (`user_address`),
  KEY `idx_market_id` (`market_id`),
  KEY `idx_is_settled` (`is_settled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='持仓表';

-- =============================================
-- 插入测试数据（可选）
-- =============================================

-- 注意：实际使用时，订单和交易数据应该通过API创建
-- 这里仅作为示例

SELECT '模块3数据库表创建完成！' AS message;

