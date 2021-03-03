const { constants, expectEvent, expectRevert, time, BN } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const { shouldBehaveLikeERC20Protection } = require('./ERC20Protection.behavior')

const ERC20Mock = artifacts.require('ERC20Mock');
const { ZERO_ADDRESS } = constants;

contract('ERC20', function (accounts) {
  const [initialHolder, recipient, anotherAccount] = accounts
  const initialSupply = new BN(web3.utils.toWei("1000"));

  beforeEach(async function () {
    this.token = await ERC20Mock.new();
    //await this.token.mintNoRestrict(initialHolder, initialSupply, {from:)
    await this.token.mint(initialHolder, initialSupply)
    await this.token.init()
  });
  shouldBehaveLikeERC20Protection('Protection_Period', initialSupply, initialHolder, recipient, anotherAccount);
});


