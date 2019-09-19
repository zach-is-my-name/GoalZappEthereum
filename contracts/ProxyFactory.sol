pragma solidity >=0.5.0 <0.6.0;
import "./UpgradeabilityProxy.sol";
import "./GoalEscrow.sol";

contract ProxyFactory {
  mapping(address=>bool) public isProxy;
  mapping (address => mapping (bytes32 => address)) public  proxyAddresses;  
  address public implementation;
  event Created(address indexed sender, address proxy);
  UpgradeabilityProxy upgradeabilityProxy;
  GoalEscrow goalEscrow;
  constructor(address _implementation /*UpgradeabilityProxy _upgradabilityProxy*/) public  {
   implementation = _implementation; 
  // upgradeabilityProxy = _upgradeabilityProxy;
  }

  function build(string memory _goalName, uint256 _amountBond, uint256 _amountReward) public returns (address payable proxy) {
      proxy = address(new UpgradeabilityProxy(implementation, goalEscrow, _amountBond, _amountReward));
      emit Created(msg.sender, address(proxy));
      isProxy[proxy] = true;
      proxyAddresses[msg.sender][hashedGoalName(_goalName)] = proxy;
   }

  function hashedGoalName (string memory _goalName) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(_goalName));
  }


}





