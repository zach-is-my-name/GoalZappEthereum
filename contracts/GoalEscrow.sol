pragma solidity ^0.5.0; 

/* Ropsten Version --Aion Address hard coded -- */

import "./SafeMath.sol";
import "./ERC20.sol";
import "./GoalOwnerRole.sol";
import "./AionRole.sol";


// interface Aion
contract Aion {
 //using SafeERC20 for ERC20;
 
  uint256 public serviceFee;
  function ScheduleCall(uint256 blocknumber, address to, uint256 value, 
    uint256 gaslimit, uint256 gasprice, bytes memory data, bool schedType) public
      payable returns (uint, address);
}

contract GoalEscrow is GoalOwnerRole, AionRole {
  using SafeMath for uint256;

  event Deposited(address indexed suggester, uint256 tokenAmount);
  event Withdrawn(address indexed suggester, uint256 tokenAmount);
  event StartProtection(uint256 protectionEnds, uint timeNow);
  event TimeNow(uint256 blocktime);
  event SuggestionExpires(uint256 expires);
  event SuggestedStepsSuggesterBond(uint Suggester_suggesterBond);
  event ReturnedToBondFunds(uint suggestedStepOwnerBond);

  mapping ( bytes32 => Suggester) public suggestedSteps;

  struct  Suggester {
   address suggester;
   uint256 suggesterBond;
   uint256 ownerBond;
   uint256 timeSuggested;
   uint256 suggestionExpires;
  }

  address public goalOwner;
  uint256 public rewardFunds;
  uint256 public bondFunds;
  uint256 public rewardAmount;
  uint256 public ownerBondAmount; 
  uint256 public suggestionDuration;
    
  
  ERC20 public token;
  Aion aion;
  address public self;


  bool private _initializedMaster;
  bool private _initializedNewGoal;

  // serves as constructor; params are in flux for short term testing conveinience / long term features (reward/bond amounts, finalizized suggestion duration)
  function initMaster(ERC20 _token) public {
    require(!_initializedMaster, "initMaster_ already called on the Escrow implementation contract");
    require(address(_token) != address(0), "token address cannot be zero");
    token = _token;
    rewardAmount = 1 ether;
    ownerBondAmount = 1 ether;
    suggestionDuration = 259200;
    _token._addEscrowRole(address(this));
    _addAionAddress(0xFcFB45679539667f7ed55FA59A15c8Cad73d9a4E);
    self = address(this);
    _initializedMaster = true;
  }
 
  function newGoalInit(ERC20 _token) public {
    require(!_initializedNewGoal, "newGoalInit has already been called on this instance"); 
    if (!_initializedMaster) {
      initMaster(_token);
    }
    _addGoalOwner(msg.sender);
    goalOwner = msg.sender;
   _initializedNewGoal = true;
  }
  
  function newGoalInitAndFund(ERC20 _token, uint _amountBond, uint _amountReward) public {
    require(!_initializedNewGoal, "newGoalInit has already been called on this instance"); 
    if (!_initializedMaster) {
      initMaster(_token);
    }
    _addGoalOwner(msg.sender);
    goalOwner = msg.sender;
    if (_amountBond > 0 && _amountReward > 0) {
      fundEscrow(_amountBond, _amountReward); 
    }
   _initializedNewGoal = true;
  }
 
  function fundEscrow (uint _amountBond, uint _amountReward) public onlyGoalOwner {
   bondFunds = bondFunds.add(_amountBond); 
   token.transferFrom(msg.sender, self, _amountBond);
   rewardFunds = rewardFunds.add(_amountReward);
   token.transferFrom(msg.sender, self, _amountReward);
  } 

 
	         //** SUGGEST **//
                  /*only suggester*/
  function depositOnSuggest(bytes32 _id, uint _amount) public notGoalOwner {
    //set suggester address
    suggestedSteps[_id].suggester = msg.sender;
    //set suggester bond
    suggestedSteps[_id].suggesterBond = suggestedSteps[_id].suggesterBond.add(_amount);
    token.transferFrom(msg.sender, address(this), _amount); 
    emit Deposited(address(this), _amount); 
    //apply owner bond
    require(bondFunds >= ownerBondAmount, "Owner has insufficient bond funds");
    bondFunds = bondFunds.sub(ownerBondAmount);  
    suggestedSteps[_id].ownerBond = suggestedSteps[_id].ownerBond.add(ownerBondAmount);
    emit SuggestedStepsSuggesterBond(suggestedSteps[_id].suggesterBond); 
    setSuggestionTimeOut(_id);
  }

  function setSuggestionTimeOut(bytes32 _id) private {
    uint256 timeNow = block.timestamp;
    suggestedSteps[_id].timeSuggested = timeNow;
    emit TimeNow(timeNow);
    suggestedSteps[_id].suggestionExpires = timeNow.add(suggestionDuration);
    emit SuggestionExpires(suggestedSteps[_id].suggestionExpires);
    schedule_returnBondsOnTimeOut(_id, timeNow.add(suggestionDuration));
  }

  function checkForTimedOutSuggestions (bytes32 _id) internal {
    returnBondsOnTimeOut(_id);
  }

  function schedule_returnBondsOnTimeOut(bytes32 _id, uint256 callTime) internal {
    aion = Aion(0xFcFB45679539667f7ed55FA59A15c8Cad73d9a4E);
    bytes memory data = abi.encodeWithSelector(bytes4(keccak256('returnBondsOnTimeOut(bytes32 )')),_id);
    uint callCost = 200000*1e9 + aion.serviceFee();
    aion.ScheduleCall.value(callCost)(callTime, address(this), 0, 2000000, 1e9, data, true);  
  }

	//** TIME OUT -- Contract disburses reward and bonds **//
  function returnBondsOnTimeOut(bytes32 _id) public {
    emit TimeNow (block.timestamp);
    emit SuggestionExpires(suggestedSteps[_id].suggestionExpires);
    require(block.timestamp >= suggestedSteps[_id].suggestionExpires, "Escrow: current time is before release time");
    uint256 suggesterBondRefundAmount = suggestedSteps[_id].suggesterBond;
    require(token.balanceOf(address(this)) >= suggesterBondRefundAmount,"Requested Suggester Bond Refund is MORE than token balance of the contract");
    //suggester
    uint256 suggesterProtectAmount = suggesterBondRefundAmount; 
    address suggester = suggestedSteps[_id].suggester;
    suggestedSteps[_id].suggesterBond = 0;
    //return suggester bond 
    token.transfer(suggester, suggesterBondRefundAmount);
    emit Withdrawn(suggester, suggesterBondRefundAmount);
    // remove restriction
    token.unsetRestrictedTokens(suggester, suggesterProtectAmount);
    //protect tokens
    token.timeProtectTokens(suggester, suggesterProtectAmount);
    // schedule end protection 
    schedule_removeTokenTimeProtection(suggester, suggesterProtectAmount);    
    //owner 
    uint256 ownerBondRefundAmount = suggestedSteps[_id].ownerBond;
    require(token.balanceOf(address(this)) >= ownerBondRefundAmount, "Broken: Contract can't afford to refund owner bond!"); 
    suggestedSteps[_id].ownerBond = 0;
    bondFunds = bondFunds.add(ownerBondRefundAmount);	
    emit ReturnedToBondFunds(ownerBondRefundAmount);
// Owner bonds remain in escrow contract; they remain restricted because owner failed to   act on step
  }

  function getSuggestionDuration() public view returns(uint256) {
      return suggestionDuration; 
  }

  function suggestionExpires(bytes32 _id) public view returns (uint256) {
    return  suggestedSteps[_id].suggestionExpires.sub(block.timestamp);
  }

  function suggesterBond (bytes32 _id) public view returns (uint256) {
    return suggestedSteps[_id].suggesterBond;
  }  

  function schedule_removeTokenTimeProtection (address _address, uint256 _amount)
   private {
   aion = Aion(0xFcFB45679539667f7ed55FA59A15c8Cad73d9a4E);
   uint256 callTime = token.protectionPeriod().add(block.timestamp);
   bytes memory data =
     abi.encodeWithSelector(bytes4(keccak256('removeTokenProtection(address,uint256)')),_address, _amount);
   uint256 callCost = 200000*1e9 + aion.serviceFee();
   aion.ScheduleCall.value(callCost)(callTime, address(token), 0, 20000000, 1e9, data, true);
  }

  function disburseOnAccept(bytes32 _id) public onlyGoalOwner returns (bool) {
    uint256 suggesterBondRefundAmount = suggestedSteps[_id].suggesterBond;
    require(token.balanceOf(address(this)) >= suggesterBondRefundAmount, "Broken: Contract can't afford to refund suggester bond!");
    //return suggester bond
    address suggester = suggestedSteps[_id].suggester;
    suggestedSteps[_id].suggesterBond = 0;
    token.transfer(suggester, suggesterBondRefundAmount);
    emit Withdrawn(suggester, suggesterBondRefundAmount);
    //pay reward to suggester
    require(token.balanceOf(address(this)) >= rewardFunds.sub(rewardAmount), "Broken: Contract can't afford to pay out reward!");
    rewardFunds = rewardFunds.sub(rewardAmount);
    token.transfer(suggester, rewardAmount); 
    emit Withdrawn(suggester, rewardAmount);    
    // remove restricted suggesterBond
    token.unsetRestrictedTokens(suggester, suggesterBondRefundAmount);
    //protect suggester tokens
    uint256 suggesterProtectAmount = suggesterBondRefundAmount.add(rewardAmount); 
    token.timeProtectTokens(suggester, suggesterProtectAmount); 
    //start protection clock    
    schedule_removeTokenTimeProtection(suggester, suggesterProtectAmount);    
    // return owner bond 
    uint256 ownerBondRefundAmount = suggestedSteps[_id].ownerBond;
    require(token.balanceOf(address(this)) >= ownerBondRefundAmount, "Broken: Contract can't afford to refund owner bond!"); 
    uint256 ownerProtectAmount = ownerBondRefundAmount;
    suggestedSteps[_id].ownerBond = 0;
    token.transfer(goalOwner, ownerBondRefundAmount);
    emit Withdrawn(goalOwner, ownerBondRefundAmount);
    // remove restricted owner tokens
     token.unsetRestrictedTokens(goalOwner, ownerBondRefundAmount.add(rewardAmount)); 
    //protect owner tokens 
    token.timeProtectTokens(goalOwner, ownerProtectAmount);
    //start protection clock    
    schedule_removeTokenTimeProtection(msg.sender, ownerProtectAmount);
  }

	//** REJECT STEP || Contract returns bonds **// 
  function returnBondsOnReject(bytes32 _id) public onlyGoalOwner returns (bool) {
    //return suggester bond
    uint256 suggesterBondRefundAmount = suggestedSteps[_id].suggesterBond;
    require(token.balanceOf(address(this)) >= suggesterBondRefundAmount,"Broken: contract can't afford to refund suggester bond!");
    uint256 suggesterProtectAmount = suggesterBondRefundAmount;
    address suggester = suggestedSteps[_id].suggester;
    suggestedSteps[_id].suggesterBond = 0;
    token.transfer(suggester, suggesterBondRefundAmount);
    emit Withdrawn(suggester, suggesterBondRefundAmount);
    // remove restricted suggester bond
    token.unsetRestrictedTokens(suggester, suggesterBondRefundAmount);
    //protect suggester return bond
    token.timeProtectTokens(suggester, suggesterProtectAmount);
    //start protection clock
    schedule_removeTokenTimeProtection(suggester, suggesterProtectAmount);    
    //return owner bond
    uint256 ownerBondRefundAmount = suggestedSteps[_id].ownerBond;
    require(token.balanceOf(address(this)) >= ownerBondRefundAmount,"Broken: contract can't afford to refund owner bond!"); 
    uint256 ownerProtectAmount = ownerBondRefundAmount; 
    suggestedSteps[_id].ownerBond = 0;
    token.transfer(goalOwner, ownerBondRefundAmount); 
    emit Withdrawn(msg.sender, ownerBondRefundAmount);
    // remove restricted goal owner bond
    token.unsetRestrictedTokens(goalOwner, ownerBondRefundAmount);  
    //protect tokens
    token.timeProtectTokens(msg.sender, ownerProtectAmount);
    // start protection clock
    schedule_removeTokenTimeProtection(msg.sender, ownerProtectAmount);
  }
}
