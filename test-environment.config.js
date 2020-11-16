/*
module.exports = {
  accounts: {
    amount: 10, // Number of unlocked accounts
    ether: 1000, // Initial balance of unlocked accounts (in ether)
  },

  contracts: {
    type: 'truffle', // Contract abstraction to use: 'truffle' for @truffle/contract or 'web3' for web3-eth-contract
    defaultGas: 0x11fffffffffff, // Maximum gas for contract calls (when unspecified)

    // Options available since v0.1.2
    defaultGasPrice: 0x1, // Gas price for contract calls (when unspecified)
    artifactsDir: 'build/contracts', // Directory where contract artifacts are stored
  },

  node: { // Options passed directly to Ganache client
    fork: 'http://127.0.0.1:8545',
    unlockedAccounts: ['0x5F2622AB3E38ecc144867Ca3AD14b8E34229ceda','0x9b73Dd0E2E5415e14b997561dc3fa30196f18acc', '0xeF5251137a511e0d40cb8CFBF54Ce6Dde63A66fE'],
    gasLimit: 0x11fffffffffff, // Maximum gas per block
    gasPrice: 0x1, // Sets the default gas price for transactions if not otherwise specified.
    allowUnlimitedContractSize: true,
  },
};
*/
