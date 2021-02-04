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
const escrowInterface = require('./interfaces/GoalEscrowTestVersion.json')
const aionContract = new web3.eth.Contract(aionInterface.abi,"0x4C26ed597F71eb658741AaFc982ecbd2e8B003Fb")
const Aion = require('aiongoalzapptestversion')

contract('Escrow', async function(accounts) {
  const [master, owner, suggester] = accounts
  
    shouldBehaveLikeGoalEscrow('GoalEscrowTestVersion', master, owner, suggester);
});

function shouldBehaveLikeGoalEscrow (errorPrefix, master, owner, suggester) {
  describe("", function() {
  beforeEach(async function() {
    this.tokenSystem = await GoalZappTokenSystem.new();
    await this.tokenSystem.initialize({value: startPoolBalance, from: master});
    await this.tokenSystem.init();  
    await this.tokenSystem.buy({value: web3.utils.toWei("1"), from: owner})
    await this.tokenSystem.buy({value: web3.utils.toWei("1"), from: suggester})
    this.implementation = await GoalEscrowTestVersion.new();
    this.factory = await ProxyFactory.new(this.implementation.address, this.tokenSystem.address)    
   })

  it('reverts when deployed with a null token address', async function() {
    this.timeout(25000)
    this.GoalEscrow = await GoalEscrowTestVersion.new() 
    await expectRevert(this.GoalEscrow.initMaster(ZERO_ADDRESS{from:master}, {from:master}),"token address cannot be zero");
  })

  describe('with token, with proxy', function () {
    describe('Create and Fund Escrow', function() {
      beforeEach(async function () {
		  	await this.factory.build("Goal1", {from: owner});
        this.proxyAddress = await this.factory.getProxyAddress("Goal1", owner, {from:owner}); 
				this.proxiedEscrow = await GoalEscrowTestVersion.at(this.proxyAddress);
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
						this.receipt = await this.proxiedEscrow.depositOnSuggest(id, suggesterBondAmount, {from: suggester, value: web3.utils.toWei("1")}); 
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

      })  // deposit on suggest 

				 context('returnBondsOnTimeOut()', async function() {
					beforeEach(async function () {
						await this.tokenSystem.approve(this.proxyAddress, MAX_UINT256, {from: suggester});
            this.suggesterBalanceBeforeDeposit = await this.tokenSystem.balanceOf(suggester)
						this.receipt = await this.proxiedEscrow.depositOnSuggest(id, suggesterBondAmount, {from: suggester, value: web3.utils.toWei("1")}); 
            this.suggesterBalanceBeforeBondReturn = await this.tokenSystem.balanceOf(suggester)
            console.log("address (this)", this.proxiedEscrow.address)

            this._suggestionExpires = (await this.proxiedEscrow.suggestedSteps(id)).suggestionExpires
            this._timeSuggested = (await this.proxiedEscrow.suggestedSteps(id)).timeSuggested
            this._suggestionDuration = await this.proxiedEscrow.suggestionDuration() 
            console.log("suggestion duration", this._suggestionDuration.toString()) 
            console.log("time suggested", this._timeSuggested.toString())
            console.log("suggestion expires", this._suggestionExpires.toString())
            console.log("block before increase", blockBeforeIncrease.number) 
            console.log("blockTime before increase", blockBeforeIncrease.timestamp)

            this. blockBeforeIncrease = await web3.eth.getBlockNumber()   
            let blockBeforeIncrease = await web3.eth.getBlock("pending") 

            await time.increase(await this.proxiedEscrow.suggestionDuration());

            let blockAfterIncrease = await web3.eth.getBlock("pending") 
            //console.log("block after increase", blockAfterIncrease.number)
            //console.log("blockTime after increase", blockAfterIncrease.timestamp)
          })
          


          context('delay test execution to test returnBondsOnTimeOut', function() {
            beforeEach(done => setTimeout(done, 25000));

						it('Aion contract calls returnBondsOnTimeOut()', async function() {
               const balanceOfSuggesterAfter = await this.tokenSystem.balanceOf(suggester)
               const equals = (this.suggesterBalanceBeforeBondReturn.add(suggesterBondAmount))
               console.log(`balanceOfSuggesterAfter ${web3.utils.fromWei(balanceOfSuggesterAfter)} equals ${web3.utils.fromWei(equals)}`)

             const eventArr = await aionContract.getPastEvents("ExecutedCallEvent", {fromBlock: this.blockBeforeIncrease, toBlock:"pending"}) 

             console.log("Aion contract calls returnsBondsOnTimeOut()", eventArr)
                expect(eventArr[0].event).to.equal("ExecutedCallEvent")
						 })

          })

          context('delay test execution to test: "returnBondsOnTimeOut"', function() {
            beforeEach(done => setTimeout(done, 15000));

				    it('schedules remove suggester token protection', async function() {
               const balanceOfSuggesterAfter = await this.tokenSystem.balanceOf(suggester)
               const equals = (this.suggesterBalanceBeforeBondReturn.add(suggesterBondAmount))
               console.log(`balanceOfSuggesterAfter ${web3.utils.fromWei(balanceOfSuggesterAfter)} equals ${web3.utils.fromWei(equals)}`)
                const events = await aionContract.getPastEvents("ScheduleCallEvent", {fromBlock: this.blockBeforeIncrease, toBlock:"pending"})
                console.log("events", events)
                expect(events[0].event).to.equal("ScheduleCallEvent") 
						 })

          })

          context('delay test execution to test: "transfers bond refund to suggester"', function() {
            beforeEach(done => setTimeout(done, 25000));

            it('transfers bond refund to suggester', async function() {
              console.log("balance before deposit", web3.utils.fromWei(this.suggesterBalanceBeforeDeposit))
              const balanceOfSuggesterAfter = await this.tokenSystem.balanceOf(suggester)
              const equals = (this.suggesterBalanceBeforeBondReturn.add(suggesterBondAmount))
              console.log(`balanceOfSuggesterAfter ${web3.utils.fromWei(balanceOfSuggesterAfter)} equals ${web3.utils.fromWei(equals)}`)
							expect(balanceOfSuggesterAfter).to.be.bignumber.equal(this.suggesterBalanceBeforeBondReturn.add(suggesterBondAmount));
					  })				

          })
				}) //return bonds on timeout  || depositOnSuggest()

       context('call getSuggestionDuration()', async function() {

        it('gets the suggestion duration time', async function() {
        const suggestionDuration = await this.proxiedEscrow.getSuggestionDuration()
         expect(suggestionDuration).to.be.bignumber.equal(await this.proxiedEscrow.suggestionDuration())
        }) 

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

      context('call suggesterBond()', async function() {

        it('returns the suggester bond amount', async function() {		
          const suggesterBond = await this.proxiedEscrow.suggesterBond(id)
          expect(suggesterBond).to.be.bignumber.equal(suggesterBondAmount);
        })

     }) 

     context('enforces token protection', function() {
       beforeEach(async function()  {
          await this.tokenSystem.approve(this.proxyAddress, MAX_UINT256, {from: suggester});
          this.suggesterBalanceBeforeDeposit = await this.tokenSystem.balanceOf(suggester)
          this.receipt = await this.proxiedEscrow.depositOnSuggest(id, suggesterBondAmount, {from: suggester, value: web3.utils.toWei("1")}); 

          this.ownerBalanceBeforeReturn = await this.tokenSystem.balanceOf(owner)
          this.ownerBalanceBeforeBondReturn = await this.tokenSystem.balanceOf(owner, {from: owner})
          this.suggesterBalanceBeforeBondReturn = await this.tokenSystem.balanceOf(suggester)
          await this.proxiedEscrow.disburseOnAccept(id, {from: owner})
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
          this.receipt = await this.proxiedEscrow.depositOnSuggest(id, suggesterBondAmount, {from: suggester, value: web3.utils.toWei("1")}); 
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

            context('delay test execution to test returnBondsOnTimeOut', function() {
              beforeEach(done => setTimeout(done, 25000));

              it('returns owner bond to owner', async function() {
                const ownerBalanceAfterReturn = await this.tokenSystem.balanceOf(owner)
                expect(this.balanceOfOwner).to.be.bignumber.equal(this.ownerTokenBalanceBeforeBondReturn.add(this.ownerBondAmount));
						}) 

          })
          context('delay test execution to test returnBondsOnReject', function() {

            it('schedules token protection removal', async function() {
                //const events = await aionContract.getPastEvents("ScheduleCallEvent", {fromBlock: this.blockBeforeDepositOnSuggest, toBlock:"pending"})
                const events = await aionContract.getPastEvents("ScheduleCallEvent", {fromBlock: this.blockBeforeDepositOnSuggest, toBlock:"pending"})
                //const events = await Promise.all([aionContract.getPastEvents("ScheduleCallEvent", {fromBlock: this.blockBeforeDepositOnSuggest, toBlock:"pending"})])
                await expect(events[0].event).to.equal("ScheduleCallEvent")
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
									await expectRevert(this.proxiedEscrow.depositOnSuggest(id, suggesterBondAmount, {from: owner}) ,"GoalOwner Role: GoalOwner CAN NOT call this function")
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
          this.ownerBalanceBeforeBondReturn = await this.tokenSystem.balanceOf(owner, {from: owner})
          this.suggesterBalanceBeforeBondReturn = await this.tokenSystem.balanceOf(suggester)
          this.blockBeforeDisburse = await web3.eth.getBlockNumber()
          await this.proxiedEscrow.disburseOnAccept(id, {from: owner})
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

         expect((this.suggesterBalanceAfterBondReturn.sub(this.suggesterBalanceBeforeBondReturn)).sub((this.rewardAmount))).to.be.bignumber.equal(this.suggesterBondAmount)
          })    
        it('pays reward to suggester', async function() {
          const suggesterBalanceAfterBondReturn = this.suggesterBalanceBeforeBondReturn.add(suggesterBondAmount)
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
           this.receipt = await this.proxiedEscrow.depositOnSuggest(id, suggesterBondAmount, {from: suggester, value: web3.utils.toWei("1")}); 
           this.suggesterBalanceAfterDeposit = await this.tokenSystem.balanceOf(suggester)

           this.suggesterAmountProtectedBefore = await this.tokenSystem.amountProtected(suggester)
           this.suggesterStructBalanceBeforeBondReturn = await this.proxiedEscrow.suggestedSteps(id)
           this.suggesterStructBalanceBeforeBondReturn  = this.suggesterStructBalanceBeforeBondReturn.ownerBond
           this.ownerBondFundsBeforeBondReturn = await this.proxiedEscrow.bondFunds()
           this.blockBeforeIncrease = await web3.eth.getBlockNumber()
           this.suggestionDuration = parseInt((await this.proxiedEscrow.suggestionDuration()).toString())
           this.blockTimeBeforeIncrease = (await web3.eth.getBlock("pending")).timestamp

					 await time.increase(await this.proxiedEscrow.suggestionDuration()) //returnBondOnTimeout()

           this.blockTimeAfterIncrease = (await web3.eth.getBlock("pending")).timestamp
         })
         
          context('delay test execution to test returnBondsOnTimeOut', function() {
            beforeEach(done => setTimeout(done, 20000));

            it('protects suggester tokens', function() {
                 expect(this.suggesterAmountProtectedBefore).to.be.bignumber.equal(suggesterBondAmount);
            })

            it('prevents their transfer', async function() {
              const e = await aionContract.getPastEvents("ExecutedCallEvent", {fromBlock: this.blockBeforeIncrease, toBlock:"pending"})                    
              console.log('prevents their transfer', e) 
              const suggesterProtectedAmountAfterReturn = await this.tokenSystem.amountProtected(suggester)

              const suggesterBalanceAfterIncrease = await this.tokenSystem.balanceOf(suggester)
              //console.log(` protection period ${(await this.tokenSystem.protectionPeriod()).toString()}`)
              //console.log(`suggestion duration ${this.suggestionDuration.toString()}`)
              console.log(`blockTimeBeforeIncrease ${this.blockTimeBeforeIncrease.toString()}`)
              console.log(`blockTimeAfterIncrease ${this.blockTimeAfterIncrease.toString()}`)
              console.log(`diff blockTimeAfterIncrease blockTimeBeforeIncrease = ${parseInt(this.blockTimeAfterIncrease.toString()) -  parseInt(this.blockTimeBeforeIncrease.toString())} `)
              console.log(`suggestion duration ${this.suggestionDuration}`)
              console.log(`suggester balance before deposit ${web3.utils.fromWei(this.suggesterBalanceBeforeDeposit)}`)
              console.log(`suggester balance after deposit ${web3.utils.fromWei(this.suggesterBalanceAfterDeposit)}`)
              console.log(`suggester balance after increase ${web3.utils.fromWei(suggesterBalanceAfterIncrease)}`)
                
              console.log(`amount protected after return ${suggesterProtectedAmountAfterReturn}`) 
               await expectRevert(this.tokenSystem.transfer(owner, suggesterProtectedAmountAfterReturn, {from: suggester}), "your tokens are under protection period, check timeToLiftProtection() for time until you have tokens available, and/or check amountProtected to see how many of your tokens are currently under the protection period")
            })



            it('owner bond returns to bond funds but remains in contract', async function() {
                const e = await aionContract.getPastEvents("ExecutedCallEvent", {fromBlock: this.blockBeforeIncrease, toBlock:"pending"})                    
                console.log("owner bond returns to bond funds but remains in contract",e) 
                this.ownerBondFundsAfterBondReturn = await this.proxiedEscrow.bondFunds()
                await expect(this.ownerBondFundsAfterBondReturn).to.be.bignumber.equal(this.suggesterStructBalanceBeforeBondReturn.add(this.ownerBondFundsBeforeBondReturn))
            })   
          })

			  }) //'protect tokens'	
    }) //when approved by payer
  })  // create and fund escrow
})
})
}
