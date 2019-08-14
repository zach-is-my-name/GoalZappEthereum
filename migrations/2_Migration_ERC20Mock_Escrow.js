const ERC20Mock = artifacts.require("ERC20Mock");
const GoalEscrow = artifacts.require("GoalEscrow");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(ERC20Mock, accounts[0] ,100, 0).then(function() {
    return deployer.deploy(GoalEscrow, ERC20Mock.address, 30)
    });
};

