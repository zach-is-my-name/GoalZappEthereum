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

  function initialize () public payable {
    require(!initializedBondingCurve, "Bonding Curve is already initialized");
    poolBalance = msg.value;
    reserveRatio = RESERVE_RATIO;
    _mint(msg.sender, INITIAL_SUPPLY);
    initializedBondingCurve = true;
  }
}




// initial supply = 100 tokens @ $.088 for the 100th
// calculate initial supply in required format
// calculate reserve ratio in required format
// calculate total cost of initial supply and run 

// find out how to deal with Wei
// calculated reserve ratio = 0; (reserveRatio = **ratioNumerator.div(ratioDenominator);**)
// try: multiply all numbers by 1,000,000 
//tokensToMintDenominator =  333333 * 2500 = 83,332,500
//poolBalance =  1e^24 
// poolBalance / tokensToMintDenominator =   1e^24 /  83,332,500 = 
//original 1e^18 
// original  (.333333 * .0025) = .0008333325 
// original result = 1e^18 / .0008333325  = 1.20000120 *e^ 21
// scaled result =  1.20001200 * e^16
// need to find common scaling factor after introducing wei 
//(.0008333325) * 1,000,000 = 833.3325) ==  

// can't have fractions unless they are evenly divisable... better to do what you did with the ratio and multiply.  . 


//	p * 10^18 / .333333 * (1/400)
// from stackExchange, oem, relevant/Bancor, look at the 'precision'
        

//    reserveRatio = _reserveRatioArg;

// reserveRatio: 333333
// totalSupply: calculate
//   uint256 reserveRatio = divider(1, 3, precision);
//   uint256 slope = divider(1, 400, precision);
//   uint256 poolBalanceEther = msg.value.div(1000000000000000000); 
//   uint256 poolBalanceScaled = poolBalanceEther.mul(1000000);
//   uint256 tokensToMintDenominator = reserveRatio.mul(slope);
//   uint256 tokensToMint = msg.value.div(tokensToMintDenominator);

// 10, 333333, .5 



//	p * 10^18 / .333333 * (1/400)
// from stackExchange, oem, relevant/Bancor, look at the 'precision'
        

//    reserveRatio = _reserveRatio;
    
//**reserveRatio;


 
//    totalSupply_ = tokensToMint;
 
//  gasPrice = _gasPrice;

//    balances[owner] = tokensToMint;
//    Transfer(0x0, owner, tokensToMint);
  


// 10, 333333, .5 




// poolBalance (msg.value) : arbitrary
// reserveRatio: 333333
// totalSupply: calculate
//   uint256 reserveRatio = divider(1, 3, precision);
//   uint256 slope = divider(1, 400, precision);
//   uint256 poolBalanceEther = msg.value.div(1000000000000000000); 
//   uint256 poolBalanceScaled = poolBalanceEther.mul(1000000);
//   uint256 tokensToMintDenominator = reserveRatio.mul(slope);
//   uint256 tokensToMint = msg.value.div(tokensToMintDenominator);


