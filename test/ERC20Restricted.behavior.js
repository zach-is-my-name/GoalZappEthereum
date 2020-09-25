const { BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;
const GoalEscrowTestVersion = artifacts.require('GoalEscrowTestVersion');
const { advanceTimeAndBlock } = require("../utils/helpers/advance_time_and_block.js");
const goalEscrow = artifacts.require("GoalEscrowTestVersion") 
const proxyFactory = artifacts.require("ProxyFactory") 

function shouldBehaveLikeERC20Restricted(errorPrefix, initialSupply, initialHolder, recipient, anotherAccount, _initialHolder) {

  describe('token holder has all tokens under restriction', function() {
     beforeEach(async function() {
      await this.token.initialize({value:web3.utils.toWei(".03359789"), from: _initialHolder})
      await this.token.init();
      this.balanceInitialHolder = await this.token.balanceOf(_initialHolder)
     }) 
    describe('amount restricted', function() {
      it('returns amount restricted === token balance', async function() {
        expect(await this.token.balanceOf(_initialHolder)).to.be.bignumber.equal(await this.token.amountRestricted(_initialHolder))
      });
    }) 

    describe('send tokens', function() {
      it('fails on send to party outside of escrow', async function() {
      await expectRevert.unspecified(this.token.transfer(recipient, this.balanceInitialHolder, {from: _initialHolder}));
      })   
      it('succeeds on send to to escrow', async function() {
      const Implementation = await goalEscrow.new() 
      const ProxyFactory = await proxyFactory.new(Implementation.address, this.token.address)
      await ProxyFactory.build("test1", {from: _initialHolder});
      const proxyAddress = await ProxyFactory.getProxyAddress("test1", _initialHolder)
      const ProxiedGoalEscrow = await goalEscrow.at(proxyAddress)
      await this.token.approve(ProxiedGoalEscrow.address, this.balanceInitialHolder, {from: _initialHolder});
      await ProxiedGoalEscrow.newGoalInitAndFund(this.token.address, 30, web3.utils.toWei("25"), web3.utils.toWei("25"), {from: _initialHolder});
      expect(await this.token.balanceOf(ProxiedGoalEscrow.address)).to.be.bignumber.equal(new BN(web3.utils.toWei("50")))
      })
    }) 
  })

  describe('lift restriction by completeing one suggest step/accept step cycle', function() {
    beforeEach(async function() {
     console.log('anotherAccount', anotherAccount) 
      this.id = web3.utils.utf8ToHex('cjorlslvv0fcz01119bgpvvmt')
      const Implementation = await goalEscrow.new() 
      this.proxyFactory = await proxyFactory.new(Implementation.address, this.token.address)
      await this.proxyFactory.build("test", {from: _initialHolder});
      const proxyAddress = await this.proxyFactory.getProxyAddress("test", _initialHolder)
      this.ProxiedGoalEscrow = await goalEscrow.at(proxyAddress)
      await this.token.initialize({value: web3.utils.toWei(".03359789"), from: _initialHolder})
      await this.token.init();
      this.balanceInitialHolder = await this.token.balanceOf(_initialHolder)
      await this.token.buy({value: web3.utils.toWei("1"), from: anotherAccount}); 
      await this.token.approve(this.ProxiedGoalEscrow.address, web3.utils.toWei("50"), {from: _initialHolder});
      await this.token.approve(this.ProxiedGoalEscrow.address, web3.utils.toWei("50"), {from: anotherAccount});
      await this.ProxiedGoalEscrow.newGoalInitAndFund(this.token.address, 30, web3.utils.toWei("25"), web3.utils.toWei("25"), {from: _initialHolder});
      this.suggesterBondAmount = web3.utils.toWei("1")
      await this.ProxiedGoalEscrow.depositOnSuggest(this.id, this.suggesterBondAmount, {from:anotherAccount});
      this.ownerBondAmount = await this.ProxiedGoalEscrow.ownerBondAmount()
    }) 
    
    describe('goal owner send tokens', function() {
      it("allows owner to send amount <= non-restricted tokens (ownerBond) to non-escrow account", async function() {
	const prevBalanceOfRecipient = await this.token.balanceOf(recipient) 
	await this.token.transfer(recipient, this.ownerBondAmount, {from: _initialHolder}) 
	const balanceOfRecipient = await this.token.balanceOf(recipient) 

	expect(balanceOfRecipient).to.be.bignumber.equal(prevBalanceOfRecipient.add(this.ownerBondAmount))
      }) 
      it("does not allow owner to send amount > non-restricted tokens to a non-escrow account", async function() {
        await expectRevert.unspecified(this.token.transfer(recipient, this.balanceInitialHolder, {from: _initialHolder}))
      })
    })
    
    describe('suggester send tokens', function() {
      it("allows suggester to send amount <= non-restricted tokens (suggesterBondAmount) to a non-escrow account", async function() {
        await this.token.transfer(recipient, this.suggesterBondAmount, {from: anotherAccount})
	const balanceOfRecipient = await this.token.balanceOf(recipient) 
        expect(balanceOfRecipient).to.be.bignumber.equal(this.suggesterBondAmount)
     })
     it("does not allow suggester to send amount > than restricted tokens (new token purchase amount)", async function() {
       
       const newTokenPurchase = await this.token.buy({from: anotherAccount, value: web3.utils.toWei("1")})
       const amountRestricted = await this.token.amountRestricted(anotherAccount)
       console.log("amountRestricted", web3.utils.fromWei(amountRestricted))
        
       await expectRevert.unspecified(this.token.transfer(recipient, amountRestricted.addn(1), {from: anotherAccount}))
     })
   })
  })
}


module.exports = {
  shouldBehaveLikeERC20Restricted
};

