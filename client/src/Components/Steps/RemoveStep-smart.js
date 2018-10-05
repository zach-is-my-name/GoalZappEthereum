/* eslint-disable */
import React, {Component} from 'react';
import {connect} from 'react-redux';
import _ from 'lodash'
import {graphql, compose, withApollo} from 'react-apollo';
import gql from 'graphql-tag';
import * as actions from '../../Actions/actions.js'

const stepsQuery = gql `
  query stepsQuery ($goalDocId: ID) {
      GoalDoc(id: $goalDocId) {
        goal
        id
        steps(orderBy:positionIndex_ASC) {
          step
          positionIndex
          suggestedStep
          id
        }
      }
    }`

const clonedStepsQuery = gql `
    query clonedStepsQuery ($goalDocId: ID) {
      GoalDoc(id: $goalDocId) {
       clonedSteps(orderBy:positionIndex_ASC) {
         step
         positionIndex
         id
         suggestedStep
         stepsId
         suggester {
           userName
         }
       }
     }}`

// const stepIdQuery = gql `
// query stepIdQuery($id:ID) {
//   allSteps(filter: {goalDoc: {id: $id}}, orderBy: positionIndex_ASC) {
//      id
//      positionIndex
//      step
//    }
//  }`

// const clonedStepIdQuery = gql `
// query clonedStepIdQuery($id:ID) {
//   allClonedSteps(filter: {goalDoc: {id: $id}}, orderBy: positionIndex_ASC) {
//      id
//      positionIndex
//      step
//    }
//  }`

const removeStepMutation = gql `mutation RemoveStepMutation($id: ID!) {
  deleteStep(id: $id) {
    step
  }
}`

const updateStepMutation = gql `mutation UpdateStepMutation($id: ID!, $positionIndex: Int) {
  updateStep(id: $id, positionIndex: $positionIndex) {
    id
    positionIndex
    step
  }
}`

const removeClonedStepMutation = gql `mutation RemoveClonedStepMutation($id: ID!) {
  deleteClonedStep(id: $id) {
    step
  }
}`

const updateClonedStepMutation = gql `mutation UpdateClonedStep($id: ID!, $positionIndex: Int) {
  updateClonedStep(id: $id, positionIndex: $positionIndex) {
    id
    positionIndex
    step
  }
}`

class RemoveStep extends Component {
  constructor(props) {
    super(props)
    this._submitRemoveStepMutation = this._submitRemoveStepMutation.bind(this)
    this._submitRemoveClonedStepMutation = this._submitClonedStepMutation.bind(this)
    this._reorderSteps = this._reorderSteps.bind(this)
    this._reorderClonedSteps = this._reorderClonedSteps.bind(this)
    }
componentDidMount() {
  this.props.unrenderRemoveStepFunction()
}

  render() {
    if (this.props.renderRemoveStepState === true) {
        this._submitRemoveStepMutation()
    }
      return null
  }


   _reorderSteps(queryResult) {
    const {loading, error} = queryResult
      if (!loading) {

        const newSteps = queryResult.data.GoalDoc.steps.slice()
        return newSteps.map((stepObj, index) => ({
          ...stepObj,
          positionIndex: index
        }))
      }}

  _reorderClonedSteps(queryResult) {
    const {loading, error} = queryResult
      if (!loading) {
        const newSteps = queryResult.data.GoalDoc.clonedSteps.slice()
        return newSteps.map((stepObj, index) => ({
          ...stepObj,
          positionIndex: index
        }))
      }
  }

  async _submitRemoveStepMutation() {
      // console.log('_submitRemoveStepMutation called')
      const removeStepResult = await this.props.removeStepMutation({
        variables: {
          id: this.props.idToRemove
        }
      }).catch((error) => {console.log(error)})

      const stepsQueryResult = await this.props.client.query({
        query:stepsQuery, variables:{
          goalDocId: this.props.goalDocId},
          fetchPolicy: 'network-only'
       }).catch(error =>  console.log(error))

      const reorderedSteps = await this._reorderSteps(stepsQueryResult)
        await reorderedSteps.map(async (stepObj, mapIndex) => {
          await this.props.updateStep({
            variables: {
              id: stepObj.id,
              positionIndex: stepObj.positionIndex
            }
          }).catch(error => console.log(error))
        })
      }


async _submitRemoveClonedStepMutation(){
    const removeClonedStepResult = await this.props.removeClonedStepMutation({
      variables: {
        id: this.props.clonedStepIdToRemove
      }
    }.catch(error => console.log(error)))

    const clonedStepsQuery = await this.props.client.query({query: stepsQuery,
      variables: {
        goalDocId: this.props.goalDocId},
        fetchPolicy: 'network-only'}).catch(error => console.log(error))

    const reorderedSteps = await this_reorderSteps(clonedStepsQueryResult)
        await reorderedClonedSteps.map(async(stepObj, mapIndex) => {
          await this.props.updateClonedStep({
            variables: {
              id: stepObj.id,
              positionIndex: stepObj.positionIndex
            }
          }).catch(error => console.log(error))
        })
        }
}

const RemoveStepWithMutation =
compose(graphql(removeStepMutation, {
  props: ({mutate}) => ({
    removeStepMutation({variables}) {
      return mutate({
        variables: {
          ...variables
        },
        // refetchQueries: [`stepsQuery`]
      }).catch((error) => {
        console.error(error)
      })
    }
  })
}),
graphql(
  updateStepMutation, {
  props: ({mutate}) => ({
    updateStep({variables}) {
      return mutate ({
        variables: {
          ...variables
        },
        refetchQueries: [`stepsQuery`]
      })
    }
  })
}),
graphql(removeClonedStepMutation, {
  props: ({mutate}) => ({
    removeClonedStepMutation({variables}) {
      return mutate({
        variables: {
          ...variables
        },
        // refetchQueries: [`stepsQuery`]
      }).catch((error) => {
        console.error(error)
      })
    }
  })
}),
graphql(
  updateClonedStepMutation, {
  props: ({mutate}) => ({
    updateClonedStep({variables}) {
      return mutate ({
        variables: {
          ...variables
        },
        refetchQueries: [`stepsQuery`]
      })
    }
  })
})
)(RemoveStep)

// const mapStateToProps = (state, props) => {
//   return ({idToRemove: state.goals.idToRemove})
// }

export default withApollo(RemoveStepWithMutation)
