// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import { IRouterClient } from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import { OwnerIsCreator } from "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import { Client } from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import { IERC20 } from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.0/token/ERC20/IERC20.sol";

/**
 * THIS IS AN EXAMPLE CONTRACT THAT USES HARDCODED VALUES FOR CLARITY.
 * THIS IS AN EXAMPLE CONTRACT THAT USES UN-AUDITED CODE.
 * DO NOT USE THIS CODE IN PRODUCTION.
 */

/// Pay using native tokens (e.g, ETH in Ethereum)
contract SEPASender is OwnerIsCreator {
    address routerAddr;

    // Event emitted when a message is sent to another chain.
    // The chain selector of the destination chain.
    // The address of the receiver on the destination chain.
    // The message being sent.
    // The token amount that was sent.
    // The fees paid for sending the message.
    event MessageSent( // The unique ID of the message.
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address receiver,
        string message,
        Client.EVMTokenAmount tokenAmount,
        uint256 fees
    );

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

    constructor(address _router) {
        routerAddr = _router;
    }

    /// @notice Sends data to receiver on the destination chain.
    /// @dev Assumes your contract has sufficient native asset (e.g, ETH on Ethereum, MATIC on Polygon...).
    /// @param destinationChainSelector The identifier (aka selector) for the destination blockchain.
    /// @param receiver The address of the recipient on the destination blockchain.
    /// @param message The string message to be sent.
    /// @param token token address.
    /// @param amount token amount.
    /// @return messageId The ID of the message that was sent.
    function sendMessage(
        uint64 destinationChainSelector,
        address receiver,
        string calldata message,
        address token,
        uint256 amount
    )
        external
        returns (bytes32 messageId)
    {
        // set the tokent amounts
        Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
        Client.EVMTokenAmount memory tokenAmount = Client.EVMTokenAmount({ token: token, amount: amount });
        tokenAmounts[0] = tokenAmount;
        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(receiver), // ABI-encoded receiver address
            data: abi.encode(message), // ABI-encoded string message
            tokenAmounts: tokenAmounts, // Tokens amounts
            extraArgs: Client._argsToBytes(
                Client.EVMExtraArgsV1({ gasLimit: 200_000, strict: false }) // Additional arguments, setting gas limit and
                    // non-strict sequency mode
            ),
            feeToken: address(0) // Setting feeToken to zero address, indicating native asset will be used for fees
         });

        // Initialize a router client instance to interact with cross-chain router
        IRouterClient router = IRouterClient(routerAddr);

        // approve the Router to spend tokens on contract's behalf. I will spend the amount of the given token
        IERC20(token).approve(address(router), amount);

        // Get the fee required to send the message
        uint256 fees = router.getFee(destinationChainSelector, evm2AnyMessage);

        // Send the message through the router and store the returned message ID
        messageId = router.ccipSend{ value: fees }(destinationChainSelector, evm2AnyMessage);

        // Emit an event with message details
        emit MessageSent(messageId, destinationChainSelector, receiver, message, tokenAmount, fees);

        // Return the message ID
        return messageId;
    }
}
