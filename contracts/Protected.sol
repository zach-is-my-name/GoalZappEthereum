pragma solidity ^0.5.0;
import "./Ownable.sol";
import "./SafeMath.sol";
import "./EscrowRole.sol";
import "./AionRole.sol";

contract Protected is EscrowRole, AionRole, Ownable {
  using SafeMath for uint256;
   
   mapping (address => uint256) public protectedTokens;
   event TransferChecked(string message);
   event Caller(address sender);
   event timeProtectTokensEvent(uint _amount, address _address);
   event rewardTimeProtectTokensEvent(uint _amount, address _address);

   event removeTokenProtectionEvent(uint _amount, address _address);
   event removeRewardTokenProtectionEvent(uint _amount, address _address);
   uint256 public protectionPeriod; //if <= unitialized
 
   function init(uint256 _protectionPeriod, bool _threeDays) public onlyOwner {
     require(_protectionPeriod > 0, "protection period must be greater than 0");
     if (_threeDays == true) {
      protectionPeriod = 259200;    
     } else {
     protectionPeriod = _protectionPeriod;
     }
   }

    modifier checkProtectedTokens(uint256 amount) {
      if (protectedTokens[msg.sender] > 0) {
        require (amount < protectedTokens[msg.sender], "your tokens are under protection period, check timeToLiftProtection() for time until you have tokens available, and/or check amountProtected to see how many of your tokens are currently under the protection period" );
      }
      _;
    }
    
    function timeProtectTokens(address _address, uint256 _amount) public onlyEscrowRole returns (bool) {
      emit timeProtectTokensEvent(_amount, _address); 
      protectedTokens[_address] = protectedTokens[_address].add(_amount);
    }

    function timeProtectRewardTokens(address _address, uint256 _amount) public onlyEscrowRole returns (bool) {
      emit rewardTimeProtectTokensEvent(_amount, _address); 
      protectedTokens[_address] = protectedTokens[_address].add(_amount);
    }

    function removeTokenProtection(address _address, uint256 _amount) external onlyAionRole returns (bool) {
      emit Caller(msg.sender);
      emit removeTokenProtectionEvent(_amount, _address);
      protectedTokens[_address] = protectedTokens[_address].sub(_amount);
    }

    function removeRewardTokenProtection(address _address, uint256 _amount) external onlyAionRole returns (bool) {
      emit Caller(msg.sender);
      emit removeRewardTokenProtectionEvent(_amount, _address);
      protectedTokens[_address] = protectedTokens[_address].sub(_amount);
      //return true;
    }

    function amountProtected (address _address) public view returns (uint256) {
     return protectedTokens[_address];
    }


}
