  let instance;
  const decimals = 18;
  const startSupply = 10 * 1e18; // 10 using a value lower then 10 makes results less accurate
  const poolBalance = 1 * 1e14; // one coin costs .00001 ETH;
  const reserveRatio = Math.round(1 / 3 * 1000000) / 1000000;
  const solRatio = Math.floor(reserveRatio * 1000000);
  const amount = 13 * 10^decimals  

let p = _poolBalance.mul(((one.add(_amount).div(_totalSupply)).pow(one.div((_reserveRatio)))).sub(1)))

let part1 = (_amount.div(_totalSupply)).add(new BN(1))


let exponent = million.div(_reserveRatio)


let p = poolBalacne.mul(((part1.pow(exponent))).sub(new BN(1)))

b * (((part1)^exponent) - million) 

pool * (((part1)^exponent) - million) 
    

let price = poolBalance * ((1 + amount / totalSupply) ** (1 / (reserveRatio)) - 1);

let part1Scaled = (million.add(amount).div(totalSupply)).mul(million)
let exponentScaled = ((million.div(reserveRatio)).mul(million))


If the two operands belong to the same fixed-point type, and the result is also to be represented in that type, 
then the product of the two integers must be explicitly multiplied by the common scaling factor; 
(in this case the result may have to be rounded, and overflow may occur.) 

For example, if the common scaling factor is 1/100, multiplying 1.23 by 0.25 entails 
multiplying 123 by 25 to yield 3075 with an intermediate scaling factor of 1/10000. 

This then must be multiplied by 1/100 to yield either 31 (0.31) or 30 (0.30), 
depending on the rounding method used, 
to result in a final scale factor of 1/100.





