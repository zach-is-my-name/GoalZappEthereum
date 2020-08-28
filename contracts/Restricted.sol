pragma solidity ^0.5.0; 

import "./SafeMath.sol";
import "./EscrowRole.sol";


contract Restricted is EscrowRole {
  using SafeMath for uint256;
  
  mapping (address => uint256) public restrictedTokens;
  mapping (address => address) public initializedEscrows;

  event Amount(uint256 amount);
  event RestrictedTokens(uint256 restrictedTokenAmount);
  event ExceedsRestricted(uint256 exceedsRestrictedAmount);
  event initializedEscrow(address escrowAddress);
  event debugCheck(address addressToCheck);

  modifier checkRestrictedTokens (uint amount, address recipient) {
    if (restrictedTokens[msg.sender] >= amount && recipient != initializedEscrows[recipient]) {
      emit debugCheck(initializedEscrows[recipient]);
      emit Amount(amount);
      emit RestrictedTokens(restrictedTokens[msg.sender]);
// bad: event SafeMath reverts: overflow, if 'amount <  restricted tokens      emit ExceedsRestricted(amount.sub(restrictedTokens[msg.sender]));
      require(amount < restrictedTokens[msg.sender] || recipient == initializedEscrows[recipient], "Transfer failed: restricted tokens exceeds transfer amount. Try again, using less than Amount Restricted");
    }
   _; 
  }

  function setInitializedEscrow(address _escrowAddress) external {
    initializedEscrows[_escrowAddress] = _escrowAddress;
  }

  function setRestrictedTokens (address _tokenMintRecipient, uint256 _amount) internal {
    restrictedTokens[_tokenMintRecipient] = restrictedTokens[_tokenMintRecipient].add(_amount);
  }

  function unsetRestrictedTokens (address _tokenDepositor, uint _amount) external onlyEscrowRole {
    restrictedTokens[_tokenDepositor] = restrictedTokens[_tokenDepositor].sub(_amount);
  } 

  function amountRestricted(address _account) public view returns (uint256) {
    return restrictedTokens[_account];
  }

}
