// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./lib/SafeMath.sol";

contract InsightToken is ERC20, AccessControl, Pausable {
    using SafeMath for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant DISCOUNTER_MANAGER_ROLE =
        keccak256("DISCOUNT_MINTER_ROLE");

    // 代币抵扣 ai 服务费的相关参数
    uint256 public constant MAX_DISCOUNT_RATE = 2000; // 最大抵扣费率，用基点表示 20%
    uint256 public discountRate; // 当前折扣率

    address public plaformTreasury; // 平台金库地址，接收用户支付的服务费

    event ServiceFeePaid(
        address indexed user,
        uint256 usdcAmount,
        uint256 tokenAmount,
        uint256 discountApplied
    );
    event DiscountRateUpdated(uint256 oldRate, uint256 newRate);
    event PlaformTreasuryUpdated(address oldTreasury, address newTreasury);

    constructor(
        address _plaformTreasury,
        string memory _name,
        string memory _symbol,
        address initialMinter,
        address initialTreasury
    ) ERC20(_name, _symbol) {
        plaformTreasury = _plaformTreasury;
        discountRate = 1000; // 默认设置折扣为10%
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, initialMinter); // 初始铸造者设置为奖励池合约
        _grantRole(DISCOUNTER_MANAGER_ROLE, msg.sender);
    }

    /**
     * 使用代币支付 服务费用
     * @param usdcFeeAmount 原始USDC金额
     * @param maxTokenAmount 用户愿意支付的最大代币数
     */
    function payServiceFeedWithDiscount(
        uint256 usdcFeeAmount,
        uint256 maxTokenAmount
    ) external whenNotPaused returns (uint256 tokenAmountPaid) {
        require(usdcFeeAmount > 0, "usdcFeeAmount must be greater than 0");

        // 获取代币价格
        uint256 tokenInUsdc = usdcToToken(usdcFeeAmount);
        uint256 tokenAmountWithOutDiscount = (usdcFeeAmount * 10 ** 18) /
            tokenInUsdc /
            10 ** 18;

        // 应用折扣
        tokenAmountPaid =
            (tokenAmountWithOutDiscount * (10000 - discountRate)) /
            10000;

        require(
            tokenAmountPaid <= maxTokenAmount,
            "tokenAmountPaid must be less than maxTokenAmount"
        );

        require(
            balanceOf(msg.sender) >= tokenAmountPaid,
            "Insufficient balance"
        );

        // 将代币转到平台金库
        _transfer(msg.sender, plaformTreasury, tokenAmountPaid);

        // 发送服务支付事件
        emit ServiceFeePaid(
            msg.sender,
            usdcFeeAmount,
            tokenAmountPaid,
            discountRate
        );
        return tokenAmountPaid;
    }

    /** 管理功能 */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function updatedDiscountRate(
        uint newRate
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newRate > MAX_DISCOUNT_RATE, "Discount rate is too heigth");
        uint256 oldRate = discountRate;
        discountRate = newRate;
        emit DiscountRateUpdated(oldRate, newRate);
    }

    function updateTreasury(
        address newTreasury
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(address(0) != newTreasury, "Treasury address cannot be zero");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
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

    /**
     *  获取代币 usdc 价格
     * @param usdcAmount USDC数量
     */
    function usdcToToken(uint256 usdcAmount) public view returns (uint256) {
        usdcAmount = usdcAmount.mul(10 ** 18);
        uint256 tokenPrice = getTokenPrice();
        return usdcAmount.mul(10 ** 18).div(tokenPrice);
    }

    function getTokenPrice() public view returns (uint256) {
        // 从预言机取 平台 token 价格 / 或者增加更新方法由管理员设置价格 ,默认 0.01 usdc： 10000000000000000
        return 10000000000000000;
    }
}
