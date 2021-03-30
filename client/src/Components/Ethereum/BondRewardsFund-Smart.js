import React from 'react'
import BondRewardsFund from './BondRewardsFund.js'
import goalescrow from '../../abi/GoalEscrow.json'
import * as DeployedAddress from '../../ContractAddress.js'
var Web3 = require('web3');
var web3 = new Web3(Web3.givenProvider || "ws://localhost:8546");
let  ProxiedGoalEscrow

if (typeof window.ethereum !== 'undefined'|| (typeof window.web3 !== 'undefined')) {
  // Web3 browser user detected. You can now use the provider.
  const provider = window['ethereum'] || window.web3.currentProvider
}

class BondRewardsFundsSmart extends React.Component {

  async componentDidMount() {
    ProxiedGoalEscrow = new web3.eth.Contract(goalescrow.abi, this.props.proxyAddress)
    const bondsAmount = web3.utils.fromWei((await ProxiedGoalEscrow.methods.rewardFunds().call()))
    this.props.setBondsAmount(bondsAmount)
   }

 async componentDidUpdate(prevProps) {
  if (this.props.proxyAddress && prevProps.proxyAddress !== this.props.proxyAddress) {
    ProxiedGoalEscrow = new web3.eth.Contract(goalescrow.abi, this.props.proxyAddress)
    const bondsAmount = web3.utils.fromWei((await ProxiedGoalEscrow.methods.rewardFunds().call()))
    this.props.setBondsAmount(bondsAmount)
  }
  if (this.props.bondsAmount && prevProps.bondsAmount !== this.props.bondsAmount) {
    const bondsAmount = web3.utils.fromWei((await ProxiedGoalEscrow.methods.rewardFunds().call()))
    this.props.setBondsAmount(bondsAmount)
  }
 }
   render() {
    return (
      <div>
      {this.props.bondsAmount ? <BondRewardsFund bondsAmount={(this.props.bondsAmount)} /> : null}
      </div>
    )
   }
}

export default BondRewardsFundsSmart
