const { BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;

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

      expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(initialSupply);
      })
    })

    describe('protectTokens', function() {
      it("places specified amount of target user's tokens under protection", async function() {
      //if fails, apply method of ERC20Transfer
        await this.token.protectTokens(initialHolder, initialSupply);
	expect(await this.token.amountProtected(initialHolder)).to.be.bignumber.equal(initialSupply); })
     }) 
  })

  describe('while account has tokens under protection',  function() {
    describe('amount protected', function () {
      it('returns the total number of tokens under protection', async function () {
        await this.token.protectTokens(initialHolder, initialSupply);
        expect(await this.token.amountProtected(initialHolder)).to.be.bignumber.equal(initialSupply)
      })
    })
   /******vvvvvvvvv******/ 
    describe('token holder tries to send tokens', function () {
      it('reverts', async function() {
        await this.token.protectTokens(initialHolder, initialSupply);
 	let protected =	await this.token.amountProtected(initialHolder);
	console.log("INITIAL_HOLDER_AMOUNT_PROTECTED", protected.toNumber());
      await expectRevert.unspecified(this.token.transferInternal(initialHolder, recipient, initialSupply));
	let recipientBalance = await this.token.balanceOf(recipient);
  	console.log("RECIPIENT_BALANCE", recipientBalance.toNumber());
      });
    });
    
  describe('remove protection', function() {
      it('removes specified number of tokens, on specified account', async function() {
	await this.token.protectTokens(initialHolder, initialSupply);
	//let protected = await this.token.amountProtected(initialHolder);
        await this.token.removeTokenProtection(initialHolder,initialSupply)
        expect(await this.token.amountProtected(initialHolder)).to.be.bignumber.equal("0");
      });
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

        expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(initialSupply);
      })
      })
    });
  };


module.exports = {
  shouldBehaveLikeERC20Protection
};
/*
-- pre-seed x protected tokens for initialHolder
-- amountProtected(initialHolder) ==  x
-- expectRevert(await this.token.transfer(x, recipient))
-- protectTokens(initialHolder, y tokens), amountProtected(initialHolder) == x tokens + y tokens == z tokens
-- expectRevert(await this.token.transfer(x, recipient))
-- expectRevert(await this.token.transfer(x, recipient))
-- removeTokenPrection(initialHolder, z), amountProtected(initialHolder) == 0
-- transfer(z, recipient),   expext success
*/
