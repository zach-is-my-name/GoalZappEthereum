import React from 'react'
import BondRewardsFund from './BondRewardsFund.js'
import goalescrow from '../../abi/GoalEscrowTestVersion.json'
import * as DeployedAddress from '../../ContractAddress.js'
var Web3 = require('web3');
var web3 = new Web3(Web3.givenProvider || "ws://localhost:8546");
let  ProxiedGoalEscrow

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
