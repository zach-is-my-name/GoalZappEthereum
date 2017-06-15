/* eslint-disable */
import React, {Component} from 'react'
import {graphql} from 'react-apollo';
import gql from 'graphql-tag';
import {connect} from 'react-redux';
import { withRouter, Redirect } from 'react-router-dom'
import * as actions from '../../Actions/actions'

import StepInputForm from './Form/StepInputForm'

/* CLASS DEFINITION */
 class StepsInput extends React.Component {
  constructor(props) {
    super(props)
    this.submitStep = this.submitStep.bind(this);
  }

/* EVENT HANDLER */
  submitStep = (values) => {
    let step = values.stepInput;
    const goalDocId  = this.props.currentGoalID
    console.log('STEP INPUT',step)
    console.log('ID INPUT', goalDocId)
    console.log('TYPE OF ID', typeof goalDocId)
    this.props.createStep({variables: {step, goalDocId}})
        .then(( {data} ) => {
          console.log('DATA SUBMITTED', data);
        /* DISPATCH ACTION */
        console.log('this is step', step)
        this.props.dispatch(actions.setStep(step))
        })
    }

/* RENDER METHOD */
  render() {

    return (
        <StepInputForm onSubmit={this.submitStep}/>
    )
  }
}

/* GRAPHQL QUERY */
const StepsMutation = gql                                         `
  mutation($step:String!, $goalDocId: ID) {
  createStep(step:$step, goalDocId:$goalDocId) {
    step
    id
  }
}`

const userQuery = gql`
  query userQuery {
    user {
      id
    }
  }
`

const StepsInputWithMutation =graphql(userQuery,
  {options: {fetchPolicy: 'network-only'}})
(graphql(StepsMutation,{
    props:({mutate}) => ({
      createStep({variables}) {
        return mutate({
          variables: {...variables }
        })
        .catch((error) => {
          console.log('there was an error sending the query', error)
        })
      }
    })
})(withRouter(StepsInput)))

/* REDUX */
const mapStateToProps = (state, props) => {
  return {currentGoal: state.goals.currentGoal, currentGoalID: state.goals.currentGoalID,
  }
}

export default connect(mapStateToProps)(StepsInputWithMutation)
