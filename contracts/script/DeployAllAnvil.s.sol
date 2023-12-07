// SPDX-License-Identifier: MIT
pragma solidity >=0.8.19 <0.9.0;

import { EntryPoint } from "@account-abstraction/contracts/core/EntryPoint.sol";
import { WebAuthn256r1 } from "../src/Lib/WebAuthn256r1.sol";
import { console2 } from "@forge-std/console2.sol";
import { Test } from "@forge-std/Test.sol";
import { WebAuthnAccountFactory } from "../src/Accounts/WebAuthnAccountFactory.sol";
import { Paymaster } from "../src/Paymaster/Paymaster.sol";
import { BaseScript } from "./Base.s.sol";
import { MockERC20 } from "../src/Mock/MockERC20.sol";

contract DeployAnvil is BaseScript, Test {
    MockERC20 mockUSDC;

    function run() external broadcast returns (address[4] memory) {
        // vm.stopBroadcast();
        // vm.startBroadcast(vm.envUint("ANVIL_PK"));
        // address addrAnvil = vm.addr(vm.envUint("ANVIL_PK"));
        address addrAnvil = msg.sender;
        // deploy the library contract and return the address
        EntryPoint entryPoint = new EntryPoint();
        console2.log("entrypoint", address(entryPoint));

        address webAuthnAddr = address(new WebAuthn256r1());
        console2.log("webAuthn", webAuthnAddr);
        // address[] memory tokens = new address[](1);
        // uint256[] memory allowances = new uint256[](1);
        // tokens[0] = address(mockUSDC);
        // allowances[0] = 100 ether;
        // address token = address(mockUSDC);
        // uint256 allowance = 100 ether;

        WebAuthnAccountFactory webAuthnAccountFactory =
            new WebAuthnAccountFactory(entryPoint, webAuthnAddr, 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65);

        console2.log("webAuthnAccountFactory", address(webAuthnAccountFactory));

        Paymaster paymaster = new Paymaster(entryPoint, addrAnvil);
        console2.log("paymaster", address(paymaster));
        console2.log("paymaster owner", addrAnvil);

        // address addrEOA = vm.addr(vm.envUint("PRIVATE_KEY"));
        uint256 amount = 100_000;
        // mockUSDC = new MockERC20("mockUSDC", "USDC", amount, 18, addrEOA);
        mockUSDC = new MockERC20("mockUSDC", "USDC", amount, 18, msg.sender);
        console2.log("mock erc", address(mockUSDC));
        // vm.stopBroadcast();
        // vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        address scWallet = 0x232E3478AF682f2971a942128593FC27D663934a;
        mockUSDC.approve(scWallet, amount);
        // vm.stopBroadcast();
        // vm.startBroadcast(vm.envUint("ANVIL_PK"));
        paymaster.addStake{ value: 1 wei }(60 * 10);
        paymaster.deposit{ value: 10 ether }();
        console2.log("paymaster deposit", paymaster.getDeposit());

        EntryPoint.DepositInfo memory DepositInfo = entryPoint.getDepositInfo(address(paymaster));
        console2.log("paymaster staked", DepositInfo.staked);
        console2.log("paymaster stake", DepositInfo.stake);
        console2.log("paymaster deposit", DepositInfo.deposit);
        console2.log("paymaster unstakeDelaySec", DepositInfo.unstakeDelaySec);
        console2.log("paymaster withdrawTime", DepositInfo.withdrawTime);

        return [address(entryPoint), webAuthnAddr, address(paymaster), address(webAuthnAccountFactory)];
    }
}
