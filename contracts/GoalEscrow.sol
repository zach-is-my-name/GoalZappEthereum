pragma solidity ^0.5.0; 


import "./SafeMath.sol";
import "./ERC20.sol";
import "./SafeERC20.sol";
import "./Ownable.sol";
import "./Address.sol";

// interface Aion

contract Aion {
 //using SafeERC20 for ERC20;
 
 //uint256 protectionPeriod = token.protectionPeriod;
  uint256 public serviceFee;
  function ScheduleCall(uint256 blocknumber, address to, uint256 value, 
    uint256 gaslimit, uint256 gasprice, bytes memory data, bool schedType) public
      payable returns (uint, address);
}

contract GoalEscrow is Ownable  {
  using SafeMath for uint256;
  using SafeERC20 for ERC20;
 
  event Deposited(address indexed payee, uint256 tokenAmount);
  event Withdrawn(address indexed payee, uint256 tokenAmount);
  
  mapping (bytes32 => Suggester) suggestedSteps;

  address goalOwner;

  uint256 rewardFunds;
  uint256 bondFunds;
  uint256 rewardAmount;
  uint256 ownerBondAmount; 
  uint256 private timeOut;
    
  struct Suggester {
   address suggester;
   uint256 suggesterBond;
   uint256 ownerBond;
   uint256 timeSuggested;
   uint256 suggestionExpires;
 }
  
  ERC20 public token;
  Aion aion;

  constructor (ERC20 _token, uint256 _timeOut) public {
    require( _timeOut > block.timestamp, 
     "TimeOut: _timeOut is before current time");
    token = _token;
    goalOwner = msg.sender;
    rewardAmount = 1;
    ownerBondAmount = 1;
    timeOut = _timeOut;
 } 
 
  function suggesterBond (bytes32 _id) public view returns (uint256) {
    return suggestedSteps[_id].suggesterBond;
  }  

//initialize struct?

  function depositOnCreate(bytes32 _id, uint _amountBond, uint _amountReward) 
    public onlyOwner { 
  
   bondFunds = bondFunds.add(_amountBond); 
   token.safeTransferFrom(msg.sender, address(this), _amountBond);

   rewardFunds = rewardFunds.add(_amountReward);
   token.safeTransferFrom(msg.sender, address(this), _amountReward);
}

  function depositOnSuggest(bytes32 _id, uint _amount, address _payee) 
   public onlyOwner {
    
    require(_id.length == 25);
    suggestedSteps[_id].suggesterBond =
     suggestedSteps[_id].suggesterBond.add(_amount);
    token.safeTransferFrom(msg.sender, address(this), _amount); 
    
    emit Deposited(_payee, _amount); 

    assert(bondFunds >= ownerBondAmount);
    bondFunds = bondFunds.sub(ownerBondAmount);  
    suggestedSteps[_id].ownerBond =
      suggestedSteps[_id].ownerBond.add(ownerBondAmount);
    suggestedSteps[_id].timeSuggested = block.timestamp;
    suggestedSteps[_id].suggestionExpires = block.timestamp.add(timeOut);
    schedule_returnBondsOnTimeOut(_id);
  }

  function suggestionExpires(bytes32 _id) public view returns (uint256) {
    return  suggestedSteps[_id].suggestionExpires.sub(block.timestamp);
  }
   
  function disburseOnAccept(bytes32 _id) public onlyOwner returns (bool) {
    uint256 suggesterBondRefundAmount = suggestedSteps[_id].suggesterBond;
   
    assert(token.balanceOf(address(this)) >= suggesterBondRefundAmount);
    address payee = suggestedSteps[_id].suggester;
    suggestedSteps[_id].suggesterBond = 0;
    token.safeTransfer(payee, suggesterBondRefundAmount);
    emit Withdrawn(payee, suggesterBondRefundAmount);
   
    assert(token.balanceOf(address(this)) >= rewardFunds.sub(rewardAmount));
    rewardFunds = rewardFunds.sub(rewardAmount);
    token.safeTransfer(payee, rewardAmount); 
    emit Withdrawn(payee, rewardAmount);    
    uint256 suggesterProtectAmount =
     suggesterBondRefundAmount.add(rewardAmount); 
    token.protectTokens(payee, suggesterProtectAmount); 
   // emit protect event 
   //start protection clock    
    schedule_removeTokenProtection(payee, suggesterProtectAmount);    
   // emit protection clock start event  
    uint256 ownerBondRefundAmount = suggestedSteps[_id].ownerBond;
    assert(token.balanceOf(address(this)) >= ownerBondRefundAmount); 
    uint256 ownerProtectAmount = ownerBondRefundAmount;
    suggestedSteps[_id].ownerBond = 0;
    token.safeTransfer(msg.sender, ownerBondRefundAmount);
    emit Withdrawn(msg.sender, ownerBondRefundAmount);
    token.protectTokens(msg.sender, ownerProtectAmount);
    // emit protect event
    //start protection clock    
    schedule_removeTokenProtection(msg.sender, ownerProtectAmount);
   // emit protection clock start event  
  }

   function returnBondsOnReject(bytes32 _id) public onlyOwner returns (bool) {
    uint256 suggesterBondRefundAmount = suggestedSteps[_id].suggesterBond;
    assert(token.balanceOf(address(this)) >= suggesterBondRefundAmount);
    uint256 suggesterProtectAmount = suggesterBondRefundAmount;
    address payee = suggestedSteps[_id].suggester;
    suggestedSteps[_id].suggesterBond = 0;
    token.safeTransfer(payee, suggesterBondRefundAmount);
    emit Withdrawn(payee, suggesterBondRefundAmount);
    token.protectTokens(payee, suggesterProtectAmount);
    // start protection clock
    schedule_removeTokenProtection(payee, suggesterProtectAmount);    
    // emit protection clock start event  
   

    uint256 ownerBondRefundAmount = suggestedSteps[_id].ownerBond;
    assert(token.balanceOf(address(this)) >= ownerBondRefundAmount); 
    uint256 ownerProtectAmount = ownerBondRefundAmount; 
    suggestedSteps[_id].ownerBond = 0;
    token.safeTransfer(msg.sender, ownerBondRefundAmount);
    emit Withdrawn(msg.sender, ownerBondRefundAmount);
    token.protectTokens(msg.sender, ownerProtectAmount);
    // emit protect event 
    // start protection clock
    schedule_removeTokenProtection(msg.sender, ownerProtectAmount);
    // emit protection clock start event  
  }
  
  function getTimeOut() public view returns(uint256) {
      return timeOut; 
  }
  
  function returnBondsOnTimeOut(bytes32 _id) public {
      require(block.timestamp >= timeOut, "Escrow: current time is before release time");
    uint256 suggesterBondRefundAmount = suggestedSteps[_id].suggesterBond;
    assert(token.balanceOf(address(this)) >= suggesterBondRefundAmount);
    uint256 suggesterProtectAmount = suggesterBondRefundAmount; 
    address payee = suggestedSteps[_id].suggester;
    suggestedSteps[_id].suggesterBond = 0;
    token.safeTransfer(payee, suggesterBondRefundAmount);
    emit Withdrawn(payee, suggesterBondRefundAmount);
    token.protectTokens(payee, suggesterProtectAmount);
    // start protection clock
    schedule_removeTokenProtection(payee, suggesterProtectAmount);    
    // emit protection event  
    
    uint256 ownerBondRefundAmount = suggestedSteps[_id].ownerBond;
    assert(token.balanceOf(address(this)) >= ownerBondRefundAmount); 
    uint256 ownerProtectAmount = ownerBondRefundAmount; 
    suggestedSteps[_id].ownerBond = 0;
    token.safeTransfer(msg.sender, ownerBondRefundAmount);
    emit Withdrawn(msg.sender, ownerBondRefundAmount);
    token.protectTokens(msg.sender, ownerProtectAmount);
    // start protection clock
    schedule_removeTokenProtection(msg.sender, ownerProtectAmount);
    // emit protection event  
  }
  
  function schedule_returnBondsOnTimeOut(bytes32 _id) public {
   aion = Aion(0xFcFB45679539667f7ed55FA59A15c8Cad73d9a4E);
   bytes memory data =
     abi.encodeWithSelector(bytes4(keccak256('returnBondsOnTimeOut(bytes32 )')),_id);
   uint callCost = 200000*1e9 + aion.serviceFee();
   aion.ScheduleCall.value(callCost) (block.timestamp.add(timeOut),
    address(this), 0, 200000,1e9, data, true);  
  }
  
  function schedule_removeTokenProtection (address _address, uint256 _amount)
   public {
   aion = Aion(0xFcFB45679539667f7ed55FA59A15c8Cad73d9a4E);
  // uint protectionPeriod = token.protectionPeriod;
   bytes memory data =
     abi.encodeWithSelector(bytes4(keccak256('removeTokenProtection(address,uint256)')),_address, _amount);
   uint callCost = 200000*1e9 + aion.serviceFee();
   aion.ScheduleCall.value(callCost) (block.timestamp.add(token.protectionPeriod()),
    address(token), 0, 200000,1e9, data, true);  
  }
}
