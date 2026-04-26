-- =============================================
-- 模块3：交易模块 - 数据库初始化脚本
-- =============================================

USE polymarket;

-- =============================================
-- 1. 市场表 (markets)
-- =============================================
ALTER TABLE polymarket.markets ADD market_id varchar(255) NOT NULL;
ALTER TABLE polymarket.markets ADD CONSTRAINT uk_market_id UNIQUE KEY (market_id);

SELECT '市场表修改完成！' AS message;

