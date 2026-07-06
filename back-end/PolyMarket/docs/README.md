# PolyMarket 后端文档中心

## 📚 文档索引

### 模块2：市场管理模块
- [模块2-验收清单.md](./模块2-验收清单.md) - 市场管理模块的功能验收清单

### 模块3：交易模块
- [模块3-验收清单.md](./模块3-验收清单.md) - 交易模块的详细验收清单和curl测试命令
- [模块3-开发总结.md](./模块3-开发总结.md) - 交易模块的开发总结和技术说明
- [模块3-测试指南.md](./模块3-测试指南.md) - 交易模块的完整测试指南

## 🚀 快速开始

### 1. 环境准备

```bash
# 安装依赖
cd back-end/PolyMarket
go mod download

# 配置数据库
# 编辑 etc/plmk.yaml，设置MySQL和Redis连接信息
```

### 2. 初始化数据库

```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS polymarket CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 执行初始化脚本
mysql -u root -p plmk < scripts/init_db.sql
mysql -u root -p plmk < scripts/module2_init_db.sql
mysql -u root -p plmk < scripts/module3_init_db.sql
```

### 3. 启动服务

```bash
# 开发模式
go run main.go

# 编译运行
go build -o plmk.exe .
./plmk.exe
```

### 4. 运行测试

```bash
# Linux/Mac
chmod +x test_trade_module.sh
./test_trade_module.sh

# Windows PowerShell
.\test_trade_module.ps1
```

## 📖 API文档

### 认证模块

#### 获取Nonce
```bash
POST /api/v1/auth/nonce
Content-Type: application/json

{
  "wallet_address": "0x..."
}
```

#### 登录
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "wallet_address": "0x...",
  "signature": "0x..."
}
```

### 市场模块

#### 创建市场
```bash
POST /api/v1/market/create
Authorization: Bearer {token}
Content-Type: application/json

{
  "question": "Will Bitcoin reach $100k by end of 2026?",
  "description": "...",
  "category": "Crypto",
  "end_time": "2026-12-31T23:59:59Z",
  "initial_yes_price": 67.5,
  "initial_no_price": 32.5
}
```

#### 查询市场列表
```bash
GET /api/v1/market/list?page=1&page_size=20&status=1&category=Crypto
```

#### 查询市场详情
```bash
GET /api/v1/market/detail/:id
```

### 交易模块

#### 创建订单
```bash
POST /api/v1/trade/order
Authorization: Bearer {token}
Content-Type: application/json

{
  "market_id": 1,
  "order_type": 0,
  "position": 1,
  "amount": 100,
  "price": 67.5,
  "slippage": 1.0
}
```

#### 查询订单列表
```bash
GET /api/v1/trade/orders?page=1&page_size=20&market_id=1&status=0
Authorization: Bearer {token}
```

#### 查询持仓列表
```bash
GET /api/v1/trade/positions?status=active
Authorization: Bearer {token}
```

#### 查询交易统计
```bash
GET /api/v1/trade/stats
Authorization: Bearer {token}
```

## 🗂️ 项目结构

```
back-end/PolyMarket/
├── cmd/                    # 命令行工具
├── docs/                   # 文档目录
│   ├── README.md          # 文档索引（本文件）
│   ├── 模块2-验收清单.md
│   ├── 模块3-验收清单.md
│   ├── 模块3-开发总结.md
│   └── 模块3-测试指南.md
├── etc/                    # 配置文件
│   └── polymarket.yaml
├── internal/               # 内部代码
│   ├── config/            # 配置结构
│   ├── handler/           # HTTP处理器
│   │   ├── auth/         # 认证处理器
│   │   ├── market/       # 市场处理器
│   │   └── trade/        # 交易处理器
│   ├── logic/             # 业务逻辑
│   │   ├── auth/
│   │   ├── market/
│   │   └── trade/
│   ├── middleware/        # 中间件
│   ├── model/             # 数据模型
│   ├── svc/              # 服务上下文
│   ├── types/            # 类型定义
│   └── utils/            # 工具函数
├── scripts/               # 数据库脚本
│   ├── init_db.sql
│   ├── module2_init_db.sql
│   └── module3_init_db.sql
├── test_trade_module.sh   # Bash测试脚本
├── test_trade_module.ps1  # PowerShell测试脚本
├── go.mod
├── go.sum
└── main.go
```

## 🔧 技术栈

- **框架**: go-zero
- **数据库**: MySQL 8.0
- **缓存**: Redis
- **认证**: JWT
- **区块链**: Ethereum (待集成)

## 📊 数据库表

### 用户表 (users)
- 存储用户钱包地址和基本信息

### 市场表 (markets)
- 存储预测市场信息

### 订单表 (orders)
- 存储用户订单

### 交易表 (trades)
- 存储成交记录

### 持仓表 (positions)
- 存储用户持仓

## 🧪 测试

### 单元测试
```bash
go test ./...
```

### API测试
```bash
# 使用自动化脚本
./test_trade_module.sh

# 或手动测试
curl -X GET http://localhost:8888/api/v1/market/list
```

## 📝 开发规范

### 代码规范
- 遵循Go官方代码规范
- 使用gofmt格式化代码
- 添加必要的注释

### Git提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 重构
test: 测试相关
chore: 构建/工具相关
```

## 🐛 问题排查

### 常见问题

1. **数据库连接失败**
   - 检查MySQL是否启动
   - 检查配置文件中的数据库连接信息

2. **Redis连接失败**
   - 检查Redis是否启动
   - 检查配置文件中的Redis连接信息

3. **JWT认证失败**
   - 检查Token是否过期
   - 检查Token格式是否正确

## 📞 联系方式

如有问题，请联系开发团队。

