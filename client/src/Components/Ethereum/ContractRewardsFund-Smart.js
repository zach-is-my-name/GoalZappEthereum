import React from 'react'
import ContractRewardsFund from './ContractRewardsFund.js'
import GOALESCROW from '../../abi/GoalEscrow.json'
import * as DeployedAddress from '../../ContractAddress.js'
var Web3 = require('web3');
var web3 = new Web3(Web3.givenProvider || "ws://localhost:8546");
let ProxiedGoalEscrow

if (typeof window.ethereum !== 'undefined'|| (typeof window.ethereum !== 'undefined')) {
  // Web3 browser user detected. You can now use the provider.
  const provider = window['ethereum'] || window.ethereum.currentProvider
}


class ContractRewardsFundSmart extends React.Component {

  async componentDidMount() {
    ProxiedGoalEscrow = new web3.eth.Contract(GOALESCROW.abi, this.props.proxyAddress)
    const rewardsAmount = await ProxiedGoalEscrow.methods.rewardFunds().call()
    this.props.setRewardsAmount(rewardsAmount)
   }

 async componentDidUpdate(prevProps) {
  if (this.props.proxyAddress && prevProps.proxyAddress !== this.props.proxyAddress) {
    ProxiedGoalEscrow = new web3.eth.Contract(GOALESCROW.abi, this.props.proxyAddress)
    const rewardsAmount = await ProxiedGoalEscrow.methods.rewardFunds().call()
    this.props.setRewardsAmount(rewardsAmount)
  }
  if (this.props.rewardsAmount && prevProps.rewardsAmount !== this.props.rewardsAmount) {
    const rewardsAmount = await ProxiedGoalEscrow.methods.rewardFunds().call()
    this.props.setRewardsAmount(rewardsAmount)
  }
 }

    render() {
  return (
    <div>
    {this.props.rewardsAmount ? <ContractRewardsFund rewardsAmount={web3.utils.fromWei(this.props.rewardsAmount)} /> : null }
    </div>
  )
   }
}

export default ContractRewardsFundSmart
