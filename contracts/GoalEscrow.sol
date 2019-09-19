pragma solidity ^0.5.0; 

import "./SafeMath.sol";
import "./ERC20.sol";
import "./Ownable.sol";
import "./Address.sol";
import "./GoalOwnerRole.sol";
import "./AionRole.sol";
import "./EscrowRole.sol";

// interface Aion
contract Aion {
 //using SafeERC20 for ERC20;
 
 //uint256 protectionPeriod = token.protectionPeriod;
  uint256 public serviceFee;
  function ScheduleCall(uint256 blocknumber, address to, uint256 value, 
    uint256 gaslimit, uint256 gasprice, bytes memory data, bool schedType) public
      payable returns (uint, address);
}

contract GoalEscrow is GoalOwnerRole, AionRole, EscrowRole  {
  using SafeMath for uint256;
 // using SafeERC20 for ERC20;
 
  event Deposited(address indexed payee, uint256 tokenAmount);
  event Withdrawn(address indexed payee, uint256 tokenAmount);
  event StartProtection(uint256 protectionEnds, uint timeNow);
  event TimeNow(uint256 blocktime);
  event SuggestionExpires(uint256 expires);
  mapping ( bytes32 => Suggester) public suggestedSteps;

  struct Suggester {
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

  /*constructor (ERC20 _token, uint256 _suggestionDuration) public {
    require(address(_token) != address(0));
    require(_suggestionDuration > 0, "_suggestionDuration must be greater than 0"); 
    token = _token;
    rewardAmount = 1;
    ownerBondAmount = 1;
    suggestionDuration = _suggestionDuration;
    _token._addEscrowRole(address(this));
 } */
  
  bool private _initializedMaster;
  bool private _initializedNewGoal;

  function initMaster (ERC20 _token, uint256 _suggestionDuration) public {
    require(!_initializedMaster, "initMaster_ already called on the Escrow implementation contract");
    require(address(_token) != address(0));
    require(_suggestionDuration > 0, "_suggestionDuration must be greater than 0"); 
    token = _token;
    rewardAmount = 1;
    ownerBondAmount = 1;
    suggestionDuration = _suggestionDuration;
    _token._addEscrowRole(address(this));
    _addAionAddress();
    _initializedMaster = true;
  }
 
  function newGoalInit(uint _amountBond, uint _amountReward) public {
    require(!_initializedNewGoal, "newGoalInit has already been called on this instance"); 
    _addGoalOwner(_msgSender());
    goalOwner = msg.sender;
    fundEscrow(_amountBond, _amountReward); 
   _initializedNewGoal = true;
  }
 
  // -- can't do a transfer and update without the the escrow contract recieving the call and checking that it got the tokens
 /* function deployAndApprove(uint _amountBond, uint _amountReward) public onlyOwner { 
   uint totalToApprove = _amountBond.add(_amountReward);
   token.approve(address(this), totalToApprove);
 }*/  

  function fundEscrow(uint _amountBond, uint _amountReward) public onlyGoalOwner {
   bondFunds = bondFunds.add(_amountBond); 
   token.transferFrom(msg.sender, address(this), _amountBond);
   rewardFunds = rewardFunds.add(_amountReward);
   token.transferFrom(msg.sender, address(this), _amountReward);
   token.unsetRestrictedTokens(msg.sender, _amountBond.add(_amountReward));
 //  token._addEscrowRole(address(this));
  } 

/*   ERC20Mock.approve(address(this), _amount); */
 
	         //** SUGGEST **//
                  /*only suggester*/

  function depositOnSuggest(bytes32 _id, uint _amount, address _payee) public notGoalOwner {
    //set suggester address
    suggestedSteps[_id].suggester = msg.sender;
    //set suggester bond
    suggestedSteps[_id].suggesterBond = suggestedSteps[_id].suggesterBond.add(_amount);
    token.transferFrom(msg.sender, address(this), _amount); 
    emit Deposited(_payee, _amount); 
    //apply owner bond
    require(bondFunds >= ownerBondAmount, "Owner has insufficient bond funds");
    bondFunds = bondFunds.sub(ownerBondAmount);  
    suggestedSteps[_id].ownerBond = suggestedSteps[_id].ownerBond.add(ownerBondAmount);
    suggestedSteps[_id].suggester = msg.sender;
    setSuggestionTimeOut(_id);
    token.unsetRestrictedTokens(msg.sender, _amount);
  }

  function setSuggestionTimeOutTestVersion(bytes32 _id) public {
   uint256 timeNow = block.timestamp;
   suggestedSteps[_id].timeSuggested = timeNow;
   emit TimeNow(timeNow);
   suggestedSteps[_id].suggestionExpires = timeNow.add(suggestionDuration);
   emit SuggestionExpires(suggestedSteps[_id].suggestionExpires);
   // schedule_returnBondsOnTimeOut(_id, timeNow.add(timeOUt));
  }

  function setSuggestionTimeOut(bytes32 _id) private {
    uint256 timeNow = block.timestamp;
    suggestedSteps[_id].timeSuggested = timeNow;
    emit TimeNow(timeNow);
    suggestedSteps[_id].suggestionExpires = timeNow.add(suggestionDuration);
    emit SuggestionExpires(suggestedSteps[_id].suggestionExpires);
    //schedule_returnBondsOnTimeOut(_id, timeNow.add(suggestionDuration));
}

  function checkForTimedOutSuggestions (bytes32 _id) internal {
      returnBondsOnTimeOut(_id);
      
  }
  function schedule_returnBondsOnTimeOut(uint256 value, bytes32 _id, uint256 callTime, uint256 gasprice, uint256 gaslimit, uint256 time_or_block) internal {
   aion = Aion(0xFcFB45679539667f7ed55FA59A15c8Cad73d9a4E);
   bytes memory data = abi.encodeWithSelector(bytes4(keccak256('returnBondsOnTimeOut(bytes32 )')),_id);
   uint callCost = 200000*1e9 + aion.serviceFee();
   aion.ScheduleCall.value(callCost) (callTime,
    address(this), 0, 200000,1e9, data, true);  
  }

	//** TIME OUT -- Contract disburses reward and bonds **//
  function returnBondsOnTimeOut(bytes32 _id) public onlyAionRole {
    require(block.timestamp >= suggestedSteps[_id].suggestionExpires, "Escrow: current time is before release time");
    uint256 suggesterBondRefundAmount = suggestedSteps[_id].suggesterBond;
    require(token.balanceOf(address(this)) >= suggesterBondRefundAmount,"Requested Suggester Bond Refund is MORE than token balance of the contract");
    //suggester
    uint256 suggesterProtectAmount = suggesterBondRefundAmount; 
    address payee = suggestedSteps[_id].suggester;
    suggestedSteps[_id].suggesterBond = 0;
    //return suggester bond 
    token.transfer(payee, suggesterBondRefundAmount);
    emit Withdrawn(payee, suggesterBondRefundAmount);
    //protect tokens
    token.timeProtectTokens(payee, suggesterProtectAmount);
    // schedule end protection 
    //schedule_removeTokenTimeProtection(payee, suggesterProtectAmount);    
    //owner 
    uint256 ownerBondRefundAmount = suggestedSteps[_id].ownerBond;
    require(token.balanceOf(address(this)) >= ownerBondRefundAmount, "Broken: Contract can't afford to refund owner bond!"); 
    suggestedSteps[_id].ownerBond = 0;
    bondFunds = bondFunds.add(ownerBondRefundAmount);	
    //return owner bond
// no transfer * token.transfer(msg.sender, ownerBondRefundAmount);
// no transfer * emit Withdrawn(msg.sender, ownerBondRefundAmount);
    //protect tokens
//no transfer * no protect * token.timeProtectTokens(msg.sender, ownerProtectAmount);
    //schedule end protection  
 //no transfer * no protect * no clock * // schedule_removeTokenTimeProtection(owner, ownerProtectAmount);
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

  function schedule_removeTokenTimeProtection (uint256 value, address _address, uint256 _amount, uint256 gasprice, uint256 gaslimit, uint256 time_or_block)
   private {
   aion = Aion(0xFcFB45679539667f7ed55FA59A15c8Cad73d9a4E);
  // uint protectionPeriod = token.protectionPeriod;
   bytes memory data =
     abi.encodeWithSelector(bytes4(keccak256('removeTokenTimeProtection(address,uint256)')),_address, _amount);
   uint256 callCost = 200000*1e9 + aion.serviceFee();
   //aion.ScheduleCall.value(callCost)( block.number+15, address(this), value, gaslimit, gasprice, hex"00", time_or_block);
  }

  function disburseOnAccept(bytes32 _id) public onlyGoalOwner returns (bool)  {
    uint256 suggesterBondRefundAmount = suggestedSteps[_id].suggesterBond;
    require(token.balanceOf(address(this)) >= suggesterBondRefundAmount, "Broken: Contract can't afford to refund suggester bond!");
    //return suggester bond
    address payee = suggestedSteps[_id].suggester;
    suggestedSteps[_id].suggesterBond = 0;
    token.transfer(payee, suggesterBondRefundAmount);
    emit Withdrawn(payee, suggesterBondRefundAmount);
    //pay reward to suggester
    require(token.balanceOf(address(this)) >= rewardFunds.sub(rewardAmount), "Broken: Contract can't afford to pay out reward!");
    rewardFunds = rewardFunds.sub(rewardAmount);
    token.transfer(payee, rewardAmount); 
    emit Withdrawn(payee, rewardAmount);    
    //protect suggester tokens
    uint256 suggesterProtectAmount = suggesterBondRefundAmount.add(rewardAmount); 
    token.timeProtectTokens(payee, suggesterProtectAmount); 
   //start protection clock    
    //schedule_removeTokenTimeProtection(payee, suggesterProtectAmount);    
    // return owner bond 
    uint256 ownerBondRefundAmount = suggestedSteps[_id].ownerBond;
    require(token.balanceOf(address(this)) >= ownerBondRefundAmount, "Broken: Contract can't afford to refund owner bond!"); 
    uint256 ownerProtectAmount = ownerBondRefundAmount;
    suggestedSteps[_id].ownerBond = 0;
    token.transfer(goalOwner, ownerBondRefundAmount);
    emit Withdrawn(goalOwner, ownerBondRefundAmount);
    //protect owner tokens 
    token.timeProtectTokens(msg.sender, ownerProtectAmount);
    //start protection clock    
   // schedule_removeTokenTimeProtection(msg.sender, ownerProtectAmount);
  }

	//** REJECT STEP || Contract returns bonds **// 
  function returnBondsOnReject(bytes32 _id) public onlyGoalOwner returns (bool) {
    //return suggester bond
    uint256 suggesterBondRefundAmount = suggestedSteps[_id].suggesterBond;
    require(token.balanceOf(address(this)) >= suggesterBondRefundAmount,"Broken: contract can't afford to refund suggester bond!");
    uint256 suggesterProtectAmount = suggesterBondRefundAmount;
    address payee = suggestedSteps[_id].suggester;
    suggestedSteps[_id].suggesterBond = 0;
    token.transfer(payee, suggesterBondRefundAmount);
    emit Withdrawn(payee, suggesterBondRefundAmount);
    //protect suggester return bond
    token.timeProtectTokens(payee, suggesterProtectAmount);
    //start protection clock
    //schedule_removeTokenTimeProtection(payee, suggesterProtectAmount);    
   //return owner bond
    uint256 ownerBondRefundAmount = suggestedSteps[_id].ownerBond;
    require(token.balanceOf(address(this)) >= ownerBondRefundAmount,"Broken: contract can't afford to refund owner bond!"); 
    uint256 ownerProtectAmount = ownerBondRefundAmount; 
    suggestedSteps[_id].ownerBond = 0;
    bondFunds = bondFunds.add(ownerBondRefundAmount); 
// no transfer * token.transfer(, ownerBondRefundAmount);
// no transfer *  emit Withdrawn(msg.sender, ownerBondRefundAmount);
    //protect tokens
// no transfer * no protect * token.timeProtectTokens(msg.sender, ownerProtectAmount);
    // start protection clock
// no transfer * no protect * no clock *  schedule_removeTokenTimeProtection(msg.sender, ownerProtectAmount);
  }
}
