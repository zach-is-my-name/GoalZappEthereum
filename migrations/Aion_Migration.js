const Aion = artifacts.require("Aion");
const SafeMath = artifacts.require("SafeMath") 
const AionClient = artifacts.require("AionClient")

module.exports = function(deployer) {
  deployer.deploy(SafeMath);
  deployer.deploy(Aion, {from:"0x6b50600866a4A4E09E82144aF3cCdfe16b3081b3"} ).then(function() {
    return deployer.deploy(AionClient, Aion.address)});
  };

