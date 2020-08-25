/* eslint-disable */
import React, {Component} from 'react';
import {graphql, compose} from 'react-apollo';
import gql from 'graphql-tag';
import {withRouter, Redirect} from 'react-router-dom'
import SuggestStep from './SuggestStep.js'
import goalescrow from '../../abi/GoalEscrowTestVersion.json'
import tokensystem from '../../abi/GoalZappTokenSystem.json'
import * as DeployedAddress from '../../ContractAddress.js'
var Web3 = require('web3');
var web3 = new Web3(Web3.givenProvider || "ws://localhost:8546");
let ProxiedGoalEscrow
const GoalZappTokenSystem = new web3.eth.Contract(tokensystem.abi, DeployedAddress.GOALZAPPTOKENSYSTEM )
// import '../../style/SuggestStep.css'

const clonedStepIdQuery   = gql `
query clonedStepQuery($id: ID) {
  clonedStepsList(filter: {clonedStepsOfGoalDoc: {id: {equals: $id}}}, sort: {positionIndex: ASC}) {
    items {
      positionIndex
      step
      suggestedStep
      id
    }
  }
}
`
const updateClonedStep = gql ` mutation updateClonedStep(
  $id: ID!,
  $suggestedStep: Boolean,
  $positionIndex: Int,
  $stepsId: String,
) {
  clonedStepUpdate(data: {
    id: $id,
    positionIndex: $positionIndex,
    stepsId: $stepsId,
    suggestedStep: $suggestedStep
  }) {
    id
    positionIndex
    stepsId
    suggestedStep
    step
  }
}
`
const createClonedStep = gql `
mutation createClonedStep($goalDocId: ID, $step: String!, $positionIndex: Int, $suggestedStep: Boolean, $stepsId: String, $suggester: ID) {
  clonedStepCreate(data: {step: $step, positionIndex: $positionIndex, suggester: {connect: {id: $suggester}}, suggestedStep: $suggestedStep, stepsId: $stepsId,  clonedStepsOfGoalDoc: {connect: {id: $goalDocId}}}) {
    step
    id
    positionIndex
    stepsId
    }
  }`

const goalDocByIdQuery = gql `query GoalDocByIdQuery ($goalDocId: ID) {
  goalDoc(id: $goalDocId) {
   goal
   id
   steps(orderBy:positionIndex_ASC) {
     items {
     step
     positionIndex
     suggestedStep
     id
    }}
   clonedSteps(orderBy:positionIndex_ASC) {
     items {
     positionIndex
     id
     suggestedStep
     stepsId
     suggester {
       id
       userName
     }
    }
   }
  }
}`

