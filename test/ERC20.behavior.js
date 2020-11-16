const { web3 } = require('@openzeppelin/test-environment');
const { constants, expectEvent, expectRevert, time, BN } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;
const ERC20Mock = artifacts.require('ERC20Mock');

function shouldBehaveLikeERC20 (errorPrefix, initialSupply, initialHolder, recipient, anotherAccount) {
  describe('should behave like ERC20', function() {
    beforeEach(async function() {
      this.token = await ERC20Mock.new({from: initialHolder});
      await this.token.mintNoRestrict(initialHolder, initialSupply)
    }) 

  describe('total supply', function () {
    it('returns the total amount of tokens', async function () {
      expect(await this.token.totalSupply()).to.be.bignumber.equal(new BN(initialSupply));
    });
  });

  describe('balanceOf', function () {
    describe('when the requested account has no tokens', function () {
      it('returns zero', async function () {
        expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal('0');
      });
    });

    describe('when the requested account has some tokens', function () {
      it('returns the total amount of tokens', async function () {
        expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(new BN(initialSupply));
      });
    });
  });

  describe('transfer', function () {
    shouldBehaveLikeERC20Transfer(errorPrefix, initialHolder, recipient, initialSupply,
      function (from, to, value) {
        return this.token.transferInternal(to, value, { from });
      }
    );
  });

  describe('transfer from', function () {
    const spender = recipient;

    describe('when the token owner is not the zero address', function () {
      const tokenOwner = initialHolder;

      describe('when the recipient is not the zero address', function () {
        const to = anotherAccount;

        describe('when the spender has enough approved balance', function () {
          /*beforeEach(async function () {
            await this.token.approveInternal(initialHolder, spender, initialSupply, { from: initialHolder });
          }); */

          describe('when the token owner has enough balance', function () {
            const amount = initialSupply;

            it('transfers the requested amount', async function () {
              await this.token.approveInternal(initialHolder, spender, initialSupply, { from: initialHolder });

              await this.token.transferFrom(tokenOwner, to, amount, { from: spender });

              expect(await this.token.balanceOf(tokenOwner)).to.be.bignumber.equal('0');

              expect(await this.token.balanceOf(to)).to.be.bignumber.equal(new BN(amount));
            });

            it('decreases the spender allowance', async function () {
              await this.token.approveInternal(initialHolder, spender, initialSupply, { from: initialHolder });

              await this.token.transferFromInternal(tokenOwner, to, amount, { from: spender });

              expect(await this.token.allowance(tokenOwner, spender)).to.be.bignumber.equal('0');
            });

            it('emits a transfer event', async function () {
              await this.token.approveInternal(initialHolder, spender, initialSupply, { from: initialHolder });

              const receipt = await this.token.transferFromInternal(tokenOwner, to, amount, { from: spender });
              //const {txHash} = await this.token.transferFromInternal(tokenOwner, to, amount, { from: spender });

              expectEvent(receipt, 'Transfer', {
              //expectEvent.inTransaction(txHash, 'Transfer', {
                from: tokenOwner,
                to: to,
                value: new BN(amount),
              });
            });

            it('emits an approval event', async function () {
              await this.token.approveInternal(initialHolder, spender, initialSupply, { from: initialHolder });

              const receipt = await this.token.transferFromInternal(tokenOwner, to, amount, { from: spender });
              //const {txHash} = await this.token.transferFromInternal(tokenOwner, to, amount, { from: spender });

              expectEvent(receipt, 'Approval', {
              //expectEvent.inTransaction(txHash, 'Approval', {
                owner: tokenOwner,
                spender: spender,
                value: new BN((await this.token.allowance(tokenOwner, spender))),
              });
            });
          });

          describe('when the token owner does not have enough balance', function () {
            const amount = initialSupply + 1;
		
            it('reverts', async function () {
              await expectRevert(this.token.transferFromInternal(
                tokenOwner, to, amount, { from: spender }), 'SafeMath: subtraction overflow'
              );
            });
          });
        });

        describe('when the spender does not have enough approved balance', function () {
          beforeEach(async function () {
            await this.token.approve(spender, (new BN (initialSupply)).subn(1), { from: tokenOwner });
          });

          describe('when the token owner has enough balance', function () {
            const amount = initialSupply;

            it('reverts', async function () {
              await expectRevert(this.token.transferFromInternal(
                tokenOwner, to, amount, { from: spender }), 'SafeMath: subtraction overflow'
              );
            });
          });

          describe('when the token owner does not have enough balance', function () {
            const amount = initialSupply + 1;

            it('reverts', async function () {
              await expectRevert(this.token.transferFromInternal(
                tokenOwner, to, amount, { from: spender }), 'SafeMath: subtraction overflow'
              );
            });
          });
        });
      });

      describe('when the recipient is the zero address', function () {
        const amount = initialSupply;
        const to = ZERO_ADDRESS;

        beforeEach(async function () {
          await this.token.approveInternal(tokenOwner, spender, amount, { from: tokenOwner });
        });

        it('reverts', async function () {
          await expectRevert(this.token.transferFromInternal(
            tokenOwner, to, amount, { from: spender }), `${errorPrefix}: transfer to the zero address`
          );
        });
      });
    });

    describe('when the token owner is the zero address', function () {
      const amount = 0;
      const tokenOwner = ZERO_ADDRESS;
      const to = recipient;

      it('reverts', async function () {
        await expectRevert(this.token.transferFromInternal(
          tokenOwner, to, amount, { from: spender }), `${errorPrefix}: transfer from the zero address`
        );
      });
    });
  });
  describe('approve', function () {
    shouldBehaveLikeERC20Approve(errorPrefix, initialHolder, recipient, initialSupply,
      function (owner, spender, amount) {
        return this.token.approveInternal(owner, spender, amount, { from: owner });
      }
    );
  });
})
}
function shouldBehaveLikeERC20Transfer (errorPrefix, from, to, balance, transfer ) {
  describe('should behave like ERC20Transfer', function() {
    beforeEach(async function() {
      this.token = await ERC20Mock.new();
      await this.token.mintNoRestrict(from, balance)
    }) 

  describe('when the recipient is not the zero address', function () {
    describe('when the sender does not have enough balance', function () {
      let amount = balance + 1 
      amount = new BN(amount);
      it('reverts', async function () {
         await expectRevert(this.token.transferInternal(from, to, amount), "SafeMath: subtraction overflow"
        );
      });
    });

    describe('when the sender transfers all balance', function () {
      let amount = balance;

      it('transfers the requested amount', async function () {
        await this.token.transferInternal(from, to, amount);

        expect(await this.token.balanceOf(from)).to.be.bignumber.equal('0');

        expect(await this.token.balanceOf(to)).to.be.bignumber.equal(new BN (amount));
      });

      it('emits a transfer event', async function () {
        //const receipt = await this.token.transferInternal(from, to, amount);
        const {txHash} = await this.token.transferInternal(from, to, amount);
        //expectEvent(receipt, 'Transfer', {
        expectEvent.inTransaction(txHash, 'Transfer', {
          from,
          to,
          value: new BN(amount),
        });
      });
    });

    describe('when the sender transfers zero tokens', function () {
      const amount = new BN('0');

      it('transfers the requested amount', async function () {
        await this.token.transferInternal(from, to, amount);

        expect(await this.token.balanceOf(from)).to.be.bignumber.equal(new BN(balance));

        expect(await this.token.balanceOf(to)).to.be.bignumber.equal('0');
      });

      it('emits a transfer event', async function () {
        const receipt = await this.token.transferInternal(from, to, amount);
        //const {txHash} = await this.token.transferInternal(from, to, amount);

        expectEvent(receipt, 'Transfer', {
        //expectEvent.inTransaction(txHash, 'Transfer', {
          from,
          to,
          value: new BN(amount),
        });
      });
    });
  });

  describe('when the recipient is the zero address', function () {
    it('reverts', async function () {
      await expectRevert(this.token.transferInternal(from, ZERO_ADDRESS, balance),
        `${errorPrefix}: transfer to the zero address`
      );
    });
  });
})
}

