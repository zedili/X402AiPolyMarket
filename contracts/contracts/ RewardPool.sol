// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./InsightToken.sol";
import "./lib/SafeMath.sol";

contract RewardPool is AccessControl, Pausable, ReentrancyGuard {
    using SafeMath for uint256;

    byte32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    byte32 public constant OPERATR_ROLE = keccak256("OPERATR_ROLE");

    InsightToken public immutable insightToken;
    IERC20 public immutable usdcToken;

    // 黑洞地址 ：销毁代币用
    address public constant BURN_ADDRESS =
        0x000000000000000000000000000000000000dEaD;

    // 分配比例,基数  10000
    uint256 public buybackRate = 4000; // 40% 回购比例
    uint256 public rewardRate = 3000; // 30% 奖励比例
    uint256 public treasuryRate = 2000; // 20% 入国库比例
    uint256 public burnRate = 1000; // 10% 销毁比例，减少总供应，提升币价

    // 记录待分配的利润
    struct PendingProfit {
        uint256 usdcAmount;
        uint256 tokenAmount;
    }
    PendingProfit public pendingProfit;

    // 获利 事件
    event ProfitReceived(uint usdcAmount, uint256 tokenAmount);
    // 回购事件
    event BuyBackExcuted(
        uint usdcSpent,
        uint256 tokenBougnt,
        uint256 tokenBurned
    );
    // 奖励事件
    event RewardDistribution(address[] receipts, uint256 amount);
    // 配置更新事件
    event AllocationUpdated(uint256 amount);

    constructor(address _insightToken, address _usdcToken, address _treasury) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATR_ROLE, msg.sender);
        _grantRole(DISTRIBUTOR_ROLE, msg.sender);

        insightToken = InsightToken(_insightToken);
        usdcToken = IERC20(_usdcToken);
        treasury = _treasury;
    }

    /**
     * 后端调用此方法，获取收益
     * @param usdcAmount USDC数量
     * @param tokenAmount 平台代币数量
     */
    function receiveProfit(
        uint256 usdcAmount,
        uint256 tokenAmount
    ) external onlyRole(DISTRIBUTOR_ROLE) whenNotPaused {
        if (usdcAmount > 0) {
            require(
                usdcToken.transferFrom(msg.sender, treasury, usdcAmount),
                "transfer usdc failed"
            );
            pendingProfit.usdcAmount += usdcAmount;
        }
        if (tokenAmount > 0) {
            require(
                insightToken.transferFrom(msg.sender, treasury, tokenAmount),
                "transfer token failed"
            );
            pendingProfit.tokenAmount += tokenAmount;
        }

        emit ReceiveProfit(usdcAmount, tokenAmount);
    }

    // function RewardDistributionistribution(
    //     address[] calldata receipts,
    //     uint256[] calldata amounts
    // ) external onlyRole(DISTRIBUTOR_ROLE) whenNotPaused nonReentrant {}

    function executeDistribution(address[] calldata rewardRecipients, uint256[] calldata rewardAmounts)
        external
        onlyRole(OPERATOR_ROLE)
        nonReentrant
        whenNotPaused
    {
        require(rewardRecipients.length == rewardAmounts.length, "Arrays length mismatch");

        // 1. 从“待分配利润”中锁定本次分配的 USDC 资金池
        // **注意**：只处理 USDC，代币奖励通过铸造产生。
        uint256 usdcToDistribute = pendingProfit.usdcAmount;
        require(usdcToDistribute > 0, "No pending profit to distribute");

        // 2. 根据固定比例计算各部分额度（基于 USDC）
        uint256 buybackUsdc = usdcToDistribute * buybackRate / 10000;
        uint256 treasuryUsdc = usdcToDistribute * treasuryRate / 10000;
        // 奖励额度也换算成等值的 USDC，用于后续计算和审计，实际发放的是铸造的代币
        uint256 rewardValueInUsdc = usdcToDistribute * rewardRate / 10000;

        // 3. 奖励是铸造token 给用户
        uint256 totalRewardAmount = 0;
        for (uint256 i = 0; i < rewardRecipients.length; i++) {
            totalRewardAmount += rewardAmounts[i];
        }
        // 关键：接入预言机将 代币转换成 usdc 价格
        // 此处假设固定的兑换率
        uint256 tokenPerUsdc = 100; // **必须替换为从预言机获取的动态价格！**
        uint256 maxTokensToMint = rewardValueInUsdc * tokenPerUsdc;
        require(totalRewardAmount <= maxTokensToMint, "Rewards exceed allocation");

        // 4. 执行分配
        // 4.1 回购并销毁（真实链上操作）
        if (buybackUsdc > 0) {
            // Step 1: 授权给DEX路由器
            usdcToken.approve(address(uniswapRouter), buybackUsdc);
            // Step 2: 执行兑换，将 USDC 换成 $INSIGHT
            // 简化路径：USDC -> WETH -> $INSIGHT (具体路径取决于池子)
            address[] memory path = new address[](3);
            path[0] = address(usdcToken);
            path[1] = uniswapRouter.WETH(); // 假设通过WETH中转
            path[2] = address(insightToken);
            
            uint256[] memory amounts = uniswapRouter.swapExactTokensForTokens(
                buybackUsdc,
                0, // 接受任何滑点，生产环境应设置最小值
                path,
                address(this), // 代币先换到本合约
                block.timestamp + 300
            );
            uint256 tokensBought = amounts[amounts.length - 1]; // 得到的 $INSIGHT 数量
            // Step 3: 销毁回购得来的代币
            insightToken.transfer(BURN_ADDRESS, tokensBought);
            emit BuybackExecuted(buybackUsdc, tokensBought, tokensBought);
            pendingProfit.usdcAmount -= buybackUsdc;
        }

        // 4.2 分发奖励（通过铸造）
        if (totalRewardAmount > 0) {
            // **核心改动**：铸造代币给合约本身（或直接给用户）
            insightToken.mint(address(this), totalRewardAmount);
            // 然后将铸造出的代币分发给用户
            for (uint256 i = 0; i < rewardRecipients.length; i++) {
                if (rewardAmounts[i] > 0) {
                    insightToken.transfer(rewardRecipients[i], rewardAmounts[i]);
                }
            }
            // 注意：pendingProfit.tokenAmount 不再有意义，因为代币是铸造的，无需累积。
            emit RewardsDistributed(rewardRecipients, rewardAmounts);
        }

        // 4.3 转入开发金库
        if (treasuryUsdc > 0) {
            usdcToken.transfer(devTreasury, treasuryUsdc);
            pendingProfit.usdcAmount -= treasuryUsdc;
        }

        // 5. 本次分配完成，清空“待分配利润”
        // 由于奖励是铸造的，我们只关心 USDC 部分是否分配完毕。
        // 处理可能的微小舍入误差：将剩余的一点 USDC 也转入金库或结转。
        if (pendingProfit.usdcAmount > 0) {
            // 可选：将微小余额转入金库或保留至下次
            usdcToken.transfer(devTreasury, pendingProfit.usdcAmount);
        }
        pendingProfit.usdcAmount = 0;
        // tokenAmount 不再需要追踪，可以移除该状态变量
        pendingProfit.tokenAmount = 0;
        
        emit DistributionCompleted(usdcToDistribute, totalRewardAmount);
    }

    /**
     * 暂停功能: 暂停合约的所有可暂停功能
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function updateAllocation(
        uint256 _buybackRate,
        uint256 _rewardRate,
        uint256 _treasuryRate,
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_buybackRate + _rewardRate + _treasuryRate + _burnRate == 10000, "Sum must be 100%");
        buybackRate = _buybackRate;
        rewardRate = _rewardRate;
        treasuryRate = _treasuryRate;
        emit AllocationUpdated(_buybackRate, _rewardRate, _treasuryRate, _burnRate);
    }


    function updateDevTreasury(address _newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newTreasury != address(0), "Invalid address");
        devTreasury = _newTreasury;
    }
}