class SuggestStepSmart extends Component {
  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this._submitSuggestedStep = this._submitSuggestedStep.bind(this)
    this._submitSuggestedStepMutation = this._submitSuggestedStepMutation.bind(this)
    // this.submitSubsequent = this.submitSubsequent.bind(this)
    this.state = {
      step: " ",
      userTokenBalance: null,
    }
  }

  async componentDidMount() {
    ProxiedGoalEscrow = new web3.eth.Contract(goalescrow.abi, this.props.proxyAddress)

    const bondFunds = web3.utils.fromWei((await ProxiedGoalEscrow.methods.bondFunds().call()))
    let userTokenBalance = await GoalZappTokenSystem.methods.balanceOf(this.props.currentEthereumAccount).call()
    this.setState({userTokenBalance})
  }

  async componentDidUpdate(prevProps) {
    if (prevProps.currentEthereumAccount !== this. props.currentEthereumAccount) {
      console.log(this.props.currentEthereumAccount)
      let userTokenBalance = await GoalZappTokenSystem.methods.balanceOf(this.props.currentEthereumAccount).call()
      console.log('userTokenBalance ', userTokenBalance  )
      this.setState({userTokenBalance})
    if(this.props.proxyAddress && prevProps.proxyAddress !== this.props.proxyAddress)
      ProxiedGoalEscrow = new web3.eth.Contract(goalescrow.abi, this.props.proxyAddress)
    }
  }



  render() {

    if (this.props.loggedInUserId && this.props.loggedInUserId !== this.props.targetUserId) {
      return (
        <SuggestStep _submitSuggestedStep={this._submitSuggestedStep}
          handleChange={this.handleChange}
          value={this.state.step} />
      )
    } else if (!this.props.loggedInUserId) {
      // TODO also check if the cloned steps are owned by the user.  This becomes more clear with 'suggestions by user'
      return null
    }
    else {
      console.log('Not a foreign user!')
      return null
    }
  }
  handleChange(e) {
    this.setState({step: e.target.value});
  }

  async _submitSuggestedStep(event) {
    console.log("called")
    event.preventDefault()
    let userTokenBalance = await GoalZappTokenSystem.methods.balanceOf(this.props.currentEthereumAccount).call()
    console.log("userTokenBalance ",userTokenBalance  )
    // console.log(this._reorderSteps(this.props.clonedStepIdQuery))
    if (this.props.loggedInUserId && userTokenBalance > 0) {
      let suggesterBond = window.prompt("Enter amout of tokens you'd like to send as bond to your suggestion. Upon resolution of your suggestion, this amount will become fully sendable and tradable without restriction.")
      if (suggesterBond <= 0) {
        return
      }
      if (suggesterBond > web3.utils.fromWei(userTokenBalance)) {
        alert("you don't own that many tokens in this address... you'll either need to buy more or transfer some in who's restriction has been lifted")
        return
      }
    let approveReceipt = await GoalZappTokenSystem.methods.approve(this.props.proxyAddress, web3.utils.toWei(suggesterBond)).send({from:this.props.currentEthereumAccount})
    .on('error', error  => console.log(error))
    if (approveReceipt === 'Error' || false) {
      return
    }
    let depositOnSuggestReceipt =  await ProxiedGoalEscrow.methods.depositOnSuggest(web3.utils.toHex(this.props.goalDocId), web3.utils.toWei(suggesterBond)).send({from:this.props.currentEthereumAccount})
      .on("receipt", receipt => console.log(receipt))
      .on("error", (error, receipt) => console.log(error))
      if (depositOnSuggestReceipt === "Error" || false) {
        alert("transaction failed -- check console")
        return
      }
      await this._submitSuggestedStepMutation(this._reorderSteps(this.props.clonedStepIdQuery))
      this.props.unrenderSuggestStepFunctiion()
  } else if (!this.props.loggedInUserId && this.state.step) {
    //render create user; save step state; when create user resolves send mutation
    }
    else if (userTokenBalance <= 0 ) {
      alert("you need to have some tokens to suggest a step.  the token is sent as a bond held in escrow.  when the goal owner takes action on the step, or time expires, you get what ever tokens you sent as bond sent back to your wallet")
    }
  }

  _reorderSteps(queryResult) {
    const {loading, error, clonedStepsList} = queryResult
    if (!loading) {
      const newStep = {
        step: this.state.step,
        suggestedStep: true,
        id: null,
        positionIndex: null
      }
      const stepIndex = this.props.stepIndex

      const newSteps = clonedStepsList.items.slice()

      newSteps.splice(stepIndex, 0, newStep )
      // newSteps.sort((a,b) => a.positionIndex - b.positionIndex)

      return newSteps.map((stepObj, index) => ({
        ...stepObj,
        positionIndex: index
      }))
    }
  }

  _submitSuggestedStepMutation = async (newClonedStepsSortedByPositionIndex) => {
    console.log('newClonedStepsSortedByPositionIndex', newClonedStepsSortedByPositionIndex)
    newClonedStepsSortedByPositionIndex.map(async (stepObj, mapIndex, array) => {
    if (stepObj.id) {
      const updatedClonedStepResult = await this.props.updateClonedStep({
        variables: {
          id: stepObj.id,
          positionIndex: stepObj.positionIndex,
        }
      })
    } else {
      const createdClonedStepResult = await this.props.createClonedStep({
        variables: {
          step: stepObj.step,
          suggestedStep: stepObj.suggestedStep,
          goalDocId: this.props.goalDocId,
          positionIndex: stepObj.positionIndex,
          stepsId: stepObj.stepsId,
          suggester: this.props.loggedInUserId
        }
      })
    }
    })
  }

}

export default compose(
  graphql(clonedStepIdQuery, {
    name:"clonedStepIdQuery",
    options: (ownProps) => ({
      variables: {
        id: ownProps.goalDocId
      },
      fetchPolicy: 'network-only'
    })
  }),
graphql(updateClonedStep, {
  name: 'updateClonedStep',
  props: ({updateClonedStep}) => ({
    updateClonedStep({variables}) {
      return updateClonedStep({
        variables: {
          ...variables
        },
        refetchQueries: ['goalDocByIdQuery'],
      }).catch((error) => {
        console.log(error)
      })
    }
  })
}),
graphql(createClonedStep, {
  name: 'createClonedStep',
  props: ({createClonedStep}) => ({
    createClonedStep({variables}) {
      return createClonedStep({
        variables: {
          ...variables
        },
        refetchQueries: ['goalDocByIdQuery'],
      }).catch((error) => {
        console.log(error)
      })
    }
  })
})


//   graphql(updateOrCreateClonedStep, {
//   name: 'updateOrCreateClonedStep',
//   props: ({updateOrCreateClonedStep}) => ({
//     updateOrCreateClonedStep({variables}) {
//       return updateOrCreateClonedStep({
//         variables: {
//           ...variables
//         },
//         refetchQueries: ['goalDocByIdQuery']
//       }).catch((error) => {
//         console.error(error)
//       })
//     }
//   })
// })
)(withRouter(SuggestStepSmart))
