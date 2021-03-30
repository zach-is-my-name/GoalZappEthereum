import React from 'react';
import {graphql} from 'react-apollo';
import gql from 'graphql-tag';
import { withRouter, Redirect } from 'react-router-dom'
import '../../style/InputGoal.css'
import goalzapptokensystem from '../../abi/GoalZappTokenSystem.json'
import goalescrow from '../../abi/GoalEscrow.json'
import proxyfactory from '../../abi/ProxyFactory.json'
import * as DeployedAddress from '../../ContractAddress.js'
import {daysToSeconds} from '../../Utils/Utils.js'
import {minutesToSeconds} from '../../Utils/Utils.js'
var Web3 = require('web3');
var web3 = new Web3(Web3.givenProvider || "ws://localhost:8546");
let accounts = web3.eth.getAccounts()
let selectedAddress;
let proxyAddress;
const GoalZappTokenSystem = new web3.eth.Contract(goalzapptokensystem.abi, DeployedAddress.GOALZAPPTOKENSYSTEM)
let ProxiedGoalEscrow
const ProxyFactory = new web3.eth.Contract(proxyfactory.abi, DeployedAddress.PROXYFACTORY)

const goalInputMutation = gql `mutation goalInputMutation($goal: String!, $ownersId: ID, $proxyAddress: String) {
  goalDocCreate(data: {goal: $goal, owner: {connect: {id: $ownersId}}, proxyAddress: $proxyAddress, goalDocsOfUser: {connect: {id: $ownersId}}}) {
    id
    proxyAddress
    goal
    owner {
      id
    }
  }
}
`
const GoalDocQuery = gql `query goalDocsListQuery ($targetUserId: ID) {
  goalDocsList(filter: {goalDocsOfUser: {id: {equals: $targetUserId}}}) {
    items {
      goal
      id
      proxyAddress
    }
  }
}`


 class InputGoalSmart extends React.Component {
    constructor(props) {
        super(props)
    this.handleChange = this.handleChange.bind(this);
    this.submitGoal = this.submitGoal.bind(this);
    this.initGoal = this.initGoal.bind(this)
    this.postInputGoal = this.postInputGoal.bind(this)
    this.initAndFundGoal = this.initAndFundGoal.bind(this)

    this.state = {
      goal : '',
      proxyAddress: "",
      userTokenBalance: null,
      proxyAddress: null,
    }
 }

  async initGoal() {
    if (this.state.proxyAddress && this.props.userTokenBalance) {
      try {
        ProxiedGoalEscrow = new web3.eth.Contract(goalescrow.abi, this.state.proxyAddress)
        if (window.confirm("You've created a goal... would you like to fund it now?")) {
          await this.initAndFundGoal()
          //const initReciept = await ProxiedGoalEscrow.methods.newGoalInit(DeployedAddress.GOALZAPPTOKENSYSTEM, minutesToSeconds(3)).send({from:this.props.currentAccount})
          let userTokenBalance = await GoalZappTokenSystem.methods.balanceOf(window.ethereum.selectedAddress).call()
          await this.postInputGoal(this.state.goal, this.state.proxyAddress)
          this.setState({proxyAddress: ""})
        } else {
          const initReciept = await ProxiedGoalEscrow.methods.newGoalInit(DeployedAddress.GOALZAPPTOKENSYSTEM, minutesToSeconds(3)).send({from:this.props.currentAccount})
          let userTokenBalance = web3.utils.fromWei((await GoalZappTokenSystem.methods.balanceOf(this.state.currentAccount).call()))
          this.props.setUserTokenBalance(userTokenBalance)
          await this.postInputGoal(this.state.goal, this.state.proxyAddress)
          this.setState({proxyAddress: ""})
        }
     } catch (err) {
       console.log(err)
      }
   }
}

  postInputGoal(goal, proxyAddress) {
      const ownersId = this.props.loggedInUserId
      this.props.inputGoal({variables: {goal, ownersId, proxyAddress}}).then(
        ({data}) => {
          this.props._setGoalDocIdOnCreate(data.goalDocCreate.id)}
      )
      .catch(error => {
        console.log('there was an error sending the query', error)
      })
    }

async submitGoal(event)  {
  event.preventDefault()

  if (!this.state.proxyAddress) {
    let createProxyResult = await ProxyFactory.methods.build(this.state.goal).send({from: this.props.currentAccount})
    console.log('createProxyResult',createProxyResult)
    let proxyAddress = await createProxyResult.events.Created.returnValues.proxy

    this.setState({proxyAddress})
    await this.initGoal()
    this.setState({goal: ""})
  } else {
    console.log("has proxy address")
    await this.initGoal()
    this.setState({goal: ""})
  }
}

async initAndFundGoal() {
  if (!this.props.userTokenBalance) {
    alert("You'll need to buy some tokens before you fund your goal")
    return
  }
  let bondFunds
  let rewardFunds
  rewardFunds = window.prompt("Amount of ZAPP tokens you'd like to add to this goal's reward pool")
  rewardFunds = parseInt(rewardFunds, 10)
  bondFunds = window.prompt("Amount of ZAPP tokens you'd like to add to this goal's bond pool")
  bondFunds = parseInt(bondFunds, 10)
      if (!Number.isInteger(rewardFunds) || rewardFunds <= 0) {
        rewardFunds = 0
        alert('try again with a whole number, greater than 0')
        rewardFunds = window.prompt("Amount of ZAPP tokens you'd like to add to this goal's reward pool")
        rewardFunds =  parseFloat(rewardFunds, 10)
      }
      if (!Number.isInteger(bondFunds) || bondFunds <= 0) {
        bondFunds = 0
        alert('try again with a whole number, greater than 0')
        bondFunds = window.prompt("Amount of ZAPP tokens you'd like to add to this goal's bond pool")
        bondFunds = parseFloat(bondFunds, 10)
      }
        if (rewardFunds && bondFunds && this.state.proxyAddress) {
             if (window.confirm(explain1)) {
                if (window.confirm(explain2)) {
               window.alert(explain3)
                }
             }
            let totalToSend = rewardFunds + bondFunds
            totalToSend = totalToSend.toString()
            const approvalReciept = await GoalZappTokenSystem.methods.approve(this.state.proxyAddress, web3.utils.toWei(totalToSend)).send({from:this.props.currentAccount})
            //console.log("approvalReciept", approvalReciept)
             // console.log('minutesToSeconds', minutesToSeconds(2))
            try {
            const initAndFundReciept = await ProxiedGoalEscrow.methods.newGoalInitAndFund(DeployedAddress.GOALZAPPTOKENSYSTEM, minutesToSeconds(2), web3.utils.toWei(bondFunds.toString()), web3.utils.toWei(rewardFunds.toString())).send({from:this.props.currentAccount})
             console.log("initAndFundReciept", initAndFundReciept)
           } catch (err) {console.log(err)}
      }
   rewardFunds > 0 ? this.setState({rewardFundsToSend: rewardFunds}) : console.log("can't set state with rewardFunds", rewardFunds)
   bondFunds > 0 ? this.setState({bondFundsToSend: bondFunds}): console.log("can't set state with bondFunds", bondFunds)
}


handleChange(e) {
  this.setState({goal: e.target.value });
    }


async componentDidUpdate(prevProps) {
  if(this.props.proxyAddress && prevProps.proxyAddress !== this.props.proxyAddress) {
    ProxiedGoalEscrow = new web3.eth.Contract(goalescrow.abi, this.props.proxyAddress)
  }
}


render() {
    return (
    <div className="goalinput-form">
      <form onSubmit={this.submitGoal}>
        <input type="text" id="form-text" placeholder=""
          onChange={this.handleChange}
          value={this.state.goal}/>
        <input type="submit" value="ZappIt"/>
      </form>
    </div>
  )
}
}

