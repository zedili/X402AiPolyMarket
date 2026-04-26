#!/bin/bash

# ========================================
# 交易模块API测试脚本
# ========================================

# 配置
API_URL="http://localhost:8888/api/v1"
TOKEN="YOUR_JWT_TOKEN_HERE"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试计数
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
test_api() {
    local test_name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_code=${5:-200}
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}[$TOTAL_TESTS] Testing: $test_name${NC}"
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method "$API_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq "$expected_code" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAILED${NC} (Expected HTTP $expected_code, got $http_code)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    # 美化JSON输出
    if command -v jq &> /dev/null; then
        echo "$body" | jq -C '.' 2>/dev/null || echo "$body"
    else
        echo "$body"
    fi
    echo ""
}

# 开始测试
clear
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}      交易模块API自动化测试${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo "API URL: $API_URL"
echo "Token: ${TOKEN:0:20}..."
echo ""

# 检查服务是否运行
echo -e "${YELLOW}检查服务状态...${NC}"
if curl -s "$API_URL/../health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 服务正在运行${NC}"
else
    echo -e "${RED}✗ 服务未运行，请先启动服务${NC}"
    exit 1
fi
echo ""

# 1. 订单管理测试
echo -e "${BLUE}=== 1. 订单管理测试 ===${NC}"
echo ""

test_api "创建买入订单(YES)" "POST" "/trade/order" \
    '{"market_id":1,"order_type":0,"position":1,"amount":100,"price":67.5,"slippage":1.0}'

test_api "创建卖出订单(NO)" "POST" "/trade/order" \
    '{"market_id":1,"order_type":1,"position":0,"amount":50,"price":32.5,"slippage":0.5}'

test_api "查询订单列表" "GET" "/trade/orders?page=1&page_size=20"

test_api "按市场筛选订单" "GET" "/trade/orders?market_id=1"

test_api "按状态筛选订单" "GET" "/trade/orders?status=0"

test_api "查询订单详情" "GET" "/trade/order/1"

test_api "取消订单" "POST" "/trade/order/1/cancel"

# 2. 交易历史测试
echo -e "${BLUE}=== 2. 交易历史测试 ===${NC}"
echo ""

test_api "查询交易历史" "GET" "/trade/history?page=1&page_size=20"

test_api "按市场筛选交易" "GET" "/trade/history?market_id=1"

# 3. 持仓管理测试
echo -e "${BLUE}=== 3. 持仓管理测试 ===${NC}"
echo ""

test_api "查询所有持仓" "GET" "/trade/positions"

test_api "查询活跃持仓" "GET" "/trade/positions?status=active"

test_api "查询已结算持仓" "GET" "/trade/positions?status=settled"

test_api "查询持仓详情" "GET" "/trade/position/1"

# 4. 统计测试
echo -e "${BLUE}=== 4. 交易统计测试 ===${NC}"
echo ""

test_api "查询交易统计" "GET" "/trade/stats"

# 5. 错误场景测试
echo -e "${BLUE}=== 5. 错误场景测试 ===${NC}"
echo ""

test_api "市场不存在" "POST" "/trade/order" \
    '{"market_id":99999,"order_type":0,"position":1,"amount":100,"price":67.5}' 404

test_api "订单不存在" "GET" "/trade/order/99999" 404

test_api "持仓不存在" "GET" "/trade/position/99999" 404

test_api "无效的订单金额" "POST" "/trade/order" \
    '{"market_id":1,"order_type":0,"position":1,"amount":-100,"price":67.5}' 400

# 测试总结
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}           测试总结${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo "总测试数: $TOTAL_TESTS"
echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
echo -e "${RED}失败: $FAILED_TESTS${NC}"

if [ $TOTAL_TESTS -gt 0 ]; then
    pass_rate=$(awk "BEGIN {printf \"%.2f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")
    echo "通过率: $pass_rate%"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 所有测试通过！${NC}"
        exit 0
    else
        echo -e "${RED}⚠️  有测试失败，请检查${NC}"
        exit 1
    fi
else
    echo "没有执行任何测试"
    exit 1
fi

