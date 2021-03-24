pragma solidity ^0.5.00;

import "./BondingCurve.sol";
// import "../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";

contract GoalZappBondingCurve is BondingCurve {
  using SafeMath for uint256;
// initial poolBalance (ether to send) web3.utils.toWei(".03359789")
uint256 public constant INITIAL_SUPPLY = 128 * (10 ** 18);
uint32 public constant RESERVE_RATIO = 333333;
uint256 public constant GAS_PRICE = 50 * (10 ** 10);
bool private initializedBondingCurve;

  function initializeBondingCurve () public payable {
    require(!initializedBondingCurve, "Bonding Curve is already initialized");
    poolBalance = msg.value;
    reserveRatio = RESERVE_RATIO;
    _mint(msg.sender, INITIAL_SUPPLY);
    initializedBondingCurve = true;
  }
}






