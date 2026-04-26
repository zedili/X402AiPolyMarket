# ========================================
# 交易模块API测试脚本 (PowerShell)
# ========================================

# 配置
$API_URL = "http://localhost:8888/api/v1"
$TOKEN = "YOUR_JWT_TOKEN_HERE"

# 测试计数
$script:TotalTests = 0
$script:PassedTests = 0
$script:FailedTests = 0

# 测试函数
function Test-API {
    param(
        [string]$TestName,
        [string]$Method,
        [string]$Endpoint,
        [string]$Data = $null,
        [int]$ExpectedCode = 200
    )
    
    $script:TotalTests++
    Write-Host "[$($script:TotalTests)] Testing: $TestName" -ForegroundColor Yellow
    
    $headers = @{
        "Authorization" = "Bearer $TOKEN"
        "Content-Type" = "application/json"
    }
    
    try {
        if ($Data) {
            $response = Invoke-WebRequest -Uri "$API_URL$Endpoint" `
                -Method $Method -Headers $headers -Body $Data `
                -UseBasicParsing -ErrorAction Stop
        } else {
            $response = Invoke-WebRequest -Uri "$API_URL$Endpoint" `
                -Method $Method -Headers $headers `
                -UseBasicParsing -ErrorAction Stop
        }
        
        $statusCode = $response.StatusCode
        $content = $response.Content
        
        if ($statusCode -eq $ExpectedCode) {
            Write-Host "✓ PASSED (HTTP $statusCode)" -ForegroundColor Green
            $script:PassedTests++
        } else {
            Write-Host "✗ FAILED (Expected HTTP $ExpectedCode, got $statusCode)" -ForegroundColor Red
            $script:FailedTests++
        }
        
        # 美化JSON输出
        try {
            $json = $content | ConvertFrom-Json | ConvertTo-Json -Depth 10
            Write-Host $json
        } catch {
            Write-Host $content
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        
        if ($statusCode -eq $ExpectedCode) {
            Write-Host "✓ PASSED (HTTP $statusCode)" -ForegroundColor Green
            $script:PassedTests++
        } else {
            Write-Host "✗ FAILED (Expected HTTP $ExpectedCode, got $statusCode)" -ForegroundColor Red
            $script:FailedTests++
        }
        
        Write-Host $_.Exception.Message -ForegroundColor Gray
    }
    
    Write-Host ""
}

# 开始测试
Clear-Host
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "      交易模块API自动化测试" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "API URL: $API_URL"
Write-Host "Token: $($TOKEN.Substring(0, [Math]::Min(20, $TOKEN.Length)))..."
Write-Host ""

# 检查服务是否运行
Write-Host "检查服务状态..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-WebRequest -Uri "$API_URL/../health" -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ 服务正在运行" -ForegroundColor Green
} catch {
    Write-Host "✗ 服务未运行，请先启动服务" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 1. 订单管理测试
Write-Host "=== 1. 订单管理测试 ===" -ForegroundColor Cyan
Write-Host ""

Test-API -TestName "创建买入订单(YES)" -Method "POST" -Endpoint "/trade/order" `
    -Data '{"market_id":1,"order_type":0,"position":1,"amount":100,"price":67.5,"slippage":1.0}'

Test-API -TestName "创建卖出订单(NO)" -Method "POST" -Endpoint "/trade/order" `
    -Data '{"market_id":1,"order_type":1,"position":0,"amount":50,"price":32.5,"slippage":0.5}'

Test-API -TestName "查询订单列表" -Method "GET" -Endpoint "/trade/orders?page=1&page_size=20"

Test-API -TestName "按市场筛选订单" -Method "GET" -Endpoint "/trade/orders?market_id=1"

Test-API -TestName "按状态筛选订单" -Method "GET" -Endpoint "/trade/orders?status=0"

Test-API -TestName "查询订单详情" -Method "GET" -Endpoint "/trade/order/1"

Test-API -TestName "取消订单" -Method "POST" -Endpoint "/trade/order/1/cancel"

# 2. 交易历史测试
Write-Host "=== 2. 交易历史测试 ===" -ForegroundColor Cyan
Write-Host ""

Test-API -TestName "查询交易历史" -Method "GET" -Endpoint "/trade/history?page=1&page_size=20"

Test-API -TestName "按市场筛选交易" -Method "GET" -Endpoint "/trade/history?market_id=1"

# 3. 持仓管理测试
Write-Host "=== 3. 持仓管理测试 ===" -ForegroundColor Cyan
Write-Host ""

Test-API -TestName "查询所有持仓" -Method "GET" -Endpoint "/trade/positions"

Test-API -TestName "查询活跃持仓" -Method "GET" -Endpoint "/trade/positions?status=active"

Test-API -TestName "查询已结算持仓" -Method "GET" -Endpoint "/trade/positions?status=settled"

Test-API -TestName "查询持仓详情" -Method "GET" -Endpoint "/trade/position/1"

# 4. 统计测试
Write-Host "=== 4. 交易统计测试 ===" -ForegroundColor Cyan
Write-Host ""

Test-API -TestName "查询交易统计" -Method "GET" -Endpoint "/trade/stats"

# 5. 错误场景测试
Write-Host "=== 5. 错误场景测试 ===" -ForegroundColor Cyan
Write-Host ""

Test-API -TestName "市场不存在" -Method "POST" -Endpoint "/trade/order" `
    -Data '{"market_id":99999,"order_type":0,"position":1,"amount":100,"price":67.5}' `
    -ExpectedCode 404

Test-API -TestName "订单不存在" -Method "GET" -Endpoint "/trade/order/99999" `
    -ExpectedCode 404

Test-API -TestName "持仓不存在" -Method "GET" -Endpoint "/trade/position/99999" `
    -ExpectedCode 404

Test-API -TestName "无效的订单金额" -Method "POST" -Endpoint "/trade/order" `
    -Data '{"market_id":1,"order_type":0,"position":1,"amount":-100,"price":67.5}' `
    -ExpectedCode 400

# 测试总结
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "           测试总结" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "总测试数: $TotalTests"
Write-Host "通过: $PassedTests" -ForegroundColor Green
Write-Host "失败: $FailedTests" -ForegroundColor Red

if ($TotalTests -gt 0) {
    $passRate = [math]::Round(($PassedTests / $TotalTests) * 100, 2)
    Write-Host "通过率: $passRate%"
    
    if ($FailedTests -eq 0) {
        Write-Host "🎉 所有测试通过！" -ForegroundColor Green
        exit 0
    } else {
        Write-Host "⚠️  有测试失败，请检查" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "没有执行任何测试"
    exit 1
}

