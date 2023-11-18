// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/MerchantRegistry.sol";
// import "forge-std/console.sol";
import { console2 } from "forge-std/console2.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract MerchantRegistryTest is Test {
    MerchantRegistry merchantRegistry;
    address owner = vm.addr(1);

    event printer(bytes sig);
    event printer32(bytes32 hash);

    function setUp() public { }

    function testRegistry() public {
        vm.startPrank(owner);
        bytes memory message = hex"2b343437383930353738393034"; //in string 447890578904 -
            // https://codebeautify.org/string-hex-converter
        bytes memory sig =
            hex"1bd03f41718cdbf3da8c3a91992cfc19e8a95723f161e7f3da224f8ff9991aa242c48c426a5ab0d0952c00fa835d6b031089cf8dee77d786acaf9be7a9502ca21b";
        merchantRegistry = new MerchantRegistry(owner);
        merchantRegistry.addMerchantToRegistry(message, sig);
        bytes memory storedMsg = merchantRegistry.merchants(address(0xe425c866Fd781064c394e1250730A2067F30f394)); //it
        emit printer(storedMsg);
    }
}
