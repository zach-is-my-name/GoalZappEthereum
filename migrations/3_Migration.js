const GoalZappTokenSystem = artifacts.require("GoalZappTokenSystem"); 
const GoalEscrowTestVersion = artifacts.require("GoalEscrowTestVersion");
const ProxyFactory = artifacts.require("ProxyFactory");

// const UpgradibilityProxy = artifacts.require("UpgradabilityProxy");

module.exports = function(deployer) {
  deployer.deploy(GoalZappTokenSystem); 
  deployer.deploy(GoalEscrowTestVersion).then(function () {
    return deployer.deploy(ProxyFactory, GoalEscrowTestVersion.address, GoalZappTokenSystem.address)
  });
 };








