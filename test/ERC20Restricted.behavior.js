const { constants, expectEvent, expectRevert, time, BN } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;
const GoalEscrowTestVersion = artifacts.require('GoalEscrowTestVersion');
const goalEscrow = artifacts.require("GoalEscrowTestVersion") 
const proxyFactory = artifacts.require("ProxyFactory") 
const aionInterface = require('./interfaces/aionInterface.json') 
const aionContract = new web3.eth.Contract(aionInterface.abi,"0x91839cBF2D9436F1963f9eEeca7d35d427867a7a")

function shouldBehaveLikeERC20Restricted(errorPrefix, initialSupply, initialHolder, recipient, anotherAccount, _initialHolder) {

  describe('token holder has all tokens under restriction', function() {
     beforeEach(async function() {
     // await this.token.initialize({value:web3.utils.toWei(".03359789"), from: _initialHolder})
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
      await expectRevert(this.token.transfer(recipient, this.balanceInitialHolder, {from: _initialHolder}), "Transfer failed: restricted tokens exceeds transfer amount. Try again, using less than Amount Restricted");
      })   

      it('succeeds on send to to escrow', async function() {
      const Implementation = await goalEscrow.new() 
      const ProxyFactory = await proxyFactory.new(Implementation.address, this.token.address)
      await ProxyFactory.build("test1", {from: _initialHolder});
      const proxyAddress = await ProxyFactory.getProxyAddress("test1", _initialHolder)
      const ProxiedGoalEscrow = await goalEscrow.at(proxyAddress)
      await this.token.approve(ProxiedGoalEscrow.address, this.balanceInitialHolder, {from: _initialHolder});
      await ProxiedGoalEscrow.newGoalInitAndFund(this.token.address, web3.utils.toWei("25"), web3.utils.toWei("25"), {from: _initialHolder});
      expect(await this.token.balanceOf(ProxiedGoalEscrow.address)).to.be.bignumber.equal(new BN(web3.utils.toWei("50")))
      })
    }) 
  })

  describe('lift restriction by completeing one suggest step/accept step cycle', function() {
    beforeEach(async function() {
      this.id = web3.utils.utf8ToHex('cjorlslvv0fcz01119bgpvvmt')
      const Implementation = await goalEscrow.new() 
      this.proxyFactory = await proxyFactory.new(Implementation.address, this.token.address)
      await this.proxyFactory.build("test", {from: _initialHolder});
      const proxyAddress = await this.proxyFactory.getProxyAddress("test", _initialHolder)
      this.ProxiedGoalEscrow = await goalEscrow.at(proxyAddress)
      await this.token.init();
      this.balanceInitialHolder = await this.token.balanceOf(_initialHolder)
      await this.token.approve(this.ProxiedGoalEscrow.address, web3.utils.toWei("2"), {from: _initialHolder});
      await this.token.approve(this.ProxiedGoalEscrow.address, web3.utils.toWei("2"), {from: anotherAccount});
      await this.ProxiedGoalEscrow.newGoalInitAndFund(this.token.address, web3.utils.toWei("1"), web3.utils.toWei("1"), {from: _initialHolder});
      this.ownerBondAmount = await this.ProxiedGoalEscrow.ownerBondAmount()
    
    }) 

    describe('cannot send restricted token to non-escrow', function() { 

      it("does not allow owner to send amount >= non-restricted tokens to a non-escrow account", async function() {
        await expectRevert(this.token.transfer(recipient, this.balanceInitialHolder, {from: _initialHolder}), "Transfer failed: restricted tokens exceeds transfer amount. Try again, using less than Amount Restricted")
      })

      it("does not allow suggester to send amount >= non-restricted tokens (new minted tokens) to a non-escrow account", async function() {
        const amountRestricted = await this.token.amountRestricted(anotherAccount, {from: anotherAccount})

        await expectRevert(this.token.transfer(recipient, amountRestricted, {from: anotherAccount}), "Transfer failed: restricted tokens exceeds transfer amount. Try again, using less than Amount Restricted")
      })
    })
  })

  describe('lift restriction by completeing one suggest step/accept step cycle', function() {
    beforeEach(async function() {
      this.id = web3.utils.utf8ToHex('cjorlslvv0fcz01119bgpvvmt')
      this.suggesterBondAmount = web3.utils.toWei("1")
      const Implementation = await goalEscrow.new() 
      this.proxyFactory = await proxyFactory.new(Implementation.address, this.token.address)
      await this.proxyFactory.build("test", {from: _initialHolder});
      const proxyAddress = await this.proxyFactory.getProxyAddress("test", _initialHolder)
      this.ProxiedGoalEscrow = await goalEscrow.at(proxyAddress)
      this.balanceInitialHolder = await this.token.balanceOf(_initialHolder)
      await this.token.approve(this.ProxiedGoalEscrow.address, web3.utils.toWei("2"), {from: _initialHolder});
      await this.token.approve(this.ProxiedGoalEscrow.address, web3.utils.toWei("2"), {from: anotherAccount});
      await this.ProxiedGoalEscrow.newGoalInitAndFund(this.token.address, web3.utils.toWei("1"), web3.utils.toWei("1"), {from: _initialHolder});
      this.ownerBondAmount = await this.ProxiedGoalEscrow.ownerBondAmount()
      await this.ProxiedGoalEscrow.depositOnSuggest(this.id, this.suggesterBondAmount, {from:anotherAccount, value: web3.utils.toWei("3")});
      await this.ProxiedGoalEscrow.disburseOnAccept(this.id, {from: _initialHolder, value: web3.utils.toWei("1")}) 
      this.blockBeforeIncrease = await web3.eth.getBlockNumber()   
        
      await time.increase((await this.ProxiedGoalEscrow.suggestionDuration()).addn(5));
    
    }) 

      context('delay test execution for Aion processing', function() {
        beforeEach(done => setTimeout(done, 20000));

        it("allows owner to send amount <= non-restricted tokens (ownerBond) to non-escrow account", async function() {
          const amountProtectedAnotherAccount = await this.token.amountProtected(anotherAccount)
          const amountProtectedInitialHolder = await this.token.amountProtected(_initialHolder)
          console.log("amountProtectedAnotherAccount", amountProtectedAnotherAccount.toString()) 
          console.log("amountProtectedInitialHolder", amountProtectedInitialHolder.toString()) 
          const prevBalanceOfRecipient = await this.token.balanceOf(recipient) 
          console.log("ownerBondAmount", this.ownerBondAmount.toString())
          await this.token.transfer(recipient, this.ownerBondAmount, {from: _initialHolder}) 
          const balanceOfRecipient = await this.token.balanceOf(recipient) 
          expect(balanceOfRecipient).to.be.bignumber.equal(prevBalanceOfRecipient.add(this.ownerBondAmount))
        }) 

        it("allows suggester to send amount <= non-restricted tokens (suggesterBondAmount) to a non-escrow account", async function() {
          await this.token.transfer(recipient, this.suggesterBondAmount, {from: anotherAccount})
          const balanceOfRecipient = await this.token.balanceOf(recipient) 
          expect(balanceOfRecipient).to.be.bignumber.equal(this.suggesterBondAmount)
        })
      })
    })
}


module.exports = {
  shouldBehaveLikeERC20Restricted
};

