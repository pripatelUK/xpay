// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { console2 } from "forge-std/console2.sol";

contract MerchantRegistry {
    address private owner;

    constructor(address _owner) {
        owner = _owner;
    }

    mapping(address => bytes) public merchants;

    //@note the message need to be provided as a hex string hex"2b343437383930323738313034" represents +447890278104
    //ethers.js wallet.signMessage("+447890278104") can generate a signature you can use to test this with
    function addMerchantToRegistry(bytes memory message, bytes memory signature) public {
        require(msg.sender == owner, "!owner");
        bytes32 hashedMessage = ECDSA.toEthSignedMessageHash(message);
        address signer = ECDSA.recover(hashedMessage, signature);
        console2.log(signer);
        require(signer != address(0), "Invalid signature");
        merchants[signer] = message;
    }
}
