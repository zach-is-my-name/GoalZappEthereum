const { BN, constants, expectEvent, expectRevert } = require('openzeppelin-test-helpers');
const { expect } = require('chai');
const BondingCurveMock = artifacts.require('BondingCurveMock.sol');

contract('BondingCurve', function(accounts) {
  const decimals = new BN(18);
  const startSupply = new BN(web3.utils.toWei("128")); // 10 using a value lower then 10 makes results less accurate
  const startPoolBalance = new BN(web3.utils.toWei(".03359789")) // one coin costs .00001 ETH;
  const reserveRatioStr = (Math.round((1 / 3) * 1000000) / 1000000).toString();
  const reserveRatio = Math.round(1 / 3 * 1000000) / 1000000;
  const solRatio = new BN(Math.floor(reserveRatio * 1000000));
  //let gasPrice = new BN(web3.utils.toWei("20"));
  //let gasPrice = web3.utils.toWei(new BN("20"));
  let gasPrice = new BN(web3.utils.toWei("20"));

  context('Bonding Curve Tests', async function() { 
  //let gasPrice = new BN(web3.utils.toWei("20"));
    before(async function() {
      this.bondingCurve = await BondingCurveMock.new(
	startSupply,
	solRatio,
	gasPrice,
	{ value: startPoolBalance, from: accounts[0] }
      );
    });
    shouldBehaveLikeBondingCurve('BondingCurve', accounts);
  })

  function shouldBehaveLikeBondingCurve(errorPrefix, accounts) {
  const reserveRatioStr = (Math.round((1 / 3) * 1000000) / 1000000).toString();
    it('deploys the bonding curve', async function() {
     let supply = await this.bondingCurve.totalSupply()
     //console.log("yes totalSupply?", supply)
   })
    describe('should initialize contract correctly', function() {
      it('should send initial tokens to owner', async function() {
// 	console.log("yes bondingCurve ?", this.bondingCurve)
        let amount = 0; 
	let totalSupply = await this.bondingCurve.totalSupply.call();
	//console.log("totalSupply", totalSupply)
	totalSupply = new BN(totalSupply)
	let poolBalance = await this.bondingCurve.poolBalance.call();
	//console.log("poolBalance", poolBalance) 
	poolBalance = poolBalance.toString();

	let price = new BN(poolBalance * ((1 + amount / totalSupply) ** (1 / (reserveRatioStr)) - 1));
      let contractBalance = await web3.eth.getBalance(this.bondingCurve.address);
      let ownerBalance = await this.bondingCurve.balanceOf.call(accounts[0]);
	expect(totalSupply).to.be.bignumber.equal(ownerBalance)
      //assert.equal(p.totalSupply, ownerBalance.valueOf(), 'should send initial tokens to owner');
      });
      it('contract holds correct amount of ETH', async function() {
      let contractBalance = await web3.eth.getBalance(this.bondingCurve.address);
      const startPoolBalance = new BN(web3.utils.toWei(".03359789")) // one coin costs .00001 ETH;
	expect(startPoolBalance).to.be.bignumber.equal(contractBalance);
      //assert.equal(startPoolBalance, contractBalance.valueOf(), 'contract should hold correct amount of ETH');
	})
      it('should initialize correct poolBalance', async function() {
      const startPoolBalance = new BN(web3.utils.toWei(".03359789")) // one coin costs .00001 ETH;
	let poolBalance = await this.bondingCurve.poolBalance.call();
	expect(startPoolBalance).to.be.bignumber.equal(poolBalance);
      //assert.equal(startPoolBalance, p.poolBalance, 'should initialize pool balance correctly');
      })  
     });

    context('estimates price for token amount correctly', function () {
      it('estimate equal to original amount', async function() {
        const decimals = new BN(18);
	let amount = new BN(13).mul((new BN (10).pow(decimals)));
	let totalSupply = await this.bondingCurve.totalSupply.call();
	 totalSupply = new BN(totalSupply)
	let poolBalance = await this.bondingCurve.poolBalance.call();
        const reserveRatio = Math.round(1 / 3 * 1000000) / 1000000;
	const reserveRatioStr = (Math.round((1 / 3) * 1000000) / 1000000).toString();
	const solRatio = new BN(Math.floor(reserveRatio * 1000000));
	let price = poolBalance.mul((((new BN(1).add(amount)).div(totalSupply)).pow((new BN(1).div(new BN(reserveRatioStr)))).sub(new BN(1))));
	let estimate = await this.bondingCurve.calculatePurchaseReturn.call(
	  totalSupply,
	  poolBalance,
	  solRatio,
	  price
	);
	expect(estimate.sub(amount)).to.be.bignumber.at.most(new BN(10).pow(new BN(3)));
     // assert.isAtMost(Math.abs(estimate.sub(amount)), 1e3, 'estimate should equal original amount');
      })
    });

    context('should buy tokens correctly via default function', function() {
      it('is able to buy tokens via fallback', async function () {
	const decimals = new BN(18);
	//let part1 = (amount.div(totalSupply)).add(new BN(1))
	let amount = new BN(200).mul((new BN(10).pow(decimals)));
	let totalSupply = await this.bondingCurve.totalSupply.call();
	let poolBalance = await this.bondingCurve.poolBalance.call();

        let littleAmount = web3.utils.fromWei(amount)
        let littlePoolBalance = (web3.utils.fromWei(poolBalance))
        let littleTotalSupply = (web3.utils.fromWei(totalSupply))

        let littleReserveRatio = 1/3   
        let littlePrice = littlePoolBalance * ((1 + littleAmount / littleTotalSupply) ** (1 / (littleReserveRatio)) - 1);
        let bigPrice = web3.utils.toWei(littlePrice.toString())

	const startBalance = await this.bondingCurve.balanceOf.call(accounts[0]);
        console.log("LITTLE AMOUNT", littleAmount)
        console.log("LITTLEPOOLBALANCE", littlePoolBalance)
	console.log("LITTLETOTALSUPPLY", littleTotalSupply)
        console.log("LITTLEPRICE", littlePrice)
        console.log("BIGPRICE", bigPrice)
//	let price = poolBalance.mul(((part1.pow(exponent))).sub(new BN(1)))
/*
	console.log("AMOUNT", web3.utils.fromWei(amount.toString()))
	console.log("POOLBALANCE", web3.utils.fromWei(poolBalance.toString()))
	console.log("TOTALSUPPLY", web3.utils.fromWei(totalSupply.toString()))
        console.log("SOLRATIO", solRatio.toString())
	console.log("EXPONENT", exponent.toString())
	console.log("PART1", part1.toString())
	console.log("PRICE", bigPrice)
	//console.log('PRICE', web3.utils.fromWei(price.toString()))
 */       
	let buyTokens = await this.bondingCurve.send(new BN(bigPrice));
	//let buyTokens = await this.bondingCurve.send(Math.floor(price));

	const endBalance = await this.bondingCurve.balanceOf.call(accounts[0]);
	let amountBought = endBalance.sub(startBalance);
        console.log("AMOUNT BOUGHT", web3.utils.fromWei(amountBought.toString()))
        console.log("AMOUNT REQUESTED", web3.utils.fromWei(amount.toString())) 
        console.log("LITTLE DIFFERENCE AMOUNT BOUGHT / AMOUNT REQUESTED", web3.utils.fromWei(amountBought.sub(amount).toString()))
        console.log("BIG DIFFERENCE AMOUNT BOUGHT / AMOUNT REQUESTED", amountBought.sub(amount).toString())
	expect(amountBought.sub(amount).abs()).to.be.bignumber.at.most(new BN(web3.utils.toWei("1")));
      });
      //assert.isAtMost(Math.abs(amountBought.sub(amount)), 1e3, 'able to buy tokens via fallback');
     });
    
    context('should buy tokens correctly', function () {
      it('it is able to buy tokens', async function () {
	let totalSupply = await this.bondingCurve.totalSupply.call();
	let poolBalance = await this.bondingCurve.poolBalance.call();
	let amount = new BN(200).mul((new BN(10).pow(decimals)));

        let littleAmount = web3.utils.fromWei(amount)
        let littlePoolBalance = (web3.utils.fromWei(poolBalance))
        let littleTotalSupply = (web3.utils.fromWei(totalSupply))

        let littleReserveRatio = 1/3   
        let littlePrice = littlePoolBalance * ((1 + littleAmount / littleTotalSupply) ** (1 / (littleReserveRatio)) - 1);
        let bigPrice = web3.utils.toWei(littlePrice.toString())

        console.log("LITTLE AMOUNT", littleAmount)
        console.log("LITTLEPOOLBALANCE", littlePoolBalance)
	console.log("LITTLETOTALSUPPLY", littleTotalSupply)
        console.log("LITTLEPRICE", littlePrice)
        console.log("BIGPRICE", bigPrice)

      const startBalance = await this.bondingCurve.balanceOf.call(accounts[0]);
      let buyTokens = await this.bondingCurve.buy({ from: accounts[0], value: bigPrice  });
      //console.log('buy gas', buyTokens.receipt.gasUsed);

      const endBalance = await this.bondingCurve.balanceOf.call(accounts[0]);
      let amountBought = endBalance.sub(startBalance);
        console.log("AMOUNT BOUGHT", web3.utils.fromWei(amountBought.toString()))
        console.log("AMOUNT REQUESTED", web3.utils.fromWei(amount.toString())) 
        console.log("LITTLE DIFFERENCE AMOUNT BOUGHT / AMOUNT REQUESTED", web3.utils.fromWei(amountBought.sub(amount).toString()))
        console.log("BIG DIFFERENCE AMOUNT BOUGHT / AMOUNT REQUESTED", amountBought.sub(amount).toString())
      expect(amountBought.sub(amount).abs()).to.be.bignumber.at.most(new BN(web3.utils.toWei("1")));
     // assert.isAtMost(Math.abs(amountBought.sub(amount)), 1e4, 'able to buy tokens');
      });
    })
    context('should buy tokens a second time correctly', function () {
      it('is able to buy tokens', async function () {
	let amount = new BN(200).mul((new BN(10).pow(decimals)));
	let totalSupply = await this.bondingCurve.totalSupply.call();
	let poolBalance = await this.bondingCurve.poolBalance.call();

        let littleAmount = web3.utils.fromWei(amount)
        let littlePoolBalance = (web3.utils.fromWei(poolBalance))
        let littleTotalSupply = (web3.utils.fromWei(totalSupply))

        let littleReserveRatio = 1/3   
        let littlePrice = littlePoolBalance * ((1 + littleAmount / littleTotalSupply) ** (1 / (littleReserveRatio)) - 1);
        let bigPrice = web3.utils.toWei(littlePrice.toString())

        console.log("LITTLE AMOUNT", littleAmount)
        console.log("LITTLEPOOLBALANCE", littlePoolBalance)
	console.log("LITTLETOTALSUPPLY", littleTotalSupply)
        console.log("LITTLEPRICE", littlePrice)
        console.log("BIGPRICE", bigPrice)

      const startBalance = await this.bondingCurve.balanceOf.call(accounts[0]);
      let buyTokens = await this.bondingCurve.buy({from: accounts[0], value: bigPrice});
      //console.log('buy gas', buyTokens.receipt.gasUsed);

      const endBalance = await this.bondingCurve.balanceOf.call(accounts[0]);
      let amountBought = endBalance.sub(startBalance);
      expect(amountBought.sub(amount).abs()).to.be.bignumber.at.most(new BN(web3.utils.toWei("1")));
     // assert.isAtMost(Math.abs(amountBought.sub(amount)), 1e4, 'should be able to buy tokens');
      });
    }) 
    context('should be able to sell tokens', function () {
      it('contract change matches sale return', async function () {
      let totalSupply = await this.bondingCurve.totalSupply.call();
      //let amount = new BN(200).mul((new BN(10).pow(decimals)));
      let amount = await this.bondingCurve.balanceOf(accounts[0]);
      let sellAmount = new BN (amount.div(new BN(2)));
      let poolBalance = await this.bondingCurve.poolBalance.call();
      const reserveRatio = Math.round(1 / 3 * 1000000) / 1000000;
      const solRatio = new BN(Math.floor(reserveRatio * 1000000));

      let saleReturn = await this.bondingCurve.calculateSaleReturn.call(
        totalSupply,
	poolBalance,
	solRatio,
	sellAmount
      );

      let contractBalance = await web3.eth.getBalance(this.bondingCurve.address);

      let sell = await this.bondingCurve.sell(sellAmount);
      //console.log('sellTokens gas ', sell.receipt.gasUsed);

      let endContractBalance = await web3.eth.getBalance(this.bondingCurve.address);
      
      console.log("START CONTRACT BALANCE", web3.utils.fromWei(contractBalance))
      console.log("SALE RETURN", web3.utils.fromWei(saleReturn));
      let diff = new BN (contractBalance).sub(new BN(endContractBalance))
//      console.log("DIFF", diff);
      console.log("DIFF CONTRACT BALANCE", web3.utils.fromWei(diff));
      console.log("END CONTRACT BALANCE", web3.utils.fromWei(endContractBalance));
	expect(saleReturn).to.be.bignumber.equal(diff); 
     // assert.equal(saleReturn.valueOf(), contractBalance - endContractBalance, // 'contract change should match sale return');
      });

      it('balance is correct', async function() {
	let amount = await this.bondingCurve.balanceOf(accounts[0]);
	let sellAmount = new BN (amount.div(new BN(2)));
	await this.bondingCurve.sell(sellAmount);
	const endBalance = await this.bondingCurve.balanceOf.call(accounts[0]);
	expect((endBalance.sub((amount.sub(sellAmount)))).abs()).to.be.bignumber.at.most(new BN(web3.utils.toWei("1")));
    //    assert.isAtMost(Math.abs(endBalance.valueOf() * 1 - (amount - sellAmount)), 1e4, 'balance should be correct');
    })

    context('should not be able to buy anything with 0 ETH', function () {
      it('reverts on buy with 0 ETH', async function () {
      await expectRevert.unspecified(this.bondingCurve.buy({ value: 0 }));
      });
    })

    context('should not be able to sell more than what you have', function () {
      it('reverts on sell with more than holdings', async function() {
	let amount = await this.bondingCurve.balanceOf(accounts[0]);
	await expectRevert.unspecified(this.bondingCurve.sell(amount.add(new BN (1)))); 
  //    await assertRevert(this.bondingCurve.sell(amount.plus(1)));
      });
     })

    context('sell all', function () {
      it('contract change matches sale return', async function () {
	let amount = await this.bondingCurve.balanceOf(accounts[0]);
	let poolBalance = await this.bondingCurve.poolBalance.call();
	let totalSupply = await this.bondingCurve.totalSupply.call();
        const reserveRatio = Math.round(1 / 3 * 1000000) / 1000000;
        const solRatio = new BN(Math.floor(reserveRatio * 1000000));

	let contractBalance = await web3.eth.getBalance(this.bondingCurve.address);

	let saleReturn = await this.bondingCurve.calculateSaleReturn.call(
	 totalSupply,
	 poolBalance,
	 solRatio,
	 amount
      );

      let sell = await this.bondingCurve.sell(amount);
      //console.log('sellTokens gas ', sell.receipt.gasUsed);

      let endContractBalance = await web3.eth.getBalance(this.bondingCurve.address);
      console.log("CONTRACT BALANCE", web3.utils.fromWei(contractBalance));
      console.log("END CONTRACT BALANCE", web3.utils.fromWei(endContractBalance));
      console.log("SALE RETURN", web3.utils.fromWei(saleReturn));
      //let diff = console.log("SALE RETURN DIFF", web3.utils.fromWei(new BN (saleReturn).sub((new BN(contractBalance).sub(new BN(endContractBalance))))));
      let diff = console.log("SALE RETURN DIFF", (new BN (saleReturn).sub((new BN(contractBalance).sub(new BN(endContractBalance))))).toString());
      
      expect(new BN (saleReturn)).to.be.bignumber.equal(new BN (contractBalance).sub(new BN (endContractBalance)));
  //    assert.equal(saleReturn.valueOf(), contractBalance - endContractBalance, 'contract change should match sale return');
     })
      it('sets account balance to 0 tokens', async function () {
      const endBalance = await this.bondingCurve.balanceOf.call(accounts[0]);
      expect(endBalance).to.be.bignumber.equal(new BN(0));
  //    assert.equal(endBalance.valueOf(), 0, 'balance should be 0 tokens');
     })
      });

    /**
     * TODO selling ALL tokens sets the totalSupply to 0 and kills the contract
     * this is because bancor formulas cannot handle totalSupply or poolBalance = 0 or even close to 0
     */

    context('should not be able to set gas price of 0', function () {
      it('disallows setting  gas price to zero', async function () {
      await expectRevert.unspecified(this.bondingCurve.setGasPrice.call(0));
      })
    });

    context('should be able to set max gas price', function () {
      it('sets gas price', async function() {
	await this.bondingCurve.setGasPrice(1, { from: accounts[0] });
	gasPrice = await this.bondingCurve.gasPrice.call();
	expect(new BN(1)).to.be.bignumber.equal(gasPrice);
	//assert.equal(1, gasPrice.valueOf(), 'gas price should update');
      });
    });

    context('should throw an error when attempting to buy with gas price higher than the universal limit', function () {
      it('throws', async function () {
      let gasPrice = new BN("5");
      await expectRevert.unspecified(this.bondingCurve.buy({gasPrice: gasPrice.add(new BN(1)), value: web3.utils.toWei("1") }));
      });
    });

    context('test calculateSaleReturn branches', function () {
      it('throws when params are 0', async function () {
      await expectRevert.unspecified(this.bondingCurve.calculateSaleReturn(0, 0, 0, 0))
      });
      it('sellReturn should be 0 when selling 0 tokens', async function () {
      let sellReturn = await this.bondingCurve.calculateSaleReturn(1, 1, 100000, 0);
      sellReturn = new BN(sellReturn);
      expect(new BN(0)).to.be.bignumber.equal(sellReturn);
      //assert.equal(0, sellReturn.toNumber(), 'sellReturn should be 0 when selling 0 tokens');
      });
      it('sellReturn should be 1 when selling all tokens', async function () {
      sellReturn = await this.bondingCurve.calculateSaleReturn(1, 1, 100000, 1);
      expect(new BN(1)).to.be.bignumber.equal(sellReturn);
      // assert.equal(1, sellReturn.toNumber(), 'sellReturn should be 1 when selling all tokens');
      })
      it('sellReturn return 1 when _connectorWeight = MAX_WEIGHT', async function () {
      sellReturn = await this.bondingCurve.calculateSaleReturn(2, 2, 1000000, 1);
      expect(new BN(1)).to.be.bignumber.equal(sellReturn);
      //assert.equal(1, sellReturn.toNumber(), 'sellReturn return 1 when _connectorWeight = MAX_WEIGHT');
      });
    });


    context('test calculatePurchaseReturn branches', function () {
      it('should throw when params are 0', async function () {
      await expectRevert.unspecified(this.bondingCurve.calculatePurchaseReturn(0, 0, 0, 0))
      //await expectThrow(this.bondingCurve.calculatePurchaseReturn(0, 0, 0, 0), 'should throw when params are 0');
      })
      it('sellReturn is 0 when selling 0 tokens', async function () {
      let buyReturn = await this.bondingCurve.calculatePurchaseReturn(1, 1, 100000, 0);
      buyReturn = new BN(buyReturn);
      expect(new BN(0)).to.be.bignumber.equal(buyReturn);
      //assert.equal(0, buyReturn.toNumber(), 'sellReturn should be 0 when selling 0 tokens');
      });
      it('sellReturn is  0 when selling 0 tokens', async function () {
      buyReturn = await this.bondingCurve.calculatePurchaseReturn(1, 1, 1000000, 1);
      expect(new BN(1)).to.be.bignumber.equal(buyReturn);
      //assert.equal(1, buyReturn.toNumber(), 'sellReturn should be 0 when selling 0 tokens');
      });
    });
})
}
});

