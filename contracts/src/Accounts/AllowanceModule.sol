// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { IAllowanceModule } from "./IAllowanceModule.sol";
// import { console2 } from "@forge-std/console2.sol";
import "forge-std/console.sol";

abstract contract AllowanceModule is IAllowanceModule {
    uint256 private lastSpend;
    uint256 private cumulativeSpent;

    // address public constant GHO_ADDRESS = 0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f;
    // address public constant SDAI_ADDRESS = 0x83F20F44975D03b1b09e64809B757c47f942BEeA;
    // address public constant USDC_ADDRESS = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48; //6 decimals

    mapping(address => uint256) private dailyAllowances;

    //@note amount here is on token native decimals e.g. 1e6 for usdc and 1e18 for gho
    constructor(address token, uint256 allowance) {
        lastSpend = block.timestamp - 1 days;
        cumulativeSpent = 0;

        //set all allowances
        // require(tokens.length == allowances.length, "all tokens need an allowance");
        // for (uint256 i = 0; i < tokens.length; i++) {
        //     uint8 decimals = IERC20Metadata(tokens[i]).decimals();
        //     uint256 normalizedAllowance = (allowances[i] * 10 ** 18) / (10 ** decimals);
        //     dailyAllowances[tokens[i]] = normalizedAllowance;
        // }
        dailyAllowances[token] = allowance;
    }

    //@note amount here is on token native decimals e.g. 1e6 for usdc and 1e18 for gho
    function pay(address tokenAddr, uint256 amount, address customerAddr, address merchantAddr) external virtual {
        IERC20Metadata token = IERC20Metadata(tokenAddr);
        uint256 normalizedAmount = (amount * 10 ** 18) / (10 ** token.decimals());
        uint256 timeDelta = block.timestamp - lastSpend;
        if (timeDelta >= 24 hours) {
            require(normalizedAmount <= dailyAllowances[tokenAddr], "expenditure is above daily allowance");
            cumulativeSpent = 0;
            //@note setup customer approval so the below runs
            token.transferFrom(customerAddr, merchantAddr, amount);
            cumulativeSpent += normalizedAmount;
        } else {
            require(
                cumulativeSpent + normalizedAmount <= dailyAllowances[tokenAddr],
                "expenditure would be take you above the daily allowance"
            );
            token.transferFrom(customerAddr, merchantAddr, amount);
            cumulativeSpent += normalizedAmount;
        }
    }
}
