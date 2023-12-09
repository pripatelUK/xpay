// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { LinkTokenInterface } from "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import { IRouterClient } from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import { Client } from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import { CCIPReceiver } from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";

contract SEPAReceiver is Ownable, CCIPReceiver {
    error NoMessageReceived(); // Used when trying to access a message but no messages have been received.

    IERC20 public euro;

    // mapping(uint256 => bool) public completedPayments;

    // Struct to hold details of a payment.
    struct Payment {
        uint64 sourceChainSelector; // The chain selector of the source chain.
        address sender; // The address of the sender.
        string message; // The content of the message.
        address token; // received token.
        uint256 amount; // received amount.
    }

    // Storage variables.
    bytes32[] public receivedPayments; // Array to keep track of the IDs of received messages.
    bytes32[] public pendingPaymentIds;
    mapping(bytes32 => Payment) public paymentDetail; // Mapping from message ID to Message struct, storing details of
        // each received message.
    mapping(bytes32 => bool) public completedPayments;

    // Event emitted when a message is received from another chain.
    // The chain selector of the source chain.
    // The address of the sender from the source chain.
    // The message that was received.
    // The token amount that was received.
    event PaymentReceived( // The unique ID of the message.
        bytes32 indexed messageId,
        uint64 indexed sourceChainSelector,
        address sender,
        string message,
        Client.EVMTokenAmount tokenAmount
    );

    // Constructor to set the accepted ERC20 token
    constructor(address router, address _tokenAddress) CCIPReceiver(router) {
        euro = IERC20(_tokenAddress);
    }

    /// handle a received euro payment
    function _ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) internal override {
        bytes32 paymentId = any2EvmMessage.messageId; // fetch the messageId
        uint64 sourceChainSelector = any2EvmMessage.sourceChainSelector; // fetch the source chain identifier (aka
            // selector)
        address sender = abi.decode(any2EvmMessage.sender, (address)); // abi-decoding of the sender address
        Client.EVMTokenAmount[] memory tokenAmounts = any2EvmMessage.destTokenAmounts;
        address token = tokenAmounts[0].token; // we expect one token to be transfered at once but of course, you can
            // transfer several tokens.
        uint256 amount = tokenAmounts[0].amount; // we expect one token to be transfered at once but of course, you can
            // transfer several tokens.
        string memory message = abi.decode(any2EvmMessage.data, (string)); // abi-decoding of the sent string message
        receivedPayments.push(paymentId);
        Payment memory detail = Payment(sourceChainSelector, sender, message, token, amount);
        paymentDetail[paymentId] = detail;

        emit PaymentReceived(paymentId, sourceChainSelector, sender, message, tokenAmounts[0]);
    }

    // Function for the owner to send the specified ERC20 token from this contract to another address
    function sendEurosToMerchant(address _to, uint256 _amount, bytes32 _paymentId) public onlyOwner {
        require(euro.balanceOf(address(this)) >= _amount, "Insufficient euros");
        require(!completedPayments[_paymentId], "Payment already completed");

        require(euro.transfer(_to, _amount), "Transfer failed");
        completedPayments[_paymentId] = true;
    }

    function getLastReceivedMessageDetails()
        external
        view
        returns (
            bytes32 messageId,
            uint64 sourceChainSelector,
            address sender,
            string memory message,
            address token,
            uint256 amount
        )
    {
        // Revert if no messages have been received
        if (receivedPayments.length == 0) revert NoMessageReceived();

        // Fetch the last received message ID
        messageId = receivedPayments[receivedPayments.length - 1];

        // Fetch the details of the last received message
        Payment memory detail = paymentDetail[messageId];

        return (messageId, detail.sourceChainSelector, detail.sender, detail.message, detail.token, detail.amount);
    }

    /// @notice Fallback function to allow the contract to receive Ether.
    /// @dev This function has no function body, making it a default function for receiving Ether.
    /// It is automatically called when Ether is sent to the contract without any data.
    receive() external payable { }
}
