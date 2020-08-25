const GoalZappTokenSystem = artifacts.require("GoalZappTokenSystem"); 
const GoalEscrow = artifacts.require("GoalEscrow");
const ProxyFactory = artifacts.require("ProxyFactory");
// const UpgradibilityProxy = artifacts.require("UpgradabilityProxy");

module.exports = function(deployer) {
  deployer.deploy(GoalZappTokenSystem); 
  deployer.deploy(GoalEscrow).then(function () {
    return deployer.deploy(ProxyFactory, GoalEscrow.address, GoalZappTokenSystem.address)
  });
  };






