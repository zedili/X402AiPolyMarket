-- 模块2：市场管理模块 - 数据库初始化脚本

USE polymarket;

-- 1. 创建市场表
CREATE TABLE IF NOT EXISTS `markets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '市场ID',
  `question` TEXT NOT NULL COMMENT '市场问题',
  `description` TEXT DEFAULT NULL COMMENT '详细描述',
  `category` VARCHAR(50) NOT NULL COMMENT '分类: CRYPTO, TECH, STOCKS, POLITICS, SPORTS, SCIENCE',
  
  `creator_address` VARCHAR(42) NOT NULL COMMENT '创建者地址',
  `contract_address` VARCHAR(42) DEFAULT NULL COMMENT '智能合约地址',
  
  -- 价格信息
  `yes_price` DECIMAL(10,2) DEFAULT 50.00 COMMENT 'YES价格(cents)',
  `no_price` DECIMAL(10,2) DEFAULT 50.00 COMMENT 'NO价格(cents)',
  `yes_shares` DECIMAL(20,8) DEFAULT 0 COMMENT 'YES总份额',
  `no_shares` DECIMAL(20,8) DEFAULT 0 COMMENT 'NO总份额',
  
  -- 统计信息
  `total_volume` DECIMAL(20,8) DEFAULT 0 COMMENT '总交易量',
  `total_liquidity` DECIMAL(20,8) DEFAULT 0 COMMENT '总流动性',
  `participant_count` INT UNSIGNED DEFAULT 0 COMMENT '参与人数',
  
  -- AI预测信息
  `ai_prediction` DECIMAL(5,2) DEFAULT NULL COMMENT 'AI预测值(0-100)',
  `confidence` DECIMAL(5,2) DEFAULT NULL COMMENT '置信度(0-100)',
  `suggests` VARCHAR(10) DEFAULT NULL COMMENT 'AI建议: YES, NO',
  
  -- 时间信息
  `start_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '开始时间',
  `end_time` TIMESTAMP NOT NULL COMMENT '结束时间',
  `settlement_time` TIMESTAMP NULL DEFAULT NULL COMMENT '结算时间',
  
  -- 状态
  `status` TINYINT UNSIGNED DEFAULT 0 COMMENT '状态: 0-待开始 1-进行中 2-已结束 3-已结算 4-已取消',
  `result` TINYINT UNSIGNED DEFAULT NULL COMMENT '结果: NULL-未结算 0-NO 1-YES',
  `audit_status` TINYINT UNSIGNED DEFAULT 0 COMMENT '审核状态: 0-待审核 1-已通过 2-已拒绝',
  
  -- 标签
  `is_hot` BOOLEAN DEFAULT FALSE COMMENT '是否热门',
  `is_featured` BOOLEAN DEFAULT FALSE COMMENT '是否精选',
  
  -- 其他
  `tags` JSON DEFAULT NULL COMMENT '标签数组',
  `metadata` JSON DEFAULT NULL COMMENT '元数据',
  
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_status` (`status`),
  KEY `idx_creator` (`creator_address`),
  KEY `idx_end_time` (`end_time`),
  KEY `idx_is_hot` (`is_hot`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_audit_status` (`audit_status`),
  KEY `idx_category_status` (`category`, `status`),
  KEY `idx_status_end_time` (`status`, `end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='市场表';

-- 2. 创建市场分类表（可选，用于管理分类信息）
CREATE TABLE IF NOT EXISTS `market_categories` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '分类ID',
  `name` VARCHAR(50) NOT NULL COMMENT '分类名称',
  `display_name` VARCHAR(100) NOT NULL COMMENT '显示名称',
  `icon` VARCHAR(50) DEFAULT NULL COMMENT '图标',
  `description` TEXT DEFAULT NULL COMMENT '描述',
  `sort_order` INT UNSIGNED DEFAULT 0 COMMENT '排序',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='市场分类表';

-- 3. 插入默认分类数据
INSERT INTO `market_categories` (`name`, `display_name`, `icon`, `description`, `sort_order`) VALUES
('CRYPTO', 'Cryptocurrency', '₿', '加密货币相关预测市场', 1),
('TECH', 'Technology', '💻', '科技行业相关预测市场', 2),
('STOCKS', 'Stocks', '📈', '股票市场相关预测', 3),
('POLITICS', 'Politics', '🏛️', '政治事件相关预测', 4),
('SPORTS', 'Sports', '⚽', '体育赛事相关预测', 5),
('SCIENCE', 'Science', '🔬', '科学研究相关预测', 6)
ON DUPLICATE KEY UPDATE 
  `display_name` = VALUES(`display_name`),
  `icon` = VALUES(`icon`),
  `description` = VALUES(`description`),
  `sort_order` = VALUES(`sort_order`);

-- 4. 创建市场收藏表
CREATE TABLE IF NOT EXISTS `market_favorites` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_address` VARCHAR(42) NOT NULL COMMENT '用户地址',
  `market_id` BIGINT UNSIGNED NOT NULL COMMENT '市场ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_market` (`user_address`, `market_id`),
  KEY `idx_user` (`user_address`),
  KEY `idx_market` (`market_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='市场收藏表';

-- 5. 创建市场评论表（可选）
CREATE TABLE IF NOT EXISTS `market_comments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '评论ID',
  `market_id` BIGINT UNSIGNED NOT NULL COMMENT '市场ID',
  `user_address` VARCHAR(42) NOT NULL COMMENT '用户地址',
  `content` TEXT NOT NULL COMMENT '评论内容',
  `parent_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '父评论ID',
  `like_count` INT UNSIGNED DEFAULT 0 COMMENT '点赞数',
  `is_deleted` BOOLEAN DEFAULT FALSE COMMENT '是否删除',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  KEY `idx_market` (`market_id`),
  KEY `idx_user` (`user_address`),
  KEY `idx_parent` (`parent_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='市场评论表';

