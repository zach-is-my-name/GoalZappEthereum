const ERC20Mintable = artifacts.require("ERC20Mintable");
const GoalEscrow = artifacts.require("GoalEscrow");

module.exports = function(deployer) {
  deployer.deploy(ERC20Mintable,30).then(function() {
    return deployer.deploy(GoalEscrow, ERC20Mintable.address, 1800);
});  
};
