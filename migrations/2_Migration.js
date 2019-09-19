const GoalZapp = artifacts.require("GoalZapp"); 
const GoalEscrow = artifacts.require("GoalEscrow");
const ProxyFactory = artifacts.require("ProxyFactory");
// const UpgradibilityProxy = artifacts.require("UpgradabilityProxy");

module.exports = function(deployer) {
  deployer.deploy(GoalZapp); 
  deployer.deploy(GoalEscrow).then(function () {
    return deployer.deploy(ProxyFactory, GoalEscrow.address)
  });
  };






