pragma solidity ^0.5.0; 

/*DockerAionTestVersion */
import "./SafeMath.sol";
import "./ERC20.sol";
import "./GoalOwnerRole.sol";
import "./AionRole.sol";


// interface Aion
contract Aion {
  function ScheduleCall(uint256 blocknumber, address to, uint256 value, 
    uint256 gaslimit, uint256 gasprice, bytes memory data, bool schedType) public
      payable returns (uint, address);
}

contract GoalEscrowTestVersion is GoalOwnerRole, AionRole {
  using SafeMath for uint256;

  event Deposited(address indexed suggester, uint256 tokenAmount);
  event Withdrawn(address indexed suggester, uint256 tokenAmount);
  event StartProtection(uint256 protectionEnds, uint timeNow);
  event TimeNow(uint256 blocktime);
  event SuggestionExpires(uint256 expires);
  event SuggestedStepsSuggesterBond(uint Suggester_suggesterBond);
  event ReturnedToBondFunds(uint suggestedStepOwnerBond);
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
  address public self;


  bool private initializedMaster;
  bool private initializedNewGoal;

  function () external payable { }

  function initMaster(ERC20 _token) public {
    require(!initializedMaster, "initMaster_ already called on the Escrow implementation contract");
    require(address(_token) != address(0), "token address cannot be zero");
    token = _token;
    rewardAmount = 1 ether;
    ownerBondAmount = 1 ether;
    suggestionDuration = _token.protectionPeriod();
    _token._addEscrowRole(address(this));
    self = address(this);
    initializedMaster = true;
  }
 
  function newGoalInit(ERC20 _token) public {
    require(!initializedNewGoal, "newGoalInit has already been called on this instance"); 
    if (!initializedMaster) {
      initMaster(_token);
    }
    _addGoalOwner(msg.sender);
    goalOwner = msg.sender;
   initializedNewGoal = true;
  }
  
  function newGoalInitAndFund(ERC20 _token, uint _amountBond, uint _amountReward) public {
    require(!initializedNewGoal, "newGoalInit has already been called on this instance"); 
    if (!initializedMaster) {
      initMaster(_token);
    }
    _addGoalOwner(msg.sender);
    goalOwner = msg.sender;
    if (_amountBond > 0 && _amountReward > 0) {
      fundEscrow(_amountBond, _amountReward); 
    }
   initializedNewGoal = true;
  }
 
  function fundEscrow (uint _amountBond, uint _amountReward) public onlyGoalOwner {
    bondFunds = bondFunds.add(_amountBond); 
    token.transferFrom(msg.sender, self, _amountBond);
    rewardFunds = rewardFunds.add(_amountReward);
    token.transferFrom(msg.sender, self, _amountReward);
  } 

 
	         //** SUGGEST **//
                /*only suggester*/
  function depositOnSuggest(bytes32 _id, uint _amount) public payable notGoalOwner {
    require(bondFunds >= 1, "appologies! contract bond funds are less than 1, a notice has been sent to goal owner to increase the funding... sit tight!");   
    require(rewardFunds >= 1, "appologies! contract bond funds are less than 1, a notice has been sent to goal owner to increase the funding... sit tight!");
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
    token.timeProtectTokens(goalOwner, suggestedSteps[_id].ownerBond); 
    token.timeProtectTokens(msg.sender, suggestedSteps[_id].suggesterBond);
    schedule_removeTokenTimeProtection(goalOwner, suggestedSteps[_id].ownerBond);    
    schedule_removeTokenTimeProtection(msg.sender, suggestedSteps[_id].suggesterBond);    
  }

  function setSuggestionTimeOut(bytes32 _id) private {
    uint256 timeNow = block.timestamp;
    suggestedSteps[_id].timeSuggested = timeNow;
    emit TimeNow(timeNow);
    suggestedSteps[_id].suggestionExpires = timeNow.add(suggestionDuration);
    emit SuggestionExpires(suggestedSteps[_id].suggestionExpires);
    schedule_returnBondsOnTimeOut(_id);
  }

  function checkForTimedOutSuggestions (bytes32 _id) internal {
    returnBondsOnTimeOut(_id);
  }

  function schedule_returnBondsOnTimeOut(bytes32 _id) internal {
    aion = Aion(0x4C26ed597F71eb658741AaFc982ecbd2e8B003Fb);
    bytes memory data = abi.encodeWithSelector(bytes4(keccak256('returnBondsOnTimeOut(bytes32)')),_id);
    uint callCost = 2000000000*1e9;
    aion.ScheduleCall.value(callCost)(block.timestamp.add(suggestionDuration), address(this), /*value*/ 0, /*gaslimit*/2000000000,/*gasprice*/ 1e9, /*data*/ data, /*time or block*/ true);  
  }
	//** CALLED BY AION -- Contract disburses reward and bonds **//
  function returnBondsOnTimeOut(bytes32 _id) public onlyAionRole {
    emit TimeNow (block.timestamp);
    emit SuggestionExpires(suggestedSteps[_id].suggestionExpires);
    require(block.timestamp >= suggestedSteps[_id].suggestionExpires, "Escrow: current time is before release time");
    uint256 suggesterBondRefundAmount = suggestedSteps[_id].suggesterBond;
    require(token.balanceOf(address(this)) >= suggesterBondRefundAmount,"Requested Suggester Bond Refund is MORE than token balance of the contract");
    //suggester
    address suggester = suggestedSteps[_id].suggester;
    suggestedSteps[_id].suggesterBond = 0;
    //return suggester bond 
    token.transfer(suggester, suggesterBondRefundAmount);
    emit Withdrawn(suggester, suggesterBondRefundAmount);
    // remove restriction
    token.unsetRestrictedTokens(suggester, suggesterBondRefundAmount);
    //owner 
    uint256 ownerBondRefundAmount = suggestedSteps[_id].ownerBond;
    require(token.balanceOf(address(this)) >= ownerBondRefundAmount, "Broken: Contract can't afford to refund owner bond!"); 
    suggestedSteps[_id].ownerBond = 0;
    bondFunds = bondFunds.add(ownerBondRefundAmount);	
    emit ReturnedToBondFunds(ownerBondRefundAmount);
   // Owner bonds remain in escrow contract; they remain restricted because owner failed to act on step
  }

  function getSuggestionDuration() public view returns(uint256) {
      return suggestionDuration; 
  }

  function suggestionExpires(bytes32 _id) public view returns (uint256) {
    return  suggestedSteps[_id].suggestionExpires.sub(block.timestamp);
  }

  function suggesterBond(bytes32 _id) public view returns (uint256) {
    return suggestedSteps[_id].suggesterBond;
  }  

  function schedule_removeTokenTimeProtection (address _address, uint256 _amount)
   private {
   aion = Aion(0x4C26ed597F71eb658741AaFc982ecbd2e8B003Fb);
   uint256 callTime = token.protectionPeriod().add(block.timestamp);
   bytes memory data = abi.encodeWithSelector(bytes4(keccak256('removeTokenProtection(address,uint256)')),_address, _amount);
   uint256 callCost = 200000*1e9;
   aion.ScheduleCall.value(callCost)(callTime, address(token), 0, 200000, 1e9, data, true);
  }

  function schedule_removeRewardTokenProtection (address _address, uint256 _amount, uint256 _timeSuggested)
   private {
   aion = Aion(0x51F5d84603dafa279Ae35596EBAFcC6CEd2B5628);
   uint256 timeNow = block.timestamp;
   uint256 timeElapsed = timeNow.sub(_timeSuggested);
   uint256 timeRemaining =  token.protectionPeriod().sub(timeElapsed);
   uint256 callTime = block.timestamp.add(timeRemaining); 
   bytes memory data = abi.encodeWithSelector(bytes4(keccak256('removeTokenProtection(address, uint256)')),_address, _amount);
   uint256 callCost = 200000*1e9;
   aion.ScheduleCall.value(callCost)(callTime, address(token), 0, 200000, 1e9, data, true);
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
      // return owner bond 
    uint256 ownerBondRefundAmount = suggestedSteps[_id].ownerBond;
    require(token.balanceOf(address(this)) >= ownerBondRefundAmount, "Broken: Contract can't afford to refund owner bond!"); 
    suggestedSteps[_id].ownerBond = 0;
    token.transfer(goalOwner, ownerBondRefundAmount);
    emit Withdrawn(goalOwner, ownerBondRefundAmount);
      // remove restricted owner tokens
    token.unsetRestrictedTokens(goalOwner, ownerBondRefundAmount.add(rewardAmount)); 
    token.timeProtectTokens(suggester, rewardAmount);
    schedule_removeRewardTokenProtection(goalOwner, rewardAmount, suggestedSteps[_id].timeSuggested);
  }

	//** REJECT STEP || Contract returns bonds **// 
  function returnBondsOnReject(bytes32 _id) public onlyGoalOwner returns (bool) {
    //return suggester bond
    uint256 suggesterBondRefundAmount = suggestedSteps[_id].suggesterBond;
    require(token.balanceOf(address(this)) >= suggesterBondRefundAmount,"Broken: contract can't afford to refund suggester bond!");
    address suggester = suggestedSteps[_id].suggester;
    suggestedSteps[_id].suggesterBond = 0;
    token.transfer(suggester, suggesterBondRefundAmount);
    emit Withdrawn(suggester, suggesterBondRefundAmount);
    // remove restricted suggester bond
    token.unsetRestrictedTokens(suggester, suggesterBondRefundAmount);
    //return owner bond
    uint256 ownerBondRefundAmount = suggestedSteps[_id].ownerBond;
    require(token.balanceOf(address(this)) >= ownerBondRefundAmount,"Broken: contract can't afford to refund owner bond!"); 
    suggestedSteps[_id].ownerBond = 0;
    token.transfer(goalOwner, ownerBondRefundAmount); 
    emit Withdrawn(msg.sender, ownerBondRefundAmount);
    //remove restricted goal owner bond;
    token.unsetRestrictedTokens(goalOwner, ownerBondRefundAmount);  
  }
}
