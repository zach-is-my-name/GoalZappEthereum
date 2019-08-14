const { BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;
const { advanceTimeAndBlock } = require("./advance_time_and_block.js");
const GoalEscrowTestVersion = artifacts.require('GoalEscrowTestVersion');
const ERC20Mock = artifacts.require('ERC20Mock');

contract('Escrow', function([_, owner, suggester]) {
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  const initialSupply = new BN(100);
  const suggestionDuration = new BN(10);
  const protectionPeriod = new BN(30); 
  it('reverts when deployed with a null token address', async function() {
    await expectRevert.unspecified(GoalEscrowTestVersion.new(ZERO_ADDRESS, suggestionDuration,  {from: owner}));
  })

  context('with token', function () {
    beforeEach(async function() {
      this.token = await ERC20Mock.new(owner, initialSupply, protectionPeriod );
      this.escrow = await GoalEscrowTestVersion.new(this.token.address, suggestionDuration, {from: owner});
    })
    shouldBehaveLikeGoalEscrow('GoalEscrowTestVersion', owner, suggester);
  })

function shouldBehaveLikeGoalEscrow (errorPrefix, owner, suggester) {
  const ownerBondDepositAmount = new BN(10);
  const suggesterBondAmount = new BN(5);
  const rewardDepositAmount = new BN(10); 
  const totalAmountOwnerDeposit = new BN(20); 

  const id = web3.utils.utf8ToHex('cjorlslvv0fcz01119bgpvvmr')
  const two = new BN(2);
  const twoFiveSix = new BN(256);
  const one = new BN(1);
  const MAX_UINT256 = (two.pow(twoFiveSix)).isub(one); 
//  new BN((2).pow(256)).isub(1);
  it('stores the token\'s address', async function () {
    const address = await this.escrow.token();
    expect(address).to.be.equal(this.token.address);
  });


  describe('Fund Escrow', function() {
    context('when not approved by payer', function () {
      it('reverts on deposit', async function () {
	await expectRevert.unspecified(
	  this.escrow.fundEscrow(ownerBondDepositAmount, rewardDepositAmount, { from: owner }),
	);
      });
    });

    context('when approved by payer', function () {
      beforeEach(async function () {
	this.token.approve(this.escrow.address, MAX_UINT256, { from: owner });
      });

      it('deposits bond and reward to contract', async function() {
	await this.escrow.fundEscrow(ownerBondDepositAmount, rewardDepositAmount, {from: owner});
	expect(await this.token.balanceOf(this.escrow.address)).to.be.bignumber.equal(totalAmountOwnerDeposit);
      });
      it('adds to contract bondFunds', async function() {
	await this.escrow.fundEscrow(ownerBondDepositAmount, rewardDepositAmount, {from: owner});
	expect(await this.escrow.bondFunds()).to.be.bignumber.equal(ownerBondDepositAmount);
      });
      it('adds to contract rewardFunds', async function() {
	await this.escrow.fundEscrow(ownerBondDepositAmount, rewardDepositAmount, {from: owner});
	expect(await this.escrow.rewardFunds()).to.be.bignumber.equal(rewardDepositAmount)
	});
    });
  });

  describe('depositOnSuggestTestVersion', function () {
    beforeEach(async function () {
      await this.token.approve(this.escrow.address, MAX_UINT256, { from: owner });
      await this.token.approve(this.escrow.address, MAX_UINT256, {from: suggester});
      await this.token.transferInternal(owner, suggester, 50, {from: owner}); 
      await this.escrow.fundEscrow(ownerBondDepositAmount, rewardDepositAmount, {from: owner});
    });

    it('deposits suggester bond amount', async function() {
      await this.escrow.depositOnSuggestTestVersion(id, suggesterBondAmount, this.escrow.address, {from: suggester}); 
      expect(await this.token.balanceOf(this.escrow.address)).to.be.bignumber.equal(totalAmountOwnerDeposit.add(suggesterBondAmount));
    })
    it('adds to suggesterBond', async function() {
      await this.escrow.depositOnSuggestTestVersion(id, suggesterBondAmount, this.escrow.address, {from: suggester}); 
      let _suggesterBond = (await this.escrow.suggestedSteps(id)).suggesterBond;
      expect(_suggesterBond).to.be.bignumber.equal(suggesterBondAmount);
    })
    it('subtracts owner bond from bondFunds', async function() {
      await this.escrow.depositOnSuggestTestVersion(id, suggesterBondAmount, this.escrow.address, {from: suggester}); 
      expect(await this.escrow.bondFunds()).to.be.bignumber.equal(ownerBondDepositAmount.isub(await this.escrow.ownerBondAmount()));
    })
    it('adds ownerBondAmount to Suggester struct member ownerBond', async function() { 
      await this.escrow.depositOnSuggestTestVersion(id, suggesterBondAmount, this.escrow.address, {from: suggester}); 
      let _ownerBond = (await this.escrow.suggestedSteps(id)).ownerBond;
      expect(_ownerBond).to.be.bignumber.equal(await this.escrow.ownerBondAmount())
    })

    context('set suggestion timeout', function() {
      it('stores the current time in the Suggester struct', async function() {
        const {logs} = await this.escrow.depositOnSuggestTestVersion(id, suggesterBondAmount, this.escrow.address, {from: suggester});
        let _timeSuggested = (await this.escrow.suggestedSteps(id)).timeSuggested
	expectEvent.inLogs(logs, 'TimeNow', {blocktime: _timeSuggested});      
      });
      
      it('stores the expiration time in the Suggester struct', async function() {
        const {logs} = await this.escrow.depositOnSuggestTestVersion(id, suggesterBondAmount, this.escrow.address, {from: suggester});
        let _suggestionExpires = (await this.escrow.suggestedSteps(id)).suggestionExpires
	expectEvent.inLogs(logs, 'SuggestionExpires', {expires: _suggestionExpires});      
      });
    
  })
  }) 
  // ** non-trivial see: https://medium.com/fluidity/standing-the-time-of-test-b906fcc374a9
   describe('returnBondsOnTimeOut()', function() {
    beforeEach(async function(){ 
      await this.token.approve(this.escrow.address, MAX_UINT256, { from: owner });
      await this.token.approve(this.escrow.address, MAX_UINT256, {from: suggester});
      await this.token.transferInternal(owner, suggester, 50, {from: owner}); 
      await this.escrow.fundEscrow(ownerBondDepositAmount, rewardDepositAmount, {from: owner});
      await this.escrow.depositOnSuggestTestVersion(id, suggesterBondAmount, this.escrow.address, {from: suggester}); 
    })
     it('transfers bond refund to suggester', async function() {
      let suggesterBalanceBeforeBondReturn = await this.token.balanceOf(suggester)
// advance blockchain here
    await  advanceTimeAndBlock((await this.escrow.suggestionDuration()).add(new BN (1)));
      await this.escrow.returnBondsOnTimeOut(id); 
      expect(await this.token.balanceOf(suggester)).to.be.bignumber.equal(suggesterBalanceBeforeBondReturn.add(suggesterBondAmount));
     }) 	    
     it('protects tokens', async function() {
    await  advanceTimeAndBlock((await this.escrow.suggestionDuration()).add(new BN(1)));
      await this.escrow.returnBondsOnTimeOut(id);
      expect(await this.token.amountProtected(suggester)).to.be.bignumber.equal(suggesterBondAmount);
     })
     it('prevents transfer of protected tokens', async function() {
      await expectRevert.unspecified(this.token.transfer(owner, 50, {from: suggester}))
     })
   })

   describe('call getSuggestionDuration()', function() {
    beforeEach(async function(){ 
      await this.token.approve(this.escrow.address, MAX_UINT256, { from: owner });
      await this.token.approve(this.escrow.address, MAX_UINT256, {from: suggester});
      await this.token.transferInternal(owner, suggester, 50, {from: owner}); 
      await this.escrow.fundEscrow(ownerBondDepositAmount, rewardDepositAmount, {from: owner});
      await this.escrow.depositOnSuggestTestVersion(id, suggesterBondAmount, this.escrow.address, {from: suggester}); 
    })
    it('gets the suggestion duration time', async function() {
    expect(await this.escrow.getSuggestionDuration()).to.be.bignumber.equal(await this.escrow.suggestionDuration())
    }) //replace to.be.equal --> to.be.bignumber.equal
   })
    describe('call suggestionExpires()', function() {
      beforeEach(async function(){ 
	await this.token.approve(this.escrow.address, MAX_UINT256, { from: owner });
	await this.token.approve(this.escrow.address, MAX_UINT256, {from: suggester});
	await this.token.transferInternal(owner, suggester, 50, {from: owner}); 
	await this.escrow.fundEscrow(ownerBondDepositAmount, rewardDepositAmount, {from: owner});
	await this.escrow.depositOnSuggestTestVersion(id, suggesterBondAmount, this.escrow.address, {from: suggester}); 
      })
      it('gets suggestion expiration (block)time', async function() {
        let _suggestionExpires = (await this.escrow.suggestedSteps(id)).suggestionExpires
        let _timeSuggested = (await this.escrow.suggestedSteps(id)).timeSuggested;
        expect(_suggestionExpires).to.be.bignumber.equal(_timeSuggested.add(await this.escrow.suggestionDuration()));
        });
      })
    describe('call suggesterBond()', function() {
      beforeEach(async function(){ 
	await this.token.approve(this.escrow.address, MAX_UINT256, { from: owner });
	await this.token.approve(this.escrow.address, MAX_UINT256, {from: suggester});
	await this.token.transferInternal(owner, suggester, 50, {from: owner}); 
	await this.escrow.fundEscrow(ownerBondDepositAmount, rewardDepositAmount, {from: owner});
	await this.escrow.depositOnSuggestTestVersion(id, suggesterBondAmount, this.escrow.address, {from: suggester}); 
      })
      it('returns the suggester bond amount', async function() {	  
	expect(await this.escrow.suggesterBond(id)).to.be.bignumber.equal(suggesterBondAmount);
	})
    }) 

   describe('disburse on accept', function() {
      beforeEach(async function(){ 
	await this.token.approve(this.escrow.address, MAX_UINT256, { from: owner });
	await this.token.approve(this.escrow.address, MAX_UINT256, {from: suggester});
	await this.token.transferInternal(owner, suggester, 50, {from: owner}); 
	await this.escrow.fundEscrow(ownerBondDepositAmount, rewardDepositAmount, {from: owner});
	await this.escrow.depositOnSuggestTestVersion(id, suggesterBondAmount, this.escrow.address, {from: suggester}); 
      })
      it('transfers bond to suggester', async function() {
	let suggesterBalanceBeforeBondReturn = await this.token.balanceOf(suggester)
	await this.escrow.disburseOnAccept(id, {from: owner});
	expect((await this.token.balanceOf(suggester)).isub(await this.escrow.rewardAmount())).to.be.bignumber.equal(suggesterBalanceBeforeBondReturn.add(suggesterBondAmount));
	})    
      it('pays reward to suggester', async function() {
	let suggesterBalanceBeforeBondReturn = await this.token.balanceOf(suggester)
        let suggesterBalanceAfterBondReturn = suggesterBalanceBeforeBondReturn.iadd(suggesterBondAmount)
	await this.escrow.disburseOnAccept(id, {from: owner});
	expect(await this.token.balanceOf(suggester)).to.be.bignumber.equal(suggesterBalanceAfterBondReturn.iadd(await this.escrow.rewardAmount()));
      })    
      it('transfers bond to owner', async function() {
	let ownerBalanceBeforeBondReturn = await this.token.balanceOf(owner, {from: owner}); 
	await this.escrow.disburseOnAccept(id, {from: owner});
        expect(await this.token.balanceOf(owner)).to.be.bignumber.equal(ownerBalanceBeforeBondReturn.iadd(await this.escrow.ownerBondAmount())); 	
      })	      
      it('protects suggester tokens', async function() {
	let suggesterBalanceBeforeReturn = await this.token.balanceOf(suggester);
	await this.escrow.disburseOnAccept(id, {from: owner});
        expect(await this.token.balanceOf(suggester)).to.be.bignumber.equal(suggesterBalanceBeforeReturn.iadd(suggesterBondAmount).iadd(await this.escrow.rewardAmount())); // before return 45 after 60
	await expectRevert.unspecified(this.token.transfer(owner, 60, {from: suggester}));
      })
      it('protects owner tokens', async function() {
	let ownerBalanceBeforeReturn = await this.token.balanceOf(owner);
	await this.escrow.disburseOnAccept(id, {from: owner});
        expect(await this.token.balanceOf(owner)).to.be.bignumber.equal(ownerBalanceBeforeReturn.iadd(await this.escrow.rewardAmount())); // before return 30 after 40   
	await expectRevert.unspecified(this.token.transfer(suggester, 40, {from: owner}));
      })
   }) 
   describe('return bonds on reject', function() {
    beforeEach(async function(){ 
      await this.token.approve(this.escrow.address, MAX_UINT256, { from: owner });
      await this.token.approve(this.escrow.address, MAX_UINT256, {from: suggester});
      await this.token.transferInternal(owner, suggester, 50, {from: owner}); 
      await this.escrow.fundEscrow(ownerBondDepositAmount, rewardDepositAmount, {from: owner});
      await this.escrow.depositOnSuggestTestVersion(id, suggesterBondAmount, this.escrow.address, {from: suggester}); 
    })
      it('refunds suggester bond', async function() {
	let suggesterBalanceBeforeReturnBond = await this.token.balanceOf(suggester);
	await this.escrow.returnBondsOnReject(id, {from: owner});
	expect(await this.token.balanceOf(suggester)).to.be.bignumber.equal(suggesterBalanceBeforeReturnBond.add(suggesterBondAmount))
      })
      it('returns owner bond to bondFunds', async function() {
	let bondFundsBeforeReturnBond = await this.escrow.bondFunds();
	await this.escrow.returnBondsOnReject(id, {from: owner});
	expect(await this.escrow.bondFunds()).to.be.bignumber.equal(bondFundsBeforeReturnBond.add(await this.escrow.ownerBondAmount()));
      }) 
})
}
})
