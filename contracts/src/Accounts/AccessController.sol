// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./IAccessController.sol";

abstract contract AccessController is IAccessController {
    uint256 public ownerCount;
    uint256 public guardianCount;
    mapping(address => bool) private owners;
    uint8 public _signersCount;
    mapping(bytes => uint256[2]) public _signers;

    modifier onlyOwner() {
        require(isOwner(msg.sender) || msg.sender == address(this), "ACL:: only owner");
        _;
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
