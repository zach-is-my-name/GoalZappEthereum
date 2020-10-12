const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;
const GoalEscrowTestVersion = artifacts.require('GoalEscrowTestVersion');

function shouldBehaveLikeERC20Protection(errorPrefix, initialSupply, initialHolder, recipient, anotherAccount) {
  // bypass scheduler and protect initialHolder's tokens

  describe('token holder has no tokens under protection', function() {

    describe('amount protected', function() {
      it('returns 0', async function() {
        expect(await this.token.amountProtected(initialHolder)).to.be.bignumber.equal('0');
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
	await this.escrow.initMaster(this.token.address, 30);
	await this.token.mint(anotherAccount, web3.utils.toWei("50"));
	//let restrictedTokensGoalOwner = await this.token.restrictedTokens(initialHolder);
	//let restrictedTokensSuggester = await this.token.restrictedTokens(anotherAccount);
	//console.log('Restricted Tokens Goal Owner: ', restrictedTokensGoalOwner.toString())
	//console.log('Restricted Tokens Suggester: ', restrictedTokensSuggester.toString())
	await this.token.approve(this.escrow.address, web3.utils.toWei("50"), {from: initialHolder});
	await this.token.approve(this.escrow.address, web3.utils.toWei("50"), {from: anotherAccount});
	await this.escrow.newGoalInitAndFund(this.token.address, 30, web3.utils.toWei("25"), web3.utils.toWei("25"), {from: initialHolder});
	await this.escrow.depositOnSuggest(this.id, web3.utils.toWei("5"), {from:anotherAccount});
	this.suggesterBond = (await this.escrow.suggestedSteps(this.id)).suggesterBond
	await this.escrow.disburseOnAccept(this.id, {from:initialHolder});
      })

      it("places specified amount of owner's tokens under protection", async function() {
	let amountProtected = (await this.token.amountProtected(initialHolder)).toString()
	expect(await this.token.amountProtected(initialHolder)).to.be.bignumber.equal(new BN(await this.escrow.ownerBondAmount()) ); 
      })

      it("places specified amount of suggester's tokens under protection", async function() {
	const id = web3.utils.utf8ToHex('cjorlslvv0fcz01119bgpvvmt')
	let amountProtected = (await this.token.amountProtected(anotherAccount)).toString()
	expect(await this.token.amountProtected(anotherAccount)).to.be.bignumber.equal(this.suggesterBond.add(await this.escrow.rewardAmount())); 
      })
    })  
  })
 
  describe('while account has tokens under protection', function() {
    beforeEach(async function () {
      this.id = web3.utils.utf8ToHex('cjorlslvv0fcz01119bgpvvmm')
      this.escrow = await GoalEscrowTestVersion.new(); 
      await this.escrow.initMaster(this.token.address, 30);
      await this.token.mint(anotherAccount, web3.utils.toWei("50"));
      await this.token.approve(this.escrow.address, web3.utils.toWei("50"), {from: initialHolder});
      await this.escrow.newGoalInitAndFund(this.token.address, 30, web3.utils.toWei("25"), web3.utils.toWei("25"), {from:initialHolder});
      await this.token.approve(this.escrow.address, web3.utils.toWei("50"), {from: anotherAccount});
      await this.escrow.depositOnSuggest(this.id, web3.utils.toWei("25"),  {from: anotherAccount});
      await this.escrow.disburseOnAccept(this.id, {from:initialHolder});
    })

    describe('amount protected', function () {
      it('returns the total number of tokens under protection', async function () {
        expect(await this.token.amountProtected(initialHolder)).to.be.bignumber.equal(new BN(await this.escrow.ownerBondAmount()))
      })
    })

    describe('owner tries to send protected tokens', function () {
      it('reverts', async function() {
 	let protected =	await this.token.amountProtected(initialHolder);
	//console.log("INITIAL_HOLDER_AMOUNT_PROTECTED", protected.toNumber());
      await expectRevert.unspecified(this.token.transferInternal(initialHolder, recipient, initialSupply));
	let recipientBalance = await this.token.balanceOf(recipient);
  	//console.log("RECIPIENT_BALANCE", recipientBalance.toNumber());
      });
    });

     describe('remove protection', function() {
      it('removes protection from specified number of tokens, on specified account', async function() {
      //let aionAddress = await this.escrow.isAionAddress(this.escrow.address) 
      //console.log('aionAddress', aionAddress);
      await this.escrow.testVersionRemoveTokenProtectionWrapper(initialHolder, await this.token.amountProtected(initialHolder));
      await time.increase(time.duration.seconds(31));
      //let protected = await this.token.amountProtected(initialHolder);
      //console.log('amount protected = ', protected.toString());
      //let expires = await this.escrow.suggestionExpires(this.id); 
      //console.log('expires = ', expires.toString());
       
       expect(await this.token.amountProtected(initialHolder)).to.be.bignumber.equal("0");
      });
      it('owner can send tokens that were protected', async function() {
        let protected = await this.token.amountProtected(initialHolder);
        let recipientAmountBeforeTransfer = await this.token.balanceOf(recipient);
        let initialHolderAmountBeforeTransfer = await this.token.balanceOf(initialHolder);
        await time.increase(time.duration.seconds(30));
        await this.escrow.testVersionRemoveTokenProtectionWrapper(initialHolder, await this.token.amountProtected(initialHolder));
        await this.token.transfer(recipient, protected, {from: initialHolder}); 
        expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(recipientAmountBeforeTransfer.add(protected)); 
        expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(initialHolderAmountBeforeTransfer.sub(protected)); 
       
      }) 
    }); 
    });

    describe('when the requested account has no protected tokens', function() {
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
    });
  };


module.exports = {
  shouldBehaveLikeERC20Protection
};
