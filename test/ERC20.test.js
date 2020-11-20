const { constants, expectEvent, expectRevert, time, BN } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const {
  shouldBehaveLikeERC20,
  shouldBehaveLikeERC20Transfer,
  shouldBehaveLikeERC20Approve,
} = require('./ERC20.behavior');

const {
  shouldBehaveLikeERC20Protection, 
} = require('./ERC20Protection.behavior')

const ERC20Mock = artifacts.require('ERC20Mock');
const { ZERO_ADDRESS } = constants;

contract('ERC20', function (accounts) {
  const [initialHolder, recipient, anotherAccount] = accounts
  const initialSupply = new BN(web3.utils.toWei("1000"));

  beforeEach(async function () {
    this.token = await ERC20Mock.new();
    await this.token.mintNoRestrict(initialHolder, initialSupply)
  });

  shouldBehaveLikeERC20('ERC20', initialSupply, initialHolder, recipient, anotherAccount);

  shouldBehaveLikeERC20Protection('Protection_Period', initialSupply, initialHolder, recipient, anotherAccount);

  describe('ERC20 functions', function() {
    beforeEach(async function () {
      this.token = await ERC20Mock.new({from: initialHolder});
      await this.token.mintNoRestrict(initialHolder, initialSupply, {from: initialHolder})
    }) 

    describe('decrease allowance', function () {

      describe('when the spender is not the zero address', async function () {
        const spender = recipient;
        const amount = new BN(web3.utils.toWei("2"))
        function shouldDecreaseApproval (amount) {
          describe('when there was no approved amount before', function () {
            it('reverts', async function () {
              await expectRevert(this.token.decreaseAllowanceInternal(
                spender, amount, { from: initialHolder }), 'SafeMath: subtraction overflow'
              );
            });
          });

          describe('when the spender had an approved amount', function () {
            const approvedAmount = new BN(web3.utils.toWei("2"));
            beforeEach(async function () {
              ( {logs: this.logs} = await this.token.approveInternal(initialHolder, spender, approvedAmount, { from: initialHolder }));
            });

            it('emits an approval event', async function () {
              const {logs} = await this.token.decreaseAllowanceInternal(spender, approvedAmount, { from: initialHolder });

              expectEvent.inLogs(logs, 'Approval', {
                owner: initialHolder,
                spender: spender,
                value: new BN(0),
              });
            });

            it('decreases the spender allowance subtracting the requested amount', async function () {
               
              await this.token.decreaseAllowanceInternal(spender, web3.utils.toWei("1"), { from: initialHolder });
              expect((await this.token.allowance(initialHolder, spender))).to.be.bignumber.equal(web3.utils.toWei("1"));
            });
   
            it('sets the allowance to zero when all allowance is removed', async function () {
              await this.token.decreaseAllowanceInternal(spender, approvedAmount, { from: initialHolder });
              expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal('0');
            });

            it('reverts when more than the full allowance is removed', async function () {
              await expectRevert(
                this.token.decreaseAllowanceInternal(spender, (new BN(approvedAmount)).addn(1), { from: initialHolder }),
                'SafeMath: subtraction overflow'
              );
            });
          });
        }

        describe('when the sender has enough balance', function () {
          const amount = initialSupply;

          shouldDecreaseApproval(amount);
        });

        describe('when the sender does not have enough balance', function () {
          const amount = initialSupply + web3.utils.toWei("1");

          shouldDecreaseApproval(amount);
        });
      });

      describe('when the spender is the zero address', function () {
        const amount = initialSupply;
        const spender = ZERO_ADDRESS;

        it('reverts', async function () {
          await expectRevert(this.token.decreaseAllowanceInternal(
            spender, amount, { from: initialHolder }), 'SafeMath: subtraction overflow'
          );
        });
      });
    });

    describe('increase allowance', function () {
      const amount = initialSupply;

      describe('when the spender is not the zero address', function () {
        const spender = recipient;

        describe('when the sender has enough balance', function () {
          it('emits an approval event', async function () {
            const receipt = await this.token.increaseAllowanceInternal(spender, amount, { from: initialHolder });

            expectEvent(receipt, 'Approval', {
              owner: initialHolder,
              spender: spender,
              value: new BN(amount),
            });
          });

          describe('when there was no approved amount before', function () {
            it('approves the requested amount', async function () {
              await this.token.increaseAllowanceInternal(spender, amount, { from: initialHolder });

              expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(new BN(amount));
            });
          });

          describe('when the spender had an approved amount', function () {
            beforeEach(async function () {
              await this.token.approveInternal(initialHolder, spender, amount, { from: initialHolder });
            });

            it('increases the spender allowance adding the requested amount', async function () {
              await this.token.increaseAllowanceInternal(spender, web3.utils.toWei("1"), { from: initialHolder });
              expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(new BN(amount).add(new BN(web3.utils.toWei("1"))));
            });
          });
        });

        describe('when the sender does not have enough balance', function () {
          const amount = initialSupply + web3.utils.toWei("1");

          it('emits an approval event', async function () {
            const receipt = await this.token.increaseAllowanceInternal(spender, amount, { from: initialHolder });

            expectEvent(receipt, 'Approval', {
              owner: initialHolder,
              spender: spender,
              value: new BN(amount),
            });
          });

          describe('when there was no approved amount before', function () {
            it('approves the requested amount', async function () {
              await this.token.increaseAllowanceInternal(spender, amount, { from: initialHolder });

              expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(new BN(amount));
            });
          });

          describe('when the spender had an approved amount', function () {
            beforeEach(async function () {
              await this.token.approveInternal(initialHolder, spender, new BN(web3.utils.toWei("1")), { from: initialHolder });
            });

            it('increases the spender allowance adding the requested amount', async function () {
              await this.token.increaseAllowanceInternal(spender, amount, { from: initialHolder });

              expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal((new BN(amount)).add(new BN(web3.utils.toWei("1"))));
            });
          });
        });
      });

      describe('when the spender is the zero address', function () {
        const spender = ZERO_ADDRESS;

        it('reverts', async function () {
          await expectRevert(
            this.token.increaseAllowance(spender, amount, { from: initialHolder }), 'ERC20: approve to the zero address'
          );
        });
      });
    });

    describe('_mint', function () {
      const amount = new BN(50);
      it('rejects a null account', async function () {
        await expectRevert(
          this.token.mint(ZERO_ADDRESS, amount), 'ERC20: mint to the zero address'
        );
      });

      describe('for a non zero account', function () {
        beforeEach('minting', async function () {
          const {logs} = await this.token.mint(recipient, amount);
          this.logs = logs 
        });

        it('increments totalSupply', async function () {
          const expectedSupply = (new BN(initialSupply)).add(amount);
          expect(await this.token.totalSupply()).to.be.bignumber.equal(expectedSupply);
        });

        it('increments recipient balance', async function () {
          expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(new BN(amount));
        });

        it('emits Transfer event', async function () {
          const event = expectEvent.inLogs(this.logs, 'Transfer', {
            from: ZERO_ADDRESS,
            to: recipient,
          });

          expect(event.args.value).to.be.bignumber.equal(amount);
        });
      });
    });

    describe('_burn', function () {
      it('rejects a null account', async function () {
        await expectRevert(this.token.burn(ZERO_ADDRESS, new BN(web3.utils.toWei("1"))),
          'ERC20: burn from the zero address');
      });

      describe('for a non zero account', function () {
        it('rejects burning more than balance', async function () {
          await expectRevert(this.token.burn(
            initialHolder, (new BN(initialSupply)).add(new BN(web3.utils.toWei("1")))), 'SafeMath: subtraction overflow'
          );
        });

        const describeBurn = function (description, amount) {
          describe(description, function () {
            beforeEach('burning', async function () {
              const {logs} = await this.token.burn(initialHolder, amount);
              this.logs = logs
            });

            it('decrements totalSupply', async function () {
              const expectedSupply = new BN(initialSupply).sub(new BN(amount));
              expect(await this.token.totalSupply()).to.be.bignumber.equal(expectedSupply);
            });

            it('decrements initialHolder balance', async function () {
              const expectedBalance = (new BN (initialSupply)).sub(new BN(amount));
              expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(expectedBalance);
            });

            it('emits Transfer event', async function () {
              const event = expectEvent.inLogs(this.logs, 'Transfer', {
                from: initialHolder,
                to: ZERO_ADDRESS,
              });

              expect(event.args.value).to.be.bignumber.equal(new BN(amount));
            });
          });
        };

        describeBurn('for entire balance', initialSupply);
        describeBurn('for less amount than balance',( new BN(initialSupply).sub(new BN(1))));
      });
    });

    describe('_burnFrom', function () {
      const allowance = new BN(web3.utils.toWei("70"));

      const spender = anotherAccount;

      beforeEach('approving', async function () {
        await this.token.approveInternal(initialHolder, spender, allowance, { from: initialHolder });
      });

      it('rejects a null account', async function () {
        await expectRevert(this.token.burnFrom(ZERO_ADDRESS, new BN(web3.utils.toWei("1"))),
          'ERC20: burn from the zero address'
        );
      });

      describe('for a non zero account', function () {
        it('rejects burning more than allowance', async function () {
          await expectRevert(this.token.burnFrom(initialHolder, allowance.add(new BN(web3.utils.toWei("1")))),
            'SafeMath: subtraction overflow'
          );
        });

        it('rejects burning more than balance', async function () {
          await expectRevert(this.token.burnFrom(initialHolder, (new BN(initialSupply)).add(new BN(web3.utils.toWei("1")))),
            'SafeMath: subtraction overflow'
          );
        });

        const describeBurnFrom = function (description, amount) {
          describe(description, function () {
            beforeEach('burning', async function () {
               const {logs} = await this.token.burnFrom(initialHolder, amount, { from: spender });
               this.logs = logs
            });

            it('decrements totalSupply', async function () {
              const expectedSupply = (new BN(initialSupply)).sub(amount);
              expect(await this.token.totalSupply()).to.be.bignumber.equal(expectedSupply);
            });

            it('decrements initialHolder balance', async function () {
              const expectedBalance = (new BN(initialSupply)).sub(amount);
              expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(expectedBalance);
            });

            it('decrements spender allowance', async function () {
              const expectedAllowance = allowance.sub(amount);
              expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(expectedAllowance);
            });

            it('emits a Transfer event', async function () {
              const event = expectEvent.inLogs(this.logs, 'Transfer', {
                from: initialHolder,
                to: ZERO_ADDRESS,
              });

              expect(event.args.value).to.be.bignumber.equal(amount);
            });

            it('emits an Approval event', async function () {
              expectEvent.inLogs(this.logs, 'Approval', {
                owner: initialHolder,
                spender: spender,
                value: await this.token.allowance(initialHolder, spender),
              });
            });
          });
        };

        describeBurnFrom('for entire allowance', allowance);
        describeBurnFrom('for less amount than allowance', allowance.subn(1));
      });
    });
        
    describe('_transfer', function () {
      shouldBehaveLikeERC20Transfer('ERC20', initialHolder, recipient, initialSupply, function (from, to, amount) {
          return this.token.transferInternal(from, to, amount);
      });

      describe('when the sender is the zero address', function () {
        it('reverts', async function () {
          await expectRevert(this.token.transferInternal(ZERO_ADDRESS, recipient, initialSupply),
            'ERC20: transfer from the zero address'
          );
        });
      });
    }); 

    describe('_approve', function () {
      shouldBehaveLikeERC20Approve('ERC20', initialHolder, recipient, initialSupply, function (owner, spender, amount) {
       return this.token.approveInternal(owner, spender, amount, {from: owner});
      });

      describe('when the owner is the zero address', function () {
        it('reverts', async function () {
          await expectRevert(this.token.approveInternal(ZERO_ADDRESS, recipient, initialSupply),
            'ERC20: approve from the zero address'
          );
        });
      }); 
    });
  })  
});


