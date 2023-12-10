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
import { IEntryPoint } from "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import { IERC20 } from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.0/token/ERC20/IERC20.sol";
import "./ChainlinkHelper.sol";
import { IAllowanceModule } from "../src/Accounts/IAllowanceModule.sol";

contract DeployAnvil is BaseScript, Test, Helper {
    MockERC20 mockUSDC;

    function run() external broadcast returns (address[3] memory) {
        // vm.stopBroadcast();
        // vm.startBroadcast(vm.envUint("ANVIL_PK"));
        // address addrAnvil = vm.addr(vm.envUint("ANVIL_PK"));
        // deploy the library contract and return the address
        EntryPoint entryPoint = new EntryPoint();
        console2.log("entrypoint", address(entryPoint));

        address webAuthnAddr = address(new WebAuthn256r1());
        console2.log("WebAuthn256r1", webAuthnAddr);

        Paymaster paymaster = new Paymaster(entryPoint, msg.sender);
        console2.log("paymaster", address(paymaster));
        console2.log("paymaster owner", msg.sender);

        // vm.stopBroadcast();
        // vm.startBroadcast(vm.envUint("ANVIL_PK"));
        paymaster.addStake{ value: 1 wei }(60 * 10);
        paymaster.deposit{ value: 1 ether }();
        console2.log("paymaster deposit", paymaster.getDeposit());

        EntryPoint.DepositInfo memory DepositInfo = entryPoint.getDepositInfo(address(paymaster));
        console2.log("paymaster staked", DepositInfo.staked);
        console2.log("paymaster stake", DepositInfo.stake);
        console2.log("paymaster deposit", DepositInfo.deposit);
        console2.log("paymaster unstakeDelaySec", DepositInfo.unstakeDelaySec);
        console2.log("paymaster withdrawTime", DepositInfo.withdrawTime);

        webAuthnFactory(address(entryPoint), webAuthnAddr);

        return [address(entryPoint), webAuthnAddr, address(paymaster)];
    }

    function mock() external {
        // address[] memory tokens = new address[](1);
        // uint256[] memory allowances = new uint256[](1);
        // tokens[0] = address(mockUSDC);
        // allowances[0] = 100 ether;
        // address token = address(mockUSDC);
        // uint256 allowance = 100 ether;

        // address addrEOA = vm.addr(vm.envUint("PRIVATE_KEY"));
        uint256 amount = 100_000;
        // mockUSDC = new MockERC20("mockUSDC", "USDC", amount, 18, addrEOA);
        mockUSDC = new MockERC20("mockUSDC", "USDC", amount, 18, msg.sender);
        console2.log("mock erc", address(mockUSDC));
        // vm.stopBroadcast();
        // vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        address scWallet = 0x232E3478AF682f2971a942128593FC27D663934a;
        mockUSDC.approve(scWallet, amount);
    }

    function approve() external broadcast {
        vm.stopBroadcast();
        vm.startBroadcast(vm.envUint("TRUSTWALLET_PK"));
        address eoa = address(0x4c4AD6820d4F7E57f48546948026754bD1dF289f);
        address virtualAACard = address(0xEa9ac9e03Cd74986205A495375038af79d8a46D5);
        // console2.log(IERC20(ccipBnMAvalancheFuji).allowance(eoa, virtualAACard));
        IERC20(ccipBnMAvalancheFuji).approve(virtualAACard, 10_000 ether);
        console2.log(IERC20(ccipBnMAvalancheFuji).allowance(eoa, virtualAACard));

        // IAllowanceModule(virtualAACard).pay(ccipBnMAvalancheFuji, 1616, eoa, "0x000000000");
    }

    function webAuthnFactory(address entryPoint, address webAuthnr1) public {
        address loginService = address(0xa8C9d55b0F734cAadfA2384d553464714b3A6369);
        WebAuthnAccountFactory webAuthnAccountFactory =
            new WebAuthnAccountFactory(IEntryPoint(entryPoint), webAuthnr1, loginService);

        console2.log("webAuthnAccountFactory", address(webAuthnAccountFactory));
    }
}
