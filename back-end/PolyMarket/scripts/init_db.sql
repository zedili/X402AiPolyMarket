-- 创建数据库
CREATE DATABASE IF NOT EXISTS polymarket 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE polymarket;

-- 用户表（基础版本，后续模块会扩展）
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `wallet_address` VARCHAR(50) NOT NULL COMMENT '钱包地址',
  `username` VARCHAR(50) DEFAULT NULL COMMENT '用户名',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wallet_address` (`wallet_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 系统配置表
CREATE TABLE IF NOT EXISTS `system_configs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `config_key` VARCHAR(100) NOT NULL COMMENT '配置键',
  `config_value` TEXT NOT NULL COMMENT '配置值',
  `config_type` VARCHAR(50) DEFAULT 'string' COMMENT '配置类型',
  `description` TEXT DEFAULT NULL COMMENT '描述',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 插入初始配置
INSERT INTO system_configs (config_key, config_value, config_type, description) VALUES
('platform_fee_rate', '0.02', 'number', '平台手续费率'),
('min_market_duration', '86400', 'number', '市场最小持续时间(秒)'),
('max_market_duration', '31536000', 'number', '市场最大持续时间(秒)'),
('min_liquidity', '1000', 'number', '最小流动性要求');

