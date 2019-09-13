let assertRevert = require('./helpers/assertRevert');
let  expectThrow = require ('./helpers/expectThrow');

const BondingCurveMock = artifacts.require('BondingCurveMock.sol');

contract('BondingCurve', accounts => {
  let instance;
  const decimals = 18;
  const startSupply = 10 * 1e18; // 10 using a value lower then 10 makes results less accurate
  const startPoolBalance = 1 * 1e14; // one coin costs .00001 ETH;
  const reserveRatio = Math.round(1 / 3 * 1000000) / 1000000;
  const solRatio = Math.floor(reserveRatio * 1000000);
  let gasPrice = 1 * 1e18;
  console.log('startSupply',startSupply)
  before(async () => {
    instance = await BondingCurveMock.new(
      startSupply,
      solRatio,
      gasPrice,
      { value: startPoolBalance, from: accounts[0] }
    );
  });

  async function getRequestParams(amount) {
    let totalSupply = await instance.totalSupply.call();
    totalSupply = totalSupply.valueOf();
    let poolBalance = await instance.poolBalance.call();
    poolBalance = poolBalance.valueOf();

    let price = poolBalance * ((1 + amount / totalSupply) ** (1 / (reserveRatio)) - 1);
    return {
      totalSupply, poolBalance, solRatio, price
    };
  }

  it('should initialize contract correctly', async () => {
    let p = await getRequestParams(0);
    let contractBalance = await web3.eth.getBalance(instance.address);
    let ownerBalance = await instance.balanceOf.call(accounts[0]);

    assert.equal(p.totalSupply, ownerBalance.valueOf(), 'should send initial tokens to owner');
    assert.equal(startPoolBalance, contractBalance.valueOf(), 'contract should hold correct amount of ETH');
    assert.equal(startPoolBalance, p.poolBalance, 'should initialize pool balance correctly');
  });

  it('should estimate price for token amount correctly', async () => {
    let amount = 13 * (10 ** decimals);
    let p = await getRequestParams(amount);
    let estimate = await instance.calculatePurchaseReturn.call(
      p.totalSupply,
      p.poolBalance,
      solRatio,
      p.price
    );

    assert.isAtMost(Math.abs(estimate.sub(amount)), 1e3, 'estimate should equal original amount');
  });

  it('should buy tokens correctly via default function', async () => {
    let amount = 8 * (10 ** decimals);

    const startBalance = await instance.balanceOf.call(accounts[0]);
    let p = await getRequestParams(amount);
    let buyTokens = await instance.send(Math.floor(p.price));
    console.log('buyTokens via default gas', buyTokens.receipt.gasUsed);

    const endBalance = await instance.balanceOf.call(accounts[0]);
    let amountBought = endBalance.sub(startBalance);
    assert.isAtMost(Math.abs(amountBought.sub(amount)), 1e3, 'able to buy tokens via fallback');
  });

  it('should buy tokens correctly', async () => {
    let amount = 14 * (10 ** decimals);

    const startBalance = await instance.balanceOf.call(accounts[0]);

    let p = await getRequestParams(amount);
    let buyTokens = await instance.buy({ from: accounts[0], value: Math.floor(p.price) });
    console.log('buy gas', buyTokens.receipt.gasUsed);

    const endBalance = await instance.balanceOf.call(accounts[0]);
    let amountBought = endBalance.sub(startBalance);
    assert.isAtMost(Math.abs(amountBought.sub(amount)), 1e4, 'able to buy tokens');
  });

  it('should buy tokens a second time correctly', async () => {
    let amount = 5 * (10 ** decimals);

    const startBalance = await instance.balanceOf.call(accounts[0]);

    let p = await getRequestParams(amount);
    let buyTokens = await instance.buy({ from: accounts[0], value: Math.floor(p.price) });
    console.log('buy gas', buyTokens.receipt.gasUsed);

    const endBalance = await instance.balanceOf.call(accounts[0]);
    let amountBought = endBalance.sub(startBalance);
    assert.isAtMost(Math.abs(amountBought.sub(amount)), 1e4, 'should be able to buy tokens');
  });

  it('should be able to sell tokens', async () => {
    let amount = await instance.balanceOf(accounts[0]);
    let sellAmount = Math.floor(amount / 2);

    let p = await getRequestParams(amount);
    let saleReturn = await instance.calculateSaleReturn.call(
      p.totalSupply,
      p.poolBalance,
      solRatio,
      sellAmount
    );

    let contractBalance = await web3.eth.getBalance(instance.address);

    let sell = await instance.sell(sellAmount.valueOf());
    console.log('sellTokens gas ', sell.receipt.gasUsed);

    let endContractBalance = await web3.eth.getBalance(instance.address);
    assert.equal(saleReturn.valueOf(), contractBalance - endContractBalance, 'contract change should match sale return');

    const endBalance = await instance.balanceOf.call(accounts[0]);
    assert.isAtMost(Math.abs(endBalance.valueOf() * 1 - (amount - sellAmount)), 1e4, 'balance should be correct');
  });

  it('should not be able to buy anything with 0 ETH', async () => {
    await assertRevert(instance.buy({ value: 0 }));
  });

  it('should not be able to sell more than what you have', async () => {
    let amount = await instance.balanceOf(accounts[0]);
    await assertRevert(instance.sell(amount.plus(1)));
  });


  it('should be able to sell all', async () => {
    let amount = await instance.balanceOf(accounts[0]);

    let contractBalance = await web3.eth.getBalance(instance.address);

    let p = await getRequestParams(amount);
    let saleReturn = await instance.calculateSaleReturn.call(
      p.totalSupply,
      p.poolBalance,
      solRatio,
      amount
    );

    let sell = await instance.sell(amount);
    console.log('sellTokens gas ', sell.receipt.gasUsed);

    let endContractBalance = await web3.eth.getBalance(instance.address);
    assert.equal(saleReturn.valueOf(), contractBalance - endContractBalance, 'contract change should match sale return');

    const endBalance = await instance.balanceOf.call(accounts[0]);
    assert.equal(endBalance.valueOf(), 0, 'balance should be 0 tokens');
  });

  /**
   * TODO selling ALL tokens sets the totalSupply to 0 and kills the contract
   * this is because bancor formulas cannot handle totalSupply or poolBalance = 0 or even close to 0
   */

  it('should not be able to set gas price of 0', async function () {
    await assertRevert(instance.setGasPrice.call(0));
  });

  it('should be able to set max gas price', async function () {
    await instance.setGasPrice(1, { from: accounts[0] });
    gasPrice = await instance.gasPrice.call();
    assert.equal(1, gasPrice.valueOf(), 'gas price should update');
  });

  it('should throw an error when attempting to buy with gas price higher than the universal limit', async () => {
    await expectThrow(instance.buy({ gasPrice: gasPrice + 1, value: 10 ** 18 }));
  });

  it('test calculateSaleReturn branches', async () => {
    await expectThrow(instance.calculateSaleReturn(0, 0, 0, 0), 'should throw when params are 0');

    let sellReturn = await instance.calculateSaleReturn(1, 1, 100000, 0);
    assert.equal(0, sellReturn.toNumber(), 'sellReturn should be 0 when selling 0 tokens');

    sellReturn = await instance.calculateSaleReturn(1, 1, 100000, 1);
    assert.equal(1, sellReturn.toNumber(), 'sellReturn should be 1 when selling all tokens');

    sellReturn = await instance.calculateSaleReturn(2, 2, 1000000, 1);
    assert.equal(1, sellReturn.toNumber(), 'sellReturn return 1 when _connectorWeight = MAX_WEIGHT');
  });


  it('test calculatePurchaseReturn branches', async () => {
    await expectThrow(instance.calculatePurchaseReturn(0, 0, 0, 0), 'should throw when params are 0');

    let buyReturn = await instance.calculatePurchaseReturn(1, 1, 100000, 0);
    assert.equal(0, buyReturn.toNumber(), 'sellReturn should be 0 when selling 0 tokens');

    buyReturn = await instance.calculatePurchaseReturn(1, 1, 1000000, 1);
    assert.equal(1, buyReturn.toNumber(), 'sellReturn should be 0 when selling 0 tokens');
  });
});

