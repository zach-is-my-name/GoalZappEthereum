pragma solidity ^0.5.0;

import "./SafeMath.sol";

contract ProtectionPeriod {
  using SafeMath for uint256;
   
   uint256 public protectionPeriod;
   mapping (address => uint256) internal protectedTokens;  
    
    constructor (uint256 _protectionPeriod) public {
        protectionPeriod = _protectionPeriod;
    }
    
    function protectTokens(address _address, uint256 _amount) public
      returns(bool) {
      protectedTokens[_address].add(_amount);
      return true;
    }     
   
    function removeTokenProtection(address _address, uint256 _amount) internal
      returns (bool) {
      protectedTokens[_address].sub(_amount);
      return true;
    }
 
    function amountProtected (address _address) public view returns (uint256)
     { 
     return protectedTokens[_address]; 
   } 
    
    modifier checkProtectedTokens (uint256 amount) {
      if (amount > protectedTokens[msg.sender]) {
        // emit event
      }
      require (amount < protectedTokens[msg.sender], "your tokens are under protection period, check timeToLiftProtection() for time until you have tokens available, and/or check amountProtected to see how many of your tokens are currently under the protection period" ); 
      _;
    }


}


