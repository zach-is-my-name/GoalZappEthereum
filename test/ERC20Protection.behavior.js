const { constants, expectEvent, expectRevert, time, BN } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;
const GoalEscrowTestVersion = artifacts.require('GoalEscrowTestVersion');
//const GoalEscrowTestVersion = contract.fromArtifact('GoalEscrowTestVersion');
//const ERC20Mock = contract.fromArtifact('ERC20Mock');
const ERC20Mock = artifacts.require('ERC20Mock');

function shouldBehaveLikeERC20Protection(errorPrefix, initialSupply, initialHolder, recipient, anotherAccount) {

describe('when the requested account has no protected tokens', function() {
  beforeEach(async function() {
    this.token = await ERC20Mock.new({from: initialHolder});
    await this.token.mint(initialHolder, initialSupply)
  }) 

	describe('amountProtected', function() {
		it('returns zero', async function () {
			expect(await this.token.amountProtected(recipient)).to.be.bignumber.equal('0');
		});
	});

	describe('token holder tries to send tokens', function() {
		it('succeeds', async function() {
		 await this.token.transferInternal(initialHolder, recipient, initialSupply)
		 expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal('0');
		 expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(new BN(initialSupply));
		})
	})
})


describe('ERC20 Protection', function() {
  beforeEach(async function() {
    this.token = await ERC20Mock.new({from: initialHolder});
    await this.token.mint(initialHolder, initialSupply)
  }) 

  describe('token holder has no tokens under protection', function() {
    describe('amount protected', function() {
      it('returns 0', async function() {
        expect(await this.token.amountProtected(initialHolder)).to.be.bignumber.equal('0');
      })
    })
  })

  describe('send tokens', function() {
    it('succeeds', async function() {
      await this.token.transferInternal(initialHolder, recipient, initialSupply);
      expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal('0');
      expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(new BN(initialSupply));
    })
  })

  describe('protectTokens', function() {
    beforeEach(async function () {
      this.id = web3.utils.utf8ToHex('cjorlslvv0fcz01119bgpvvmt')
      this.escrow = await GoalEscrowTestVersion.new(); 
      this.protectionPeriod = await this.token.protectionPeriod()

      //await debug(this.escrow.initMaster(this.token.address, 30))
      this.token = await ERC20Mock.new({from: initialHolder});
      await this.token.mint(initialHolder, initialSupply)
      await this.token.mint(anotherAccount, web3.utils.toWei("50"), {from: anotherAccount});
      await this.token.approveInternal(initialHolder, this.escrow.address, web3.utils.toWei("50"), {from: initialHolder});
      await this.token.approveInternal(anotherAccount, this.escrow.address, web3.utils.toWei("50"), {from: anotherAccount});
      await this.escrow.newGoalInitAndFund(this.token.address, 30, web3.utils.toWei("25"), web3.utils.toWei("25"), {from: initialHolder});
      await this.escrow.depositOnSuggest(this.id, web3.utils.toWei("5"), {from: anotherAccount, value: web3.utils.toWei("1")});
      this.suggesterBond = (await this.escrow.suggestedSteps(this.id)).suggesterBond
      await this.escrow.disburseOnAccept(this.id, {from:initialHolder});
    })

    it("places specified amount of owner's tokens under protection", async function() {
			let amountProtected = await this.token.amountProtected(initialHolder, {from:initialHolder})
			let ownerBondAmount =await this.escrow.ownerBondAmount({from: initialHolder}) 
			expect(amountProtected).to.be.bignumber.equal(ownerBondAmount); 
    })

    it("places specified amount of suggester's tokens under protection", async function() {
			const id = web3.utils.utf8ToHex('cjorlslvv0fcz01119bgpvvmt')
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
<<<<<<< HEAD
				const amountProtected =	await this.token.amountProtected(initialHolder);
				return await expectRevert(this.token.transfer( recipient, amountProtected, {from: initialHolder}),"your tokens are under protection period, check timeToLiftProtection() for time until you have tokens available, and/or check amountProtected to see how many of your tokens are currently under the protection period" );
=======
 	let protected =	await this.token.amountProtected(initialHolder);
	//console.log("INITIAL_HOLDER_AMOUNT_PROTECTED", protected.toNumber());
      await expectRevert.unspecified(this.token.transferInternal(initialHolder, recipient, initialSupply));
>>>>>>> DebugDockerAionTestVersion
      });
    });

     describe('remove protection', function() {
      before(async function() {
        this.amountProtected = await this.token.amountProtected(initialHolder);
        await time.increase(this.protectionPeriod.add(new BN("1"))) 
        await time.advanceBlock()
      })

      it('removes protection from specified number of tokens, on specified account', async function() {
       this.timeout(10000)
       
       setTimeout(async function() {
         const amountProtectedInitialHolder = await this.token.amountProtected(initialHolder)
         expect(amountProtectedInitialHolder).to.be.bignumber.equal("0");
       }, 95000)
      });

      it('owner can send tokens that were protected', async function() {
        setTimeout(async function() {
          const initialHolderAmountBeforeTransfer = await this.token.balanceOf(initialHolder);
          const recipientAmountBeforeTransfer = await this.token.balanceOf(recipient);
          await this.token.transfer(recipient, this.amountProtected, {from: initialHolder}); 
          expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(recipientAmountBeforeTransfer.add(this.amountProtected)); 
          expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(initialHolderAmountBeforeTransfer.sub(this.amountProtected)); 
        }, 95000) 
      }) 

    }) 
    })
  })  
  })
  }


module.exports = {
  shouldBehaveLikeERC20Protection
};
