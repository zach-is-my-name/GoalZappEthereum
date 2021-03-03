const { constants, expectEvent, expectRevert, time, BN } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;
const GoalEscrowTestVersion = artifacts.require('GoalEscrowTestVersion');
const ProxyFactory = artifacts.require('ProxyFactory');
const ERC20Mock = artifacts.require('ERC20Mock');
const aionInterface = require('./interfaces/aionInterface.json') 
const aionContract = new web3.eth.Contract(aionInterface.abi,"0x91839cBF2D9436F1963f9eEeca7d35d427867a7a")

function shouldBehaveLikeERC20Protection(errorPrefix, initialSupply, initialHolder, recipient, anotherAccount) {
  describe('when the token holder has no protected tokens', function() {

    describe('amountProtected', function() {
      it('returns zero', async function () {
        expect(await this.token.amountProtected(recipient)).to.be.bignumber.equal('0');
      });
    });

    describe('token holder tries to send tokens', function() {
      it('succeeds', async function() {
       await this.token.transferNoRestriction(initialHolder, recipient, initialSupply);
       expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal('0');
       expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(new BN(initialSupply));
      })
    })
  describe('ERC20 Protection', function() {
    describe('token holder has no tokens under protection', function() {
      describe('amount protected', function() {
        it('returns 0', async function() {
          expect(await this.token.amountProtected(initialHolder)).to.be.bignumber.equal('0');
        })
      })
    })
  })

    describe('send tokens', function() {
      it('succeeds', async function() {
        await this.token.transferNoRestriction(initialHolder, recipient, initialSupply);
        expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal('0');
        expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(new BN(initialSupply));
      })
    })
    })

    describe('protectTokens', function() {
      beforeEach(async function () {
        this.id = web3.utils.utf8ToHex('cjorlslvv0fcz01119bgpvvmt')
        this.escrow = await GoalEscrowTestVersion.new(); 
        this.protectionPeriod = await this.token.protectionPeriod()
        await this.token.approveInternal(initialHolder, this.escrow.address, web3.utils.toWei("50"), {from: initialHolder});
        await this.token.mint(anotherAccount, new BN(web3.utils.toWei("50")), {from: anotherAccount})
        await this.token.approveInternal(anotherAccount, this.escrow.address, web3.utils.toWei("50"), {from: anotherAccount});
        await this.escrow.newGoalInitAndFund(this.token.address, web3.utils.toWei("25"), web3.utils.toWei("25"), {from: initialHolder});
        await this.escrow.depositOnSuggest(this.id, web3.utils.toWei("5"), {from: anotherAccount, value: web3.utils.toWei("3")});
        this.suggesterBond = (await this.escrow.suggestedSteps(this.id)).suggesterBond
        await this.escrow.disburseOnAccept(this.id, {from: initialHolder, value: web3.utils.toWei("1")});
      })
     

      it("places specified amount of owner's tokens under protection", async function() {
        let amountProtected = await this.token.amountProtected(initialHolder, {from:initialHolder})
        let ownerBondAmount = await this.escrow.ownerBondAmount({from: initialHolder}) 
        expect(amountProtected).to.be.bignumber.equal(ownerBondAmount); 
      })

      it("places specified amount of suggester's tokens under protection", async function() {
        let amountProtected = (await this.token.amountProtected(anotherAccount)).toString()
        expect(await this.token.amountProtected(anotherAccount)).to.be.bignumber.equal(this.suggesterBond.add(await this.escrow.rewardAmount())); 
      })

    describe('while account has tokens under protection', function() {
      describe('amount protected', function () {
        it('returns the total number of tokens under protection', async function () {
          const amountProtectedInitialHolder = await this.token.amountProtected(initialHolder) 
          const ownerBondAmount = await this.escrow.ownerBondAmount()
          expect(amountProtectedInitialHolder).to.be.bignumber.equal(ownerBondAmount)
        })
      })

      describe('owner tries to send protected tokens', function () {
        it('reverts', async function() {
          const amountProtected =	await this.token.amountProtected(initialHolder);
          return await expectRevert(this.token.transfer( recipient, amountProtected, {from: initialHolder}),"your tokens are under protection period, check timeToLiftProtection() for time until you have tokens available, and/or check amountProtected to see how many of your tokens are currently under the protection period" );
        });
      });
    })  
   })

       describe('remove protection', function() {
        beforeEach(async function() {
          this.timeBeforeIncrease = (await web3.eth.getBlock("pending")).timestamp

          this.id = web3.utils.utf8ToHex('cjorlslvv0fcz01119bgpvvmt')

          this.implementation = await GoalEscrowTestVersion.new();
          this.factory = await ProxyFactory.new(this.implementation.address, this.token.address)    
          await this.factory.build("Goal1", {from: initialHolder});
          this.proxyAddress = await this.factory.getProxyAddress("Goal1", initialHolder, {from:initialHolder});
          this.escrow = await GoalEscrowTestVersion.at(this.proxyAddress); 

          this.protectionPeriod = await this.token.protectionPeriod()
          await this.token.approveInternal(initialHolder, this.escrow.address, web3.utils.toWei("50"), {from: initialHolder});
          await this.token.mint(anotherAccount, new BN(web3.utils.toWei("50")), {from: anotherAccount})
          await this.token.approveInternal(anotherAccount, this.escrow.address, web3.utils.toWei("50"), {from: anotherAccount});
          await this.escrow.newGoalInitAndFund(this.token.address, web3.utils.toWei("25"), web3.utils.toWei("25"), {from: initialHolder});
          const isAion = await this.escrow.isAionAddress("0x6b50600866a4A4E09E82144aF3cCdfe16b3081b3");
          console.log("isAion", isAion);
          await this.escrow.depositOnSuggest(this.id, web3.utils.toWei("5"), {from: anotherAccount, value: web3.utils.toWei("3")});
          this.suggesterBond = (await this.escrow.suggestedSteps(this.id)).suggesterBond
          await this.escrow.disburseOnAccept(this.id, {from: initialHolder, value: web3.utils.toWei("1")});

          this.blockBeforeIncrease = await web3.eth.getBlockNumber()
          
          const timeBefore = await web3.eth.getBlock("pending") 
          console.log("timeBefore", timeBefore.timestamp)  
          
          this.amountProtected = await this.token.amountProtected(initialHolder);
          console.log("Amount Protected -- before", this.amountProtected.toString())
          console.log("protection period", this.protectionPeriod.toString())

          await time.increase(this.protectionPeriod.add(new BN("5"))) 

          const blockAfterIncrease = await web3.eth.getBlock("pending") 
          const timeAfter = blockAfterIncrease.timestamp
          console.log("timeAfter", timeAfter) 
        })

          context('delay test execution for Aion processing', function() {
            beforeEach(done => setTimeout(done, 14000));
             it('removes protection from specified number of tokens, on specified account', async function() {
                 const eventArr = await aionContract.getPastEvents("ExecutedCallEvent", {fromBlock: this.blockBeforeIncrease, toBlock:"pending"}) 
                 console.log('eventArr', eventArr)
                 let amountProtectedInitialHolder = await this.token.amountProtected(initialHolder)
                 console.log("amount protected after time increase", amountProtectedInitialHolder.toString())
                 //console.log("time before increase", this.timeBeforeIncrease)
                 //console.log("timeNow -- after time increase ", timeNow)
                 //await this.token.debugRemoveRewardTokenProtection(initialHolder, web3.utils.toWei("1"))
                 //amountProtectedInitialHolder = await this.token.amountProtected(initialHolder)
                 expect(amountProtectedInitialHolder).to.be.bignumber.equal("0");
             });

             it('owner can send tokens that were protected', async function() {
               const initialHolderAmountBeforeTransfer = await this.token.balanceOf(initialHolder);
               const recipientAmountBeforeTransfer = await this.token.balanceOf(recipient);
               await this.token.transfer(recipient, this.amountProtected, {from: initialHolder}); 
               expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(recipientAmountBeforeTransfer.add(this.amountProtected)); 
               expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(initialHolderAmountBeforeTransfer.sub(this.amountProtected)); 
            }) 
         })
      }) 
  }


module.exports = {
  shouldBehaveLikeERC20Protection
};
