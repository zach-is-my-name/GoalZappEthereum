pragma solidity ^0.5.0;

import "./SafeMath.sol";
import "./EscrowRole.sol";
import "./AionRole.sol";

contract Protected is EscrowRole, AionRole {
  using SafeMath for uint256;
   
   mapping (address => uint256) public protectedTokens;
   event TransferChecked(string message);
   event Caller(address sender);
   uint256 public protectionPeriod;
  
   function init() public {
     protectionPeriod = 259200;    
   }
     

    modifier checkProtectedTokens(uint256 amount) {
      if (protectedTokens[msg.sender] > 0) {
        require (amount < protectedTokens[msg.sender], "your tokens are under protection period, check timeToLiftProtection() for time until you have tokens available, and/or check amountProtected to see how many of your tokens are currently under the protection period" );
      }
      _;
    }
    
    function timeProtectTokens(address _address, uint256 _amount) public onlyEscrowRole returns (bool) {
      protectedTokens[_address] = protectedTokens[_address].add(_amount);
     // return true;
    }

    function removeTokenProtection(address _address, uint256 _amount) public onlyAionRole returns (bool) {
      emit Caller(msg.sender);
      protectedTokens[_address] = protectedTokens[_address].sub(_amount);
      //return true;
    }

    function amountProtected (address _address) public view returns (uint256) {
     return protectedTokens[_address];
   }


}
