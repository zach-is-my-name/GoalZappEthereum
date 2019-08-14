pragma solidity ^0.5.0;

import "./ERC20.sol";

contract GoalZappToken is ERC20 {
    constructor(uint256 _protectionPeriod) ERC20(_protectionPeriod) public {}
}
