/* 

- deploy sender

forge script ./script/DeploySEPACCIP.s.sol:DeploySEPACCIP -vvv --broadcast --rpc-url avalancheFuji --sig
"deploySender()"

- sender: 0xa38b14AF02A08a7Ece8E735872d0937C1607EF6f

forge script ./script/DeploySEPACCIP.s.sol:DeploySEPACCIP -vvv --broadcast --rpc-url polygonMumbai --sig
"deployReceiver()"

- reeiver: 0x94C1555D5d28E1436B3920C0b880C5700b4793a4

- load up sender contract with avax
cast send 0x6D2bAD8d296DfD38Da6DdCD46c313178134578F5 --rpc-url avalancheFuji
--private-key= --value 0.2ether

- load up receiver contract with EURe

forge script ./script/DeploySEPACCIP.s.sol:SendPayment -vvv --broadcast --rpc-url avalancheFuji --sig
"run(address,address,string,address,uint256)" -- 0xa38b14AF02A08a7Ece8E735872d0937C1607EF6f
0x94C1555D5d28E1436B3920C0b880C5700b4793a4 "IBAN_HERE" 0xD21341536c5cF5EB1bcb58f6723cE26e8D8E90e4 100

cast call 0x94C1555D5d28E1436B3920C0b880C5700b4793a4 "getLastReceivedMessageDetails()" --rpc-url polygonMumbai
*/

// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "forge-std/Script.sol";
import "./ChainlinkHelper.sol";
import { SEPAReceiver } from "../src/SEPAReceiver.sol";
import { SEPASender } from "../src/SEPASender.sol";

contract DeploySEPACCIP is Script, Helper {
    function deploySender() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        (address router,,,) = getConfigFromNetwork(SupportedNetworks.AVALANCHE_FUJI);

        SEPASender sepaSender = new SEPASender(router);
        // address mumbaiEURe = address(0xCF487EFd00B70EaC8C28C654356Fb0E387E66D62);
        // SEPAReceiver sepaReceiver = new SEPAReceiver(router, mumbaiEURe);

        console.log("SEPASender contract deployed on fuji", "with address: ", address(sepaSender));
        // console.log("SEPAReceiver contract deployed on ", networks[network], "with address: ",
        // address(sepaReceiver));

        vm.stopBroadcast();
    }

    function deployReceiver() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        (address router,,,) = getConfigFromNetwork(SupportedNetworks.POLYGON_MUMBAI);

        address mumbaiEURe = address(0xCF487EFd00B70EaC8C28C654356Fb0E387E66D62);
        SEPAReceiver sepaReceiver = new SEPAReceiver(router, mumbaiEURe);

        console.log("SEPAReceiver contract deployed on mumbai", "with address: ", address(sepaReceiver));

        vm.stopBroadcast();
    }
}

contract SendPayment is Script, Helper {
    function run(
        address payable sender,
        address receiver,
        string memory message,
        address token,
        uint256 amount
    )
        external
    {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        (,,, uint64 destinationChainId) = getConfigFromNetwork(SupportedNetworks.POLYGON_MUMBAI);

        bytes32 messageId = SEPASender(sender).sendMessage(destinationChainId, receiver, message, token, amount);

        console.log(
            "You can now monitor the status of your Chainlink CCIP Message via https://ccip.chain.link using CCIP Message ID: "
        );
        console.logBytes32(messageId);

        vm.stopBroadcast();
    }
}
