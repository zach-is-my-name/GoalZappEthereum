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
const aionInterface = require('./aionInterface/aionInterface.json') 
const aionContract = new web3.eth.Contract(aionInterface.abi, "0xAB046F7cc64DCDfDAE5aF718Ff412B023C852E9E")
const Aion = require('aiongoalzapptestversion')

//console.log("aionInterface", aionInterface)
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
})

function shouldBehaveLikeGoalEscrow (errorPrefix, master, owner, suggester) {

  it('reverts when deployed with a null token address', async function() {
    this.GoalEscrow = await GoalEscrowTestVersion.new() 
    await expectRevert.unspecified(this.GoalEscrow.initMaster(ZERO_ADDRESS, 30, {from:master}));
  })

  describe('with token, with proxy', function () {
    describe('Create and Fund Escrow', function() {
      beforeEach(async function () {
				this.Escrow = await GoalEscrowTestVersion.new()
				await this.Escrow.initMaster(this.tokenSystem.address, 30, {from: master}); 
			})
      context('when not approved by payer', function () { 

				it('reverts on deposit', async function () {
				await expectRevert.unspecified( this.Escrow.newGoalInitAndFund(this.tokenSystem.address, 30, ownerBondDepositAmount, rewardDepositAmount, {from: owner})
				);
				});

      });   

      describe('when approved by payer', function () {
				beforeEach(async function () {
					await this.tokenSystem.approve(this.Escrow.address, MAX_UINT256, { from: owner });
					await this.Escrow.newGoalInitAndFund(this.tokenSystem.address, 30, ownerBondDepositAmount, rewardDepositAmount, {from: owner});
				});

				it('stores the token\'s address', async function () {
					const address = await this.Escrow.token();
					expect(address).to.be.equal(this.tokenSystem.address);
				});

				it('deposits bond and reward to contract', async function() {
					expect(await this.tokenSystem.balanceOf(this.Escrow.address)).to.be.bignumber.equal(totalAmountOwnerDeposit);
				});

				it('adds to contract bondFunds', async function() {
					expect(await this.Escrow.bondFunds()).to.be.bignumber.equal(ownerBondDepositAmount);
				});

				it('adds to contract rewardFunds', async function() {
					expect(await this.Escrow.rewardFunds()).to.be.bignumber.equal(rewardDepositAmount)
					});

				describe('depositOnSuggest', function () {
					beforeEach(async function () {
						await this.tokenSystem.approve(this.Escrow.address, MAX_UINT256, {from: suggester});
						const {logs} = await this.Escrow.depositOnSuggest(id, suggesterBondAmount, {from: suggester , value: new BN(2 * Math.pow(10,15))}); 
            this.logs = logs 

					});

					it('deposits suggester bond amount', async function() {
						expect(await this.tokenSystem.balanceOf(this.Escrow.address)).to.be.bignumber.equal(totalAmountOwnerDeposit.add(suggesterBondAmount));
					})
					it('adds to suggesterBond', async function() {
						let _suggesterBond = (await this.Escrow.suggestedSteps(id)).suggesterBond;
						expect(_suggesterBond).to.be.bignumber.equal(suggesterBondAmount);
					})
					it('subtracts owner bond from bondFunds', async function() {
						expect(await this.Escrow.bondFunds()).to.be.bignumber.equal(ownerBondDepositAmount.isub(await this.Escrow.ownerBondAmount()));
					})
					it('adds ownerBondAmount to Suggester struct member ownerBond', async function() { 
						let _ownerBond = (await this.Escrow.suggestedSteps(id)).ownerBond;
						expect(_ownerBond).to.be.bignumber.equal(await this.Escrow.ownerBondAmount())
					})

					context('set suggestion timeout', function() {

						it('stores the current time in the Suggester struct', async function() {
							let _timeSuggested = (await this.Escrow.suggestedSteps(id)).timeSuggested
							expectEvent.inLogs(this.logs, 'TimeNow', {blocktime: _timeSuggested});      
						});
						
						it('stores the expiration time in the Suggester struct', async function() {
							let _suggestionExpires = (await this.Escrow.suggestedSteps(id)).suggestionExpires
							expectEvent.inLogs(this.logs, 'SuggestionExpires', {expires: _suggestionExpires});      
						});

				 context('returnBondsOnTimeOut()', function() {
  			 	before('advance block', async function() {
							await time.increase(new BN ("31"));
              await time.advanceBlock()  
          })
						it('Aion contract calls returnBondsOnTimeOut()', function(done) {
              //console.log("LATEST TIME BEFORE", (await web3.eth.getBlock("latest")).timestamp)  
              //console.log("LATEST # BEFORE", (await web3.eth.getBlock("latest")).number)  

              //this.timeout(25000)
          
	            //const scheduleCallEvents = await aionContract.getPastEvents("ScheduleCallEvent")
 	            //this.aionCallEvent = scheduleCallEvents
					    //console.log("scheduleCallEvents -- block now", scheduleCallEvents[0].blockNumber)
					    //console.log("scheduleCallEvents --calltime", scheduleCallEvents[0].returnValues.blockNumber)
              //console.log("LATEST TIME AFTER", (await web3.eth.getBlock("latest")).timestamp)  
						  // let pendingBlockAfter = (await web3.eth.getBlock("pending", true)).number 
              //console.log("PENDING # AFTER",pendingBlockAfter)  
              //console.log("LATEST BLOCK # -->  after block increase", (await time.latestBlock()).toString())
              //this.timeout(20000)
              //const initialBlock = await web3.eth.getBlockNumber()
              //console.log('initialBlock',initialBlock)
								  //const exEvent = aionContract.events.ExecutedCallEvent({fromBlock: "latest"}).on("data", 
                  //console.log("event", exEvent) 
               
                setTimeout(function() {

									aionContract.getPastEvents("ExecutedCallEvent", {fromBlock: "latest", toBlock:"pending"}).then(eventArr => console.log(eventArr)).then(
                  eventArr =>  expectEvent(eventArr[0] /*executedCallEvents[0]*/, 'ExecutedCallEvent', {}))
										done()
                   }, 15000 )

           });


				  it('schedules remove suggester token protection', async function() {
				 		await time.increase((await this.Escrow.suggestionDuration()).add(new BN(1)));
						expectEvent.inLogs(this.aionCallEvent, 'ScheduleCallEvent', {})
					})


					it('transfers bond refund to suggester', async function() {
						let suggesterBalanceBeforeBondReturn = await this.tokenSystem.balanceOf(suggester)
						 await time.increase((await this.Escrow.suggestionDuration()).add(new BN (1)));
							 expect(await this.tokenSystem.balanceOf(suggester)).to.be.bignumber.equal(suggesterBalanceBeforeBondReturn.add(suggesterBondAmount));
					 })				
								 
					it('protects suggester tokens and prevents their transfer', async function() {
						await time.increase((await this.Escrow.suggestionDuration()).add(new BN(1)));

						expect(await this.tokenSystem.amountProtected(suggester)).to.be.bignumber.equal(suggesterBondAmount);

							 let amountProtected = await this.tokenSystem.amountProtected(suggester)
						   await expectRevert.unspecified(this.tokenSystem.transfer(owner, amountProtected, {from: suggester}))
				  })

					it('owner bond returns to bond funds but remains in contract', async function() {
           
						this.ownerBondFundsBeforeBondReturn = await this.Escrow.bondFunds.call() 

						const duration = await this.Escrow.suggestionDuration.call()
            console.log("duration", duration.toString()) 
						await time.increase(duration.add(new BN("1")));

						const ownerBondFundsAfterBondReturn = await this.Escrow.bondFunds.call() 
            console.log("RETURNS",ownerBondFundsAfterBondReturn)
            expect(ownerBondFundsAfterBondReturn).to.be.bignumber.greaterThan(this.ownerBondFundsBeforeBondReturn)
          })   
					
				 context('call getSuggestionDuration()', function() {
					it('gets the suggestion duration time', async function() {
					expect(await this.Escrow.getSuggestionDuration()).to.be.bignumber.equal(await this.Escrow.suggestionDuration())
					}) 
				 })

					context('call suggestionExpires()', function() {
						it('gets suggestion expiration (block)time', async function() {
							let _suggestionExpires = (await this.Escrow.suggestedSteps(id)).suggestionExpires
							let _timeSuggested = (await this.Escrow.suggestedSteps(id)).timeSuggested;
							expect(_suggestionExpires).to.be.bignumber.equal(_timeSuggested.add(await this.Escrow.suggestionDuration()));
						});
					})

					context('call suggesterBond()', function() {
						it('returns the suggester bond amount', async function() {		
							expect(await this.Escrow.suggesterBond(id)).to.be.bignumber.equal(suggesterBondAmount);
							})
					}) 



				 context('disburse on accept', function() {
						beforeEach(async function(){ 
							this.ownerBalanceBeforeReturn = await this.tokenSystem.balanceOf(owner);
							this.ownerBalanceBeforeBondReturn = await this.tokenSystem.balanceOf(owner, {from: owner}); 
							this.suggesterBalanceBeforeBondReturn = await this.tokenSystem.balanceOf(suggester)
										 
							const {logs} = await this.Escrow.disburseOnAccept(id, {from: owner});
              this.logs = logs
							this.suggesterBalanceAfterBondReturn = await this.tokenSystem.balanceOf(suggester)
              
							const scheduleCallEvents = await aionContract.getPastEvents("ScheduleCallEvent")

							const executedCallEvents = await aionContract.getPastEvents("ExecutedCallEvent")

							this.aionCallEvent = scheduleCallEvents
							this.aionExecuteEvent =  executedCallEvents 
						})



						it('transfers bond to suggester', async function() {
										expect((this.suggesterBalanceAfterBondReturn.sub(this.suggesterBalanceBeforeBondReturn)).sub((await this.Escrow.rewardAmount()))).to.be.bignumber.equal(suggesterBondAmount)
							})    
						it('pays reward to suggester', async function() {
							let suggesterBalanceAfterBondReturn = this.suggesterBalanceBeforeBondReturn.iadd(suggesterBondAmount)
							expect(await this.tokenSystem.balanceOf(suggester)).to.be.bignumber.equal(suggesterBalanceAfterBondReturn.iadd(await this.Escrow.rewardAmount()));
						})    
						it('transfers bond to owner', async function() {
							expect(await this.tokenSystem.balanceOf(owner)).to.be.bignumber.equal(this.ownerBalanceBeforeBondReturn.iadd(await this.Escrow.ownerBondAmount()));	
						})				
						it('protects suggester tokens', async function() {
										let rewardAmount = await this.Escrow.rewardAmount();
							//console.log('reward amount ', rewardAmount.toString());
							let amountProtected = await this.tokenSystem.amountProtected(suggester)  
										//console.log('amount protected', amountProtected.toString()); 
						 // console.log('suggester bond amount', suggesterBondAmount.toString());
										expect(amountProtected).to.be.bignumber.equal(suggesterBondAmount.add(rewardAmount)); 
						})
						it('reverts when suggester attempts to transfer tokens under protection', async function() {
							let amountProtected = await this.tokenSystem.amountProtected(suggester)  
							//console.log('amount protected', web3.utils.fromWei(amountProtected.toString())); 
							//console.log('amount to transfer', 60) 
							await expectRevert.unspecified(this.tokenSystem.transfer(owner, amountProtected, {from: suggester}));
						}) 
						it('protects owner tokens', async function() {
							expect(await this.tokenSystem.amountProtected(owner)).to.be.bignumber.equal(await this.Escrow.ownerBondAmount())
						})
						it('reverts when owner attempts to transfer tokens under protection', async function () {
							await expectRevert.unspecified(this.tokenSystem.transfer(suggester, await this.Escrow.ownerBondAmount(), {from: owner}));
						}) 
            it('schedules token protection removal', async function() {
							expectEvent.inLogs(this.aionCallEvent, 'ScheduleCallEvent', {})			  
						})
				 })  
				 context('return bonds on reject', function() {
					beforeEach(async function(){ 
						this.suggesterBalanceBeforeReturnBond = await this.tokenSystem.balanceOf(suggester);
						this.ownerTokenBalanceBeforeBondReturn = await this.tokenSystem.balanceOf(owner);	
						this.suggesterBondInEscrow = (await this.Escrow.suggestedSteps(id)).suggesterBond;
						this.ownerBondAmount = await this.Escrow.ownerBondAmount()

            const scheduleCallEvents = await aionContract.getPastEvents("ScheduleCallEvent")

            const executedCallEvents = await aionContract.getPastEvents("ExecutedCallEvent")

            this.aionCallEvent = scheduleCallEvents
            this.aionExecuteEvent =  executedCallEvents 
					}) 

						it('refunds suggester bond', async function() {
							await this.Escrow.returnBondsOnReject(id, {from: owner});
							expect(await this.tokenSystem.balanceOf(suggester)).to.be.bignumber.equal(this.suggesterBalanceBeforeReturnBond.add(this.suggesterBondInEscrow))
						})
						it('returns owner bond to owner', async function() {
						  //  console.log('ownerBondAmount', this.ownerBondAmount.toString())
						  // console.log('ownerTokenBalanceBeforeBondReturn', this.ownerTokenBalanceBeforeBondReturn.toString())
							
							await this.Escrow.returnBondsOnReject(id, {from: owner});

							const ownerBalanceAfterReturn = await this.tokenSystem.balanceOf(owner)
							const ownerBondAmountAfterReturn = await this.Escrow.ownerBondAmount()
							
						 // console.log('ownerBondAmountAfterReturn', ownerBondAmountAfterReturn.toString())
							//console.log('ownerBalanceAfterReturn', ownerBalanceAfterReturn.toString()) 
							expect(await this.tokenSystem.balanceOf(owner)).to.be.bignumber.equal(this.ownerTokenBalanceBeforeBondReturn.add(this.ownerBondAmount));
						}) 
            it('schedules token protection removal', async function() {
            const scheduleCallEvents = await aionContract.getPastEvents("ScheduleCallEvent")
            //console.log("SCHEDULE_CALL_EVENTS", scheduleCallEvents)

					  await this.Escrow.returnBondsOnReject(id, {from: owner});

						expectEvent.inLogs(this.aionCallEvent, 'ScheduleCallEvent', {})			  

						})
				 })

				}) 
		 })

				 context('permissions', function() {
						context('onlyGoalOwner role', function() {
							context('fund escrow', function () {
					it('fails when not goal owner role', async function() {
						await expectRevert.unspecified(this.Escrow.fundEscrow(ownerBondDepositAmount , rewardDepositAmount , {from: suggester}))
					})
							})
						})

					 context('notGoalOwner role', function() {
							context('deposit on suggest', function() {
								it('fails when has onlyGoalOwnerRole', async function() {
									await expectRevert.unspecified(this.Escrow.depositOnSuggest(id, suggesterBondAmount, {from: owner}))
								})
							})
					 })
						
					 context('notAion role', function() {
						 it('fails when has onlyAionRole', async function() {
								await expectRevert.unspecified(this.Escrow.returnBondsOnTimeOut(id)) 
						 })
					 })
				 }) 


			 }) 
     })
   })
})
}
