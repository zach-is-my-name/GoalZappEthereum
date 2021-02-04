const { constants, expectEvent, expectRevert, time, BN } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { shouldBehaveLikeERC20Restricted} = require('./ERC20Restricted.behavior')
const ERC20Mock = artifacts.require('ERC20Mock');
const { ZERO_ADDRESS } = constants;

contract('ERC20 Restricted', function (accounts) {
  const [initialHolder, recipient, anotherAccount, _initialHolder] = accounts
  const initialSupply = new BN(web3.utils.toWei("1000"));

  beforeEach(async function () {
    this.token = await ERC20Mock.new();
    await this.token.mint(initialHolder, initialSupply) 
  });

  shouldBehaveLikeERC20Restricted('Restriction_Period', initialSupply, initialHolder, recipient, anotherAccount, _initialHolder)
})
