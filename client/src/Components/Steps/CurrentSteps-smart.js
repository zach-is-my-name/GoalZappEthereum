/* eslint-disable */
// index is passed down as stepIndex because it is restricted in react-sortable

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {graphql, compose} from 'react-apollo'
import gql from 'graphql-tag';
import * as actions from '../../Actions/actions.js'
import '../../style/CurrentSteps.css'
import OwnGoalCurrentSteps from './OwnGoalCurrentSteps.js'
import ForeignGoalCurrentSteps from './ForeignGoalCurrentSteps.js'
import {OwnerSteps} from './OwnerSteps.js'

const goalDocByIdQuery = gql `query goalDocByIdQuery ($goalDocId: ID) {
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
     step
     id
     stepsId
     suggestedStep
     suggestEdit
     suggestMove
     suggestRemove
     suggester {
       id
       userName
     }
    }
   }
  }
}`


class CurrentStepsSmart extends Component {
  constructor(props) {
    super(props)
  }

  componentDidUpdate(prevProps) {
    if (this.props.currentEthereumAccount && prevProps.currentEthereumAccount && this.props.currentEthereumAccount !== prevProps.currentEthereumAccount) {
      this.props.goalDocById.refetch()
    }
  }

  render() {
    const {networkStatus, goalDoc, loading} = this.props.goalDocById
    const {loggedInUserId, targetUserId, selectedSuggesterId, renderTargetUserSteps} = this.props

    let clonedSteps
    let children
    let steps
    let acceptedStep
    let goalOwnerStep
    let selectedSuggesterSuggested

    if (loading || !goalDoc || !loggedInUserId || !targetUserId || !selectedSuggesterId) {
      return <div>Loading...</div>
    }

    else if (loggedInUserId === targetUserId) {
      //filter out suggested steps NOT suggested by the selected suggester
      const clonedStepsForSelectedSuggester = () => {
        goalDoc.clonedSteps.items.forEach(stepObj => {
          acceptedStep = !stepObj.suggestedStep && stepObj.suggester && stepObj.suggester.id === selectedSuggesterId
          goalOwnerStep = !stepObj.suggestedStep && !stepObj.suggester
          selectedSuggesterSuggested = stepObj.suggestedStep && stepObj.suggester && (stepObj.suggester.id === selectedSuggesterId)
        })

        return goalDoc.clonedSteps.items.filter(stepObj => {
          return acceptedStep || goalOwnerStep  || selectedSuggesterSuggested
        })
      }

        clonedSteps = clonedStepsForSelectedSuggester()
        steps = goalDoc.steps.items
        return (
          <div className="current-steps-smart-container">
            {
                  <OwnGoalCurrentSteps
                    proxyAddress={this.props.proxyAddress}
                    randomColorStep={this.props.randomColorStep}
                    clonedSteps={clonedSteps || []}
                    steps={steps || []}
                    goalDocId={this.props.goalDocId}
                    targetUserId={targetUserId}
                    loggedInUserId={loggedInUserId}
                    selectedSuggesterId={selectedSuggesterId}
                    selectedSuggesterName={this.props.selectedSuggesterName}
                    suggestersIndex={this.props.suggestersIndex}
                    currentEthereumAccount={this.props.currentEthereumAccount}
                    />
            }
        </div>

    )
    } else if (loggedInUserId !== targetUserId) {
      /* foreign goal */
        const clonedStepsForSelectedSuggester = () => {
        //filter out suggested steps NOT suggested by the selected suggester
          goalDoc.clonedSteps.items.forEach(stepObj => {
            acceptedStep = !stepObj.suggestedStep && stepObj.suggester && stepObj.suggester.id === selectedSuggesterId
            goalOwnerStep = !stepObj.suggestedStep && !stepObj.suggester
            selectedSuggesterSuggested = stepObj.suggestedStep && stepObj.suggester && (stepObj.suggester.id === selectedSuggesterId)
          })

          return goalDoc.clonedSteps.items.filter(stepObj => {
            return acceptedStep || goalOwnerStep  || selectedSuggesterSuggested
          })
        }
          clonedSteps = clonedStepsForSelectedSuggester()
          steps = goalDoc.steps.items

          if (selectedSuggesterId === loggedInUserId && !renderTargetUserSteps ) {
          return (
            <div className="current-steps-smart-container">
                 <ForeignGoalCurrentSteps
                  goalDocId={this.props.goalDocId}
                  targetUserId={targetUserId}
                  loggedInUserId={loggedInUserId}
                  clonedSteps={clonedSteps}
                  steps={steps || []}
                  selectedSuggesterId={selectedSuggesterId}
                  selectedSuggesterName={this.props.selectedSuggesterName}
                  suggestersIndex={this.props.suggestersIndex}
                  proxyAddress={this.props.proxyAddress}
                  currentEthereumAccount={this.props.currentEthereumAccount}
                  />
          </div>
            )}
             else if (selectedSuggesterId === loggedInUserId && renderTargetUserSteps){
               return(
            <div className="current-steps-smart-container">
                 <OwnerSteps currentGoalSteps={steps} />
                 </div>
                )
              }
              }

     // console.log("currentStepsSmart hit null")
    return null
}
}

const WithData = compose(graphql(goalDocByIdQuery, {
  name: 'goalDocById',
  options: (ownProps) => {
    return ({
      variables: {
        goalDocId: ownProps.goalDocId
      },
      skip: ownProps=> !ownProps.goalDocId
    })
  }
}))(CurrentStepsSmart)
// graphql(suggesterClonedSteps, {
//   name: 'suggesterClonedSteps',
//   options: (ownProps) => {
//     return({ variables: {goalDocId: ownProps.goalDocId}})
//   },
//   skip: ownProps => ownProps.selectedSuggesterId === ownProps.loggedInUserId
// }
// ))(CurrentStepsSmart)

export default WithData
