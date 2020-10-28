const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;

const GoalEscrowTestVersion = artifacts.require('GoalEscrowTestVersion');
const GoalZappTokenSystem = artifacts.require('GoalZappTokenSystem');
const ProxyFactory = artifacts.require('ProxyFactory');
const GoalZappBondingCurve = artifacts.require('GoalZappBondingCurve'); 
const Proxy = artifacts.require('Proxy');

const initialSupply  = new BN(web3.utils.toWei("128")); 
const startPoolBalance = new BN(web3.utils.toWei(".03359789")) 
const suggestionDuration = new BN(10);
const protectionPeriod = new BN(30); 

const ownerBondDepositAmount = new BN(web3.utils.toWei("10"));
const suggesterBondAmount = new BN(web3.utils.toWei("5"));
const rewardDepositAmount = new BN(web3.utils.toWei("10")); 
const totalAmountOwnerDeposit = new BN(web3.utils.toWei("20")); 

const id = web3.utils.utf8ToHex('cjorlslvv0fcz01119bgpvvmr')

const two = new BN(2);
const twoFiveSix = new BN(256);
const one = new BN(1);
const MAX_UINT256 = (two.pow(twoFiveSix)).isub(one); 
const aionInterface = require('./interfaces/aionInterface.json') 
const escrowInterface = require('./interfaces/GoalEscrowTestVersion.json')
const aionContract = new web3.eth.Contract(aionInterface.abi, "0xAB046F7cc64DCDfDAE5aF718Ff412B023C852E9E")
const Aion = require('aiongoalzapptestversion')

contract('Escrow', function([master, owner, suggester]) {
  beforeEach(async function() {
    this.tokenSystem = await GoalZappTokenSystem.new();
    await this.tokenSystem.initialize({value: startPoolBalance, from: master});
    await this.tokenSystem.init();  
    await this.tokenSystem.buy({value: web3.utils.toWei("1"), from: owner})
    await this.tokenSystem.buy({value: web3.utils.toWei("1"), from: suggester})
    this.implementation = await GoalEscrowTestVersion.new();
    this.factory = await ProxyFactory.new(this.implementation.address, this.tokenSystem.address)    
   })

    shouldBehaveLikeGoalEscrow('GoalEscrowTestVersion', master, owner, suggester);

  });

