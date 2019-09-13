pragma solidity ^0.5.0;

import "./GoalZappToken.sol";

// mock class using ERC20
contract ERC20Mock is GoalZappToken {
    constructor (address initialAccount, uint256 initialBalance, uint256 _protectionPeriod) GoalZappToken(_protectionPeriod)  public {
        _mint(initialAccount, initialBalance);

    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) public {
        _burn(account, amount);
    }

    function burnFrom(address account, uint256 amount) public {
        _burnFrom(account, amount);
    }

    function transferInternal(address from, address to, uint256 value) public  checkProtectedTokens (value)   {
        _transfer(from, to, value);
    }

    function approveInternal(address owner, address spender, uint256 value) public {
        _approve(owner, spender, value);
    }
}
