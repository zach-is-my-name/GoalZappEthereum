import React from 'react';
import {graphql} from 'react-apollo';
import gql from 'graphql-tag';
import {connect} from 'react-redux';
import { withRouter, Redirect } from 'react-router-dom'
import * as actions from '../../Actions/actions'


/*Class Declaration */
 class GoalInput extends React.Component {
    constructor(props) {
        super(props)
    this.submitGoal = this.submitGoal.bind(this);
    this.state = {
      goal : ''
    }
    }
/* Event Handler*/

submitGoal(event)  {
  event.preventDefault()
  const {goal} = this.state;
  // console.log(goal)
  const ownersId = this.props.loggedInUserID
    // console.log(this.props.loggedInUserID)
    this.props.inputGoal({variables: { goal, ownersId }} )
    .catch((error) => {
      console.log('there was an error sending the query', error)
    })
    .then(({data}) => {

      console.log("Mutation Sent!")
      /*Action Dispatch */
      this.props.dispatch(actions.setGoal(data.createGoalDoc))
    })}


//you can probably dispatch setGoal with the returned value of the mutation (which
// should include an id and the goal
    render() {
    if (this.props.data.loading) {
      return (<div>Loading</div>)
    }

    // redirect if no user is logged in
    if (!this.props.data.user) {
      console.warn('only logged in users can create new posts')
      return (
        <Redirect to={{
          pathname: '/'
        }}/>
      )
    }

        const input = <form  onSubmit={this.submitGoal}>
          <input type="text" id="form-text" placeholder="Your Goal"
            onChange={(e)=> this.setState({goal: e.target.value})}/>
          <input type="submit" name="submit step" value="ZappIt"/>
        </form>

        return (input);
    }}


/* GraphQL */

const goalInputMutation = gql `mutation($goal: String, $ownersId: ID) {
  createGoalDoc(goal:$goal, ownersId: $ownersId ) {
    goal
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

const GoalInputWithData = graphql(userQuery,
{ options: {fetchPolicy: 'network-only'}})(graphql(goalInputMutation,{
  props: ({mutate}) => ({
    inputGoal({variables}) {
      return mutate({
        variables: {...variables}
      })
      .catch((error) => {
        console.log('there was an error sending the query', error)
      })
    }
  })
})(withRouter(GoalInput)));

/*Redux */
const mapStateToProps = (state, props) => {
  return {
    currentGoal: state.currentGoal,
    loggedInUserID: state.goals.loggedInUserID
  }
}

export default connect(mapStateToProps)(GoalInputWithData)