function shouldBehaveLikeERC20Approve (errorPrefix, owner, spender, supply, approve) {
  describe('should behave like ERC20Approve', function() {
    beforeEach(async function() {
      this.token = await ERC20Mock.new({from: owner});
      await this.token.mintNoRestrict(owner, supply)
    }) 

  describe('when the spender is not the zero address', function () {
    describe('when the sender has enough balance', function () {
      const amount = supply;

      it('emits an approval event', async function () {
        const {txHash} = await this.token.approveInternal(owner, spender, amount, {from:owner});

        expectEvent.inTransaction(txHash, 'Approval', {
          owner: owner,
          spender: spender,
          value: new BN(amount),
        });
      });

      describe('when there was no approved amount before', function () {
        it('approves the requested amount', async function () {
          await this.token.approveInternal(owner, spender, amount);

          expect(await this.token.allowance(owner, spender)).to.be.bignumber.equal(new BN(amount));
        });
      });

      describe('when the spender had an approved amount', function () {
        beforeEach(async function () {
          await this.token.approveInternal(owner, spender, new BN(1));
        });

        it('approves the requested amount and replaces the previous one', async function () {
          await this.token.approveInternal(owner, spender, amount);

          expect(await this.token.allowance(owner, spender)).to.be.bignumber.equal(new BN(amount));
        });
      });
    });

    describe('when the sender does not have enough balance', function () {
      const amount = supply + 1;

      it('emits an approval event', async function () {
        const {txHash} = await this.token.approveInternal(owner, spender, amount);

        expectEvent.inTransaction(txHash, 'Approval', {
          owner: owner,
          spender: spender,
          value: new BN(amount),
        });
      });

      describe('when there was no approved amount before', function () {
        it('approves the requested amount', async function () {
          await this.token.approveInternal(owner, spender, amount);

          expect(await this.token.allowance(owner, spender)).to.be.bignumber.equal(new BN(amount));
        });
      });

      describe('when the spender had an approved amount', function () {
        beforeEach(async function () {
          await this.token.approveInternal(owner, spender, new BN(1));
        });

        it('approves the requested amount and replaces the previous one', async function () {
          await this.token.approveInternal(owner, spender, amount);

          expect(await this.token.allowance(owner, spender)).to.be.bignumber.equal(new BN(amount));
        });
      });
    });
  });

  describe('when the spender is the zero address', function () {
    it('reverts', async function () {
      await expectRevert(this.token.approveInternal(owner, ZERO_ADDRESS, supply),
        `${errorPrefix}: approve to the zero address`
      );
    });
  });
})
}


module.exports = {
  shouldBehaveLikeERC20,
  shouldBehaveLikeERC20Transfer,
  shouldBehaveLikeERC20Approve,
};
