// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import { AllowanceController } from "../src/Accounts/AllowanceController.sol";
import { MockERC20 } from "../src/Mock/MockERC20.sol";
import { EntryPoint } from "@account-abstraction/contracts/core/EntryPoint.sol";
import { WebAuthn256r1 } from "../src/Lib/WebAuthn256r1.sol";
import { console2 } from "@forge-std/console2.sol";
import { Test } from "@forge-std/Test.sol";
import { WebAuthnAccountFactory } from "../src/Accounts/WebAuthnAccountFactory.sol";
import { Paymaster } from "../src/Paymaster/Paymaster.sol";
// import { BaseScript } from "./Base.s.sol";

contract AllowanceModuleTest is Test {
    MockERC20 mockUSDC;
    address escrowAddr = vm.addr(0x27);
    // address merchantAddr = vm.addr(0xed);
    address customerAddr = vm.addr(0xdede);

    function setUp() public { }

    // function testoldAllowanceModule() public {
    //     vm.prank(customerAddr);
    //     //create mock and mint init supply to customer
    //     mockUSDC = new MockERC20("mockUSDC", "USDC", 100 ether, 18);

    // address[] memory tokens = new address[](1);
    // uint256[] memory allowances = new uint256[](1);
    // tokens[0] = address(mockUSDC);
    // allowances[0] = 100 ether;
    // //create allowance module with tokens and their allowances. set escrowAddr as owner
    // allowanceModule = new AllowanceModule(tokens, allowances);
    // vm.prank(customerAddr);
    // mockUSDC.approve(address(allowanceModule), 1000 ether);
    // uint256 amount = 10 ether;
    // vm.prank(escrowAddr);
    // allowanceModule.pay(address(mockUSDC), amount, customerAddr, escrowAddr);
    // uint256 escrowBalance = mockUSDC.balanceOf(escrowAddr);
    // assert(escrowBalance == amount);
    // console2.log("escrowAddr balance:", escrowBalance);
    // }

    function testFullFlow() public {
        EntryPoint entryPoint = new EntryPoint();
        console2.log("entrypoint", address(entryPoint));

        address webAuthnAddr = address(new WebAuthn256r1());
        console2.log("webAuthn", webAuthnAddr);
        //allowance module setup
        mockUSDC = new MockERC20("mockUSDC", "USDC", 100 ether, 18, msg.sender);
        address[] memory tokens = new address[](1);
        uint256[] memory allowances = new uint256[](1);
        // tokens[0] = address(mockUSDC);
        // allowances[0] = 100 ether;
        address token = address(mockUSDC);
        uint256 allowance = 100 ether;

        WebAuthnAccountFactory webAuthnAccountFactory =
            new WebAuthnAccountFactory(entryPoint, webAuthnAddr, 0xa8C9d55b0F734cAadfA2384d553464714b3A6369);
        console2.log("webAuthnAccountFactory", address(webAuthnAccountFactory));

        Paymaster paymaster = new Paymaster(entryPoint, msg.sender);
        console2.log("paymaster", address(paymaster));
        console2.log("paymaster owner", msg.sender);

        paymaster.addStake{ value: 1 wei }(60 * 10);
        paymaster.deposit{ value: 10 ether }();
        console2.log("paymaster deposit", paymaster.getDeposit());

        // EntryPoint.DepositInfo memory DepositInfo = entryPoint.getDepositInfo(address(paymaster));
        // console2.log("paymaster staked", DepositInfo.staked);
        // console2.log("paymaster stake", DepositInfo.stake);
        // console2.log("paymaster deposit", DepositInfo.deposit);
        // console2.log("paymaster unstakeDelaySec", DepositInfo.unstakeDelaySec);
        // console2.log("paymaster withdrawTime", DepositInfo.withdrawTime);
    }
}
