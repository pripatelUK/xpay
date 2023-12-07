// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SEPAPayments is Ownable {
    IERC20 public euro;

    struct Payment {
        address merchant;
        string description;
        uint256 timestamp;
    }

    mapping(uint256 => Payment) public payments;
    mapping(uint256 => bool) public completedPayments;
    uint256[] public pendingPaymentIds;

    uint256 public paymentCount;

    // Constructor to set the accepted ERC20 token
    constructor(address _tokenAddress) {
        euro = IERC20(_tokenAddress);
    }

    // Function to receive a new payment record to process
    function processPayment(uint256 _amount, string memory _description) public onlyOwner {
        payments[paymentCount] =
            Payment({ merchant: msg.sender, description: _description, timestamp: block.timestamp });

        pendingPaymentIds.push(paymentCount);
        paymentCount++;
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
