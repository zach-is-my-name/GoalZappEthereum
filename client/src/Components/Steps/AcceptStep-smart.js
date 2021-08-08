/* eslint-disable */
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {graphql, compose, withApollo} from 'react-apollo';
import gql from 'graphql-tag';
import * as actions from '../../Actions/actions'
import goalescrow from '../../abi/GoalEscrow.json'
import * as DeployedAddress from '../../ContractAddress.js'
var Web3 = require('web3');
var web3 = new Web3(Web3.givenProvider || "ws://localhost:8546");
let proxyAddress
let ProxiedGoalEscrow

const stepIdQuery = gql `
query stepIdQuery($id:ID){
  stepsList(filter: {stepsOfGoalDoc: {id: {equals: $id}}}, sort: {positionIndex: ASC}) {
      items {
        id
        positionIndex
        step
        suggestedStep
      }
    }
  }`

const createStep = gql `
mutation createStep(
  $goalDocId: ID,
  $step: String!,
  $positionIndex: Int,
  $suggestedStep: Boolean
) {
  stepCreate(data: {
    step: $step,
    stepsOfGoalDoc: {connect: {id: $goalDocId}},
    positionIndex: $positionIndex,
    suggestedStep: $suggestedStep}) {
    step,
    id,
    stepsOfGoalDoc {
      id
    }
  }
}
`

const updateStep = gql `
  mutation updateStep(
    $id: ID!,
    $positionIndex: Int
  ) {
    stepUpdate(data: {
      id: $id,
      positionIndex: $positionIndex,
    }) {
      id
      positionIndex
      suggestedStep
      step
    }
  }
`

const updateClonedStep = gql ` mutation updateClonedStep(
  $id: ID!,
  $positionIndex: Int,
) {
  clonedStepUpdate(data: {
    id: $id,
    positionIndex: $positionIndex,
    suggestedStep: false
  }) {
    id
    positionIndex
    stepsId
    suggestedStep
    step
  }
}
`
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

 class AcceptStep extends Component {
   proxyAddress = this.props.proxyAddress
  constructor(props) {
    super(props)
    this._submitAcceptStep = this._submitAcceptStep.bind(this)
    this._reorderSteps = this._reorderSteps.bind(this)
    this._submitUpdateClonedSteps = this._submitUpdateClonedSteps.bind(this)
    this._submitAcceptStepMutation = this._submitAcceptStepMutation.bind(this)
}

  componentDidMount() {
    this.props.unrenderAcceptStepFunction()
    console.log('click handler accept step')
  }

  render() {
  if (this.props.renderAcceptStepState === true) {
      this._submitAcceptStep()
  }
  return null
  }

async _submitAcceptStep(clonedStepIdQuery) {
  ProxiedGoalEscrow = new web3.eth.Contract(goalescrow.abi, this.props.proxyAddress)
  let acceptStepReceipt = await ProxiedGoalEscrow.methods.disburseOnAccept(web3.utils.toHex(this.props.goalDocId)).send({from: this.props.currentEthereumAccount})
  .on('error', error => console.log(error))
  if (acceptStepReceipt === 'Error' || false) {
    return
  }
  let stepIdQueryResult
  try {
       stepIdQueryResult  = await this.props.client.query({
         query: stepIdQuery, variables : { id: this.props.goalDocId},
           fetchPolicy: 'network-only'
         })
    } catch (error) {
      console.log(error)
    }

  try {
    const returnedId =  await this._submitAcceptStepMutation(this._reorderSteps(stepIdQueryResult))
    console.log('returnedId', returnedId )
    await this._submitUpdateClonedSteps(returnedId)
  }
 catch (error) {
  console.log(error)
  }
}

async _submitAcceptStepMutation (newStepsSortedByPositionIndex) {
  console.log('newStepsSortedByPositionIndex', newStepsSortedByPositionIndex)
  try {
    const mapFunction =  newStepsSortedByPositionIndex.map(async (stepObj, mapIndex) => {
          if (stepObj.id) {
            await this.props.updateStep({
              variables: {
                id: stepObj.id,
                positionIndex: stepObj.positionIndex
              }
            })
          } else if (!stepObj.id) {
            const createStepResult = await  this.props.createStep({
              variables: {
                goalDocId: stepObj.goalDocId,
                step: stepObj.step,
                positionIndex: stepObj.positionIndex,
                suggestedStep: stepObj.suggestedStep
              }
            })
            return createStepResult
          // console.log('createStepResult', createStepResult )
          }
        })

      const idObj = await Promise.all(mapFunction).then(results =>results.find(obj => obj && obj.data && obj.data.stepCreate.id))
      const idValue = idObj.data.stepCreate.id
      return idValue
      // }
} catch (error) {
  console.log(error)
}
}

_reorderSteps(queryResult) {
    try {
      const {loading} = queryResult
      if (!loading) {

      const {stepIndex} = this.props
      if (!loading) {
        const newSteps = queryResult.data.stepsList.items.slice()

        const newStep = {
          step: this.props.acceptedStep,
          suggestedStep: false,
          id: null,
          positionIndex: null,
          goalDocId: this.props.goalDocId
        }
        newSteps.splice(stepIndex, 0, newStep)
        // newSteps.sort((a,b)=> a.positionIndex - b.positionIndex)

        return  newSteps.map((stepObj, index) => ({
          ...stepObj,
          positionIndex: index,
          }))
        }
      }
  } catch (error) {
    console.log(error)
}
}



  async _submitUpdateClonedSteps(returnedStepId) {
    const id  = this.props.clonedStepId
    await this.props.updateClonedStep({variables: {
      id: id,
      suggestedStep: false,
      stepsId: returnedStepId
    }
  })
  }
}

const WithData = compose(
  graphql(updateStep, {
  name:'updateStep',
  props: ({updateStep}) => ({
    updateStep({variables}) {
      return updateStep({
        variables: {
          ...variables
        },
        refetchQueries: ['goalDocByIdQuery']
      }).catch((error) => {
        console.log('there was an error sending the query', error)
      })
    }
  }),
}),
  graphql(createStep, {
  name: 'createStep',
  props: ({createStep}) => ({
    createStep({variables}) {
      console.log(variables)
      return createStep({
        variables: {
          ...variables
        },
        refetchQueries: ['goalDocByIdQuery'],
        errorPolicy: 'all'
      }).catch((error) => {
        console.error('there was an error sending the query', error)
      })
    }
  }),
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
})
)(AcceptStep)

export default withApollo(WithData)
