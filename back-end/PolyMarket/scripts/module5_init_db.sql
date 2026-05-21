-- =============================================
-- 模块5：AI预测与支付模块 - 数据库初始化脚本
-- =============================================

USE polymarket;

-- =============================================
-- 1. AI预测调用记录表 (ai_prediction_logs)
-- =============================================
CREATE TABLE IF NOT EXISTS `ai_prediction_logs` (
      `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '记录ID',
      `user_address` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户钱包地址',
      `cache_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '缓存键（预测唯一标识）',
      `model` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '使用的AI模型',
      `messages` json NOT NULL COMMENT '请求消息列表',
      `temperature` decimal(3,2) DEFAULT '1.00' COMMENT '温度参数',
      `top_p` decimal(3,2) DEFAULT '1.00' COMMENT 'TopP参数',
      `max_tokens` int DEFAULT NULL COMMENT '最大token数',
      `stream` tinyint(1) DEFAULT '0' COMMENT '是否流式请求',
      `result_type` tinyint unsigned NOT NULL DEFAULT '0' COMMENT '结果类型：0-JSON 1-Stream',
      `result_json` longblob COMMENT '非流式结果（完整JSON二进制）',
      `result_events` json DEFAULT NULL COMMENT '流式结果（事件字符串数组）',
      `result_delays` json DEFAULT NULL COMMENT '流式延迟（时间差整数数组，单位纳秒）',
      `response_time` bigint DEFAULT '0' COMMENT '响应时间（毫秒）',
      `token_usage` int DEFAULT NULL COMMENT 'Token使用量',
      `cache_hit` tinyint(1) DEFAULT '0' COMMENT '是否命中缓存',
      `status` tinyint unsigned DEFAULT '0' COMMENT '状态：0-成功 1-失败',
      `error_message` text COLLATE utf8mb4_unicode_ci COMMENT '错误信息',
      `request_metadata` json DEFAULT NULL COMMENT '请求元数据（扩展字段）',
      `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
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
    `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '支付记录ID',
    `user_address` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户钱包地址',
    `market_id` bigint unsigned NOT NULL COMMENT '市场ID',
    `prediction_log_id` bigint unsigned DEFAULT NULL COMMENT '关联的AI预测记录ID',
    `prediction` tinyint unsigned NOT NULL COMMENT '预测方向：0-NO 1-YES',
    `prediction_data` text COLLATE utf8mb4_unicode_ci COMMENT 'AI预测详情JSON',
    `payment_amount` decimal(20,8) NOT NULL COMMENT '支付金额',
    `currency` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'USDC' COMMENT '支付代币类型',
    `payment_type` tinyint unsigned DEFAULT '0' COMMENT '支付类型：0-预测购买 1-订阅服务 2-其他',
    `tx_hash` varchar(66) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '交易哈希',
    `block_number` bigint unsigned DEFAULT NULL COMMENT '区块号',
    `from_address` varchar(42) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '付款地址',
    `to_address` varchar(42) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '收款地址',
    `status` tinyint unsigned DEFAULT '0' COMMENT '支付状态：0-待支付 1-支付中 2-已支付 3-支付失败 4-已退款',
    `error_message` text COLLATE utf8mb4_unicode_ci COMMENT '错误信息',
    `description` text COLLATE utf8mb4_unicode_ci COMMENT '支付描述',
    `metadata` json DEFAULT NULL COMMENT '扩展元数据',
    `paid_at` timestamp NULL DEFAULT NULL COMMENT '支付完成时间',
    `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `cache_key` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '缓存键（预测唯一标识）',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_tx_hash` (`tx_hash`),
    KEY `idx_user_address` (`user_address`),
    KEY `idx_market_id` (`market_id`),
    KEY `idx_prediction_log_id` (`prediction_log_id`),
    KEY `idx_status` (`status`),
    KEY `idx_created_at` (`created_at`),
    CONSTRAINT `fk_payment_prediction` FOREIGN KEY (`prediction_log_id`) REFERENCES `ai_prediction_logs` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='x402支付记录表';

SELECT 'x402支付记录表创建完成！' AS message;

