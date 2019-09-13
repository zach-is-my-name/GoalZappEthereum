pragma solidity ^0.5.00;

import "./BondingCurve.sol";


contract BondingCurveMock is BondingCurve {
  constructor(
    uint256 totalSupplyArg,
    uint32 reserveRatioArg,
    uint256 gasPriceArg) public payable
  {

    reserveRatio = reserveRatioArg;
    _totalSupply = totalSupplyArg;
    gasPrice = gasPriceArg;
    poolBalance = msg.value;

    _balances[_owner] = totalSupplyArg;
    emit Transfer(address(0x0), _owner, totalSupplyArg);
  }
}

