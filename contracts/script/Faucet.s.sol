// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import "./ChainlinkHelper.sol";

interface ICCIPToken {
    function drip(address to) external;
}

contract Faucet is Script, Helper {
    function run(SupportedNetworks network) external {
        uint256 senderPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(senderPrivateKey);
        address senderAddress = vm.addr(senderPrivateKey);

        (address ccipBnm, address ccipLnm) = getDummyTokensFromNetwork(network);
        address customer = address(0x4c4AD6820d4F7E57f48546948026754bD1dF289f);

        ICCIPToken(ccipBnm).drip(customer);

        if (network == SupportedNetworks.ETHEREUM_SEPOLIA) {
            ICCIPToken(ccipLnm).drip(customer);
        }

        vm.stopBroadcast();
    }
}
