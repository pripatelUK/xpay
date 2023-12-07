pragma solidity ^0.8.19;

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    uint8 private _decimals; //openzep hardcodes decimals to 18 so creating this as a workaround

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 initialSupply,
        uint8 decimals_,
        address fundedAddr
    )
        ERC20(name_, symbol_)
    {
        _mint(fundedAddr, initialSupply);
        _setDecimals(decimals_);
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     */
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Sets the number of decimals.
     */
    function _setDecimals(uint8 decimals_) internal {
        _decimals = decimals_;
    }
}

// contract MockERC20 {
//     string public name = "ERC20Mock";
//     string public symbol = "ERC20Mock";
//     uint8 public decimals;

//     event Transfer(address indexed from, address indexed to, uint256 amount);

//     mapping(address => uint256) balances;

//     uint256 internal _totalSupply;

//     constructor(uint256 _initSupply, uint8 _decimals) {
//         _totalSupply = _initSupply;
//         balances[msg.sender] = _initSupply;
//         decimals = _decimals;
//     }

//     function totalSupply() public view returns (uint256) {
//         return _totalSupply;
//     }

//     function balanceOf(address owner) public view returns (uint256) {
//         return balances[owner];
//     }

//     function transfer(address to, uint256 amount) public returns (bool) {
//         balances[msg.sender] = balances[msg.sender] - amount;
//         balances[to] = balances[to] + amount;
//         return true;
//     }
// }
