/* eslint-disable */
import React, {Component} from 'react';
import {BrowserRouter as Router, Route, Link} from 'react-router-dom';
import {connect} from 'react-redux';
import {graphql, compose} from 'react-apollo'
import gql from 'graphql-tag'
import * as actions from '../Actions/actions'
import App from '../Components/Container/App'
import CurrentUser from '../Components/User/CurrentUser'
import GlobalFeedPage from './GlobalFeedPage'
import '../style/UserFeedPage.css'
import CurrentGoal from '../Components/Goal/CurrentGoal-smart'
import CurrentStepsSmart from '../Components/Steps/CurrentSteps-smart'
import Notifications from '../Components/Feed/Notifications-smart'
import TargetUser from '../Components/User/TargetUser'
import SelectGoal from '../Components/Goal/SelectGoal-smart'
import InputGoalSmart  from '../Components/Goal/InputGoal-smart'

  const userQuery = gql `
          query userQuery {
            user {
              id
              userName
            }
          }
        `
  const targetUserQuery = gql `
  query targetUserQuery($targetUser: ID) {
  User(id:$targetUser) {
    userName
    id
  }
}`

 // const =
 class UserFeedPage extends Component {
   constructor(props){
    super(props)
    // this.dispatchtargetUserID = this.dispatchtargetUserID.bind(this)
   }

componentDidMount() {
    const {match} = this.props;
    this.props.dispatch(actions.setTargetUserID(match.params.userid))
}

  render() {
  const {match} = this.props;
  const {loading, error, User} = this.props.targetUserQuery
  // this.dispatchtargetUserID(match.params.userid)
if (loading) {
    return (<div> Loading.. </div>)
  }
    return (
  <div className="userfeedpage-container">
    <h2> UserFeed </h2>
    <TargetUser targetUserName={User.userName || ''} />
    <SelectGoal userId={this.props.userQuery.user.id} />
    {/* <InputGoal /> */}
    {/* <CurrentStepsSmart loggedInUser={this.props.data.user.} />
      <CurrentGoal id={this.props.currentGoalID}/>

    {/* <Route exact path={`${match.url}/userfeed/:userid`} component={UserFeedPage} /> */}
    <Notifications />
    {/* <CurrentStepsSmart loggedInUserId={this.props.data.user.id || ""} targetUserId={match.params.userid}  /> */}
    <Link className="globalfeed" to="/">
      GlobalFeed
    </Link>
  </div>
)
  }
  }

const mapStateToProps = (state, props) => {
  return {
currentGoalID: state.goals.currentGoalID,
  }
}

const WithData = compose(
  graphql(userQuery,
    {name: 'userQuery'}),
  graphql(targetUserQuery,
    {name: 'targetUserQuery',
     options: (ownProps) => {
       console.log(ownProps)
  return ({variables: {targetUser: ownProps.userQuery.user.id}})
  }}
  ))(UserFeedPage)
export default connect(mapStateToProps)(WithData)
