// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockUSDC is ERC20, Ownable {
    // USDC 有 6 位小数
    constructor() ERC20("USD Coin", "USDC") Ownable(msg.sender) {
        // 部署时铸造一些代币给部署者
        _mint(msg.sender, 1000000 * 10 ** 6); // 100万 USDC，考虑6位小数
    }

    // 允许部署者铸造更多代币（仅用于测试）
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // 允许部署者销毁代币（仅用于测试）
    function burn(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }
}
