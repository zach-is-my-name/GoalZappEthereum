const { web3, accounts, contract} = require('@openzeppelin/test-environment');
const { constants, expectEvent, expectRevert, time, BN } = require('@openzeppelin/test-helpers');

const { expect } = require('chai');
const BondingCurveMock = contract.fromArtifact('BondingCurveMock');

describe('BondingCurve', function() {
  const decimals = new BN(18);
  const startSupply = new BN(web3.utils.toWei("128")); // 10 using a value lower then 10 makes results less accurate
  const startPoolBalance = new BN(web3.utils.toWei(".03359789")) 
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
   });
    describe('should initialize bonding curve correctly', function() {
      it('should send initial tokens to owner', async function() {
        let amount = 0; 
	let totalSupply = await this.bondingCurve.totalSupply.call();
	totalSupply = new BN(totalSupply)
	let poolBalance = await this.bondingCurve.poolBalance.call();
	poolBalance = poolBalance.toString();

	let price = new BN(poolBalance * ((1 + amount / totalSupply) ** (1 / (reserveRatioStr)) - 1));
	let contractBalance = await web3.eth.getBalance(this.bondingCurve.address);
	let ownerBalance = await this.bondingCurve.balanceOf.call(accounts[0]);

	expect(totalSupply).to.be.bignumber.equal(ownerBalance)
      });

      it('contract holds correct amount of ETH', async function() {
	let contractBalance = await web3.eth.getBalance(this.bondingCurve.address);
	const startPoolBalance = new BN(web3.utils.toWei(".03359789"))

	expect(startPoolBalance).to.be.bignumber.equal(contractBalance);
	});

      it('should initialize correct poolBalance', async function() {
	const startPoolBalance = new BN(web3.utils.toWei(".03359789")) 
	let poolBalance = await this.bondingCurve.poolBalance.call();

	expect(startPoolBalance).to.be.bignumber.equal(poolBalance);
      });  
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
      });
    });

    context('should buy tokens correctly via default function', function() {
      it('is able to buy tokens via fallback', async function () {
	const decimals = new BN(18);
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
	let buyTokens = await this.bondingCurve.send(new BN(bigPrice));

	const endBalance = await this.bondingCurve.balanceOf.call(accounts[0]);
	let amountBought = endBalance.sub(startBalance);
	expect(amountBought.sub(amount).abs()).to.be.bignumber.at.most(new BN(web3.utils.toWei("1")));
      });
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


      const startBalance = await this.bondingCurve.balanceOf.call(accounts[0]);
      let buyTokens = await this.bondingCurve.buy({ from: accounts[0], value: bigPrice  });

      const endBalance = await this.bondingCurve.balanceOf.call(accounts[0]);
      let amountBought = endBalance.sub(startBalance);
      expect(amountBought.sub(amount).abs()).to.be.bignumber.at.most(new BN(web3.utils.toWei("1")));
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


      const startBalance = await this.bondingCurve.balanceOf.call(accounts[0]);
      let buyTokens = await this.bondingCurve.buy({from: accounts[0], value: bigPrice});

      const endBalance = await this.bondingCurve.balanceOf.call(accounts[0]);
      let amountBought = endBalance.sub(startBalance);
      expect(amountBought.sub(amount).abs()).to.be.bignumber.at.most(new BN(web3.utils.toWei("1")));
      });
    }) 
    context('should be able to sell tokens', function () {
      it('contract change matches sale return', async function () {
      let totalSupply = await this.bondingCurve.totalSupply.call();
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

      let endContractBalance = await web3.eth.getBalance(this.bondingCurve.address);
      
      let diff = new BN (contractBalance).sub(new BN(endContractBalance))
	expect(saleReturn).to.be.bignumber.equal(diff); 
      });

      it('balance is correct', async function() {
	let amount = await this.bondingCurve.balanceOf(accounts[0]);
	let sellAmount = new BN (amount.div(new BN(2)));
	await this.bondingCurve.sell(sellAmount);
	const endBalance = await this.bondingCurve.balanceOf.call(accounts[0]);
	expect((endBalance.sub((amount.sub(sellAmount)))).abs()).to.be.bignumber.at.most(new BN(web3.utils.toWei("1")));
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
      let diff = console.log("SALE RETURN DIFF", (new BN (saleReturn).sub((new BN(contractBalance).sub(new BN(endContractBalance))))).toString());
      
      expect(new BN (saleReturn)).to.be.bignumber.equal(new BN (contractBalance).sub(new BN (endContractBalance)));
  //    assert.equal(saleReturn.valueOf(), contractBalance - endContractBalance, 'contract change should match sale return');
     })
      it('sets account balance to 0 tokens', async function () {
      const endBalance = await this.bondingCurve.balanceOf.call(accounts[0]);
      expect(endBalance).to.be.bignumber.equal(new BN(0));
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
      });
      it('sellReturn should be 1 when selling all tokens', async function () {
	sellReturn = await this.bondingCurve.calculateSaleReturn(1, 1, 100000, 1);
	expect(new BN(1)).to.be.bignumber.equal(sellReturn);
      })
      it('sellReturn return 1 when _connectorWeight = MAX_WEIGHT', async function () {
	sellReturn = await this.bondingCurve.calculateSaleReturn(2, 2, 1000000, 1);
	expect(new BN(1)).to.be.bignumber.equal(sellReturn);
      });
    });


    context('test calculatePurchaseReturn branches', function () {
      it('should throw when params are 0', async function () {
	await expectRevert.unspecified(this.bondingCurve.calculatePurchaseReturn(0, 0, 0, 0))
      })
      it('sellReturn is 0 when selling 0 tokens', async function () {
	let buyReturn = await this.bondingCurve.calculatePurchaseReturn(1, 1, 100000, 0);
	buyReturn = new BN(buyReturn);
	expect(new BN(0)).to.be.bignumber.equal(buyReturn);
      });
      it('sellReturn is  0 when selling 0 tokens', async function () {
	buyReturn = await this.bondingCurve.calculatePurchaseReturn(1, 1, 1000000, 1);
	expect(new BN(1)).to.be.bignumber.equal(buyReturn);
      });
    });
})
}
});

