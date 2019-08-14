pragma solidity ^0.4.18;

import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./BancorFormula.sol";
import "./BondingCurveConstructor.sol";
import "./SafeMath.sol";

/**
 * @title Bonding Curve
 * @dev Bonding curve contract based on Bacor formula
 */
contract BondingCurve is BondingCurveConstructor, StandardToken, BancorFormula, Ownable {
  using SafeMath for uint256;

  constructor  ( uint256 _totalSupply, uint32 _reserveRatio /* , uint256 _gasPrice */ ) public payable {

    reserveRatio = _reserveRatio;
    poolBalance = msg.value;   
    totalSupply_ = _totalSupply;
    balances[owner] = _totalSupply;
  }

  /**
   * @dev Available balance of reserve token in contract
   */
  uint256 public poolBalance;

  /*
   * @dev reserve ratio, represented in ppm, 1-1000000
   * 1/3 corresponds to y= multiple * x^2
   * 1/2 corresponds to y= multiple * x
   * 2/3 corresponds to y= multiple * x^1/2
   * multiple will depend on contract initialization,
   * specifically totalAmount and poolBalance parameters
   * we might want to add an 'initialize' function that will allow
   * the owner to send ether to the contract and mint a given amount of tokens
  */
  uint32 public reserveRatio;

  /*
   * - Front-running attacks are currently mitigated by the following mechanisms:
   * TODO - minimum return argument for each conversion provides a way to define a minimum/maximum price for the transaction
   * - gas price limit prevents users from having control over the order of execution
  */
  uint256 public gasPrice = 1000000000000 wei; // maximum gas price for bancor transactions

  /**
   * @dev default function
   * gas ~ 91645
   */
  function() public payable {
    buy();
  }

  /**
   * @dev Buy tokens
   * gas ~ 77825
   * TODO implement maxAmount that helps prevent miner front-running
   */
  function buy() validGasPrice public payable returns(bool) {
    require(msg.value > 0);
    uint256 tokensToMint = calculatePurchaseReturn(totalSupply_, poolBalance, reserveRatio, msg.value);
    totalSupply_ = totalSupply_.add(tokensToMint);
    balances[msg.sender] = balances[msg.sender].add(tokensToMint);
    poolBalance = poolBalance.add(msg.value);
    LogMint(tokensToMint, msg.value);
    return true;
  }

  /**
   * @dev Sell tokens
   * gas ~ 86936
   * @param sellAmount Amount of tokens to withdraw
   * TODO implement maxAmount that helps prevent miner front-running
   */
  function sell(uint256 sellAmount) validGasPrice public returns(bool) {
    require(sellAmount > 0 && balances[msg.sender] >= sellAmount);
    uint256 ethAmount = calculateSaleReturn(totalSupply_, poolBalance, reserveRatio, sellAmount);
    msg.sender.transfer(ethAmount);
    poolBalance = poolBalance.sub(ethAmount);
    balances[msg.sender] = balances[msg.sender].sub(sellAmount);
    totalSupply_ = totalSupply_.sub(sellAmount);
    LogWithdraw(sellAmount, ethAmount);
    return true;
  }

  // verifies that the gas price is lower than the universal limit
  modifier validGasPrice() {
    assert(tx.gasprice <= gasPrice);
    _;
  }

  /**
   * @dev Allows the owner to update the gas price limit
   * @param _gasPrice The new gas price limit
  */
  function setGasPrice(uint256 _gasPrice) onlyOwner public {
    require(_gasPrice > 0);
    gasPrice = _gasPrice;
  }

  event LogMint(uint256 amountMinted, uint256 totalCost);
  event LogWithdraw(uint256 amountWithdrawn, uint256 reward);
  event LogBondingCurve(string logString, uint256 value);
}
