/* eslint-disable */
import React, {Component} from 'react'
import {graphql, compose, withApollo} from 'react-apollo';
import gql from 'graphql-tag';
import GOALESCROW from '../../abi/GoalEscrow.json'
import * as DeployedAddress from '../../ContractAddress.js'
var Web3 = require('web3');
var web3 = new Web3(Web3.givenProvider || "ws://localhost:8546");
let proxyAddress
let  ProxiedGoalEscrow

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


const clonedStepsQuery1 = gql `
    query clonedStepsQuery ($goalDocId: ID) {
      GoalDoc(id: $goalDocId) {
       id
       clonedSteps(orderBy:positionIndex_ASC) {
         step
         positionIndex
         id
         suggestedStep
         stepsId
         suggester {
           id
           userName
         }
       }
     }}`

const clonedStepsQuery = gql `query clonedStepsQuery($id: ID) {
  clonedStepsList(filter: {clonedStepsOfGoalDoc: {id: {equals: $id}}}, sort: {step: ASC}) {
    items {
      positionIndex
      step
      suggestedStep
      id
    }
  }
}
`

const removeClonedStepMutation1 = gql `
  mutation RemoveClonedStepMutetion($id: ID!) {
  deleteClonedStep(id: $id) {
    step
    id
  }
}`

const removeClonedStepMutation = gql `mutation removeClonedStepMutation($id: ID)  {
  clonedStepDelete(data: {id: $id}) {
    success
  }
}
`
const updateClonedStepMutation1 = gql `mutation UpdateClonedStep($id: ID!, $positionIndex: Int) {
  updateClonedStep(id: $id, positionIndex: $positionIndex) {
    id
    positionIndex
    step
  }
}`

const updateClonedStepMutation = gql ` mutation updateClonedStep(
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


class RejectStep extends Component {
  proxyAddress = this.props.proxyAddress
  constructor(props) {
    super(props)
    this._reorderClonedSteps = this._reorderClonedSteps.bind(this)
    this._submitRejectStepMutation = this._submitRejectStepMutation.bind(this)
  }

  componentDidMount() {
    ProxiedGoalEscrow = new web3.eth.Contract(GOALESCROW.abi, this.props.proxyAddress)
    this.props.unrenderRejectStepFunction()
  }

  render() {
    ProxiedGoalEscrow = new web3.eth.Contract(GOALESCROW.abi, this.props.proxyAddress)
    console.log('Component Rendered')
    console.log(this.props)
    if (this.props.renderRejectStepState === true) {
      console.log(this.props.renderRejectStep)
      this._submitRejectStepMutation(this.props.idToRemove)
    }
    return null
  }

  async _submitRejectStepMutation(idToRemove) {
    let rejectStepReceipt = await ProxiedGoalEscrow.methods.returnBondsOnReject(web3.utils.toHex(this.props.goalDocId)).send({from: this.props.currentEthereumAccount})
    .on('error', error => console.log(error))
    console.log('rejectStepReceipt', rejectStepReceipt)
    if (rejectStepReceipt === 'Error' || false) {
      return
    }
    let rejectStepResult, clonedStepsQueryResult, reorderedClonedSteps
    try {
      rejectStepResult = await this.props.removeClonedStepMutation({
        variables: {
          id: this.props.idToRemove
        }
      })
      } catch(error) {
        console.log(error) }
    try {
      clonedStepsQueryResult = await this.props.client.query({
      query: clonedStepsQuery, variables : {
        goalDocId: this.props.goalDocId},
        fetchPolicy: 'network-only'
    })
    } catch(error) {
      console.log(error)
    }

    try { reorderedClonedSteps = await this._reorderClonedSteps(clonedStepsQueryResult) }
      catch (error) {console.log(error)}

    try {
      reorderedClonedSteps.map(async (stepObj, mapIndex) => {
          await this.props.updateClonedStep({
            variables: {
              id: stepObj.id,
              positionIndex: stepObj.positionIndex
            }
          })
        })
    } catch (error) {
        console.log(error)
      }
  }

  _reorderClonedSteps(queryResult) {
   const {loading, error} = queryResult
   if (!loading) {
     const newSteps = queryResult.data.clonedStepsList.items.slice()
     return newSteps.map((stepObj, index) => ({
       ...stepObj,
       positionIndex: index,
     }))
    }
    }
  }


const RejectStepWithMutation =
compose(graphql(removeClonedStepMutation, {
  props: ({mutate}) => ({
    removeClonedStepMutation({variables}) {
      return mutate({
        variables: {
          ...variables
        },
        refetchQueries: ['goalDocByIdQuery']
      })
    }
  })
}),
graphql(
  updateClonedStepMutation, {
    props: ({mutate}) => ({
      updateClonedStep({variables}) {
        return mutate({
          variables: {
          ...variables
      },
      refetchQueries: [`goalDocByIdQuery`]
        })
      }
    })
})
)(RejectStep)

export default withApollo(RejectStepWithMutation)