function shouldBehaveLikeGoalEscrow (errorPrefix, master, owner, suggester) {

  it('reverts when deployed with a null token address', async function() {
    this.GoalEscrow = await GoalEscrowTestVersion.new() 
    await expectRevert(this.GoalEscrow.initMaster(ZERO_ADDRESS, 30, {from:master}),"token address cannot be zero");
  })

  describe('with token, with proxy', function () {
    describe('Create and Fund Escrow', function() {
      beforeEach(async function () {
		  	await this.factory.build("Goal1", {from: owner});
        this.proxyAddress = await this.factory.getProxyAddress("Goal1", owner, {from:owner}); 
				this.proxiedEscrow = await GoalEscrowTestVersion.at(this.proxyAddress);
        this.web3ContractProxiedEscrow = new web3.eth.Contract(escrowInterface.abi, this.proxyAddress);  
				await this.proxiedEscrow.initMaster(this.tokenSystem.address, 30, {from: master}); 
			})
      context('when not approved by payer', function () { 
				it('reverts on deposit', async function () {
				await expectRevert(this.proxiedEscrow.newGoalInitAndFund(this.tokenSystem.address, 30, ownerBondDepositAmount, rewardDepositAmount, {from: owner}) ," SafeMath: subtraction overflow");
				});
      });   

      describe('when approved by payer', function () {
				beforeEach(async function () {
					await this.tokenSystem.approve(this.proxiedEscrow.address, MAX_UINT256, { from: owner });
					await this.proxiedEscrow.newGoalInitAndFund(this.tokenSystem.address, 30, ownerBondDepositAmount, rewardDepositAmount, {from: owner});
				});
/*
				it('stores the token\'s address', async function () {
					const address = await this.proxiedEscrow.token();
					expect(address).to.be.equal(this.tokenSystem.address);
				});

				it('deposits bond and reward to contract', async function() {
					expect(await this.tokenSystem.balanceOf(this.proxiedEscrow.address)).to.be.bignumber.equal(totalAmountOwnerDeposit);
				});

				it('adds to contract bondFunds', async function() {
					expect(await this.proxiedEscrow.bondFunds()).to.be.bignumber.equal(ownerBondDepositAmount);
				});

				it('adds to contract rewardFunds', async function() {
					expect(await this.proxiedEscrow.rewardFunds()).to.be.bignumber.equal(rewardDepositAmount)
					});
*/
				describe('depositOnSuggest', function () {
					beforeEach(async function () {
						await this.tokenSystem.approve(this.proxyAddress, MAX_UINT256, {from: suggester});
						 this.receipt = await this.proxiedEscrow.depositOnSuggest(id, suggesterBondAmount, {from: suggester, value: web3.utils.toWei("1")}); 
             //console.log("receipt", this.receipt)
             this.logs = this.receipt.logs  
					});

					it('deposits suggester bond amount', async function() {
						expect(await this.tokenSystem.balanceOf(this.proxiedEscrow.address)).to.be.bignumber.equal(totalAmountOwnerDeposit.add(suggesterBondAmount));
					})
					it('adds to suggesterBond', async function() {
						let _suggesterBond = (await this.proxiedEscrow.suggestedSteps(id)).suggesterBond;
						expect(_suggesterBond).to.be.bignumber.equal(suggesterBondAmount);
					})
					it('subtracts owner bond from bondFunds', async function() {
						expect(await this.proxiedEscrow.bondFunds()).to.be.bignumber.equal(ownerBondDepositAmount.isub(await this.proxiedEscrow.ownerBondAmount()));
					})
					it('adds ownerBondAmount to Suggester struct member ownerBond', async function() { 
						let _ownerBond = (await this.proxiedEscrow.suggestedSteps(id)).ownerBond;
						expect(_ownerBond).to.be.bignumber.equal(await this.proxiedEscrow.ownerBondAmount())
					})

          it('stores the time step suggested', async function() {
            const timeNowEvent = await this.web3ContractProxiedEscrow.getPastEvents("TimeNow", {fromBlock: 0, toBlock: "latest"})
            console.log('returnVals',timeNowEvent[0].returnValues)
            let _timeSuggested = (await this.proxiedEscrow.suggestedSteps(id)).timeSuggested
            expect(new BN(timeNowEvent[0].returnValues.blocktime)).to.be.bignumber.equal(_timeSuggested)
          });
          
          it('stores the expiration time', async function() {
            const suggestionExpiresEvent =  await this.web3ContractProxiedEscrow.getPastEvents("SuggestionExpires", {fromBlock: 0, toBlock: "latest"})
            let _suggestionExpires = (await this.proxiedEscrow.suggestedSteps(id)).suggestionExpires
            expect(new BN(suggestionExpiresEvent[0].returnValues.expires)).to.be.bignumber.equal(_suggestionExpires)
          });

				 context('returnBondsOnTimeOut()', function() {
  			 	before('advance time and block', async function() {
				    this.suggesterBalanceBeforeBondReturn = await this.tokenSystem.balanceOf(suggester)
            await time.increase(new BN ("31"));
            await time.advanceBlock()  
            this.balanceOfSuggesterAfter = await this.tokenSystem.balanceOf(suggester)
          })

						it('Aion contract calls returnBondsOnTimeOut()', function(done) {
              setTimeout(function() {
                aionContract.getPastEvents("ExecutedCallEvent", {fromBlock: "latest", toBlock:"pending"})/*.then(eventArr => console.log("exEvent",eventArr))*/.then(
                  eventArr =>  expectEvent(eventArr[0] /*executedCallEvents[0]*/, 'ExecutedCallEvent', {}))
                  done()
                 }, 15000 )
						})

				    /*it('schedules remove suggester token protection', function(done) {
              setTimeout(function() {
               
                aionContract.getPastEvents("ScheduleCallEvent", {fromBlock: 0, toBlock:"pending"}).then(eventArr => console.log('schEventArr', eventArr)) 
.then(
                  eventArr =>  expectEvent(eventArr[0] executedCallEvents[0], 'ScheduleCallEvent', {}) )
                  done()
                 }, 5000 )
						})*/

            it('transfers bond refund to suggester', function() {
							 expect(this.balanceOfSuggesterAfter).to.be.bignumber.equal(this.suggesterBalanceBeforeBondReturn.add(suggesterBondAmount));
					 })				
				}) 

			 context('protect tokens', function() {			 
         before('advance time and block', async function() {
           this.suggesterAmountProtectedBefore = await this.tokenSystem.amountProtected(suggester)
            this.suggesterStructBalanceBeforeBondReturn =  (await this.proxiedEscrow.suggestedSteps(id)).ownerBond				 
						this.ownerBondFundsBeforeBondReturn = await this.proxiedEscrow.bondFunds() 
						await time.increase((await this.proxiedEscrow.suggestionDuration()).add(new BN(1)));
						this.ownerBondFundsAftereBondReturn = await this.proxiedEscrow.bondFunds() 
         
         })
					it('protects suggester tokens and prevents their transfer', async function() {
						expect(this.suggesterAmountProtectedBefore).to.be.bignumber.equal(suggesterBondAmount);

							 //console.log('amount protected', amountProtected.toString());
						await expectRevert.unspecified(this.tokenSystem.transfer(owner, this.suggesterAmountProtectedBefore, {from: suggester}))
				 })

					it('owner bond returns to bond funds but remains in contract', async function() {
           expect(this.ownerBondFundsAfterBondReturn).to.be.bignumber.equal(
           this.suggesterStructBalanceBeforeBondReturn.add(this.ownerBondFundsBeforeBondReturn))
          })   
			})	

       context('call getSuggestionDuration()', function() {
        it('gets the suggestion duration time', async function() {
         expect(await this.proxiedEscrow.getSuggestionDuration()).to.be.bignumber.equal(await this.proxiedEscrow.suggestionDuration())
        }) 
       })

      context('call suggestionExpires()', function() {
        it('gets suggestion expiration (block)time', async function() {
          let _suggestionExpires = (await this.proxiedEscrow.suggestedSteps(id)).suggestionExpires
          let _timeSuggested = (await this.proxiedEscrow.suggestedSteps(id)).timeSuggested;
          expect(_suggestionExpires).to.be.bignumber.equal(_timeSuggested.add(await this.proxiedEscrow.suggestionDuration()));
        });
      })

      context('call suggesterBond()', function() {
        it('returns the suggester bond amount', async function() {		
          expect(await this.proxiedEscrow.suggesterBond(id)).to.be.bignumber.equal(suggesterBondAmount);
          })
      }) 

     context('disburse on accept', function() {
        beforeEach(async function(){ 
          this.ownerBalanceBeforeReturn = await this.tokenSystem.balanceOf(owner);
          this.ownerBalanceBeforeBondReturn = await this.tokenSystem.balanceOf(owner, {from: owner}); 
          this.suggesterBalanceBeforeBondReturn = await this.tokenSystem.balanceOf(suggester)
                 
          const {logs} = await this.proxiedEscrow.disburseOnAccept(id, {from: owner});
          this.logs = logs
          this.suggesterBalanceAfterBondReturn = await this.tokenSystem.balanceOf(suggester)
        })

        it('transfers bond to suggester', async function() {
                expect((this.suggesterBalanceAfterBondReturn.sub(this.suggesterBalanceBeforeBondReturn)).sub((await this.proxiedEscrow.rewardAmount()))).to.be.bignumber.equal(suggesterBondAmount)
          })    
        it('pays reward to suggester', async function() {
          let suggesterBalanceAfterBondReturn = this.suggesterBalanceBeforeBondReturn.iadd(suggesterBondAmount)
          expect(await this.tokenSystem.balanceOf(suggester)).to.be.bignumber.equal(suggesterBalanceAfterBondReturn.iadd(await this.proxiedEscrow.rewardAmount()));
        })    
        it('transfers bond to owner', async function() {
          expect(await this.tokenSystem.balanceOf(owner)).to.be.bignumber.equal(this.ownerBalanceBeforeBondReturn.iadd(await this.proxiedEscrow.ownerBondAmount()));	
        })				
        it('protects suggester tokens', async function() {
                let rewardAmount = await this.proxiedEscrow.rewardAmount();
          //console.log('reward amount ', rewardAmount.toString());
          let amountProtected = await this.tokenSystem.amountProtected(suggester)  
                //console.log('amount protected', amountProtected.toString()); 
         // console.log('suggester bond amount', suggesterBondAmount.toString());
                expect(amountProtected).to.be.bignumber.equal(suggesterBondAmount.add(rewardAmount)); 
        })
        it('reverts when suggester attempts to transfer tokens under protection', async function() {
          let amountProtected = await this.tokenSystem.amountProtected(suggester)  
          console.log('amount protected', web3.utils.fromWei(amountProtected.toString())); 
          console.log('amount to transfer', 60) 
          await expectRevert(this.tokenSystem.transfer(owner, amountProtected, {from: suggester}), "your tokens are under protection period, check timeToLiftProtection() for time until you have tokens available, and/or check amountProtected to see how many of your tokens are currently under the protection period") ;
        }) 
        it('protects owner tokens', async function() {
          expect(await this.tokenSystem.amountProtected(owner)).to.be.bignumber.equal(await this.proxiedEscrow.ownerBondAmount())
        })
        it('reverts when owner attempts to transfer tokens under protection', async function () {
          await expectRevert.unspecified(this.tokenSystem.transfer(suggester, await this.proxiedEscrow.ownerBondAmount(), {from: owner}));
        }) 
        it('schedules token protection removal', function(done) {
              setTimeout(function() {
                aionContract.getPastEvents("ScheduleCallEvent", {fromBlock: "latest", toBlock:"pending"}).then(eventArr => console.log(eventArr)).then(
                eventArr =>  expectEvent(eventArr[0] /*executedCallEvents[0]*/, "ScheduleCallEvent", {}))
                  done()
                 }, 15000 )
        })
       })  

				 context('return bonds on reject', function() {
					beforeEach(async function(){ 
						this.suggesterBalanceBeforeReturnBond = await this.tokenSystem.balanceOf(suggester);
						this.ownerTokenBalanceBeforeBondReturn = await this.tokenSystem.balanceOf(owner);	
						this.suggesterBondInEscrow = (await this.proxiedEscrow.suggestedSteps(id)).suggesterBond;
						this.ownerBondAmount = await this.proxiedEscrow.ownerBondAmount()
					}) 

						it('refunds suggester bond', async function() {
							await this.proxiedEscrow.returnBondsOnReject(id, {from: owner});
							expect(await this.tokenSystem.balanceOf(suggester)).to.be.bignumber.equal(this.suggesterBalanceBeforeReturnBond.add(this.suggesterBondInEscrow))
						})
						it('returns owner bond to owner', async function() {
						  //  console.log('ownerBondAmount', this.ownerBondAmount.toString())
						  // console.log('ownerTokenBalanceBeforeBondReturn', this.ownerTokenBalanceBeforeBondReturn.toString())
							
							await this.proxiedEscrow.returnBondsOnReject(id, {from: owner});

							const ownerBalanceAfterReturn = await this.tokenSystem.balanceOf(owner)
							const ownerBondAmountAfterReturn = await this.proxiedEscrow.ownerBondAmount()
							
						 // console.log('ownerBondAmountAfterReturn', ownerBondAmountAfterReturn.toString())
							//console.log('ownerBalanceAfterReturn', ownerBalanceAfterReturn.toString()) 
							expect(await this.tokenSystem.balanceOf(owner)).to.be.bignumber.equal(this.ownerTokenBalanceBeforeBondReturn.add(this.ownerBondAmount));
						}) 
            it('schedules token protection removal', async function() {
              this.timeout(8000)
							const {logs} = await this.proxiedEscrow.returnBondsOnReject(id, {from: owner});
							expectEvent(this.logs, 'ScheduleCallEvent', {})			  
              setTimeout(function() {
                aionContract.getPastEvents("ScheduleCallEvent", {fromBlock: "latest", toBlock:"pending"}).then(eventArr => console.log(eventArr)).then(
                eventArr =>  expectEvent(eventArr[0] /*executedCallEvents[0]*/, "ScheduleCallEvent", {}))
              //    done()
                 }, 8000 )
						})
				 })
		 })

				 context('permissions', function() {
						context('onlyGoalOwner role', function() {
							context('fund escrow', function () {
					it('fails when not goal owner role', async function() {
						await expectRevert(this.proxiedEscrow.fundEscrow(ownerBondDepositAmount , rewardDepositAmount , {from: suggester}), "GoalOwner Role: caller does not have the GoalOwner role")
					})
							})
						})

					 context('notGoalOwner role', function() {
							context('deposit on suggest', function() {
								it('fails when has onlyGoalOwnerRole', async function() {
									await expectRevert(this.proxiedEscrow.depositOnSuggest(id, suggesterBondAmount, {from: owner}),"GoalOwner Role: GoalOwner CAN NOT call this function")
								})
							})
					 })
						
					 context('notAion role', function() {
						 it('fails when has onlyAionRole', async function() {
								await expectRevert(this.proxiedEscrow.returnBondsOnTimeOut(this.id),"Aion Role: caller does not have the Aion role") 
						 })
					 })
				 }) 
     })
   })
 })
}
