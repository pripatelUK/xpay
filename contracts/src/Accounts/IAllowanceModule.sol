pragma solidity ^0.8.19;

interface IAllowanceModule {
    function pay(address tokenAddr, uint256 amount, address customerAddr, address merchantAddr) external;
}
