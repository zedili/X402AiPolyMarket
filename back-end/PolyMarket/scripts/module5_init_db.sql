-- =============================================
-- 模块5：AI预测与支付模块 - 数据库初始化脚本
-- =============================================

USE polymarket;

-- =============================================
-- 1. AI预测调用记录表 (ai_prediction_logs)
-- =============================================
CREATE TABLE IF NOT EXISTS `ai_prediction_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `user_address` VARCHAR(42) NOT NULL COMMENT '用户钱包地址',

  -- 预测请求信息
  `cache_key` VARCHAR(255) NOT NULL COMMENT '缓存键（预测唯一标识）',
  `model` VARCHAR(100) NOT NULL COMMENT '使用的AI模型',
  `messages` JSON NOT NULL COMMENT '请求消息列表',
  `temperature` DECIMAL(3,2) DEFAULT 1.00 COMMENT '温度参数',
  `top_p` DECIMAL(3,2) DEFAULT 1.00 COMMENT 'TopP参数',
  `max_tokens` INT DEFAULT NULL COMMENT '最大token数',
  `stream` BOOLEAN DEFAULT FALSE COMMENT '是否流式请求',

  -- 预测结果（参考Redis缓存结构）
  `result_type` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '结果类型：0-JSON 1-Stream',
  `result_json` LONGBLOB DEFAULT NULL COMMENT '非流式结果（完整JSON二进制）',
  `result_events` JSON DEFAULT NULL COMMENT '流式结果（事件字符串数组）',
  `result_delays` JSON DEFAULT NULL COMMENT '流式延迟（时间差整数数组，单位纳秒）',

  -- 性能指标
  `response_time` BIGINT DEFAULT 0 COMMENT '响应时间（毫秒）',
  `token_usage` INT DEFAULT NULL COMMENT 'Token使用量',
  `cache_hit` BOOLEAN DEFAULT FALSE COMMENT '是否命中缓存',

  -- 状态和错误
  `status` TINYINT UNSIGNED DEFAULT 0 COMMENT '状态：0-成功 1-失败',
  `error_message` TEXT DEFAULT NULL COMMENT '错误信息',

  -- 元数据
  `request_metadata` JSON DEFAULT NULL COMMENT '请求元数据（扩展字段）',

  -- 时间信息
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

  PRIMARY KEY (`id`),
  KEY `idx_user_address` (`user_address`),
  KEY `idx_cache_key` (`cache_key`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI预测调用记录表';

SELECT 'AI预测调用记录表创建完成！' AS message;

-- =============================================
-- 2. x402支付记录表 (payments) - 关联预测记录
-- =============================================
CREATE TABLE IF NOT EXISTS `payments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '支付记录ID',
  `user_address` VARCHAR(42) NOT NULL COMMENT '用户钱包地址',
  `market_id` BIGINT UNSIGNED NOT NULL COMMENT '市场ID',

  -- 🔑 关联预测记录
  `prediction_log_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '关联的AI预测记录ID',

  -- 预测信息
  `prediction` TINYINT UNSIGNED NOT NULL COMMENT '预测方向：0-NO 1-YES',
  `prediction_data` TEXT DEFAULT NULL COMMENT 'AI预测详情JSON',

  -- 支付信息
  `payment_amount` DECIMAL(20,8) NOT NULL COMMENT '支付金额',
  `currency` VARCHAR(20) DEFAULT 'USDC' COMMENT '支付代币类型',
  `payment_type` TINYINT UNSIGNED DEFAULT 0 COMMENT '支付类型：0-预测购买 1-订阅服务 2-其他',

  -- 交易信息
  `tx_hash` VARCHAR(66) DEFAULT NULL COMMENT '交易哈希',
  `block_number` BIGINT UNSIGNED DEFAULT NULL COMMENT '区块号',
  `from_address` VARCHAR(42) DEFAULT NULL COMMENT '付款地址',
  `to_address` VARCHAR(42) DEFAULT NULL COMMENT '收款地址',

  -- 支付状态
  `status` TINYINT UNSIGNED DEFAULT 0 COMMENT '支付状态：0-待支付 1-支付中 2-已支付 3-支付失败 4-已退款',

  -- 错误信息
  `error_message` TEXT DEFAULT NULL COMMENT '错误信息',

  -- 描述和元数据
  `description` TEXT DEFAULT NULL COMMENT '支付描述',
  `metadata` JSON DEFAULT NULL COMMENT '扩展元数据',

  -- 时间信息
  `paid_at` TIMESTAMP NULL DEFAULT NULL COMMENT '支付完成时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tx_hash` (`tx_hash`),
  KEY `idx_user_address` (`user_address`),
  KEY `idx_market_id` (`market_id`),
  KEY `idx_prediction_log_id` (`prediction_log_id`),  -- 🔑 新增索引
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),

  -- 🔑 外键约束（可选，根据业务需求决定是否启用）
  CONSTRAINT `fk_payment_prediction` FOREIGN KEY (`prediction_log_id`)
    REFERENCES `ai_prediction_logs` (`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='x402支付记录表';

SELECT 'x402支付记录表创建完成！' AS message;

