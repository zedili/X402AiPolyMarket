-- 模块1：用户认证与管理模块 - 数据库初始化脚本

USE polymarket;

-- 1. 扩展 users 表
ALTER TABLE `users`
    ADD COLUMN   `avatar_url` VARCHAR(255) DEFAULT NULL COMMENT '头像URL' AFTER `username`,
ADD COLUMN   `email` VARCHAR(100) DEFAULT NULL COMMENT '邮箱' AFTER `avatar_url`,
ADD COLUMN   `bio` TEXT DEFAULT NULL COMMENT '个人简介' AFTER `email`,
ADD COLUMN   `total_trades` INT UNSIGNED DEFAULT 0 COMMENT '总交易次数' AFTER `bio`,
ADD COLUMN   `total_volume` DECIMAL(20,8) DEFAULT 0 COMMENT '总交易量' AFTER `total_trades`,
ADD COLUMN   `total_profit` DECIMAL(20,8) DEFAULT 0 COMMENT '总收益' AFTER `total_volume`,
ADD COLUMN  `win_count` INT UNSIGNED DEFAULT 0 COMMENT '胜利次数' AFTER `total_profit`,
ADD COLUMN   `lose_count` INT UNSIGNED DEFAULT 0 COMMENT '失败次数' AFTER `win_count`,
ADD COLUMN   `status` TINYINT UNSIGNED DEFAULT 0 COMMENT '状态: 0-正常 1-禁用' AFTER `lose_count`,
ADD COLUMN   `last_login_at` TIMESTAMP NULL DEFAULT NULL COMMENT '最后登录时间' AFTER `status`;

-- 添加索引（如果不存在）
ALTER TABLE `users`
    ADD INDEX   `idx_username` (`username`),
ADD INDEX   `idx_created_at` (`created_at`);

-- 2. 创建认证随机数表
CREATE TABLE   `auth_nonces` (
                                 `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
                                 `wallet_address` VARCHAR(50) NOT NULL COMMENT '钱包地址',
                                 `nonce` VARCHAR(255) NOT NULL COMMENT '随机数/登录消息',
                                 `expires_at` TIMESTAMP NOT NULL COMMENT '过期时间',
                                 `used` TINYINT UNSIGNED DEFAULT 0 COMMENT '是否已使用: 0-未使用 1-已使用',
                                 `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

                                 PRIMARY KEY (`id`),
                                 UNIQUE KEY `uk_nonce` (`nonce`),
                                 KEY `idx_wallet_address` (`wallet_address`),
                                 KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='认证随机数表';

-- 3. 创建刷新令牌表
CREATE TABLE   `refresh_tokens` (
                                    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
                                    `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
                                    `token` VARCHAR(255) NOT NULL COMMENT 'Refresh Token',
                                    `expires_at` TIMESTAMP NOT NULL COMMENT '过期时间',
                                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

                                    PRIMARY KEY (`id`),
                                    UNIQUE KEY `uk_token` (`token`),
                                    KEY `idx_user_id` (`user_id`),
                                    KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='刷新令牌表';

-- 4. 清理过期数据的存储过程（可选）
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS `clean_expired_nonces`()
BEGIN
DELETE FROM `auth_nonces` WHERE `expires_at` < NOW();
END$$

CREATE PROCEDURE IF NOT EXISTS `clean_expired_tokens`()
BEGIN
DELETE FROM `refresh_tokens` WHERE `expires_at` < NOW();
END$$

DELIMITER ;

-- 5. 创建定时任务（可选，需要 MySQL Event Scheduler 开启）
-- SET GLOBAL event_scheduler = ON;

-- CREATE EVENT IF NOT EXISTS `evt_clean_expired_nonces`
-- ON SCHEDULE EVERY 1 HOUR
-- DO CALL clean_expired_nonces();

-- CREATE EVENT IF NOT EXISTS `evt_clean_expired_tokens`
-- ON SCHEDULE EVERY 1 HOUR
-- DO CALL clean_expired_tokens();

