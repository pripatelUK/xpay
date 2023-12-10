pragma solidity ^0.8.19;

interface ISEPASender {
    event MessageSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address receiver,
        string message,
        EVMTokenAmount tokenAmount,
        uint256 fees
    );
    event OwnershipTransferRequested(address indexed from, address indexed to);
    event OwnershipTransferred(address indexed from, address indexed to);

    struct EVMTokenAmount {
        address token;
        uint256 amount;
    }

    function acceptOwnership() external;
    function messageDetail(bytes32)
        external
        view
        returns (uint64 sourceChainSelector, address sender, string memory message, address token, uint256 amount);
    function owner() external view returns (address);
    function receivedMessages(uint256) external view returns (bytes32);
    function sendMessage(
        uint64 destinationChainSelector,
        address receiver,
        string memory message,
        address token,
        uint256 amount
    )
        external
        returns (bytes32 messageId);
    function transferOwnership(address to) external;
}
