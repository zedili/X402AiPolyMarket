# X402AiPolyMarket contracts

此目录包含 X402AiPolyMarket 项目的智能合约。

# 项目初始化
```bash

# 1. 初始化 npm
npm init -y

# 2. 安装 Toolbox、dotenv 和 hardhat（会自动安装兼容的 hardhat 版本）
npm install --save-dev @nomicfoundation/hardhat-toolbox
npm install dotenv

# 4. 安装 OpenZeppelin 合约
npm install @openzeppelin/contracts

# 5. 初始化 Hardhat
npx hardhat init
# 选择: Create a TypeScript project（Toolbox 支持 TypeScript）


```



## 运行项目
   ```bash
# 安装依赖
npm install

# 编译合约：
npx hardhat compile

# 运行测试
npx hardhat test
    
# 部署合约（示例）：
npx hardhat run scripts/deploy.js --network localhost

```

## 项目结构
```bash
contracts/
├── README.md
├── hardhat.config.js
├── package.json
├── contracts/          # 智能合约路径
│   └── Lock.sol       # 示例合约
├── scripts/            # 部署脚本
│   └── deploy.js
├── test/               # 测试文件
│   └── Lock.js
└── artifacts/          # 编译后的合约工件（自动生成）
```