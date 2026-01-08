// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockWETH is ERC20 {
    constructor() ERC20("Wrapped Ether", "WETH") {}

    // 存入 ETH 并铸造 WETH
    function deposit() public payable {
        _mint(msg.sender, msg.value);
    }

    // 销毁 WETH 并提取 ETH
    function withdraw(uint256 wad) public {
        _burn(msg.sender, wad);
        payable(msg.sender).transfer(wad);
    }

    // 允许合约接收 ETH
    receive() external payable {
        deposit();
    }
}
