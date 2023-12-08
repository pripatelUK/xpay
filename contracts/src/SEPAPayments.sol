// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { LinkTokenInterface } from "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import { IRouterClient } from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import { Client } from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import { CCIPReceiver } from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";

contract SEPAPayments is Ownable, CCIPReceiver {
    IERC20 public euro;

    struct Payment {
        address merchant;
        string description;
        uint256 timestamp;
    }

    mapping(uint256 => Payment) public payments;
    mapping(uint256 => bool) public completedPayments;
    uint256[] public pendingPaymentIds;

    // uint256 public paymentCount;

    // Struct to hold details of a message.
    struct Message {
        uint64 sourceChainSelector; // The chain selector of the source chain.
        address sender; // The address of the sender.
        string message; // The content of the message.
        address token; // received token.
        uint256 amount; // received amount.
    }

    // Storage variables.
    bytes32[] public receivedMessages; // Array to keep track of the IDs of received messages.
    mapping(bytes32 => Message) public messageDetail; // Mapping from message ID to Message struct, storing details of
        // each received message.

    // Event emitted when a message is received from another chain.
    // The chain selector of the source chain.
    // The address of the sender from the source chain.
    // The message that was received.
    // The token amount that was received.
    event MessageReceived( // The unique ID of the message.
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

    // Function to receive a new payment record to process
    // function processPayment(uint256 _amount, string memory _description) public onlyOwner {
    //     payments[paymentCount] =
    //         Payment({ merchant: msg.sender, description: _description, timestamp: block.timestamp });

    //     pendingPaymentIds.push(paymentCount);
    //     paymentCount++;
    // }

    /// handle a received euro payment
    function _ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) internal override {
        bytes32 messageId = any2EvmMessage.messageId; // fetch the messageId
        uint64 sourceChainSelector = any2EvmMessage.sourceChainSelector; // fetch the source chain identifier (aka
            // selector)
        address sender = abi.decode(any2EvmMessage.sender, (address)); // abi-decoding of the sender address
        Client.EVMTokenAmount[] memory tokenAmounts = any2EvmMessage.destTokenAmounts;
        address token = tokenAmounts[0].token; // we expect one token to be transfered at once but of course, you can
            // transfer several tokens.
        uint256 amount = tokenAmounts[0].amount; // we expect one token to be transfered at once but of course, you can
            // transfer several tokens.
        string memory message = abi.decode(any2EvmMessage.data, (string)); // abi-decoding of the sent string message
        receivedMessages.push(messageId);
        Message memory detail = Message(sourceChainSelector, sender, message, token, amount);
        messageDetail[messageId] = detail;

        emit MessageReceived(messageId, sourceChainSelector, sender, message, tokenAmounts[0]);
    }

    // Function for the owner to send the specified ERC20 token from this contract to another address
    function sendEurosToMerchant(address _to, uint256 _amount, uint256 _paymentId) public onlyOwner {
        require(euro.balanceOf(address(this)) >= _amount, "Insufficient euros");
        require(!completedPayments[_paymentId], "Payment already completed");

        require(euro.transfer(_to, _amount), "Transfer failed");
        completedPayments[_paymentId] = true;

        // Remove payment ID from pending payments
        for (uint256 i = 0; i < pendingPaymentIds.length; i++) {
            if (pendingPaymentIds[i] == _paymentId) {
                pendingPaymentIds[i] = pendingPaymentIds[pendingPaymentIds.length - 1];
                pendingPaymentIds.pop();
                break;
            }
        }
    }

    // Function to list all pending (not completed) payment IDs
    function listPendingPayments() public view returns (uint256[] memory) {
        return pendingPaymentIds;
    }
}