const InputGoalWithData =
graphql(goalInputMutation, {
  props: ({mutate, ownProps}) => ({
    inputGoal({variables}) {
      return mutate({
      variables: {
        ...variables
      }
      ,
      refetchQueries:[{query: GoalDocQuery, variables: {targetUserId: ownProps.targetUserId} }]
    })
      .catch((error) => {
        console.log('there was an error sending the query', error)
      })
      }
    })
})
(InputGoalSmart)

 const explain1 = "you'll see two popup windows... 1st to 'approve' the amount of tokens to send.. the 2nd to actually send them.To transfer the tokens, you'll need to click 'approve' to both...Do you want a short explanation of why all of this is necessary?"
 const explain2 = "The safest and easiest way to transfer *tokens* in Ethereum is to give the smart contract on the blockchain permission to pull a specified amount of tokens out of your account... then giving permission to actually take them.  this sounds weird, but it makes sense because we're not actually *sending* tokens anywhere... we're just updating the ledger of the token smart contract, saying 'smart contract I'm sending to has X more tokens, and I have X less tokens... So if we're updating a ledger that is separate from the contract that's having balance increased in this case the GoalEscrow contract... Do you understand that? Click Ok for simple example, click cancel to move on to those pop-ups"
 const explain3 = "Suppose if you wired some money to my bank account my bank would AUTOMATICALLY forward that money to a registered charity...If you just sent the money, the bank wouldn't know who sent it or why... it would just sit in my account.  BUT if my bank *requested* the money from your bank, they could know up front what the instructions are... you approve the request, and you approve the send... In the future when GoalZapp upgrades it's tokens to ERC-777 tokens, the double approve won't be necessary"

export default InputGoalWithData
