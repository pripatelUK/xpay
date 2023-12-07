// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IAccessController.sol";
import { IERC20Metadata } from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import { IAllowanceModule } from "./IAllowanceModule.sol";
// import { console2 } from "@forge-std/console2.sol";
import "forge-std/console.sol";

abstract contract AllowanceController is IAccessController, IAllowanceModule {
    uint256 public ownerCount;
    mapping(address => bool) private owners;
    uint8 public _signersCount;
    mapping(bytes => uint256[2]) public _signers;

    uint256 private lastSpend;
    uint256 private cumulativeSpent;

    // address public constant GHO_ADDRESS = 0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f;
    // address public constant SDAI_ADDRESS = 0x83F20F44975D03b1b09e64809B757c47f942BEeA;
    // address public constant USDC_ADDRESS = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48; //6 decimals

    mapping(address => uint256) private dailyAllowances;

    modifier onlyOwner() {
        require(isOwner(msg.sender) || msg.sender == address(this), "ACL:: only owner");
        _;
    }

    function setDailyAllowance(address token, uint256 allowance) external onlyOwner {
        lastSpend = block.timestamp - 1 days;
        cumulativeSpent = 0;
        dailyAllowances[token] = allowance;
    }

    //@note amount here is on token native decimals e.g. 1e6 for usdc and 1e18 for gho
    function pay(address tokenAddr, uint256 amount, address customerAddr, address merchantAddr) external onlyOwner {
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

    modifier onlyOwnerOrEntryPoint(address _entryPoint) {
        require(msg.sender == _entryPoint || isOwner(msg.sender), "ACL:: not owner or entryPoint");
        _;
    }

    function isOwner(address _address) public view returns (bool) {
        return owners[_address];
    }

    //custom
    function addSigner(bytes calldata credId, uint256[2] calldata pubKeyCoordinates) external onlyOwner {
        _addSigner(credId, pubKeyCoordinates);
    }

    //custom
    function _addSigner(bytes memory credId, uint256[2] memory pubKeyCoordinates) internal {
        _signers[credId] = pubKeyCoordinates;
        _signersCount++;
    }

    function addOwner(address _newOwner) external onlyOwner {
        _addOwner(_newOwner);
    }

    // INTERNAL

    function _addOwner(address _newOwner) internal {
        // no check for address(0) as used when creating wallet via BLS.
        require(_newOwner != address(0), "ACL:: zero address");
        require(!owners[_newOwner], "ACL:: already owner");
        emit OwnerAdded(_newOwner);
        owners[_newOwner] = true;
        ownerCount = ownerCount + 1;
    }
}
