const { constants, expectRevert, time, BN } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;

const GoalEscrowTestVersion = artifacts.require('GoalEscrowTestVersion');
const GoalZappTokenSystem = artifacts.require('GoalZappTokenSystem');
const ProxyFactory = artifacts.require('ProxyFactory');
const GoalZappBondingCurve = artifacts.require('GoalZappBondingCurve'); 
const Proxy = artifacts.require('Proxy');

const initialSupply  = new BN(web3.utils.toWei("128")); 
const startPoolBalance = new BN(web3.utils.toWei(".03359789")) 

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
const aionContract = new web3.eth.Contract(aionInterface.abi,"0x91839cBF2D9436F1963f9eEeca7d35d427867a7a")
const escrowInterface = require('./interfaces/GoalEscrowTestVersion.json')
const Aion = require('aiongoalzapptestversion')

contract('Test GoalEscrowTestVersion.sol', async function(accounts) {
  const [master, owner, suggester] = accounts
  
    shouldBehaveLikeGoalEscrow('GoalEscrowTestVersion', master, owner, suggester);
});

function shouldBehaveLikeGoalEscrow (errorPrefix, master, owner, suggester) {
  describe("", function() {
//  aionContract = new web3.eth.Contract(aionInterface.abi,"0x61e9F089BDE5B51882895192F852FA4AbBd29608")

  beforeEach(async function() {
    this.aionContract = aionContract;
    this.tokenSystem = await GoalZappTokenSystem.new();
    await this.tokenSystem.initializeBondingCurve({value: startPoolBalance, from: master});
    await this.tokenSystem.init();  
    await this.tokenSystem.buy({value: web3.utils.toWei("1"), from: owner})
    await this.tokenSystem.buy({value: web3.utils.toWei("1"), from: suggester})
    //this.implementation = await GoalEscrowTestVersion.new();
    //this.factory = await ProxyFactory.new(this.implementation.address, this.tokenSystem.address)    
   })

  it('reverts when deployed with a null token address', async function() {
    this.timeout(25000)
    this.GoalEscrow = await GoalEscrowTestVersion.new() 
    await expectRevert(this.GoalEscrow.initMaster(ZERO_ADDRESS, {from:master}),"token address cannot be zero");
  })

  describe('with token, with proxy', function () {
    describe('Create and Fund Escrow', function() {
      beforeEach(async function () {
		  	//await this.factory.build("Goal1", {from: owner});
				this.proxiedEscrow = await GoalEscrowTestVersion.new();
        this.proxyAddress = this.proxiedEscrow.address
        this.web3ContractProxiedEscrow = new web3.eth.Contract(escrowInterface.abi, this.proxyAddress);  
				await this.proxiedEscrow.initMaster(this.tokenSystem.address, {from: master}); 
			})

      context('when not approved by payer', function () { 

				it('reverts on deposit', async function () {
				await expectRevert(this.proxiedEscrow.newGoalInitAndFund(this.tokenSystem.address, ownerBondDepositAmount, rewardDepositAmount, {from: owner}) ," SafeMath: subtraction overflow");
				});

      });   

      describe('when approved by payer', function () {
				beforeEach(async function () {
					await this.tokenSystem.approve(this.proxiedEscrow.address, MAX_UINT256, { from: owner });
					await this.proxiedEscrow.newGoalInitAndFund(this.tokenSystem.address, ownerBondDepositAmount, rewardDepositAmount, {from: owner});
				});

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


          describe('depositOnSuggest', async function () {
            beforeEach(async function () {
              await this.tokenSystem.approve(this.proxyAddress, MAX_UINT256, {from: suggester});
              this.blockBeforeDepositOnSuggest = await web3.eth.getBlockNumber() 
              this.receipt = await this.proxiedEscrow.depositOnSuggest(id, suggesterBondAmount, {from: suggester, value: web3.utils.toWei("3")}); 
              this._suggestionExpires = (await this.proxiedEscrow.suggestedSteps(id)).suggestionExpires
              this._timeSuggested = (await this.proxiedEscrow.suggestedSteps(id)).timeSuggested
              this._suggestionDuration = await this.proxiedEscrow.suggestionDuration() 
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
              const timeNowEvent = await this.proxiedEscrow.getPastEvents("TimeNow", {fromBlock: this.blockBeforeDepositOnSuggest, toBlock: "latest"})
              let _timeSuggested = (await this.proxiedEscrow.suggestedSteps(id)).timeSuggested
              expect(new BN(timeNowEvent[0].returnValues.blocktime)).to.be.bignumber.equal(_timeSuggested)
            });
            
            it('stores the expiration time', async function() {
              const suggestionExpiresEvent =  await this.proxiedEscrow.getPastEvents("SuggestionExpires", {fromBlock: this.blockBeforeDepositOnSuggest, toBlock: "latest"})
              let _suggestionExpires = (await this.proxiedEscrow.suggestedSteps(id)).suggestionExpires
              expect(new BN(suggestionExpiresEvent[0].returnValues.expires)).to.be.bignumber.equal(_suggestionExpires)
            });

           context('delay test execution to test "schedule token protection"', function() {
             beforeEach(done => setTimeout(done, 20000));

             	it('schedules remove suggester token protection', async function() {
               const events = await aionContract.getPastEvents("ScheduleCallEvent", {fromBlock: this.blockBeforeIncrease, toBlock:"pending"})
               expect(events[0].event).to.equal("ScheduleCallEvent") 
             })
           })
           

          })  // deposit on suggest 

				 describe('returnBondsOnTimeOut()', async function() {
					beforeEach(async function () {
						await this.tokenSystem.approve(this.proxyAddress, MAX_UINT256, {from: suggester});
            this.suggesterBalanceBeforeDeposit = await this.tokenSystem.balanceOf(suggester)
						this.receipt = await this.proxiedEscrow.depositOnSuggest(id, suggesterBondAmount, {from: suggester, value: web3.utils.toWei("3")}); 
            this._suggestionExpires = (await this.proxiedEscrow.suggestedSteps(id)).suggestionExpires
            this._timeSuggested = (await this.proxiedEscrow.suggestedSteps(id)).timeSuggested
            this._suggestionDuration = await this.proxiedEscrow.suggestionDuration() 
            this.blockBeforeIncrease = await web3.eth.getBlockNumber()   
            this._blockBeforeIncrease = await web3.eth.getBlock("pending") 

            this.suggesterBondBeforeIncrease = await this.proxiedEscrow.suggesterBond(id)
            await time.increase((await this.proxiedEscrow.suggestionDuration()).addn(5));

            let blockAfterIncrease = await web3.eth.getBlock("pending") 
						this.timeAfterIncrease = blockAfterIncrease.timestamp 
          })

           context('call suggestionExpires()', async function() {
              beforeEach(async function() {
                this._suggestionExpires = (await this.proxiedEscrow.suggestedSteps(id)).suggestionExpires
                this._timeSuggested = (await this.proxiedEscrow.suggestedSteps(id)).timeSuggested
                this._suggestionDuration = await this.proxiedEscrow.suggestionDuration() 
              })

              it('gets suggestion expiration (block)time', async function() {
                expect(this._suggestionExpires).to.be.bignumber.equal(this._timeSuggested.add(this._suggestionDuration));
              });
           })

           context('call getSuggestionDuration()', async function() {
             it('gets the suggestion duration time', async function() {
               const suggestionDuration = await this.proxiedEscrow.getSuggestionDuration()
               expect(suggestionDuration).to.be.bignumber.equal(await this.proxiedEscrow.suggestionDuration())
             }) 
           }) 

           context('call suggesterBond()', async function() {
             it('returns the suggester bond amount', async function() {		
               expect(this.suggesterBondBeforeIncrease).to.be.bignumber.equal(suggesterBondAmount);
             })
           }) 

           context('delay test execution to test returnBondsOnTimeOut', function() {
             beforeEach(done => setTimeout(done, 20000));

             it('Aion contract calls returnBondsOnTimeOut()', async function() {
               const eventArr = await aionContract.getPastEvents("ExecutedCallEvent", {fromBlock: this.blockBeforeIncrease, toBlock:"pending"}) 
               expect(eventArr[0].event).to.equal("ExecutedCallEvent")
             })
           })


          context('delay test execution to test "transfers bond refund to suggester"', function() {
            beforeEach(done => setTimeout(done, 20000));

            it('transfers bond refund to suggester', async function() {
            let blockAfterIncrease = await web3.eth.getBlock("pending") 
						let timeNow = blockAfterIncrease.timestamp
              const eventArr = await aionContract.getPastEvents("ExecutedCallEvent", {fromBlock: this.blockBeforeIncrease, toBlock:"pending"}) 
              const balanceOfSuggesterAfterReturn = await this.tokenSystem.balanceOf(suggester)
							expect(balanceOfSuggesterAfterReturn).to.be.bignumber.equal(this.suggesterBalanceBeforeDeposit);
					  })				
          })
				}) //return bonds on timeout  w/  depositOnSuggest()


     context('enforces token protection', function() {
       beforeEach(async function()  {
          await this.tokenSystem.approve(this.proxyAddress, MAX_UINT256, {from: suggester});
          this.suggesterBalanceBeforeDeposit = await this.tokenSystem.balanceOf(suggester)
          this.receipt = await this.proxiedEscrow.depositOnSuggest(id, suggesterBondAmount, {from: suggester, value: web3.utils.toWei("3")}); 

          this.ownerBalanceBeforeReturn = await this.tokenSystem.balanceOf(owner)
          this.ownerBalanceBeforeBondReturn = await this.tokenSystem.balanceOf(owner, {from: owner})
          this.suggesterBalanceBeforeDeposit = await this.tokenSystem.balanceOf(suggester)
          await this.proxiedEscrow.disburseOnAccept(id, {from: owner, value: web3.utils.toWei("1")})
          this.suggesterBalanceAfterBondReturn = await this.tokenSystem.balanceOf(suggester)
          this.rewardAmount = await this.proxiedEscrow.rewardAmount()
          this.amountProtectedOwner = await this.tokenSystem.amountProtected(owner)
          this.ownerBondAmount =  await this.proxiedEscrow.ownerBondAmount()
          this.amountProtectedSuggester = await this.tokenSystem.amountProtected(suggester)
      }) 
        

        it('reverts when suggester attempts to transfer tokens under protection', async function() {
          await expectRevert(this.tokenSystem.transfer(owner, this.amountProtectedSuggester, {from: suggester}), "your tokens are under protection period, check timeToLiftProtection() for time until you have tokens available, and/or check amountProtected to see how many of your tokens are currently under the protection period");
        }) 
        it('reverts when owner attempts to transfer tokens under protection', async function () {
          this.amountProtectedOwner = await this.tokenSystem.amountProtected(owner)
          await expectRevert(this.tokenSystem.transfer(suggester, this.amountProtectedOwner, {from: owner}),"your tokens are under protection period, check timeToLiftProtection() for time until you have tokens available, and/or check amountProtected to see how many of your tokens are currently under the protection period");
        }) 


       context('delay test execution to test: schedules token protection removal', function() {
          beforeEach(done => setTimeout(done, 25000));

            it('schedules token protection removal', async function() {
              const _event = await aionContract.getPastEvents("ScheduleCallEvent", {fromBlock: this.blockBeforeDepositOnSuggest, toBlock:"pending"})
              expect(_event[0].event).to.equal("ScheduleCallEvent")
            })

         })
       })

       context('return bonds on reject', function() {
        beforeEach(async function(){ 
          await this.tokenSystem.approve(this.proxyAddress, MAX_UINT256, {from: suggester});
          this.ownerTokenBalanceBeforeDeposit = await this.tokenSystem.balanceOf(owner);	
          this.suggesterBalanceBeforeDeposit = await this.tokenSystem.balanceOf(suggester)
          this.receipt = await this.proxiedEscrow.depositOnSuggest(id, suggesterBondAmount, {from: suggester, value: web3.utils.toWei("3")}); 
          this.ownerBondRefundAmount = (await this.proxiedEscrow.suggestedSteps(id)).ownerBond
          this.suggesterBalanceBeforeReturnBond = await this.tokenSystem.balanceOf(suggester);
          this.ownerTokenBalanceBeforeBondReturn = await this.tokenSystem.balanceOf(owner);	
          this.suggesterBondInEscrow = (await this.proxiedEscrow.suggestedSteps(id)).suggesterBond;
          this.ownerBondAmount = await this.proxiedEscrow.ownerBondAmount()
          await this.proxiedEscrow.returnBondsOnReject(id, {from: owner});
          this.balanceOfOwner = await this.tokenSystem.balanceOf(owner)
        }) 
 
            it('refunds suggester bond', async function() {
              const balanceOfSuggester =  await this.tokenSystem.balanceOf(suggester)
              expect(balanceOfSuggester).to.be.bignumber.equal(this.suggesterBalanceBeforeReturnBond.add(this.suggesterBondInEscrow))
            })

         //   context('delay test execution to test returnBondsOnTimeOut', function() {
          //    beforeEach(done => setTimeout(done, 25000));

            it('returns owner bond to owner', async function() {
              const ownerBalanceAfterReturn = await this.tokenSystem.balanceOf(owner)
              expect(this.balanceOfOwner).to.be.bignumber.equal(this.ownerTokenBalanceBeforeBondReturn.add(this.ownerBondAmount));
            }) 

          //})

/* move or delete 
            it('schedules token protection removal', async function() {
                //const events = await aionContract.getPastEvents("ScheduleCallEvent", {fromBlock: this.blockBeforeDepositOnSuggest, toBlock:"pending"})
                const events = await aionContract.getPastEvents("ScheduleCallEvent", {fromBlock: this.blockBeforeDepositOnSuggest, toBlock:"pending"})
                //const events = await Promise.all([aionContract.getPastEvents("ScheduleCallEvent", {fromBlock: this.blockBeforeDepositOnSuggest, toBlock:"pending"})])
                await expect(events[0].event).to.equal("ScheduleCallEvent")
						})
*/
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
									await expectRevert(this.proxiedEscrow.depositOnSuggest(id, suggesterBondAmount, {value:web3.utils.toWei("3"), from: owner}) ,"GoalOwner Role: GoalOwner CAN NOT call this function")
								})

							})
					 })
						
					 context('notAion role', function() {
						 it('fails when has onlyAionRole', async function() {
								await expectRevert(this.proxiedEscrow.returnBondsOnTimeOut(id), "Aion Role: caller does not have the Aion role") 
						 })

					 })
				 }) 
        
     context('disburse on accept', async function() {
        beforeEach(async function(){ 
          await this.tokenSystem.approve(this.proxyAddress, MAX_UINT256, {from: suggester});
          this.ownerTokenBalanceBeforeDeposit = await this.tokenSystem.balanceOf(owner);	
          this.suggesterBalanceBeforeDeposit = await this.tokenSystem.balanceOf(suggester)
          this.receipt = await this.proxiedEscrow.depositOnSuggest(id, suggesterBondAmount, {from: suggester, value: web3.utils.toWei("3")}); 

          this.ownerBalanceBeforeBondReturn = await this.tokenSystem.balanceOf(owner, {from: owner})
          this.suggesterBalanceBeforeDeposit = await this.tokenSystem.balanceOf(suggester)
          this.blockBeforeDisburse = await web3.eth.getBlockNumber()
          await this.proxiedEscrow.disburseOnAccept(id, {from: owner, value: web3.utils.toWei("1")})
          this.suggesterBalanceAfterBondReturn = await this.tokenSystem.balanceOf(suggester)
          this.amountProtectedSuggester = await this.tokenSystem.amountProtected(suggester)
          this.rewardAmount = await this.proxiedEscrow.rewardAmount()
          this.amountProtectedOwner = await this.tokenSystem.amountProtected(owner)
          this.ownerBondAmount =  await this.proxiedEscrow.ownerBondAmount()
        })

        it('transfers bond to suggester', async function() {
         this.suggesterBalanceAfterBondReturn = await this.tokenSystem.balanceOf(suggester) 
         this.rewardAmount = await this.proxiedEscrow.rewardAmount()
         this.suggesterBondAmount = new BN(web3.utils.toWei("5"));

         expect((this.suggesterBalanceAfterBondReturn.sub(this.suggesterBalanceBeforeDeposit)).sub((this.rewardAmount))).to.be.bignumber.equal(this.suggesterBondAmount)
        })    

        it('pays reward to suggester', async function() {
          const suggesterBalanceAfterBondReturn = this.suggesterBalanceBeforeDeposit.add(suggesterBondAmount)
          const balanceOfSuggester =  await this.tokenSystem.balanceOf(suggester)
          expect(balanceOfSuggester).to.be.bignumber.equal(suggesterBalanceAfterBondReturn.add(this.rewardAmount))
        })    

        it('transfers bond to owner', async function() {
          const balanceOfOwner = await this.tokenSystem.balanceOf(owner)
          await expect(balanceOfOwner).to.be.bignumber.equal(this.ownerBalanceBeforeBondReturn.add(this.ownerBondAmount))	
        })				
     
        it('protects owner tokens', function() {
          expect(new BN(this.amountProtectedOwner)).to.be.bignumber.equal(new BN(this.ownerBondAmount))
        })

        it('protects suggester tokens', function() {
          expect(new BN(this.amountProtectedSuggester)).to.be.bignumber.equal(new BN(suggesterBondAmount.add(this.rewardAmount))); 
        })
      })

			 context('protect tokens', async function() {			 
         beforeEach(async function() {
           await this.tokenSystem.approve(this.proxyAddress, MAX_UINT256, {from: suggester});
           this.suggesterBalanceBeforeDeposit = await this.tokenSystem.balanceOf(suggester)
           this.receipt = await this.proxiedEscrow.depositOnSuggest(id, suggesterBondAmount, {from: suggester, value: web3.utils.toWei("3")}); 
           this.suggesterBalanceAfterDeposit = await this.tokenSystem.balanceOf(suggester)

           this.suggesterAmountProtectedBefore = await this.tokenSystem.amountProtected(suggester)
           this.suggesterStructBalanceBeforeBondReturn = await this.proxiedEscrow.suggestedSteps(id)
           this.suggesterStructBalanceBeforeBondReturn  = this.suggesterStructBalanceBeforeBondReturn.ownerBond
           this.ownerBondFundsBeforeBondReturn = await this.proxiedEscrow.bondFunds()
           this.suggestionDuration = await this.proxiedEscrow.suggestionDuration();
           this.blockBeforeIncrease = await web3.eth.getBlockNumber()
         })
         
          context('before returnBondsOnTimeOut()', function() {
              it('protects suggester tokens', function() {
                   expect(this.suggesterAmountProtectedBefore).to.be.bignumber.equal(suggesterBondAmount);
              })

              it('prevents their transfer', async function() {
                const e = await aionContract.getPastEvents("ExecutedCallEvent", {fromBlock: this.blockBeforeIncrease, toBlock:"pending"})                    
                const suggesterProtectedAmountAfterReturn = await this.tokenSystem.amountProtected(suggester)

                const suggesterBalanceAfterIncrease = await this.tokenSystem.balanceOf(suggester)

                 await expectRevert(this.tokenSystem.transfer(owner, suggesterProtectedAmountAfterReturn, {from: suggester}), "your tokens are under protection period, check timeToLiftProtection() for time until you have tokens available, and/or check amountProtected to see how many of your tokens are currently under the protection period")
              })
            })
          }) 
       }) //'protect tokens'	
      }) //when approved by payer
    })  // create and fund escrow
  }) //with token, with proxy
  //})
}
