pragma solidity >=0.5.0 <0.6.0;
import "./UpgradeabilityProxy.sol";
import "./GoalEscrow.sol";
import "./ERC20.sol";

contract ProxyFactory {
  mapping(address=>bool) public isProxy;
  mapping (address => mapping (bytes32 => address)) public proxyAddresses;  
  event Created(address indexed sender, address proxy);

// The interface 
// The address
  address public implementation;
  ERC20 public token;

  constructor(address _implementation, ERC20 _token) public  {
    implementation = _implementation; 
    token = _token; 
  }

  function build(string memory _goalName) public returns (address payable proxy) {
    proxy = address(new UpgradeabilityProxy(implementation));
    emit Created(msg.sender, address(proxy));
    isProxy[proxy] = true;
    proxyAddresses[msg.sender][hashedGoalName(_goalName)] = proxy;
    token.setInitializedEscrow(proxy); 
   }

  function hashedGoalName (string memory _goalName) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(_goalName));
  }

  function getProxyAddress(string memory _goalName, address _creator) public view returns (address) {
    return proxyAddresses[_creator][hashedGoalName(_goalName)];  
  }
}





