const Aion = artifacts.require('Aion');
const address = Aion.address
module.exports = function(callback) {
console.log("shits")
console.log(address)

callback()
}
